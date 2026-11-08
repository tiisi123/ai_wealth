import { test, expect } from '@playwright/test';
import { openRoute } from './helpers.js';

// W1 三态 E2E · 批次 C（基线 origin/main = e4d8f49560145d855d9a742e8de170658411958b）
// ---------------------------------------------------------------------------
// 范围严格限定于 PR #29 §15.2 逐路由矩阵第 19 / 22 / 26 / 28 / 30 行，即 5 个手机页：
//   H-05 `m/assistant`、P-14 `m/wealth`、P-15 `m/holdings`、H-03 `m/compare`、
//   P-11 `m/result`。本批次只新增这一个 spec 文件；不改生产代码、共享配置/helpers、
//   其他测试、docs/CI。
//
// 本批特别约束（任务书）：
// - `m/assistant` 本批只测单轮 S/F/E；不实现、不引用、不断言尚未批准的 H-05 多轮
//   上下文契约（F-07 / §16-A）。所有断言只覆盖「本次单轮回答」。
// - `m/holdings` 复用真实只读计算端点 `GET /api/calculations/portfolio` 的真实响应
//   结构（与 three-state.spec.js 的 portfolioAvailable() 同源），并覆盖 400 / 503
//   两类失败与 `available=false` 空态。
// - `m/compare` 成功态必须消费并断言服务端可比性事实：comparable、
//   comparison_basis、incomparable_reason、missing_product_ids、calculation_id。
// - 其余按 §15.2 矩阵逐路由目标可见行为。
//
// 【数据来源与验收边界（§15.4 / §15.5）】
// - 全部为「受控契约响应」或「真实无来源空态」。用 page.route 维护一份内存会话与
//   受控 /api/ 后端（health / sessions / demo-data / knowledge / ai/generate /
//   calculations/portfolio / commands），响应结构取自当前 main 的真实返回
//   （controllers.js、sessionService.js、aiOrchestrator.js、portfolioService.calculate、
//   candidateRules.comparisonOutcome、errorMiddleware），数值取自仓库自带演示夹具
//   src/fixtures/demoData.js。这是 UI 契约验证：**不是真实业务数据验收**，不构成
//   真实模型输出或投资建议结论，**不虚构真实业务数据**。
// - 失败态一律由服务端真实错误体 `{ error:{ code,message,details? }, request_id }`
//   驱动（400 VALIDATION_ERROR / 409 VERSION_CONFLICT / 422 INSUFFICIENT_EVIDENCE /
//   503 DEPENDENCY_UNAVAILABLE），不在浏览器里伪造 promptError（§15.4 第 2 款）。
// - 空态优先用真实无来源（会话无该数据）；不能的（如 not-implemented / available=false）
//   用受控契约响应并在用例注释标明「受控契约，不是真实业务数据」。
// - 每条用例都是独立的成功 / 失败 / 空态断言，只读页面真实可见文本
//   （toContainText / not.toContainText），不断言内部变量；同一测试内覆盖多个错误码
//   时对每个错误码分别断言。
// - 不删断言、不放宽断言、不把失败态改成成功态、不用 test.skip / test.fixme 掩盖
//   缺陷（§15.3 红线）。若目标可见行为在生产代码中不可达，断言保持红并在交付报告
//   里登记精确缺陷；本批 5 页在受控契约下均可达成，未发现需弱化断言的生产缺陷。
// - 受控后端不依赖本地 DB，行为确定；CI 的 ci-e2e-smoke（DATA_MODE=database +
//   postgres 服务）仍按 playwright.config.js 启动真实服务并跑全量 E2E。
// ---------------------------------------------------------------------------

const APP = '#app';
const API_VERSION = 'v1';
const CONTRACT = '2026-11-02.1';
const SESSION_ID = '00000000-0000-4000-8000-00000000c01';
const REQ = '00000000-0000-4000-8000-00000000c02';
const DATA_AS_OF = '2026-09-28';
const DATA_AS_OF_FULL = '2026-09-28 09:30';
const DATA_VERSION = 'demo-2026-09-28-v1';
const KNOWLEDGE_VERSION = 'knowledge-demo-v1';
const SOURCE_ID = 'vendor-product-2026-09-28';
const SOURCE_TS = '2026-09-28T09:00:00+08:00';

const HEALTH_ROUTE = '**/api/health';
const SESSION_CREATE_ROUTE = /\/api\/sessions$/;
const SESSION_ID_ROUTE = /\/api\/sessions\/[^/]+$/;
const COMMANDS_ROUTE = /\/api\/sessions\/[^/]+\/commands$/;
const DEMO_DATA_ROUTE = '**/api/demo-data**';
const KNOWLEDGE_ROUTE = '**/api/knowledge';
const GENERATE_ROUTE = '**/api/ai/generate';
const PORTFOLIO_ROUTE = '**/api/calculations/portfolio**';

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) };
}

// ---------------------------------------------------------------------------
// 受控夹具（controlled fixtures）——结构取自真实接口，数值为演示夹具，不是业务事实。
// ---------------------------------------------------------------------------

// healthService.read() + controllers.health 的顶层结构。
function healthOk() {
  return {
    status: 'ok', service: 'wealth-prototype-demo', instance_id: 'e2e-mobile-stable-three-state',
    node_env: 'test', data_mode: 'database', ai_mode: 'fixture',
    dependencies: {
      database: { ok: true }, shared_document_store: { ok: true },
      knowledge: { status: 'ACTIVE', knowledge_version: KNOWLEDGE_VERSION, document_count: 4, chunk_count: 4, vector_count: 4, ready: true },
      model: { configured: true, execution_mode: 'fixture', model: 'fixture-generate-1', embedding_model: 'fixture-embedding-1' },
      rules: { ready: true, count: 3, expected_version: 'rules-demo-v1' },
      contract: { ready: true, api_version: API_VERSION, frontend_contract_version: CONTRACT },
      data_mode: { ready: true }
    },
    generated_at: '2026-09-28T09:30:00.000Z',
    api_version: API_VERSION, frontend_contract_version: CONTRACT
  };
}

