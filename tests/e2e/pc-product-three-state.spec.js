import { test, expect } from '@playwright/test';
import { openRoute } from './helpers.js';

// W1 三态 E2E 批次 B（基线 origin/main = e4d8f49560145d855d9a742e8de170658411958b）。
//
// 范围严格限定于 PR #29 §15.2 逐路由矩阵第 3 / 4 / 5 / 9 / 11 行：
//   P-02 `pc/product-fund`、P-03 `pc/product-insurance` / `pc/product-wealth`、
//   H-03 `pc/compare`、H-04 `pc/research`。
// 本批次只新增这一个 spec 文件；不改生产代码、共享配置/helpers、其他测试、docs/CI。
//
// 每条用例都是独立的成功 / 失败 / 空态断言，只读页面真实可见文本
// （toContainText / not.toContainText），不断言内部变量。
//
// 【数据来源与验收边界（§15.4 / §15.5）】
// - 前三页在 §15.2「缺真实数据源 = 是」（净值序列、保单/理赔、管理人/审计等扩展字段
//   服务端没有来源）：用「受控契约响应」验证 UI 三态映射，空态用「真实无来源空态」
//   （近三年/成立以来无收益序列、保单板块无来源、管理人/审计字段无来源）；
// - 受控响应的结构取自当前 main 的真实接口/状态形状，数值取自仓库自带演示夹具
//   src/fixtures/demoData.js；这是 UI 契约验证，**不是真实业务数据验收**，本文件
//   不宣称任何真实数据验收，也不虚构真实业务数据；
// - 失败态一律由服务端真实错误体 `{ error:{ code,message,details? }, request_id }`
//   驱动，不在浏览器里伪造 promptError（§15.4 第 2 款）；
// - 不使用 test.skip / test.fixme，不删断言、不放宽断言、不改成功态、不把失败态
//   改成成功态（§15.3 红线）。
//
// 【受控后端】用 page.route 拦截 /api/ 请求，维护一份内存会话状态：
// session-sync.js 建链所需 GET /api/health、POST /api/sessions、GET /api/demo-data、
// GET /api/knowledge 全部返回受控契约响应；PATCH 回显 patch 以保持前后端状态一致；
// 每个用例按需覆盖 demo-data（产品目录）、ai/generate（research_qa）、
// sessions/.../commands（save_comparison）。这样用例不依赖本地 DB，且行为确定。

const APP = '#app';
const API_VERSION = 'v1';
const CONTRACT = '2026-11-02.1';
const SESSION_ID = '00000000-0000-4000-8000-00000000e2e';
const REQ = '00000000-0000-4000-8000-00000000b0b';
const DATA_AS_OF = '2026-09-28';
const DATA_AS_OF_FULL = '2026-09-28 09:30';
const DATA_VERSION = 'demo-2026-09-28-v1';
const KNOWLEDGE_VERSION = 'knowledge-demo-v1';
const SOURCE_ID = 'vendor-product-2026-09-28';
const SOURCE_TS = `${DATA_AS_OF}T09:00:00+08:00`;

const HEALTH_ROUTE = '**/api/health';
const SESSIONS_ROUTE = '**/api/sessions';
const SESSION_ID_ROUTE = /\/api\/sessions\/[^/]+$/;
const COMMANDS_ROUTE = /\/api\/sessions\/[^/]+\/commands$/;
const DEMO_DATA_ROUTE = '**/api/demo-data**';
const KNOWLEDGE_ROUTE = '**/api/knowledge';
const GENERATE_ROUTE = '**/api/ai/generate';

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) };
}

