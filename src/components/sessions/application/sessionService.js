import { randomUUID } from 'node:crypto';
import { ConflictError, InsufficientEvidenceError, NotFoundError, ValidationError } from '../../../platform/http/errors.js';
import { defaultSessionState } from '../../../fixtures/demoData.js';
import { ACTIVITY_KINDS, MAX_ACTIVITIES, downstreamReset, sanitizePatch, SESSION_COMMANDS, validateSessionState } from '../domain/session.js';

function assertVersion(expectedVersion) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new ValidationError('expected_version must be a positive integer');
  }
}

function assertInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('command input must be an object');
}

// A stringified boolean such as "false" is truthy in JavaScript, so it would
// revoke from an "if (authorized)" check yet pass through as authorized.
function booleanInput(value, field) {
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be a boolean`, { field: typeof value });
  return value;
}

export class SessionService {
  constructor({ repository, dataService, rulesService, defaultCustomerId = 'customer-001' }) {
    this.repository = repository;
    this.dataService = dataService;
    this.rulesService = rulesService;
    this.defaultCustomerId = defaultCustomerId;
  }

  async create({ customerId = this.defaultCustomerId } = {}) {
    const snapshot = await this.dataService.snapshot({ customerId });
    const state = {
      ...defaultSessionState(),
      customerId: snapshot.customer.id,
      customerName: snapshot.customer.name,
      authorized: snapshot.customer.authorized === true,
      dataVersion: snapshot.data_version,
      asOf: snapshot.data_as_of,
      asOfFull: snapshot.data_as_of_full
    };
    return this.repository.create({ customerId: snapshot.customer.id, state });
  }

  async get(sessionId) {
    const session = await this.repository.find(sessionId);
    if (!session) throw new NotFoundError('session not found');
    return session;
  }

  async patch({ sessionId, expectedVersion, requestId, patch }) {
    if (!requestId) throw new ValidationError('request_id is required');
    const prior = await this.repository.findMutation(sessionId, requestId);
    if (prior) return prior.session || prior;
    assertVersion(expectedVersion);
    const cleanPatch = sanitizePatch(patch);
    const current = await this.get(sessionId);
    let effectivePatch = cleanPatch;
    if (cleanPatch.goal && JSON.stringify(cleanPatch.goal) !== JSON.stringify(current.state.goal)) {
      effectivePatch = { ...cleanPatch, ...downstreamReset(), goal: cleanPatch.goal };
    }
    if (cleanPatch.compareSet?.length) {
      const snapshot = await this.dataService.snapshot({ customerId: current.customer_id });
      const known = new Set(snapshot.products.map((product) => product.id));
      const invalid = cleanPatch.compareSet.filter((id) => !known.has(id));
      if (invalid.length) throw new ValidationError('比较集包含当前数据版本中不存在的产品', { product_ids: invalid });
    }
    const nextState = { ...current.state, ...effectivePatch };
    validateSessionState(nextState);
    const updated = await this.repository.update({ sessionId, expectedVersion, patch: effectivePatch, requestId });
    if (!updated) throw await this.versionConflict(sessionId);
    return updated;
  }

  async command({ sessionId, expectedVersion, requestId, command, input = {} }) {
    if (!requestId) throw new ValidationError('request_id is required');
    const prior = await this.repository.findMutation(sessionId, requestId);
    if (prior) return prior.session ? prior : { session: prior, result: null };
    assertVersion(expectedVersion);
    assertInput(input);
    if (!SESSION_COMMANDS.has(command)) throw new ValidationError('unsupported session command', { command });
    const current = await this.get(sessionId);
    if (current.version !== expectedVersion) throw await this.versionConflict(sessionId);
    const snapshot = await this.dataService.snapshot({ customerId: current.customer_id });
    const transition = await this.buildTransition({ command, input, current, snapshot });
    if (!transition) return { session: current, result: { status: 'NOOP' } };
    if (['NEED_CONFIRMATION', 'UNSUPPORTED_RULE'].includes(transition.result?.status)) {
      return { session: current, result: transition.result };
    }
    const nextState = { ...current.state, ...transition.patch };
    validateSessionState(nextState);
    const updated = await this.repository.update({ sessionId, expectedVersion, patch: transition.patch, requestId, result: transition.result });
    if (!updated) throw await this.versionConflict(sessionId);
    return { session: updated, result: transition.result };
  }

  async buildTransition({ command, input, current, snapshot }) {
    const state = current.state;
    if (command === 'set_authorization') {
      const authorized = booleanInput(input.authorized, 'authorized');
      if (authorized && snapshot.customer.authorized !== true) throw new InsufficientEvidenceError('当前客户数据未授权，不能由浏览器授予权限');
      return {
        patch: authorized
          ? { authorized: true, authNotice: '' }
          : { authorized: false, ...downstreamReset(), diagnosis: null, lastAnswer: null, researchAnswer: null },
        result: { status: 'APPLIED', authorized }
      };
    }

    this.assertAuthorized(state, snapshot);
    if (command === 'generate_allocation') {
      const goal = input.goal;
      if (!goal || typeof goal !== 'object' || Array.isArray(goal)) throw new ValidationError('goal is required');
      const result = await this.rulesService.matchAndExecute({
        ruleId: input.rule_id,
        ruleVersion: input.rule_version,
        inputs: { ...goal, authorized: true }
      });
      if (result.status !== 'MATCHED') return { patch: {}, result };
      return {
        patch: {
          ...downstreamReset(),
          goal: { ...goal },
          plan: { ...result.result },
          ruleMatch: result,
          dataVersion: snapshot.data_version
        },
        result
      };
    }
    if (command === 'generate_candidates') {
      if (!state.plan || !state.goal) throw new ConflictError('请先生成有效配置方案', { command: 'generate_allocation' });
      const result = this.rulesService.selectCandidates(snapshot, state.goal);
      return {
        patch: {
          candidates: result.candidate_ids,
          candidateCalculation: result,
          compareSet: [],
          compareSaved: false,
          careSubmitted: false,
          selectPoolSynced: false,
          dataVersion: snapshot.data_version
        },
        result
      };
    }
    if (command === 'save_comparison') {
      const productIds = input.product_ids || state.compareSet;
      if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 3 || new Set(productIds).size !== productIds.length) {
        throw new ValidationError('有效比较必须包含 2–3 个不同产品');
      }
      const currentProducts = new Map(snapshot.products.map((product) => [product.id, product]));
      if (productIds.some((id) => !currentProducts.has(id))) throw new ValidationError('比较集包含不存在或已失效的产品');
      const result = { status: 'APPLIED', product_ids: [...productIds], data_version: snapshot.data_version };
      return { patch: { compareSet: [...productIds], compareSaved: true, careSubmitted: false }, result };
    }
    if (command === 'submit_care') {
      if (!state.compareSaved) throw new ConflictError('请先保存有效产品比较');
      return { patch: { careSubmitted: true, contactTodo: true }, result: { status: 'WAITING_FOR_MANAGER' } };
    }
    if (command === 'create_reminder') {
      return { patch: { remindCreated: true }, result: { status: 'APPLIED', remindCreated: true } };
    }
    if (command === 'record_activity') {
      const { kind, title } = input;
      if (typeof kind !== 'string' || !ACTIVITY_KINDS.has(kind)) {
        throw new ValidationError('record_activity 的 kind 不在白名单内', { kind, allowed: [...ACTIVITY_KINDS] });
      }
      if (title !== undefined && (typeof title !== 'string' || title.length > 120)) {
        throw new ValidationError('record_activity 的 title 必须是长度不超过 120 的字符串');
      }
      const existing = Array.isArray(state.activities) ? state.activities : [];
      if (existing.length >= MAX_ACTIVITIES) {
        throw new ConflictError('活动记录已达上限，请先清理后再写入', { limit: MAX_ACTIVITIES });
      }
      // The server owns the identity, timestamp and data version. The browser
      // can only select a whitelisted kind and an optional display label.
      const record = {
        activity_id: randomUUID(),
        kind,
        title: typeof title === 'string' ? title : kind,
        created_at: new Date().toISOString(),
        data_version: snapshot.data_version
      };
      return {
        patch: { activities: [...existing, record] },
        result: { status: 'APPLIED', ...record }
      };
    }
    throw new ValidationError('unsupported session command', { command });
  }

  assertAuthorized(state, snapshot) {
    if (state.authorized !== true || snapshot.customer.authorized !== true) {
      throw new InsufficientEvidenceError('当前会话和客户数据均需保持授权');
    }
  }

  async versionConflict(sessionId) {
    const latest = await this.get(sessionId);
    return new ConflictError('session version is stale; reload shared state before retrying', { current_version: latest.version, session_id: sessionId });
  }
}