// src/fixtures/demoData.js 的 products[]（演示夹具，不是真实业务数据）。
function demoProducts() {
  return [
    { id: 'wealth', name: '稳盈固收180天', type: '理财', risk: 'R2', role: '稳健底仓', latest_return: 0.0362, drawdown: -0.0042, liquidity: '180 天持有期', fee: 0.002, sale_status: 'ON_SALE' },
    { id: 'fund', name: '易方达中证A500联接A', type: '基金', risk: 'R3', role: '权益增长', latest_return: 0.1842, drawdown: -0.098, liquidity: '工作日可申赎', fee: 0.006, sale_status: 'ON_SALE' },
    { id: 'deposit', name: '安心定期3年', type: '存款', risk: 'R1', role: '确定性现金', annual_rate: 0.0215, liquidity: '提前支取按活期', fee: 0, sale_status: 'ON_SALE' },
    { id: 'insurance', name: '安享长期医疗', type: '保险', risk: '保障', role: '医疗保障', liquidity: '长期保障', sale_status: 'ON_SALE' },
    { id: 'bondfund', name: '华安稳健增利 12 个月', type: '基金', risk: 'R2', role: '稳健底仓', latest_return: 0.0408, drawdown: -0.0112, liquidity: '12 个月持有期', fee: 0.0045, sale_status: 'ON_SALE' },
    { id: 'wealthplus', name: '安盈精选固收+', type: '理财', risk: 'R3', role: '收益增强', latest_return: 0.0518, drawdown: -0.024, liquidity: '12 个月', fee: 0.005, sale_status: 'ON_SALE' },
    { id: 'cash', name: '天天利现金管理', type: '理财', risk: 'R1', role: '现金管理', latest_return: 0.0182, drawdown: null, liquidity: '工作日快赎', fee: 0.0015, sale_status: 'ON_SALE' }
  ].map((p) => ({ ...p, source_id: SOURCE_ID, source_timestamp: SOURCE_TS }));
}

// P-14 成功态：三种 sale_status（ON_SALE / OFF_SALE / 未提供）确认徽章只读服务端字段，
// 不由页面默认值补齐。其余字段仍取自同一演示夹具。
function wealthProductsWithMixedSaleStatus() {
  return demoProducts()
    .filter((p) => p.type === '理财')
    .map((p) => {
      if (p.id === 'wealthplus') return { ...p, sale_status: 'OFF_SALE' };
      if (p.id === 'cash') { const { sale_status, ...rest } = p; return rest; }
      return p;
    });
}

// P-14 空态：服务端快照完全不返回「理财」类产品（真实无来源）。
function nonWealthProducts() {
  return demoProducts().filter((p) => p.type !== '理财');
}

function demoDataBody(products) {
  return {
    data_version: DATA_VERSION, data_as_of: DATA_AS_OF, data_as_of_full: DATA_AS_OF_FULL,
    customer: { id: 'customer-001', name: '林女士', risk_level: 'R3', region: '上海', authorized: true, data_as_of: DATA_AS_OF },
    products,
    holdings: [
      { id: 'holding-001', customer_id: 'customer-001', product_id: 'fund', amount: 168420, return_rate: 0.1842, source_id: 'inhouse-standard-package', source_timestamp: SOURCE_TS },
      { id: 'holding-002', customer_id: 'customer-001', product_id: 'wealth', amount: 250000, return_rate: 0.0362, source_id: 'inhouse-standard-package', source_timestamp: SOURCE_TS },
      { id: 'holding-003', customer_id: 'customer-001', product_id: 'deposit', amount: 300000, return_rate: 0.0215, source_id: 'inhouse-standard-package', source_timestamp: SOURCE_TS }
    ],
    readonly_projections: {},
    api_version: API_VERSION
  };
}

// GET /api/knowledge 的只读投影（片段带 title / page / document_id）。
function knowledgeBody() {
  return {
    status: { status: 'ACTIVE', knowledge_version: KNOWLEDGE_VERSION, document_count: 4, chunk_count: 4, vector_count: 4, vector_dim: 1536, embedding_model: 'fixture-embedding-1', ready: true },
    chunks: [
      { chunk_id: 'chunk-a500-001', document_id: 'doc-a500-quarterly', title: 'A500 季报与风险说明', source_id: 'research-pack-2026-09', product_id: 'fund', source_timestamp: SOURCE_TS, knowledge_version: KNOWLEDGE_VERSION, page: 3, text: 'A500 近期波动主要来自行业权重调整与市场风险偏好变化。', score: 0.91 },
      { chunk_id: 'chunk-fixed-income-001', document_id: 'doc-fixed-income-monthly', title: '固收+策略月报', source_id: 'research-pack-2026-09', product_id: 'wealthplus', source_timestamp: SOURCE_TS, knowledge_version: KNOWLEDGE_VERSION, page: 5, text: '降息预期可能支持债券部分表现。', score: 0.88 },
      { chunk_id: 'chunk-insurance-001', document_id: 'doc-insurance-terms', title: '长期医疗产品说明书', source_id: 'vendor-docs-2026-09', product_id: 'insurance', source_timestamp: SOURCE_TS, knowledge_version: KNOWLEDGE_VERSION, page: 8, text: '投保前需确认既往症除外责任。', score: 0.86 },
      { chunk_id: 'chunk-deposit-001', document_id: 'doc-deposit-rules', title: '存款计息规则', source_id: 'bank-rules-2026-09', product_id: 'deposit', source_timestamp: SOURCE_TS, knowledge_version: KNOWLEDGE_VERSION, page: 2, text: '到期利息按本金乘以年利率和年数计算。', score: 0.84 }
    ],
    readonly_projections: {},
    api_version: API_VERSION
  };
}

