import { ValidationError } from '../../platform/http/errors.js';
import { buildReadonlyProjections, projectInsuranceCoverage, resolveReadonlyPrincipal } from './readonlyProjections.js';

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

// GET 只读计算接口的查询参数：服务层（normalizeDepositInputs）负责数值/单位校验，
// 这里只做存在性与类型兜底，避免把 undefined 静默当成 0。
function queryValue(query, field) {
  const value = query?.[field];
  if (value === undefined || value === '') return undefined;
  if (Array.isArray(value)) throw new ValidationError(`${field} 只能传一个值`);
  return value;
}

export function createControllers(container) {
  const {
    config,
    healthService,
    dataService,
    knowledgeService,
    sessionService,
    rulesService,
    portfolioService,
    aiOrchestrator
  } = container;

  // GET /api/demo-data 与只读投影共用同一授权前置：有 session 取会话状态，否则按 DATA_MODE 规则。
  async function resolvePrincipal(req, options = {}) {
    return resolveReadonlyPrincipal({ config, sessionService, query: req.query, ...options });
  }

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
    // P-01：前端用到的 7 项 (/ready) checks 的只读暴露。所有值均来自 healthService，
    // 不在此处引入任何默认值；readiness 汇总同样只读返回。
    healthChecks: async (_req, res) => {
      const readiness = await healthService.ready();
      res.json({
        ready: readiness.ready,
        checks: readiness.checks,
        dependencies: readiness.dependencies,
        generated_at: readiness.generated_at,
        api_version: config.API_VERSION,
        frontend_contract_version: config.FRONTEND_CONTRACT_VERSION
      });
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
      // 只读派生投影放在独立命名空间，不新增会话状态 key、不写回会话。
      const projections = buildReadonlyProjections({ snapshot, authorized, insuranceLimit: req.query.insurance_limit });
      res.json({ ...snapshot, readonly_projections: projections, api_version: config.API_VERSION });
    },
    knowledge: async (req, res) => {
      const status = await knowledgeService.status();
      const chunks = status.knowledge_version
        ? await knowledgeService.list({ limit: Math.min(Number(req.query.limit) || 50, 100), knowledgeVersion: status.knowledge_version })
        : [];
      // 知识片段本身是公开数据；只读投影按同一授权前置派生。
      // 没有 session_id 时（浏览器 Boot 链即如此调用）按未授权处理：不读客户快照、不回显明细。
      // 修复前这里会因 database 模式缺 session_id 直接 400，导致前端 waitForSession 超时而所有 E2E 失败。
      const principal = await resolvePrincipal(req, { required: false });
      const snapshot = principal.anonymous
        ? { customer: null, products: [], holdings: [] }
        : await dataService.getCustomerContext({ customerId: principal.customerId, authorized: principal.authorized });
      res.json({
        status,
        chunks,
        readonly_projections: buildReadonlyProjections({ snapshot, authorized: principal.authorized, insuranceLimit: req.query.insurance_limit }),
        api_version: config.API_VERSION
      });
    },
    // §8.1 #4：存款本息只读计算入口（不复用会话命令，不改 7 命令集合）。
    // 校验与单位换算由 businessRulesService.calculateDeposit 负责：
    // rate_unit=decimal 传 0.0215；rate_unit=percent 传 2.15（内部 /100）。
    calculateDeposit: async (req, res) => {
      const result = await rulesService.calculateDeposit({
        principal: queryValue(req.query, 'principal'),
        annual_rate: queryValue(req.query, 'annual_rate'),
        years: queryValue(req.query, 'years'),
        rate_unit: queryValue(req.query, 'rate_unit'),
        rule_version: queryValue(req.query, 'rule_version')
      });
      if (result.status !== 'MATCHED') {
        // 未知规则版本沿用服务层的 UNSUPPORTED_RULE 结果，不被伪装成成功计算。
        res.status(422).json({ ...result, api_version: config.API_VERSION });
        return;
      }
      // 空态：无挂牌利率的期限必须由调用方显式给 annual_rate；服务端不套用任何默认利率。
      res.json({ ...result, api_version: config.API_VERSION });
    },
    // §8.1 #5：持仓收益/贡献/集中度只读计算入口。授权前置与 GET /api/demo-data 相同；
    // 未授权/空持仓由 portfolioService 返回 available=false，绝不返回 0 元冒充结果。
    calculatePortfolio: async (req, res) => {
      const principal = await resolvePrincipal(req, { required: true });
      const result = await portfolioService.calculate({ customerId: principal.customerId, authorized: principal.authorized });
      res.json({ ...result, api_version: config.API_VERSION });
    },
    // 独立保单/保障缺口只读投影（P-13 前端可直接取，无需读整份 demo-data）。
    insuranceCoverage: async (req, res) => {
      const principal = await resolvePrincipal(req, { required: true });
      const snapshot = await dataService.getCustomerContext({ customerId: principal.customerId, authorized: principal.authorized });
      res.json({
        ...projectInsuranceCoverage({ products: snapshot.products, authorized: principal.authorized, limit: req.query.limit }),
        data_version: snapshot.data_version || null,
        data_as_of: snapshot.data_as_of || null,
        api_version: config.API_VERSION
      });
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