// healthService.read() + controllers.health 的顶层结构（字段与真实实现一致）。
function healthOk() {
  return {
    status: 'ok', service: 'wealth-prototype-demo', instance_id: 'e2e-pc-product-three-state',
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
    { id: 'insurance', name: '安享长期医疗', type: '保险', risk: '保障', role: '医疗保障', coverage: 4000000, annual_premium: 3280, liquidity: '长期保障', sale_status: 'ON_SALE' },
    { id: 'bondfund', name: '华安稳健增利 12 个月', type: '基金', risk: 'R2', role: '稳健底仓', latest_return: 0.0408, drawdown: -0.0112, liquidity: '12 个月持有期', fee: 0.0045, sale_status: 'ON_SALE' },
    { id: 'wealthplus', name: '安盈精选固收+', type: '理财', risk: 'R3', role: '收益增强', latest_return: 0.0518, drawdown: -0.024, liquidity: '12 个月', fee: 0.005, sale_status: 'ON_SALE' },
    { id: 'cash', name: '天天利现金管理', type: '理财', risk: 'R1', role: '现金管理', latest_return: 0.0182, drawdown: null, liquidity: '工作日快赎', fee: 0.0015, sale_status: 'ON_SALE' }
  ].map((p) => ({ ...p, source_id: SOURCE_ID, source_timestamp: SOURCE_TS }));
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

// GET /api/knowledge 的只读投影（片段带 title / page / document_id，供引用回指使用）。
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

// POST /api/ai/generate 的 research_qa 成功结果（aiOrchestrator.executeGenerate 返回结构）。
function generateOk(req) {
  return {
    request_id: req.request_id,
    text: '在授权知识范围内，A500 近期波动主要来自行业权重调整与市场风险偏好变化；固收+仍受信用利差与权益仓位影响。（演示桩 fixture 结论，非真实模型输出）',
    citations: ['chunk-a500-001', 'chunk-fixed-income-001'],
    evidence: {
      data_ids: [], calculation_ids: [], rule_citations: [],
      chunk_ids: ['chunk-a500-001', 'chunk-fixed-income-001'],
      scores: [{ chunk_id: 'chunk-a500-001', score: 0.91 }, { chunk_id: 'chunk-fixed-income-001', score: 0.88 }]
    },
    data_as_of: DATA_AS_OF, data_version: DATA_VERSION, knowledge_version: KNOWLEDGE_VERSION,
    model: 'fixture-generate-1', embedding_model: 'fixture-embedding-1', finish_reason: 'stop',
    latency_ms: 137, risks: [], execution_mode: 'fixture'
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

// 安装受控后端。config 可覆盖：
//   state                —— 注入的会话状态（compareSet / candidateCalculation / researchAnswer / landing）
//   catalogError         —— { status, body }：demo-data 第 1 次（建链）成功，之后（产品目录）返回该错误
//   commandError         —— { status, body }：save_comparison 命令返回该真实错误
//   generateError        —— { status, body }：research_qa 生成返回该真实错误
//   products             —— 覆盖 demo-data 的 products[]
async function installBackend(page, config = {}) {
  let version = 1;
  const state = { ...baseSessionState(), ...(config.state || {}) };
  let demoDataCalls = 0;
  const record = () => ({ session_id: SESSION_ID, version, state: { ...state } });
  const postBody = (request) => {
    try { return request.postDataJSON() || {}; } catch { return {}; }
  };

  await page.route(HEALTH_ROUTE, (route) => route.fulfill(json(healthOk())));

  await page.route(SESSIONS_ROUTE, (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return route.fulfill(json({ session: record(), api_version: API_VERSION }, 201));
  });

  await page.route(SESSION_ID_ROUTE, (route) => {
    const method = route.request().method();
    if (method === 'GET') return route.fulfill(json({ session: record(), api_version: API_VERSION }));
    if (method === 'PATCH') {
      Object.assign(state, postBody(route.request()).patch || {});
      version += 1;
      return route.fulfill(json({ session: record(), api_version: API_VERSION }));
    }
    return route.continue();
  });

  await page.route(COMMANDS_ROUTE, (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    if (config.commandError) return route.fulfill(json(config.commandError.body, config.commandError.status));
    version += 1;
    const input = postBody(route.request()).input || {};
    return route.fulfill(json({ session: record(), result: { status: 'APPLIED', product_ids: input.product_ids || [], data_version: DATA_VERSION }, api_version: API_VERSION }));
  });

  await page.route(DEMO_DATA_ROUTE, (route) => {
    demoDataCalls += 1;
    // 第 1 次是 session-sync.js 的 loadData：必须成功，会话才能 connected=true。
    // 之后是 productPage 的 ensureProductCatalog：按用例注入成功或真实失败体。
    if (demoDataCalls > 1 && config.catalogError) {
      return route.fulfill(json(config.catalogError.body, config.catalogError.status));
    }
    return route.fulfill(json(demoDataBody(config.products || demoProducts())));
  });

  await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeBody())));

  await page.route(GENERATE_ROUTE, (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    if (config.generateError) return route.fulfill(json(config.generateError.body, config.generateError.status));
    return route.fulfill(json(generateOk(postBody(route.request()))));
  });
}