// defaultSessionState() 的字段（session.js），受控会话的权威状态基底。
function baseSessionState() {
  return {
    customerName: '林女士', customerId: 'customer-001', authorized: true, qualified: false,
    lastQuestion: '', lastAnswer: null, diagnosis: null,
    goal: { amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' },
    plan: null, candidates: [], compareSet: [], compareSaved: false, careSubmitted: false,
    remindCreated: false, reviewReady: false, holdingsExpanded: false, contactTodo: false,
    selectPoolSynced: false, acceptanceAdvanced: false, researchAnswer: null,
    researchUsedInCandidates: false, ruleMatch: null, aiStatus: null, promptError: '',
    authNotice: '', landing: null, role: '投顾 / 财富管理', aiRequests: [], activities: [],
    dataVersion: DATA_VERSION, knowledgeVersion: KNOWLEDGE_VERSION, ruleVersion: 'rules-demo-v1',
    asOf: DATA_AS_OF, asOfFull: DATA_AS_OF_FULL, viewFilter: {}, uiState: {},
    candidateCalculation: null
  };
}

// POST /api/ai/generate 的 assistant_qa 单轮成功结果（aiOrchestrator 返回结构）。
// request_id 必须回显请求里的同一个值，否则 runRealAiTask 会以「不匹配」拒绝。
const ASSISTANT_ANSWER = '受控回答：这是演示桩 fixture 生成的一轮助手回答，仅证明链路与引用白名单真实。';
function assistantOk(req) {
  return {
    request_id: req.request_id,
    text: ASSISTANT_ANSWER,
    citations: ['product:fund', 'holding:holding-001'],
    evidence: { data_ids: [], calculation_ids: [], rule_citations: [], chunk_ids: [], scores: [] },
    data_as_of: DATA_AS_OF, data_version: DATA_VERSION, knowledge_version: KNOWLEDGE_VERSION,
    model: 'fixture-generate-1', embedding_model: 'fixture-embedding-1', finish_reason: 'stop',
    latency_ms: 42, risks: [], execution_mode: 'fixture'
  };
}

// GET /api/calculations/portfolio 的 available=true 返回。
// 结构与数值复用 three-state.spec.js 的 portfolioAvailable()（portfolioService.calculate
// / computePortfolio 的真实字段与同一公式内部一致计算），即「复用真实计算端点」。
const PORTFOLIO_CALC_ID = 'portfolio-0f5e2a9c41d7b863e4a1';
function portfolioAvailable() {
  return {
    available: true, unavailable_reason: null,
    data_version: DATA_VERSION, data_as_of: DATA_AS_OF,
    calculation: {
      calculation_id: PORTFOLIO_CALC_ID,
      calculation_version: 'portfolio-unverified-return-v1',
      data_ids: ['holding:holding-001', 'holding:holding-002', 'holding:holding-003'],
      data_as_of: DATA_AS_OF, currency: 'CNY',
      total_amount: 718420,
      weights: [
        { holding_id: 'holding-001', product_id: 'fund', data_id: 'holding:holding-001', weight: 0.234431 },
        { holding_id: 'holding-002', product_id: 'wealth', data_id: 'holding:holding-002', weight: 0.347986 },
        { holding_id: 'holding-003', product_id: 'deposit', data_id: 'holding:holding-003', weight: 0.417583 }
      ],
      max_concentration: 0.417583, max_concentration_basis: 'all_assets', max_concentration_holding_id: 'holding-003',
      positions: [
        { holding_id: 'holding-001', product_id: 'fund', product_name: '易方达中证A500联接A', product_type: '基金', role: '权益增长', is_equity: true, amount: 168420, return_rate: 0.1842, return_amount: 26197.4, contribution_to_total_return: 0.635158 },
        { holding_id: 'holding-002', product_id: 'wealth', product_name: '稳盈固收180天', product_type: '理财', role: '稳健底仓', is_equity: false, amount: 250000, return_rate: 0.0362, return_amount: 8733.84, contribution_to_total_return: 0.211753 },
        { holding_id: 'holding-003', product_id: 'deposit', product_name: '安心定期3年', product_type: '存款', role: '确定性现金', is_equity: false, amount: 300000, return_rate: 0.0215, return_amount: 6314.24, contribution_to_total_return: 0.153089 }
      ],
      equity: {
        available: true, unavailable_reason: null, amount: 168420, share_of_total: 0.234431, count: 1,
        concentrations: [{ holding_id: 'holding-001', product_id: 'fund', product_name: '易方达中证A500联接A', amount: 168420, basis: 'equity_assets', fraction: 1 }],
        max_concentration: 1, max_concentration_basis: 'equity_assets', max_concentration_holding_id: 'holding-001', max_concentration_product_id: 'fund'
      },
      holding_return: {
        available: true, unavailable_reason: null, basis: 'amount_x_rate_over_1_plus_rate', level: 'estimated',
        source_rates_verified: true, amount: 41245.48, rate: 0.060908,
        note: '由当前持仓累计收益率按成本还原估算，未含现金分红与交易流水，不视为账务级收益'
      }
    },
    basis: 'all_assets',
    conventions: { currency: 'CNY', amount_unit: '元', ratio_unit: '小数（0.4176 = 41.76%）', rounding: { amount: '2 位小数', ratio: '6 位小数' } },
    api_version: API_VERSION
  };
}

// GET /api/calculations/portfolio 的 available=false 返回（portfolioService.calculate
// 对 unauthorized / no_holdings 的真实形态：不返回假 0 元）。
function portfolioUnavailable(reason) {
  return {
    available: false, unavailable_reason: reason,
    data_version: DATA_VERSION, data_as_of: DATA_AS_OF,
    calculation: null, basis: 'all_assets', conventions: {},
    api_version: API_VERSION
  };
}

// H-03：candidateCalculation.comparison（candidateRules.comparisonOutcome 的真实结构）。
// 三种口径分别覆盖 comparable / comparison_basis / incomparable_reason /
// missing_product_ids 四类可比性事实，items 长度与 compareSet 一致以便页面进入
// 「服务端已覆盖」分支并渲染完整 facts。
function comparableCalculation() {
  const basis = { type: '理财', risk: 'R2', benchmark: 'period_return' };
  return {
    calculation_id: 'candidate-e2e-comparable-0001',
    candidate_ids: ['wealth', 'wealthplus'],
    comparison: {
      comparable: true, comparison_basis: basis, incomparable_reason: null, missing_product_ids: [],
      items: [
        { product_id: 'wealth', basis, missing: [] },
        { product_id: 'wealthplus', basis, missing: [] }
      ]
    }
  };
}
function differentBasisCalculation() {
  return {
    calculation_id: 'candidate-e2e-different-basis-0001',
    candidate_ids: ['fund', 'deposit'],
    comparison: {
      comparable: false, comparison_basis: null, incomparable_reason: 'different_basis', missing_product_ids: [],
      items: [
        { product_id: 'fund', basis: { type: '基金', risk: 'R3', benchmark: 'period_return' }, missing: [] },
        { product_id: 'deposit', basis: { type: '存款', risk: 'R1', benchmark: 'annual_rate' }, missing: [] }
      ]
    }
  };
}
function missingValuesCalculation() {
  return {
    calculation_id: 'candidate-e2e-missing-values-0001',
    candidate_ids: ['fund', 'bondfund'],
    comparison: {
      comparable: false, comparison_basis: null, incomparable_reason: 'missing_values', missing_product_ids: ['bondfund'],
      items: [
        { product_id: 'fund', basis: { type: '基金', risk: 'R3', benchmark: 'period_return' }, missing: [] },
        { product_id: 'bondfund', basis: null, missing: ['product_not_in_data_version'] }
      ]
    }
  };
}

// 服务端真实错误体（errorMiddleware 形状）。
const generate422 = () => ({ status: 422, body: { error: { code: 'INSUFFICIENT_EVIDENCE', message: '当前任务没有足够的证据片段，已停止生成' }, request_id: REQ } });
const generate503 = () => ({ status: 503, body: { error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'AI 生成服务暂时不可用' }, request_id: REQ } });
const saveComparison400 = () => ({ status: 400, body: { error: { code: 'VALIDATION_ERROR', message: '比较集必须包含 2–3 个当前产品库中的真实产品', details: { fields: ['product_ids'] } }, request_id: REQ } });
const saveComparison409 = () => ({ status: 409, body: { error: { code: 'VERSION_CONFLICT', message: '会话版本已过期，请重新加载共享状态' }, request_id: REQ } });
const recordActivity422 = () => ({ status: 422, body: { error: { code: 'INSUFFICIENT_EVIDENCE', message: '服务端返回 422 INSUFFICIENT_EVIDENCE：当前客户无该产品持仓，无法生成诊断' }, request_id: REQ } });
const portfolio400 = () => ({ status: 400, body: { error: { code: 'VALIDATION_ERROR', message: '持仓金额非法', details: { field: 'holdings.amount' } }, request_id: REQ } });
const portfolio503 = () => ({ status: 503, body: { error: { code: 'DEPENDENCY_UNAVAILABLE', message: '持仓计算依赖的共享应用服务暂时不可用' }, request_id: REQ } });
const patchConflict409 = () => ({ status: 409, body: { error: { code: 'VERSION_CONFLICT', message: '会话版本已过期，请重新加载共享状态' }, request_id: REQ } });
const demoDataReload503 = () => ({ status: 503, body: { error: { code: 'DEPENDENCY_UNAVAILABLE', message: '共享数据快照加载失败：知识库依赖不可用（受控夹具）' }, request_id: REQ } });

