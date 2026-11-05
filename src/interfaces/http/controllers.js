import { ValidationError } from '../../platform/http/errors.js';

function requestIdOf(req) {
  return req.body?.request_id || req.get('x-request-id');
}

function ensureUuid(value, field) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))) {
    throw new ValidationError(`${field} 必须是 UUID`);
  }
  return value;
}

function stringArray(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new ValidationError(`${field} 必须是非空字符串数组`);
  }
  return [...new Set(value)];
}

export function createControllers(container) {
  const { config, healthService, dataService, knowledgeService, sessionService, aiOrchestrator } = container;

  return {
    health: async (_req, res) => {
      const health = await healthService.read();
      res.json({ ...health, api_version: config.API_VERSION, frontend_contract_version: config.FRONTEND_CONTRACT_VERSION });
    },
    ready: async (_req, res) => {
      const readiness = await healthService.ready();
      const payload = { ...readiness, api_version: config.API_VERSION, frontend_contract_version: config.FRONTEND_CONTRACT_VERSION };
      res.status(readiness.ready ? 200 : 503).json(payload);
    },
    demoData: async (req, res) => {
      let customerId;
      let authorized = config.DATA_MODE === 'fixture';
      if (req.query.session_id) {
        const session = await sessionService.get(ensureUuid(req.query.session_id, 'session_id'));
        customerId = session.customer_id;
        authorized = session.state.authorized === true;
      } else if (config.DATA_MODE === 'database') {
        throw new ValidationError('生产数据查询必须携带有效 session_id');
      }
      const snapshot = await dataService.getCustomerContext({ customerId, authorized });
      res.json({ ...snapshot, api_version: config.API_VERSION });
    },
    knowledge: async (req, res) => {
      const status = await knowledgeService.status();
      const chunks = status.knowledge_version
        ? await knowledgeService.list({ limit: Math.min(Number(req.query.limit) || 50, 100), knowledgeVersion: status.knowledge_version })
        : [];
      res.json({ status, chunks, api_version: config.API_VERSION });
    },
    createSession: async (_req, res) => {
      const session = await sessionService.create();
      res.status(201).json({ session, api_version: config.API_VERSION });
    },
    getSession: async (req, res) => {
      const session = await sessionService.get(ensureUuid(req.params.sessionId, 'session_id'));
      res.json({ session, api_version: config.API_VERSION });
    },
    patchSession: async (req, res) => {
      const session = await sessionService.patch({
        sessionId: ensureUuid(req.params.sessionId, 'session_id'),
        expectedVersion: Number(req.body?.expected_version),
        requestId: ensureUuid(requestIdOf(req), 'request_id'),
        patch: req.body?.patch
      });
      res.json({ session, api_version: config.API_VERSION });
    },
    sessionCommand: async (req, res) => {
      const result = await sessionService.command({
        sessionId: ensureUuid(req.params.sessionId, 'session_id'),
        expectedVersion: Number(req.body?.expected_version),
        requestId: ensureUuid(requestIdOf(req), 'request_id'),
        command: req.body?.command,
        input: req.body?.input || {}
      });
      res.json({ ...result, api_version: config.API_VERSION });
    },
    generate: async (req, res) => {
      const sessionId = ensureUuid(req.body?.session_id, 'session_id');
      const requestId = ensureUuid(requestIdOf(req), 'request_id');
      const taskType = req.body?.task_type;
      const sessionVersion = Number(req.body?.session_version);
      if (!Number.isInteger(sessionVersion) || sessionVersion < 1 || !taskType || !req.body || typeof req.body.input !== 'object') {
        throw new ValidationError('session_version、task_type 和 input 为必填字段');
      }
      const result = await aiOrchestrator.generate({
        sessionId,
        sessionVersion,
        requestId,
        taskType,
        input: req.body.input,
        productIds: stringArray(req.body.product_ids, 'product_ids'),
        sourceIds: stringArray(req.body.source_ids, 'source_ids')
      });
      res.json(result);
    }
  };
}