// 失败态夹具：服务端真实错误体（errorMiddleware 形状）。
function catalogFailure() {
  return { status: 503, body: { error: { code: 'DEPENDENCY_UNAVAILABLE', message: '共享应用服务暂时不可用' }, request_id: REQ } };
}
function saveComparisonFailure() {
  return { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: '比较集必须包含 2–3 个当前产品库中的真实产品', details: { fields: ['product_ids'] } }, request_id: REQ } };
}
function researchGenerateFailure() {
  return { status: 422, body: { error: { code: 'INSUFFICIENT_EVIDENCE', message: '当前任务没有足够的知识片段，已停止生成' }, request_id: REQ } };
}

// 受控比较口径：candidateCalculation.comparison（businessRulesService / candidateRules 的真实结构）。
function comparableCalculation() {
  const basis = { type: '基金', risk: 'R3', benchmark: 'period_return' };
  return {
    calculation_id: 'candidate-e2e-comparable-0001',
    candidate_ids: ['fund', 'bondfund'],
    comparison: {
      comparable: true, comparison_basis: basis, incomparable_reason: null, missing_product_ids: [],
      items: [
        { product_id: 'fund', basis, missing: [] },
        { product_id: 'bondfund', basis, missing: [] }
      ]
    }
  };
}
function incomparableCalculation() {
  return {
    calculation_id: 'candidate-e2e-incomparable-0001',
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

// 在同一页面内切换 hash（保持会话与 landing 状态，触发 app 的 hashchange 重渲染）。
async function goHash(page, route) {
  await page.evaluate((r) => { location.hash = `#${r}`; }, route);
}

// ---------------------------------------------------------------------------
// P-02 pc/product-fund：GET /api/demo-data 三态（§15.2 行 3）
// ---------------------------------------------------------------------------
test.describe('P-02 pc/product-fund：GET /api/demo-data 三态', () => {
  test('成功：产品事实 / 费率 / 近一年收益 / 回撤 / 可售状态 / 来源 / 时点来自 products[]', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-fund');
    const app = page.locator(APP);
    await expect(app).toContainText('易方达中证A500联接A', { timeout: 20_000 });
    await expect(app).toContainText('产品事实');
    await expect(app).toContainText('GET /api/demo-data');
    await expect(app).toContainText('数据来源');
    await expect(app).toContainText(SOURCE_ID);
    await expect(app).toContainText('数据时点');
    await expect(app).toContainText(DATA_AS_OF);
    await expect(app).toContainText('可售状态');
    await expect(app).toContainText('ON_SALE');
    await expect(app).toContainText('近一年收益率');
    await expect(app).toContainText('18.42%');
    await expect(app).toContainText('-9.80%');
    await expect(app).toContainText('0.60% 管理费');
    await expect(app).toContainText('口径字段');
    await expect(app).toContainText('products[].latest_return');
    await expect(app).toContainText('服务端事实');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：产品目录 GET /api/demo-data 返回 503 → 共享数据加载失败 + 真实错误码，不展示静态行', async ({ page }) => {
    // 受控契约：建链的 demo-data 成功，产品目录读取失败 → 页面落真实失败态。
    await installBackend(page, { catalogError: catalogFailure() });
    await openRoute(page, 'pc/product-fund');
    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('GET /api/demo-data → HTTP 503');
    await expect(app).toContainText('DEPENDENCY_UNAVAILABLE');
    await expect(app).toContainText('共享应用服务暂时不可用');
    await expect(app).toContainText('本页不展示任何静态或演示行');
    await expect(app).not.toContainText('易方达中证A500联接A');
  });

  test('空态：近三年无收益序列 → 该区间暂无数据；缺扩展字段列真实无来源空态', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-fund');
    const app = page.locator(APP);
    await expect(app).toContainText('易方达中证A500联接A', { timeout: 20_000 });
    // 真实无来源空态：服务端只发布近一年，切到近三年后不沿用数值、不画示意曲线。
    await pickInterval(page, '近三年');
    await expect(app).toContainText('观察区间：近三年');
    await expect(app).toContainText('该区间暂无数据');
    await expect(app).toContainText('空态 · 该区间无数据');
    await expect(app).toContainText('系统不用其他区间或示意曲线补位');
    // 服务端未返回的扩展字段（净值序列/规模/持仓分布/基金经理/费率结构）如实列为空态。
    await expect(app).toContainText('暂未由服务端提供的字段');
    await expect(app).toContainText('净值序列');
    await expect(app).toContainText('基金经理');
    await expect(app).toContainText('未提供');
  });
});