// ---------------------------------------------------------------------------
// 受控后端：维护一份内存会话状态，PATCH 回显 patch 以保持前后端一致；
// 每个用例按需覆盖各端点。这样用例不依赖本地 DB，且行为确定。
//
// config:
//   state                 —— 注入的会话状态（compareSet / candidateCalculation / landing /
//                            activities / lastAnswer 等）
//   products              —— 覆盖 demo-data 的 products[]
//   portfolio             —— { status, body } 覆盖 GET /api/calculations/portfolio
//   generateError         —— { status, body } 让 POST /api/ai/generate 返回真实错误
//   commandError          —— { status, body } 让 POST .../commands 返回真实错误
//   patchConflictOnce     —— 为 true 时第 1 次 PATCH 返回 409（触发共享状态重载），
//                            其余 PATCH 正常回显（模拟重载后写入成功）
//   demoDataReloadError   —— { status, body }：demo-data 第 1 次（建链）成功，
//                            第 2 次起（重载读取）返回该真实失败体
// ---------------------------------------------------------------------------
async function installBackend(page, config = {}) {
  let version = 1;
  const state = { ...baseSessionState(), ...(config.state || {}) };
  let demoDataCalls = 0;
  let patchCalls = 0;
  const record = () => ({ session_id: SESSION_ID, version, state: { ...state }, customer_id: 'customer-001', status: 'ACTIVE' });
  const postBody = (request) => {
    try { return request.postDataJSON() || {}; } catch { return {}; }
  };

  await page.route(HEALTH_ROUTE, (route) => route.fulfill(json(healthOk())));

  await page.route(SESSION_CREATE_ROUTE, (route) =>
    route.fulfill(json({ session: record(), api_version: API_VERSION }, 201)));

  await page.route(SESSION_ID_ROUTE, (route) => {
    const method = route.request().method();
    if (method === 'GET') return route.fulfill(json({ session: record(), api_version: API_VERSION }));
    if (method === 'PATCH') {
      patchCalls += 1;
      if (config.patchConflictOnce && patchCalls === 1) {
        const c = patchConflict409();
        return route.fulfill(json(c.body, c.status));
      }
      Object.assign(state, postBody(route.request()).patch || {});
      version += 1;
      return route.fulfill(json({ session: record(), api_version: API_VERSION }));
    }
    return route.continue();
  });

  await page.route(COMMANDS_ROUTE, (route) => {
    if (config.commandError) return route.fulfill(json(config.commandError.body, config.commandError.status));
    version += 1;
    const input = postBody(route.request()).input || {};
    return route.fulfill(json({
      session: record(),
      result: { status: 'APPLIED', product_ids: input.product_ids || [], data_version: DATA_VERSION },
      api_version: API_VERSION
    }));
  });

  await page.route(DEMO_DATA_ROUTE, (route) => {
    demoDataCalls += 1;
    if (demoDataCalls > 1 && config.demoDataReloadError) {
      return route.fulfill(json(config.demoDataReloadError.body, config.demoDataReloadError.status));
    }
    return route.fulfill(json(demoDataBody(config.products || demoProducts())));
  });

  await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeBody())));

  await page.route(GENERATE_ROUTE, (route) => {
    if (config.generateError) return route.fulfill(json(config.generateError.body, config.generateError.status));
    return route.fulfill(json(assistantOk(postBody(route.request()))));
  });

  await page.route(PORTFOLIO_ROUTE, (route) => {
    if (config.portfolio) return route.fulfill(json(config.portfolio.body, config.portfolio.status));
    return route.fulfill(json(portfolioAvailable()));
  });
}

