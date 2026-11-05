import { ValidationError } from '../../../platform/http/errors.js';

// Only user input and presentation state may use the generic PATCH endpoint.
// Business transitions are executed by validated session commands.
export const SESSION_PATCH_FIELDS = new Set([
  'role',
  'authNotice',
  'aiStatus',
  'promptError',
  'lastQuestion',
  'lastAnswer',
  'diagnosis',
  'goal',
  'compareSet',
  'reviewReady',
  'researchAnswer',
  'researchUsedInCandidates',
  'ruleMatch',
  'contactTodo',
  'holdingsExpanded',
  'landing',
  'aiRequests',
  'viewFilter',
  'uiState'
]);

export const SESSION_COMMANDS = new Set([
  'set_authorization',
  'generate_allocation',
  'generate_candidates',
  'save_comparison',
  'submit_care',
  'create_reminder',
  'record_activity'
]);

// W1 work-item operations that used to be static landing pages. Each kind maps
// to exactly one user-visible action; the browser may only choose a kind, never
// supply the authoritative record (id / timestamp / data version).
export const ACTIVITY_KINDS = new Set([
  'task-center',
  'source-detail',
  'new-supply',
  'subscribe',
  'brief',
  'upload',
  'extract',
  'templates',
  'review-writing',
  'workspace',
  'research-plan',
  'save',
  'mobile-search',
  'filter-panel'
]);

export const MAX_ACTIVITIES = 50;

export function sanitizePatch(patch = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new ValidationError('session patch must be an object');
  const unknown = Object.keys(patch).filter((key) => !SESSION_PATCH_FIELDS.has(key));
  if (unknown.length) throw new ValidationError('session patch contains unsupported or server-owned fields', { fields: unknown });
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

export function validateSessionState(state) {
  if (state?.plan) {
    const values = ['cash', 'bond', 'equity', 'protection'].map((key) => Number(state.plan[key] || 0));
    if (values.some((value) => !Number.isFinite(value) || value < 0) || values.reduce((sum, value) => sum + value, 0) !== 100) {
      throw new ValidationError('配置比例必须为非负数字且合计 100%', { plan: state.plan });
    }
  }
  if (state?.compareSet) {
    if (!Array.isArray(state.compareSet) || state.compareSet.length > 3 || state.compareSet.some((id) => typeof id !== 'string' || !id)) {
      throw new ValidationError('比较集必须包含最多 3 个有效产品 ID');
    }
    if (new Set(state.compareSet).size !== state.compareSet.length) throw new ValidationError('比较集不能包含重复产品');
  }
  if (state?.activities !== undefined) {
    if (!Array.isArray(state.activities) || state.activities.length > MAX_ACTIVITIES) {
      throw new ValidationError('活动记录必须是数组且不超过上限');
    }
    if (state.activities.some((item) => !item || typeof item.activity_id !== 'string' || !ACTIVITY_KINDS.has(item.kind) || typeof item.created_at !== 'string')) {
      throw new ValidationError('活动记录包含服务端不认可的字段或类型');
    }
  }
  // W1 state contract: AI result projections are written back by the browser
  // after /api/ai/generate. They stay on the PATCH whitelist, but their shape
  // and size are bounded here so arbitrary text or huge payloads cannot be
  // stored as a "successful" AI answer.
  for (const key of ['lastAnswer', 'researchAnswer']) {
    const value = state?.[key];
    if (value == null) continue;
    if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`${key} 必须是对象`);
    if (typeof value.text !== 'string' || value.text.length > 20000) throw new ValidationError(`${key}.text 必须是长度不超过 20000 的字符串`);
    if (value.sources !== undefined && !Array.isArray(value.sources)) throw new ValidationError(`${key}.sources 必须是数组`);
  }
  for (const key of ['diagnosis', 'ruleMatch']) {
    const value = state?.[key];
    if (value == null) continue;
    if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`${key} 必须是对象`);
  }
  if (state?.aiRequests !== undefined) {
    if (!Array.isArray(state.aiRequests) || state.aiRequests.length > 100 || state.aiRequests.some((id) => typeof id !== 'string' || !id)) {
      throw new ValidationError('aiRequests 必须是字符串数组且不超过 100 条');
    }
  }
  for (const key of ['landing', 'uiState', 'viewFilter', 'goal']) {
    const value = state?.[key];
    if (value == null) continue;
    if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`${key} 必须是对象`);
    if (JSON.stringify(value).length > 65536) throw new ValidationError(`${key} 超过 64KB 上限`);
  }
  return state;
}

export function downstreamReset() {
  return {
    plan: null,
    ruleMatch: null,
    candidateCalculation: null,
    candidates: [],
    compareSet: [],
    compareSaved: false,
    careSubmitted: false,
    remindCreated: false,
    researchUsedInCandidates: false,
    selectPoolSynced: false,
    activities: []
  };
}