// P-02 区间切换：用 DOM change 事件驱动 app 的委托监听（setUi + rerender），
// 与视口无关，pc / mobile 两个工程都可稳定触发。
async function pickInterval(page, value) {
  await page.evaluate((v) => {
    const select = document.querySelector('select[data-ui-change="interval"]');
    if (!select) throw new Error('观察区间 select 不存在');
    select.value = v;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

// ---------------------------------------------------------------------------
// P-03 pc/product-insurance：GET /api/demo-data 三态（§15.2 行 4）
// ---------------------------------------------------------------------------
test.describe('P-03 pc/product-insurance：GET /api/demo-data 三态', () => {
  test('成功：产品行 / 事实 / 可售状态来自快照', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-insurance');
    const app = page.locator(APP);
    await expect(app).toContainText('安享长期医疗', { timeout: 20_000 });
    await expect(app).toContainText('产品事实');
    await expect(app).toContainText('GET /api/demo-data');
    await expect(app).toContainText('数据来源');
    await expect(app).toContainText(SOURCE_ID);
    await expect(app).toContainText('数据时点');
    await expect(app).toContainText(DATA_AS_OF);
    await expect(app).toContainText('可售状态');
    await expect(app).toContainText('ON_SALE');
    await expect(app).toContainText('保障额度');
    await expect(app).toContainText('¥4,000,000');
    await expect(app).toContainText('年度保费');
    await expect(app).toContainText('¥3,280');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：快照 GET /api/demo-data 返回 503 → 共享数据加载失败 + 真实错误码', async ({ page }) => {
    await installBackend(page, { catalogError: catalogFailure() });
    await openRoute(page, 'pc/product-insurance');
    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('GET /api/demo-data → HTTP 503');
    await expect(app).toContainText('DEPENDENCY_UNAVAILABLE');
    await expect(app).toContainText('本页不展示任何静态或演示行');
    await expect(app).not.toContainText('安享长期医疗');
  });

  test('空态：保单板块无来源 → 未授权或暂无可展示保单；缺字段列为空态', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-insurance');
    const app = page.locator(APP);
    await expect(app).toContainText('安享长期医疗', { timeout: 20_000 });
    // 真实无来源空态：服务端没有保单/理赔记录，不展示任何保单卡片。
    await expect(app).toContainText('未授权或暂无可展示保单');
    await expect(app).toContainText('本页不展示任何保单卡片');
    await expect(app).toContainText('暂未由服务端提供的字段');
    await expect(app).toContainText('保单（保单号 / 生效日 / 续保日）');
    await expect(app).toContainText('理赔服务进度');
    await expect(app).toContainText('未提供');
  });
});

// ---------------------------------------------------------------------------
// P-03 pc/product-wealth：GET /api/demo-data 三态（§15.2 行 5）
// ---------------------------------------------------------------------------
test.describe('P-03 pc/product-wealth：GET /api/demo-data 三态', () => {
  test('成功：产品行 / 可售状态来自快照', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-wealth');
    const app = page.locator(APP);
    await expect(app).toContainText('稳盈固收180天', { timeout: 20_000 });
    await expect(app).toContainText('产品事实');
    await expect(app).toContainText('GET /api/demo-data');
    await expect(app).toContainText('数据来源');
    await expect(app).toContainText(SOURCE_ID);
    await expect(app).toContainText('数据时点');
    await expect(app).toContainText(DATA_AS_OF);
    await expect(app).toContainText('可售状态');
    await expect(app).toContainText('ON_SALE');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：快照 GET /api/demo-data 返回 503 → 共享数据加载失败 + 真实错误码', async ({ page }) => {
    await installBackend(page, { catalogError: catalogFailure() });
    await openRoute(page, 'pc/product-wealth');
    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('GET /api/demo-data → HTTP 503');
    await expect(app).toContainText('DEPENDENCY_UNAVAILABLE');
    await expect(app).toContainText('本页不展示任何静态或演示行');
    await expect(app).not.toContainText('稳盈固收180天');
  });

  test('空态：管理人字段 / 审计信息无来源 → 暂未由服务端提供的字段', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/product-wealth');
    const app = page.locator(APP);
    await expect(app).toContainText('稳盈固收180天', { timeout: 20_000 });
    // 真实无来源空态：原有静态「注册资本 50 亿 / 在管规模 1,280 亿 / 审计日」已删除，
    // 页面如实列出无服务端来源的字段，不用演示数值补齐。
    await expect(app).toContainText('暂未由服务端提供的字段');
    await expect(app).toContainText('管理人注册资本 / 在管规模');
    await expect(app).toContainText('products[] 未返回管理人字段');
    await expect(app).toContainText('审计信息');
    await expect(app).toContainText('未提供');
  });
});