// 在同一页面内切换 hash（保持会话与 landing 状态，触发 app 的 hashchange 重渲染）。
async function goHash(page, route) {
  await page.evaluate((r) => { location.hash = `#${r}`; }, route);
}

// ===========================================================================
// 1. H-05 m/assistant：POST /api/ai/generate（assistant_qa）· 单轮 S/F/E
//    §15.2 行 19 目标可见行为：S 回答 + 引用 + fixture 标注；F 422/503 → ai-error；
//    E 空问题 → prompt-needed。本批不实现/不断言未批准的 H-05 多轮上下文契约。
// ===========================================================================
test.describe('H-05 m/assistant：assistant_qa 单轮三态（§15.2 行 19）', () => {
  test('成功：单轮回答 + 来源引用 + 演示桩 fixture 标注，不伪造内部变量', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'm/assistant');
    await page.locator('#mobilePrompt').fill('帮我看一下我的组合');
    await page.locator('[data-action="m-send"]').click();

    // 结果页：回答、来源、提示与 request_id 均来自受控服务端响应。
    const app = page.locator(APP);
    await expect(app).toContainText('问小财已回答', { timeout: 20_000 });
    await expect(app).toContainText(ASSISTANT_ANSWER);
    await expect(app).toContainText('product:fund');
    await expect(app).toContainText('holding:holding-001');
    await expect(app).toContainText('信息辅助，不构成投资建议');
    await expect(app).toContainText('请求标识 request_id');
    await expect(app).not.toContainText('AI 生成失败');
    await expect(app).not.toContainText('请先输入问题');

    // 回到助手页读取本轮回答气泡：只断言这一轮，不触及任何多轮上下文契约。
    await goHash(page, 'm/assistant');
    await expect(app).toContainText('已回答', { timeout: 20_000 });
    await expect(app).toContainText(ASSISTANT_ANSWER);
    await expect(app).toContainText('product:fund');
    await expect(app).toContainText('演示桩 fixture');
    await expect(app).toContainText('以上为信息辅助，不构成投资建议或交易指令');
  });

  test('失败 A：assistant_qa 422 INSUFFICIENT_EVIDENCE → ai-error，展示真实错误且不写成功', async ({ page }) => {
    await installBackend(page, { generateError: generate422() });
    await openRoute(page, 'm/assistant');
    await page.locator('#mobilePrompt').fill('帮我看一下我的组合');
    await page.locator('[data-action="m-send"]').click();

    const app = page.locator(APP);
    await expect(app).toContainText('AI 生成失败', { timeout: 20_000 });
    await expect(app).toContainText('AI ERROR');
    await expect(app).toContainText('当前任务没有足够的证据片段，已停止生成');
    await expect(app).toContainText('FAILED');
    await expect(app).toContainText('未写入成功结果');
    await expect(app).not.toContainText('问小财已回答');
    await expect(app).not.toContainText(ASSISTANT_ANSWER);
  });

  test('失败 B：assistant_qa 503 DEPENDENCY_UNAVAILABLE → ai-error，展示真实错误且不写成功', async ({ page }) => {
    await installBackend(page, { generateError: generate503() });
    await openRoute(page, 'm/assistant');
    await page.locator('#mobilePrompt').fill('帮我看一下我的组合');
    await page.locator('[data-action="m-send"]').click();

    const app = page.locator(APP);
    await expect(app).toContainText('AI 生成失败', { timeout: 20_000 });
    await expect(app).toContainText('AI ERROR');
    await expect(app).toContainText('AI 生成服务暂时不可用');
    await expect(app).toContainText('FAILED');
    await expect(app).toContainText('未写入成功结果');
    await expect(app).not.toContainText('问小财已回答');
    await expect(app).not.toContainText(ASSISTANT_ANSWER);
  });

  test('空态：空问题 → prompt-needed，不生成回答也不伪造引用', async ({ page }) => {
    // 真实空态：flow.js 的 m-send 对空输入落到 prompt-needed，不发起 ai/generate。
    await installBackend(page);
    await openRoute(page, 'm/assistant');
    await page.locator('[data-action="m-send"]').click();

    const app = page.locator(APP);
    await expect(app).toContainText('请先输入问题', { timeout: 20_000 });
    await expect(app).toContainText('用大白话描述你的理财问题后');
    await expect(app).toContainText('已授权资料');
    await expect(app).not.toContainText('问小财已回答');
    await expect(app).not.toContainText(ASSISTANT_ANSWER);
    await expect(app).not.toContainText('AI 生成失败');
  });

  test('空态（补充 · 真实无来源）：服务端尚无回答时助手页不伪造答案/引用/结论', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'm/assistant');
    const app = page.locator(APP);
    await expect(app).toContainText('你可以直接问我', { timeout: 20_000 });
    await expect(app).toContainText('暂无持仓提醒');
    await expect(app).toContainText('服务端没有写入提醒记录');
    await expect(app).not.toContainText(ASSISTANT_ANSWER);
    await expect(app).not.toContainText('问小财已回答');
    await expect(app).not.toContainText('以上为信息辅助，不构成投资建议或交易指令');
  });
});

// ===========================================================================
// 2. P-14 m/wealth：GET /api/demo-data 三态（§15.2 行 22）
//    S 产品卡 + sale_status 徽章；F 快照失败 → 共享数据加载失败；
//    E 分类无产品 → 当前视图暂无产品。
// ===========================================================================
test.describe('P-14 m/wealth：GET /api/demo-data 三态（§15.2 行 22）', () => {
  test('成功：产品卡与 sale_status 徽章只读服务端字段（ON_SALE / OFF_SALE / 未提供）', async ({ page }) => {
    await installBackend(page, { products: wealthProductsWithMixedSaleStatus() });
    await openRoute(page, 'm/wealth');
    const app = page.locator(APP);
    await expect(app).toContainText('稳盈固收180天', { timeout: 20_000 });
    await expect(app).toContainText('安盈精选固收+');
    await expect(app).toContainText('天天利现金管理');
    await expect(app).toContainText('我行可售 · ON_SALE');
    await expect(app).toContainText('暂不可售 · OFF_SALE');
    await expect(app).toContainText('可售状态未提供');
    await expect(app).toContainText('共 3 只，来自 GET /api/demo-data');
    await expect(app).toContainText('可售徽章只读服务端 sale_status');
    await expect(app).not.toContainText('当前视图暂无产品');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：共享快照重载返回 503 → 共享数据加载失败 + 真实错误码，不展示伪成功产品', async ({ page }) => {
    // 受控契约：建链快照成功；一次真实写路径触发 409 VERSION_CONFLICT → 共享状态
    // 重载时 GET /api/demo-data 返回 503 DEPENDENCY_UNAVAILABLE → 全局 sync-error
    // 失败态（不是浏览器构造的假错误）。错误码/消息均来自受控服务端响应。
    await installBackend(page, { patchConflictOnce: true, demoDataReloadError: demoDataReload503() });
    await openRoute(page, 'm/wealth');
    // 触发一次真实会话写路径（与角色切换同一个 patch），错误来自上面的受控响应。
    await page.evaluate(() => window.DemoSession.patch({ role: '专业投研' }));

    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('SESSION ERROR');
    await expect(app).toContainText('共享数据快照加载失败：知识库依赖不可用（受控夹具）');
    await expect(app).toContainText('真实数据未加载成功');
    await expect(app).not.toContainText('稳盈固收180天');
    await expect(app).not.toContainText('我行可售 · ON_SALE');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
  });

  test('空态：快照无「理财」类产品 → 当前视图暂无产品，不补入默认产品', async ({ page }) => {
    // 真实无来源空态：服务端快照不返回「理财」类产品（非注入错误）。
    await installBackend(page, { products: nonWealthProducts() });
    await openRoute(page, 'm/wealth');
    const app = page.locator(APP);
    await expect(app).toContainText('当前视图暂无产品', { timeout: 20_000 });
    await expect(app).toContainText('GET /api/demo-data 没有返回「理财」类产品');
    await expect(app).toContainText('本页不展示任何演示产品');
    await expect(app).not.toContainText('稳盈固收180天');
    await expect(app).not.toContainText('我行可售 · ON_SALE');
    await expect(app).not.toContainText('共 3 只');
  });
});

// ===========================================================================
// 3. P-15 m/holdings：GET /api/calculations/portfolio 三态（§15.2 行 26）
//    复用真实只读计算端点的真实响应结构，覆盖 400 / 503 与 available=false。
// ===========================================================================
test.describe('P-15 m/holdings：GET /api/calculations/portfolio 三态（§15.2 行 26）', () => {
  test('成功：双分母集中度 + estimated 收益 + calculation_id 来自服务端结果', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'm/holdings');
    const app = page.locator(APP);
    await expect(app).toContainText('服务端计算结果', { timeout: 20_000 });
    await expect(app).toContainText('集中度（两种分母口径，不可混用）');
    await expect(app).toContainText('最大单产品权重 · 全资产口径');
    await expect(app).toContainText('basis=all_assets');
    await expect(app).toContainText('41.76%');
    await expect(app).toContainText('最大单产品权重 · 权益资产口径');
    await expect(app).toContainText('basis=equity_assets');
    await expect(app).toContainText('100.00%');
    await expect(app).toContainText('持有收益（服务端估算）');
    await expect(app).toContainText('¥41,245.48');
    await expect(app).toContainText('不视为账务级收益');
    await expect(app).toContainText(PORTFOLIO_CALC_ID);
    await expect(app).not.toContainText('服务端计算失败');
    await expect(app).not.toContainText('暂无持仓');
    await expect(app).not.toContainText('该口径不可用（无权益持仓）');
  });

  test('失败 A：400 VALIDATION_ERROR → 服务端计算失败 + 错误码，不展示服务端金额', async ({ page }) => {
    await installBackend(page, { portfolio: portfolio400() });
    await openRoute(page, 'm/holdings');
    const app = page.locator(APP);
    await expect(app).toContainText('服务端计算失败（VALIDATION_ERROR）', { timeout: 20_000 });
    await expect(app).toContainText('服务端错误 VALIDATION_ERROR');
    await expect(app).toContainText('持仓金额非法');
    await expect(app).toContainText('未获得服务端结果，本次不展示任何金额');
    await expect(app).not.toContainText('¥41,245.48');
    await expect(app).not.toContainText('服务端计算结果');
    await expect(app).not.toContainText(PORTFOLIO_CALC_ID);
  });

  test('失败 B：503 DEPENDENCY_UNAVAILABLE → 服务端计算失败 + 错误码，不展示服务端金额', async ({ page }) => {
    await installBackend(page, { portfolio: portfolio503() });
    await openRoute(page, 'm/holdings');
    const app = page.locator(APP);
    await expect(app).toContainText('服务端计算失败（DEPENDENCY_UNAVAILABLE）', { timeout: 20_000 });
    await expect(app).toContainText('服务端错误 DEPENDENCY_UNAVAILABLE');
    await expect(app).toContainText('持仓计算依赖的共享应用服务暂时不可用');
    await expect(app).toContainText('未获得服务端结果，本次不展示任何金额');
    await expect(app).not.toContainText('¥41,245.48');
    await expect(app).not.toContainText('服务端计算结果');
    await expect(app).not.toContainText(PORTFOLIO_CALC_ID);
  });

  test('空态 A：available=false / no_holdings → 暂无持仓，不显示 0 元', async ({ page }) => {
    // 受控契约，不是真实业务数据：portfolioService.calculate 对空持仓的真实形态。
    await installBackend(page, { portfolio: { status: 200, body: portfolioUnavailable('no_holdings') } });
    await openRoute(page, 'm/holdings');
    const app = page.locator(APP);
    await expect(app).toContainText('暂无持仓', { timeout: 20_000 });
    await expect(app).toContainText('本页不展示 0 元，也不展示任何估算收益或集中度');
    await expect(app).toContainText('unavailable_reason=no_holdings');
    await expect(app).not.toContainText('¥41,245.48');
    await expect(app).not.toContainText('服务端计算结果');
    await expect(app).not.toContainText('41.76%');
  });

  test('空态 B：available=false / unauthorized → 未授权查看持仓计算，不显示 0 元', async ({ page }) => {
    // 受控契约，不是真实业务数据：portfolioService.calculate 对未授权的真实形态。
    await installBackend(page, { portfolio: { status: 200, body: portfolioUnavailable('unauthorized') } });
    await openRoute(page, 'm/holdings');
    const app = page.locator(APP);
    await expect(app).toContainText('未授权查看持仓计算', { timeout: 20_000 });
    await expect(app).toContainText('本页不展示 0 元，也不展示任何估算收益或集中度');
    await expect(app).toContainText('unavailable_reason=unauthorized');
    await expect(app).not.toContainText('¥41,245.48');
    await expect(app).not.toContainText('服务端计算结果');
    await expect(app).not.toContainText('41.76%');
  });
});