// ---------------------------------------------------------------------------
// H-03 pc/compare：comparable / incomparable_reason / comparison_basis（§15.2 行 9）
// ---------------------------------------------------------------------------
test.describe('H-03 pc/compare：服务端比较口径三态', () => {
  test('成功 A：comparable=true → 可排名、比较口径 comparison_basis 与 calculation_id 可见', async ({ page }) => {
    // 受控契约响应：candidateCalculation.comparison 由服务端发布，页面只消费不换算（A07）。
    await installBackend(page, { state: { compareSet: ['fund', 'bondfund'], candidateCalculation: comparableCalculation() } });
    await openRoute(page, 'pc/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('2 个产品', { timeout: 20_000 });
    await expect(app).toContainText('易方达中证A500联接A');
    await expect(app).toContainText('华安稳健增利 12 个月');
    await expect(app).toContainText('可排名（服务端口径一致）');
    await expect(app).toContainText('排名资格：服务端判定 comparable=true');
    await expect(app).toContainText('产品类型 基金');
    await expect(app).toContainText('风险 R3');
    await expect(app).toContainText('收益口径 period_return');
    await expect(app).toContainText('比较口径 calculation_id：candidate-e2e-comparable-0001');
    await expect(app).not.toContainText('incomparable_reason=');
  });

  test('成功 B：comparable=false → incomparable_reason 可见、明示不可排名', async ({ page }) => {
    // 受控契约响应：不同口径（基金 vs 存款）→ different_basis，页面按理由明示不可排名。
    await installBackend(page, { state: { compareSet: ['fund', 'deposit'], candidateCalculation: incomparableCalculation() } });
    await openRoute(page, 'pc/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('不可排名（口径不同或服务端未覆盖）', { timeout: 20_000 });
    await expect(app).toContainText('排名资格：服务端判定 comparable=false');
    await expect(app).toContainText('incomparable_reason=different_basis');
    await expect(app).toContainText('产品类型 / 风险等级 / 收益口径不同');
    await expect(app).toContainText('因此不可排名');
    await expect(app).toContainText('不同口径的产品只并列事实');
    await expect(app).toContainText('比较口径 calculation_id：candidate-e2e-incomparable-0001');
  });

  test('失败：save_comparison 400 → action-error 展示真实错误码与消息，不展示成功结果', async ({ page }) => {
    await installBackend(page, { state: { compareSet: ['fund', 'wealth', 'deposit'] }, commandError: saveComparisonFailure() });
    await openRoute(page, 'pc/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('3 个产品', { timeout: 20_000 });
    await page.locator('[data-action="save-pc-compare"]').click();
    await expect(page).toHaveURL(/#pc\/result/);
    await expect(app).toContainText('操作未完成');
    await expect(app).toContainText('REQUEST ERROR');
    await expect(app).toContainText('比较集必须包含 2–3 个当前产品库中的真实产品');
    await expect(app).toContainText('未展示成功结果');
    await expect(app).not.toContainText('比较结果已保存');
  });

  test('空态：比较集为空 → 引导空态，不自动补入默认候选', async ({ page }) => {
    await installBackend(page, { state: { compareSet: [] } });
    await openRoute(page, 'pc/compare');
    const app = page.locator(APP);
    await expect(app).toContainText('比较集为空', { timeout: 20_000 });
    await expect(app).toContainText('当前没有可比较的产品，系统不会自动补入默认候选');
    await expect(app).toContainText('返回候选池');
    await expect(app).not.toContainText('可排名（服务端口径一致）');
    await expect(app).not.toContainText('不可排名（口径不同或服务端未覆盖）');
  });
});

// ---------------------------------------------------------------------------
// H-04 pc/research：research_qa 引用、错误、空问题（§15.2 行 11）
// ---------------------------------------------------------------------------
test.describe('H-04 pc/research：POST /api/ai/generate（research_qa）三态', () => {
  test('成功：研究回答 + 引用（标题 + 页码）+ 时延 / 模型可见', async ({ page }) => {
    await installBackend(page);
    await openRoute(page, 'pc/research');
    // 真实动作：点击「开始研究」→ POST /api/ai/generate（受控成功契约）→ 写 researchAnswer。
    await page.locator('[data-action="ask"]').click();
    await expect(page).toHaveURL(/#pc\/result/);
    // 回到研究页读取服务端已保存的 researchAnswer 与引用回指。
    await goHash(page, 'pc/research');
    const app = page.locator(APP);
    await expect(app).toContainText('本次回答', { timeout: 20_000 });
    await expect(app).toContainText('财富智服 · 研究回答');
    await expect(app).toContainText('演示桩 fixture');
    await expect(app).toContainText('fixture-generate-1');
    await expect(app).toContainText('137 ms');
    await expect(app).toContainText('引用回指（chunk_id · 标题 · 页码）');
    await expect(app).toContainText('chunk-a500-001');
    await expect(app).toContainText('A500 季报与风险说明');
    await expect(app).toContainText('第 3 页');
    await expect(app).toContainText('固收+策略月报');
    await expect(app).toContainText('第 5 页');
  });

  test('失败：research_qa 422 → ai-error 与超范围明确拒答，展示真实错误码，不伪造回答', async ({ page }) => {
    // 受控契约：服务端无引用/证据，以 422 INSUFFICIENT_EVIDENCE 失败。
    await installBackend(page, { generateError: researchGenerateFailure() });
    await openRoute(page, 'pc/research');
    await page.locator('[data-action="ask"]').click();
    await expect(page).toHaveURL(/#pc\/result/);
    const app = page.locator(APP);
    // 结果页：通用 ai-error，带真实错误与「未写入成功结果」。
    await expect(app).toContainText('AI 生成失败', { timeout: 20_000 });
    await expect(app).toContainText('AI ERROR');
    await expect(app).toContainText('当前任务没有足够的知识片段，已停止生成');
    await expect(app).toContainText('FAILED');
    await expect(app).toContainText('未写入成功结果');
    // 研究页：本次真实拒答原因（不是通用文案）。
    await goHash(page, 'pc/research');
    await expect(app).toContainText('本次问题未被回答');
    await expect(app).toContainText('明确拒答：本次问题超出现有授权证据范围');
    await expect(app).toContainText('INSUFFICIENT_EVIDENCE');
    await expect(app).toContainText('422');
    await expect(app).toContainText('返回引用数');
    await expect(app).toContainText('知识片段数');
    await expect(app).not.toContainText('本次回答');
    await expect(app).not.toContainText('引用回指（chunk_id · 标题 · 页码）');
  });

  test('空态：无服务端研究回答 → 等待 AI 生成，不伪造答案 / 引用 / 模型', async ({ page }) => {
    // 真实无来源空态：会话里没有 researchAnswer，页面如实显示「等待生成」的原始空态。
    await installBackend(page);
    await openRoute(page, 'pc/research');
    const app = page.locator(APP);
    await expect(app).toContainText('等待 AI 生成', { timeout: 20_000 });
    await expect(app).toContainText('尚未发起真实研究任务');
    await expect(app).toContainText('待发起');
    await expect(app).not.toContainText('本次回答');
    await expect(app).not.toContainText('财富智服 · 研究回答');
    await expect(app).not.toContainText('引用回指（chunk_id · 标题 · 页码）');
    await expect(app).not.toContainText('演示桩 fixture');
  });

  test('空态（补充 · 受控契约）：空问题的 prompt-needed 落点显示「请先输入问题」', async ({ page }) => {
    // 受控契约响应：空问题被服务端拒绝后写入 prompt-needed 落点。
    // 这是 UI 契约验证（页面在服务端返回该 landing 时的呈现），不是真实业务数据验收；
    // 不弱化上面「真实无来源空态」的任何断言。
    await installBackend(page, { state: { landing: { id: 'prompt-needed', from: 'pc/research', asOf: DATA_AS_OF } } });
    await openRoute(page, 'pc/result');
    const app = page.locator(APP);
    await expect(app).toContainText('请先输入问题', { timeout: 20_000 });
    await expect(app).toContainText('用大白话描述你的理财问题后');
    await expect(app).toContainText('已授权资料');
    await expect(app).toContainText('#pc/research');
    await expect(app).not.toContainText('本次回答');
  });
});