// ===========================================================================
// 4. H-03 m/compare：服务端比较口径三态（§15.2 行 28）
//    成功态必须消费并断言可比性事实：comparable / comparison_basis /
//    incomparable_reason / missing_product_ids / calculation_id。
// ===========================================================================
test.describe('H-03 m/compare：服务端比较口径三态（§15.2 行 28）', () => {
  test('成功 A：comparable=true → 可排名，comparison_basis 与 calculation_id 可见', async ({ page }) => {
    // 受控契约响应：candidateCalculation.comparison 由服务端发布，页面只消费不换算。
    await installBackend(page, { state: { compareSet: ['wealth', 'wealthplus'], candidateCalculation: comparableCalculation() } });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('当前 2 个产品', { timeout: 20_000 });
    await expect(app).toContainText('稳盈固收180天');
    await expect(app).toContainText('安盈精选固收+');
    await expect(app).toContainText('可排名（服务端口径一致）');
    await expect(app).toContainText('排名资格：服务端判定 comparable=true');
    await expect(app).toContainText('产品类型 理财');
    await expect(app).toContainText('风险 R2');
    await expect(app).toContainText('收益口径 period_return');
    await expect(app).toContainText('比较口径 calculation_id：candidate-e2e-comparable-0001');
    await expect(app).not.toContainText('incomparable_reason=');
    await expect(app).not.toContainText('不可排名（口径不同或服务端未覆盖）');
  });

  test('成功 B：comparable=false / different_basis → incomparable_reason 可见、明示不可排名', async ({ page }) => {
    await installBackend(page, { state: { compareSet: ['fund', 'deposit'], candidateCalculation: differentBasisCalculation() } });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('当前 2 个产品', { timeout: 20_000 });
    await expect(app).toContainText('易方达中证A500联接A');
    await expect(app).toContainText('安心定期3年');
    await expect(app).toContainText('不可排名（口径不同或服务端未覆盖）');
    await expect(app).toContainText('排名资格：服务端判定 comparable=false');
    await expect(app).toContainText('incomparable_reason=different_basis');
    await expect(app).toContainText('产品类型 / 风险等级 / 收益口径不同');
    await expect(app).toContainText('因此不可排名');
    await expect(app).toContainText('不同口径的产品只并列事实');
    await expect(app).toContainText('比较口径 calculation_id：candidate-e2e-different-basis-0001');
    await expect(app).not.toContainText('可排名（服务端口径一致）');
  });

  test('成功 C：comparable=false / missing_values → missing_product_ids 可见、缺值不参与比较', async ({ page }) => {
    await installBackend(page, { state: { compareSet: ['fund', 'bondfund'], candidateCalculation: missingValuesCalculation() } });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('当前 2 个产品', { timeout: 20_000 });
    await expect(app).toContainText('不可排名（口径不同或服务端未覆盖）');
    await expect(app).toContainText('排名资格：服务端判定 comparable=false');
    await expect(app).toContainText('incomparable_reason=missing_values');
    await expect(app).toContainText('比较集中有产品在当前数据版本里缺值');
    await expect(app).toContainText('缺失产品：bondfund（missing_values，不参与任何比较）');
    await expect(app).toContainText('比较口径 calculation_id：candidate-e2e-missing-values-0001');
    await expect(app).not.toContainText('可排名（服务端口径一致）');
  });

  test('失败 A：save_comparison 400 VALIDATION_ERROR → action-error，展示真实错误且不伪装成功', async ({ page }) => {
    await installBackend(page, { state: { compareSet: ['fund', 'wealth', 'deposit'] }, commandError: saveComparison400() });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('当前 3 个产品', { timeout: 20_000 });
    await page.locator('[data-action="m-save-compare"]').click();
    await expect(page).toHaveURL(/#m\/result/);
    await expect(app).toContainText('操作未完成', { timeout: 20_000 });
    await expect(app).toContainText('REQUEST ERROR');
    await expect(app).toContainText('比较集必须包含 2–3 个当前产品库中的真实产品');
    await expect(app).toContainText('未展示成功结果');
    await expect(app).not.toContainText('比较结果已保存');
  });

  test('失败 B：save_comparison 409 VERSION_CONFLICT → action-error，展示真实错误且不伪装成功', async ({ page }) => {
    await installBackend(page, { state: { compareSet: ['fund', 'wealth', 'deposit'] }, commandError: saveComparison409() });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('当前 3 个产品', { timeout: 20_000 });
    await page.locator('[data-action="m-save-compare"]').click();
    await expect(page).toHaveURL(/#m\/result/);
    await expect(app).toContainText('操作未完成', { timeout: 20_000 });
    await expect(app).toContainText('REQUEST ERROR');
    await expect(app).toContainText('会话版本已过期，请重新加载共享状态');
    await expect(app).toContainText('未展示成功结果');
    await expect(app).not.toContainText('比较结果已保存');
  });

  test('空态：比较集为空 → 显式引导空态，不自动补入默认候选、不给出排名结论', async ({ page }) => {
    // 真实无来源空态：会话里 compareSet 为空。
    await installBackend(page, { state: { compareSet: [] } });
    await openRoute(page, 'm/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('比较集为空', { timeout: 20_000 });
    await expect(app).toContainText('请先在真实候选中加入 2–3 个产品');
    await expect(app).toContainText('系统不会自动补入默认产品');
    await expect(app).toContainText('去候选推荐');
    await expect(app).not.toContainText('可排名（服务端口径一致）');
    await expect(app).not.toContainText('不可排名（口径不同或服务端未覆盖）');
    await expect(app).not.toContainText('保存比较结果');
  });
});

// ===========================================================================
// 5. P-11 m/result：record_activity / landingSpec / aiResult 三态（§15.2 行 30）
//    S 服务端记录或 aiResult；F action-error；E not-implemented / 尚未写入服务端记录。
// ===========================================================================
const ACTIVITY_RECORD = {
  activity_id: 'act-e2e-mobile-0001', kind: 'mobile-search', title: 'A500',
  created_at: '2026-09-28T09:30:00.000Z', data_version: DATA_VERSION
};

test.describe('P-11 m/result：服务端写入结果三态（§15.2 行 30）', () => {
  test('成功 A：结果页只显示服务端 activities[] 真实记录', async ({ page }) => {
    await installBackend(page, {
      state: {
        landing: { id: 'mobile-search', from: 'm/fund', asOf: DATA_AS_OF, query: 'A500', requestId: REQ },
        activities: [ACTIVITY_RECORD]
      }
    });
    await openRoute(page, 'm/result');
    const app = page.locator(APP);
    await expect(app).toContainText('基金搜索结果', { timeout: 20_000 });
    await expect(app).toContainText('已由应用服务写入真实记录');
    await expect(app).toContainText('服务端状态');
    await expect(app).toContainText(ACTIVITY_RECORD.activity_id);
    await expect(app).toContainText(ACTIVITY_RECORD.created_at);
    await expect(app).toContainText(ACTIVITY_RECORD.data_version);
    await expect(app).toContainText('累计 1 条');
    await expect(app).not.toContainText('W1 未实现');
    await expect(app).not.toContainText('操作未完成');
    await expect(app).not.toContainText('尚未写入服务端记录');
  });

  test('成功 B：结果页只显示服务端 aiResult 投影（文本 / 引用 / 模型 / 时延）', async ({ page }) => {
    await installBackend(page, {
      state: {
        landing: {
          id: 'summary', from: 'm/assistant', asOf: DATA_AS_OF,
          aiResult: {
            text: '受控摘要：A500 季报与风险说明的要点（演示桩 fixture 结果）。',
            citations: ['chunk-a500-001'], model: 'fixture-generate-1', latency_ms: 88,
            execution_mode: 'fixture'
          }
        }
      }
    });
    await openRoute(page, 'm/result');
    const app = page.locator(APP);
    await expect(app).toContainText('报告摘要', { timeout: 20_000 });
    await expect(app).toContainText('受控摘要：A500 季报与风险说明的要点（演示桩 fixture 结果）。');
    await expect(app).toContainText('chunk-a500-001');
    await expect(app).toContainText('fixture-generate-1');
    await expect(app).toContainText('88 ms');
    await expect(app).not.toContainText('W1 未实现');
    await expect(app).not.toContainText('操作未完成');
  });

  test('失败：record_activity 真实 422 → action-error 显示真实错误码，不伪装成功', async ({ page }) => {
    await installBackend(page, { commandError: recordActivity422() });
    await openRoute(page, 'm/assistant');
    // 走真实 UI 动作分发（mobile-search → record_activity），失败完全来自受控服务端响应。
    await page.evaluate(() => window.WealthActions.dispatch({
      action: 'mobile-search', el: document.querySelector('#app'), productId: '', event: {}
    }));
    const app = page.locator(APP);
    await expect(app).toContainText('操作未完成', { timeout: 20_000 });
    await expect(app).toContainText('REQUEST ERROR');
    await expect(app).toContainText('INSUFFICIENT_EVIDENCE');
    await expect(app).toContainText('当前客户无该产品持仓，无法生成诊断');
    await expect(app).toContainText('未展示成功结果');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
  });

  test('空态 A：工作项无服务端记录 → 尚未写入服务端记录，不补默认成功', async ({ page }) => {
    // 真实无来源空态：landing 有工作项，但 activities[] 为空。
    await installBackend(page, {
      state: { landing: { id: 'task-center', from: 'm/assistant', asOf: DATA_AS_OF }, activities: [] }
    });
    await openRoute(page, 'm/result');
    const app = page.locator(APP);
    await expect(app).toContainText('尚未写入服务端记录', { timeout: 20_000 });
    await expect(app).toContainText('当前无待处理事项');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
    await expect(app).not.toContainText(ACTIVITY_RECORD.activity_id);
  });

  test('空态 B：无写入方的操作 → not-implemented，不伪装成功也不写状态', async ({ page }) => {
    // 受控契约，不是真实业务数据：未知操作经真实 dispatcher 落到 not-implemented。
    await installBackend(page);
    await openRoute(page, 'm/assistant');
    await page.evaluate(() => window.WealthActions.dispatch({
      action: 'w1-unknown-mobile-action', el: document.querySelector('#app'), productId: '', event: {}
    }));
    const app = page.locator(APP);
    await expect(app).toContainText('W1 未实现', { timeout: 20_000 });
    await expect(app).toContainText('该操作在当前 W1 范围尚未实现');
    await expect(app).toContainText('未写入成功状态');
    await expect(app).toContainText('w1-unknown-mobile-action');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
    // 注意：landingSpec('not-implemented') 的 kicker 本身就是「操作未完成」，
    // 因此不能用它区分失败态；用 action-error 独有的 kicker「REQUEST ERROR」
    // 与「未展示成功结果」来断言没有落到伪成功/操作失败页。
    await expect(app).not.toContainText('REQUEST ERROR');
    await expect(app).not.toContainText('未展示成功结果');
  });
});
