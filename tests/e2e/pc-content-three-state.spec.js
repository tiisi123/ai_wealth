import { test, expect } from '@playwright/test';
import { openRoute } from './helpers.js';

// W1 三态 E2E · 批次 A（PR #29 §15.2 逐路由矩阵）
// ---------------------------------------------------------------------------
// 覆盖 7 条「无既定生产修复」路由：pc/workspace、pc/supply、pc/events、
// pc/macro、pc/industry、pc/library、pc/result。每条路由各补一条独立的
// 成功态 / 失败态 / 空态断言，只读取页面真实可见文本（toContainText），
// 不断言内部变量，不改生产代码。
//
// 口径（与 §15.2、§2 通用约束、three-state.spec.js 惯例一致）：
// - 全部为「受控契约响应」或「真实无来源快照」：注入的 2xx / 4xx / 5xx
//   响应与会话状态都是显式 fixture 夹具，字段取自当前 main 的真实返回结构
//   （controllers.js / sessionService.js / demoData fixtures / knowledge
//   status）。这些夹具只证明 UI 与服务端契约的映射，**不宣称真实业务数据
//   验收达标**，也不作为真实模型输出或投资建议结论。
// - 失败态必须由服务端真实错误驱动（这里由受控接口返回 400/409/422/503
//   等真实 error.code + error.message），页面必须显示真实错误，
//   **不得显示伪成功**、不得回落到静态/演示行。
// - 空态必须是显式无来源空态，**不得用默认数字或默认行补齐**。
// - 复用 helpers.js 的 openRoute（等待共享会话就绪 + app.js 渲染），
//   以及 three-state.spec.js 的 page.route 注入惯例；真实服务由
//   playwright.config.js 的 webServer 启动（DATA_MODE=database、
//   AI_MODE=fixture）。本地无 database 时以 CI 的 ci-e2e-smoke
//   （postgres 服务 + database 模式）为准。
// - 不删断言、不放宽断言、不 skip、不 .only；若目标可见行为在生产代码中
//   不可达，断言保持红，并在交付报告里登记精确缺陷。
// ---------------------------------------------------------------------------

const APP = '#app';
const DEMO_DATA_ROUTE = '**/api/demo-data**';
const KNOWLEDGE_ROUTE = '**/api/knowledge**';
const SESSIONS_ROUTE = '**/api/sessions**';

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) };
}

// ---------------------------------------------------------------------------
// 受控夹具（controlled fixtures）——所有数字/字符串均为夹具值，不是业务事实。
// ---------------------------------------------------------------------------

// GET /api/demo-data 的受控快照：字段与 demoDataRepository.getSnapshot() 一致，
// 产品行是 fixture，id/来源/时点/可售状态刻意与真库种子不同，便于确认页面
// 读数确实来自注入响应而不是默认数据。
const FIXTURE_PRODUCTS = [
  {
    id: 'fx-fund', name: '受控夹具·稳健增长基金', type: '基金', risk: 'R2', role: '稳健底仓',
    latest_return: 0.0312, drawdown: -0.0123, liquidity: '工作日可申赎', fee: 0.005,
    sale_status: 'ON_SALE', source_id: 'fixture-vendor-2026-11-07',
    source_timestamp: '2026-11-07T09:00:00+08:00'
  },
  {
    id: 'fx-wealth', name: '受控夹具·固收增强理财', type: '理财', risk: 'R2', role: '稳健底仓',
    latest_return: 0.0268, drawdown: null, liquidity: '180 天持有期', fee: 0.002,
    sale_status: 'OFF_SALE', source_id: 'fixture-vendor-2026-11-07',
    source_timestamp: '2026-11-07T09:00:00+08:00'
  },
  {
    id: 'fx-deposit', name: '受控夹具·定期存款', type: '存款', risk: 'R1', role: '确定性现金',
    annual_rate: 0.0215, liquidity: '提前支取按活期', fee: 0,
    sale_status: 'ON_SALE', source_id: 'fixture-vendor-2026-11-07',
    source_timestamp: '2026-11-07T09:00:00+08:00'
  }
];

function demoDataOk() {
  return {
    customer: { id: 'customer-001', name: '林女士', risk_level: 'R3', region: '上海', authorized: true, data_as_of: '2026-09-28' },
    products: FIXTURE_PRODUCTS.map((p) => ({ ...p })),
    holdings: [],
    data_as_of: '2026-09-28',
    data_as_of_full: '2026-09-28 09:30',
    data_version: 'fixture-data-2026-11-07-v1',
    readonly_projections: {},
    api_version: 'v1'
  };
}

// GET /api/knowledge 的受控成功响应（ACTIVE 知识版本 + 2 个知识片段）。
function knowledgeOk() {
  const version = 'fixture-knowledge-2026-11-07-v1';
  return {
    status: {
      status: 'ACTIVE', knowledge_version: version,
      document_count: 2, chunk_count: 2, vector_count: 2,
      vector_dim: 1536, embedding_model: 'fixture-embedding-1'
    },
    chunks: [
      {
        chunk_id: 'fx-chunk-001', document_id: 'fx-doc-001', title: '受控夹具·稳健增长基金季报',
        source_id: 'fixture-research-2026-11-07', product_id: 'fx-fund',
        source_timestamp: '2026-11-07T09:00:00+08:00', page: 3, text: '受控夹具片段正文。',
        knowledge_version: version
      },
      {
        chunk_id: 'fx-chunk-002', document_id: 'fx-doc-002', title: '受控夹具·定期存款计息说明',
        source_id: 'fixture-research-2026-11-07', product_id: 'fx-deposit',
        source_timestamp: '2026-11-07T09:00:00+08:00', page: 7, text: '受控夹具片段正文。',
        knowledge_version: version
      }
    ],
    readonly_projections: {},
    api_version: 'v1'
  };
}

// 真实无来源快照：没有 ACTIVE 知识版本、没有片段（服务端 NOT_READY）。
function knowledgeNoSource() {
  return {
    status: { status: 'NOT_READY', knowledge_version: null, document_count: 0, chunk_count: 0, vector_count: 0 },
    chunks: [],
    readonly_projections: {},
    api_version: 'v1'
  };
}

// 受控知识接口带专属片段（用于 P-07 三页的「有片段时」目标成功态）。
// 片段标题与时点均为夹具值；这些路由在当前生产代码中没有真实数据源，
// 因此该响应是受控契约夹具，不构成真实业务数据验收。
function knowledgeWithType(type) {
  const version = 'fixture-knowledge-2026-11-07-v1';
  const labels = { events: '市场事件', macro: '宏观指标', industry: '行业研报' };
  return {
    status: {
      status: 'ACTIVE', knowledge_version: version,
      document_count: 1, chunk_count: 1, vector_count: 1,
      vector_dim: 1536, embedding_model: 'fixture-embedding-1'
    },
    chunks: [
      {
        chunk_id: `fx-${type}-chunk-001`, document_id: `fx-${type}-doc-001`,
        title: `受控夹具·${labels[type]}片段`, source_id: `fixture-${type}-2026-11-07`,
        product_id: null, source_timestamp: '2026-11-07T09:00:00+08:00',
        page: 5, text: '受控夹具片段正文。', knowledge_version: version
      }
    ],
    readonly_projections: {},
    api_version: 'v1'
  };
}

// 受控会话状态：activities[] / researchAnswer / landing 均取自服务端会话投影
// （GET|POST /api/sessions/:id 的 session.state）。id/时点/版本为夹具值。
const ACTIVITY_RECORDS = [
  {
    activity_id: '11111111-1111-4111-8111-111111111111', kind: 'task-center',
    title: '受控夹具·工作项记录 A', created_at: '2026-11-07T01:00:00.000Z',
    data_version: 'fixture-data-2026-11-07-v1'
  },
  {
    activity_id: '22222222-2222-4222-8222-222222222222', kind: 'workspace',
    title: '受控夹具·工作项记录 B', created_at: '2026-11-07T02:00:00.000Z',
    data_version: 'fixture-data-2026-11-07-v1'
  }
];

const RESEARCH_ANSWER = {
  question: '受控夹具：本周固收+产品回撤如何解释？',
  text: '受控夹具回答文本，仅验证页面把服务端 researchAnswer 投影到可见卡片，不代表真实模型输出或业务结论。',
  sources: ['doc:fixture-a500-2026-11-07'],
  source_ids: [],
  model: 'fixture-generate-1',
  latency_ms: 12
};

const LANDING_TASK_CENTER = { id: 'task-center', from: 'pc/architecture', asOf: '2026-09-28' };

// ---------------------------------------------------------------------------
// 注入工具：把受控状态合并进服务端会话响应（保留真实 session_id / version，
// 因此 demo-data / knowledge / 命令的授权前置仍由真实服务校验）。
// ---------------------------------------------------------------------------
async function controlledSession(page, statePatch) {
  await page.route(SESSIONS_ROUTE, async (route) => {
    const response = await route.fetch();
    let body;
    try { body = await response.json(); } catch { body = null; }
    if (body && body.session && body.session.state) {
      body.session.state = { ...body.session.state, ...statePatch };
    }
    await route.fulfill({ response, json: body });
  });
}

// 失败态由服务端真实错误驱动：受控 PATCH 返回 409 VERSION_CONFLICT 触发
// 共享状态重载，重载时受控 GET /api/knowledge 返回 503 DEPENDENCY_UNAVAILABLE，
// 应用进入全局 sync-error 失败态（不是浏览器构造的假错误）。
async function driveSharedDataFailure(page, errorMessage) {
  await page.route(SESSIONS_ROUTE, (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill(json({
        error: { code: 'VERSION_CONFLICT', message: '会话版本已过期，请重新加载共享状态' },
        request_id: '00000000-0000-4000-8000-0000000000b1'
      }, 409));
    }
    return route.continue();
  });
  await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json({
    error: { code: 'DEPENDENCY_UNAVAILABLE', message: errorMessage },
    request_id: '00000000-0000-4000-8000-0000000000b2'
  }, 503)));
  // 触发一次真实会话写路径（与角色切换同一个 patch），错误来自上面的服务端响应。
  await page.evaluate(() => window.DemoSession.patch({ role: '专业投研' }));
}

// 当受控接口在 boot 阶段返回失败时，共享会话不会进入 connected；
// 这里只等 app.js 完成首屏渲染（与 openRoute 的唯一差别是不等会话就绪）。
async function openRouteWithoutSessionWait(page, routePath) {
  await page.goto(`/#${routePath}`);
  await page.waitForFunction(() => (document.querySelector('#app')?.children.length ?? 0) > 0);
}

// 切换页面视图（等价于点击 tabBtn：setView + 重渲染），viewport 无关。
async function setViewAndRender(page, routePath, label) {
  await page.evaluate(({ r, v }) => {
    const s = window.DemoSession.get();
    window.DemoSession.patch({ viewFilter: { ...(s.viewFilter || {}), [r]: v } });
    window.render();
  }, { r: routePath, v: label });
}

// ===========================================================================
// 1. pc/workspace（H-01）· GET /api/sessions/:id、GET /api/demo-data、record_activity
//    §15.2 目标可见行为：
//    S：researchAnswer 卡片 + activities[] 记录；
//    F：会话/数据加载失败 →「共享数据加载失败」；
//    E：无最近使用/无提醒 → 显式空态。
// ===========================================================================
test.describe('pc/workspace：服务端会话投影三态', () => {
  test('成功：researchAnswer 卡片与 activities[] 服务端记录可见，不显示空态占位', async ({ page }) => {
    await controlledSession(page, { researchAnswer: RESEARCH_ANSWER, activities: ACTIVITY_RECORDS });
    await openRoute(page, 'pc/workspace');

    const app = page.locator(APP);
    await expect(app).toContainText('本次研究回答', { timeout: 20_000 });
    await expect(app).toContainText(RESEARCH_ANSWER.question);
    await expect(app).toContainText(RESEARCH_ANSWER.text);
    await expect(app).toContainText('研究参考，不构成投资建议');
    // activities[] 由服务端记录驱动：计数、标题、activity_id、data_version 都来自夹具响应。
    await expect(app).toContainText('服务端记录 2 条');
    await expect(app).toContainText(ACTIVITY_RECORDS[0].title);
    await expect(app).toContainText(ACTIVITY_RECORDS[0].activity_id);
    await expect(app).toContainText(ACTIVITY_RECORDS[0].data_version);
    await expect(app).toContainText('消息提醒');
    await expect(app).toContainText('2 条');
    await expect(app).not.toContainText('当前无最近使用记录');
    await expect(app).not.toContainText('当前无消息提醒');
  });

  test('失败：会话/数据加载失败显示真实错误「共享数据加载失败」，不显示伪成功', async ({ page }) => {
    await openRoute(page, 'pc/workspace');
    await driveSharedDataFailure(page, '共享会话数据加载失败：知识库依赖不可用（受控夹具）');

    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('SESSION ERROR');
    await expect(app).toContainText('知识库依赖不可用（受控夹具）');
    await expect(app).toContainText('真实数据未加载成功');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
  });

  test('空态：无最近使用/无提醒 → 显式空态，不用默认数字补齐', async ({ page }) => {
    await controlledSession(page, { researchAnswer: null, activities: [] });
    await openRoute(page, 'pc/workspace');

    const app = page.locator(APP);
    await expect(app).toContainText('当前无最近使用记录', { timeout: 20_000 });
    await expect(app).toContainText('应用服务没有提供个人工作区条目');
    await expect(app).toContainText('当前无消息提醒');
    await expect(app).toContainText('推荐任务');
    await expect(app).toContainText('未提供');
    await expect(app).toContainText('空态');
    // 空态不得用演示草稿、研究回答卡片或固定条数补齐。
    // 注意：页面上有一个静态按钮「查看服务端记录」，因此不断言「服务端记录」字面，
    // 而是断言成功态专属的计数徽标与研究回答卡片不出现。
    await expect(app).not.toContainText('本次研究回答');
    await expect(app).not.toContainText('服务端记录 1 条');
    await expect(app).not.toContainText('服务端记录 2 条');
    await expect(app).not.toContainText('18,426');
    await expect(app).not.toContainText('99.98%');
  });
});

// ===========================================================================
// 2. pc/supply（P-06）· GET /api/demo-data（页面 ensureProductCatalog 读取）
//    §15.2 目标可见行为：
//    S：产品行作为供给单元，带 product:<id>/来源/时点/可售；
//    F：快照失败 → 真实错误（页面为「共享数据加载失败」+ 真实状态码/错误码）；
//    E：资讯/策略/行业无来源 →「当前分类暂无已审核供给」。
// ===========================================================================
test.describe('pc/supply：供给目录三态', () => {
  test('成功：供给行来自受控快照，带 product:<id>/来源/时点/可售', async ({ page }) => {
    await page.route(DEMO_DATA_ROUTE, (route) => route.fulfill(json(demoDataOk())));
    await openRoute(page, 'pc/supply');

    const app = page.locator(APP);
    await expect(app).toContainText('供给行与行数取自 GET /api/demo-data', { timeout: 20_000 });
    await expect(app).toContainText('受控夹具·稳健增长基金');
    await expect(app).toContainText('product:fx-fund');
    await expect(app).toContainText('fixture-vendor-2026-11-07');
    await expect(app).toContainText('2026-11-07 09:00:00');
    await expect(app).toContainText('可售');
    await expect(app).toContainText('暂不可售'); // OFF_SALE 行按服务端字段原样展示
    await expect(app).not.toContainText('暂无已审核供给');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：快照接口返回真实 503，显示真实错误且不展示任何供给行', async ({ page }) => {
    // 第 1 次 demo-data 是 boot 的会话数据投影（必须成功），
    // 第 2 次是页面 ensureProductCatalog 的读取（受控失败）。
    let calls = 0;
    await page.route(DEMO_DATA_ROUTE, (route) => {
      calls += 1;
      if (calls === 1) return route.fulfill(json(demoDataOk()));
      return route.fulfill(json({
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: '共享产品快照依赖不可用（受控夹具）' },
        request_id: '00000000-0000-4000-8000-0000000000d1'
      }, 503));
    });
    await openRoute(page, 'pc/supply');

    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('产品事实未能从共享应用服务加载');
    await expect(app).toContainText('HTTP 503');
    await expect(app).toContainText('DEPENDENCY_UNAVAILABLE');
    // 失败态不得展示任何静态/演示供给行，也不得展示成功计数。
    await expect(app).not.toContainText('product:fx-fund');
    await expect(app).not.toContainText('供给行与行数取自');
  });

  test('空态：资讯分类无服务端来源 →「当前分类暂无已审核供给」，无默认行/计数', async ({ page }) => {
    await page.route(DEMO_DATA_ROUTE, (route) => route.fulfill(json(demoDataOk())));
    await openRoute(page, 'pc/supply');
    const app = page.locator(APP);
    // 先等成功态落地（供给表格已由受控快照渲染），再切到无来源分类。
    await expect(app).toContainText('供给行与行数取自 GET /api/demo-data', { timeout: 20_000 });
    await setViewAndRender(page, 'pc/supply', '资讯');

    await expect(app).toContainText('当前分类暂无已审核供给', { timeout: 20_000 });
    await expect(app).toContainText('共享应用服务没有该类供给的数据来源');
    await expect(app).toContainText('当前无待处理供给');
    await expect(app).toContainText('空态');
    // 空态不得用默认供给行或统计计数补齐。
    await expect(app).not.toContainText('product:fx-fund');
    await expect(app).not.toContainText('受控夹具·稳健增长基金');
    await expect(app).not.toContainText('共享数据加载失败');
  });
});

// ===========================================================================
// 3–5. pc/events / pc/macro / pc/industry（P-07）· GET /api/knowledge、research_qa
//    §15.2 目标可见行为：
//    S：有专属片段/指标时按知识片段渲染并标时点；
//    F：GET /api/knowledge 失败 → 真实错误；
//    E：无片段 →「暂无可引用材料」/ 显式空态。
//    注意：这三页在生产代码中是 researchPage(type) 的静态无来源空态页，
//    不读取 _knowledgeChunks、页面自身也不发起 GET /api/knowledge；
//    因此 S/F 的目标行为在当前生产代码里不可达。断言保持原样（红），
//    缺陷在交付报告中精确登记，不删断言/不放宽/不 skip。
// ===========================================================================
const RESEARCH_PAGES = [
  { route: 'pc/events', type: 'events', heading: '市场事件解读', board: '重点事件' },
  { route: 'pc/macro', type: 'macro', heading: '宏观分析', board: '宏观指标看板' },
  { route: 'pc/industry', type: 'industry', heading: '行业解读', board: '行业研究视图' }
];

for (const spec of RESEARCH_PAGES) {
  test.describe(`${spec.route}：知识/数据接口三态`, () => {
    test('成功：有专属片段时按知识片段渲染并标时点', async ({ page }) => {
      await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeWithType(spec.type))));
      await openRoute(page, spec.route);

      const app = page.locator(APP);
      // 页面成功渲染研究视图（这些断言与真实生产行为一致，先固定诚实基线）。
      await expect(app).toContainText(spec.heading, { timeout: 20_000 });
      await expect(app).toContainText(spec.board);
      await expect(app).toContainText('研究口径');
      await expect(app).toContainText('系统不会补入默认观点或演示数值');
      // §15.2 S 目标：受控知识响应带专属片段 + 时点，页面必须按片段渲染。
      // 当前生产实现为静态空态，不会渲染注入的片段 → 该断言保持红以暴露缺陷。
      await expect(app).toContainText(`受控夹具·${{ events: '市场事件', macro: '宏观指标', industry: '行业研报' }[spec.type]}片段`, { timeout: 10_000 });
      await expect(app).toContainText('2026-11-07 09:00:00');
    });

    test('失败：GET /api/knowledge 真实错误必须可见，不得静默成功', async ({ page }) => {
      await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json({
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: '知识库依赖不可用：GET /api/knowledge（受控夹具）' },
        request_id: '00000000-0000-4000-8000-0000000000e1'
      }, 503)));
      await openRouteWithoutSessionWait(page, spec.route);

      const app = page.locator(APP);
      // §15.2 F 目标：接口失败时显示真实错误码/消息，而不是静态「暂无可引用材料」。
      // 当前生产实现不消费该接口、初始化错误被全局忽略 → 该断言保持红以暴露缺陷。
      await expect(app).toContainText('DEPENDENCY_UNAVAILABLE', { timeout: 10_000 });
      await expect(app).toContainText('知识库依赖不可用');
      await expect(app).not.toContainText('已生成');
    });

    test('空态：真实无来源快照 →「暂无可引用材料」，不补默认数字', async ({ page }) => {
      await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeNoSource())));
      await openRoute(page, spec.route);

      const app = page.locator(APP);
      await expect(app).toContainText(spec.heading, { timeout: 20_000 });
      await expect(app).toContainText('暂无可引用材料');
      await expect(app).toContainText(`shared 知识库当前没有 ${spec.type} 专属片段`);
      await expect(app).toContainText('系统不会补入默认观点或演示数值');
      await expect(app).toContainText('未提供'); // 宏观日历：无服务端来源
      // 空态不得用虚构指标/默认数字补齐。
      await expect(app).not.toContainText('权益暴露 20%');
      await expect(app).not.toContainText('99.98%');
      await expect(app).not.toContainText('18,426');
    });
  });
}

// ===========================================================================
// 6. pc/library（P-08）· GET /api/demo-data + GET /api/knowledge
//    §15.2 目标可见行为：
//    S：产品卡片 + knowledge_version + 片段数；
//    F：/api/demo-data 或 /api/knowledge 失败 →「共享数据加载失败」；
//    E：无知识版本 →「暂无已发布产品知识」。
// ===========================================================================
test.describe('pc/library：产品智库三态', () => {
  test('成功：产品卡片与知识版本/片段数来自受控只读接口', async ({ page }) => {
    await page.route(DEMO_DATA_ROUTE, (route) => route.fulfill(json(demoDataOk())));
    await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeOk())));
    await openRoute(page, 'pc/library');

    const app = page.locator(APP);
    await expect(app).toContainText('已加载', { timeout: 20_000 });
    await expect(app).toContainText('fixture-knowledge-2026-11-07-v1');
    await expect(app).toContainText('2 份文档 · 2 个片段');
    await expect(app).toContainText('product:fx-fund');
    await expect(app).toContainText('1 个片段');
    await expect(app).toContainText('fx-doc-001');
    await expect(app).not.toContainText('暂无已发布产品知识');
    await expect(app).not.toContainText('共享数据加载失败');
  });

  test('失败：快照接口真实 503 →「共享数据加载失败」+错误码，不展示产品卡片', async ({ page }) => {
    await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeOk())));
    let calls = 0;
    await page.route(DEMO_DATA_ROUTE, (route) => {
      calls += 1;
      if (calls === 1) return route.fulfill(json(demoDataOk()));
      return route.fulfill(json({
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: '共享产品快照依赖不可用（受控夹具）' },
        request_id: '00000000-0000-4000-8000-0000000000f1'
      }, 503));
    });
    await openRoute(page, 'pc/library');

    const app = page.locator(APP);
    await expect(app).toContainText('共享数据加载失败', { timeout: 20_000 });
    await expect(app).toContainText('产品事实未能从共享应用服务加载');
    await expect(app).toContainText('HTTP 503');
    await expect(app).toContainText('DEPENDENCY_UNAVAILABLE');
    // 失败块替代了产品表格：不得出现受控产品行或知识片段引用。
    // 知识版本卡片是另一个独立只读接口（GET /api/knowledge）的成功投影，
    // 此处仍显示「已加载」属实，不把它误判为伪成功。
    await expect(app).not.toContainText('product:fx-fund');
    await expect(app).not.toContainText('1 个片段');
    await expect(app).not.toContainText('fx-doc-001');
  });

  test('空态：无 ACTIVE 知识版本 →「暂无已发布产品知识」，不补默认计数/版本', async ({ page }) => {
    await page.route(DEMO_DATA_ROUTE, (route) => route.fulfill(json(demoDataOk())));
    await page.route(KNOWLEDGE_ROUTE, (route) => route.fulfill(json(knowledgeNoSource())));
    await openRoute(page, 'pc/library');

    const app = page.locator(APP);
    await expect(app).toContainText('无知识版本', { timeout: 20_000 });
    await expect(app).toContainText('暂无已发布产品知识');
    await expect(app).toContainText('空态');
    // 空态不得用默认知识版本、文档/片段计数或演示卡片补齐。
    await expect(app).not.toContainText('份文档 ·');
    await expect(app).not.toContainText('已加载');
    await expect(app).not.toContainText('knowledge-demo-v1');
  });
});

// ===========================================================================
// 7. pc/result（P-11）· record_activity、landingSpec、aiResult
//    §15.2 目标可见行为：
//    S：只显示服务端 activities[]/aiResult 记录；
//    F：action-error 真实错误码；
//    E：not-implemented /「尚未写入服务端记录」。
// ===========================================================================
test.describe('pc/result：服务端写入结果三态', () => {
  test('成功：结果页只显示服务端 activities[] 真实记录', async ({ page }) => {
    await controlledSession(page, { landing: LANDING_TASK_CENTER, activities: [ACTIVITY_RECORDS[0]] });
    await openRoute(page, 'pc/result');

    const app = page.locator(APP);
    await expect(app).toContainText('任务中心', { timeout: 20_000 });
    await expect(app).toContainText('已由应用服务写入真实记录');
    await expect(app).toContainText('服务端状态');
    await expect(app).toContainText(ACTIVITY_RECORDS[0].activity_id);
    await expect(app).toContainText(ACTIVITY_RECORDS[0].created_at);
    await expect(app).toContainText(ACTIVITY_RECORDS[0].data_version);
    await expect(app).toContainText('累计 1 条');
    await expect(app).not.toContainText('W1 未实现');
    await expect(app).not.toContainText('尚未写入服务端记录');
  });

  test('失败：record_activity 真实 422 → action-error 显示真实错误码，不伪装成功', async ({ page }) => {
    await openRoute(page, 'pc/architecture');
    await page.route(SESSIONS_ROUTE, (route) => {
      if (route.request().url().endsWith('/commands')) {
        return route.fulfill(json({
          error: { code: 'INSUFFICIENT_EVIDENCE', message: '服务端返回 422 INSUFFICIENT_EVIDENCE：当前客户无该产品持仓，无法生成诊断' },
          request_id: '00000000-0000-4000-8000-0000000000a1'
        }, 422));
      }
      return route.continue();
    });
    // 走真实 UI 动作分发（record_activity），失败完全来自上面的受控服务端响应。
    await page.evaluate(() => window.WealthActions.dispatch({
      action: 'task-center', el: document.querySelector('#app'), productId: '', event: {}
    }));

    const app = page.locator(APP);
    await expect(app).toContainText('操作未完成', { timeout: 20_000 });
    await expect(app).toContainText('REQUEST ERROR');
    await expect(app).toContainText('INSUFFICIENT_EVIDENCE');
    await expect(app).toContainText('未展示成功结果');
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
  });

  test('空态：工作项无服务端记录 →「尚未写入服务端记录」，不补默认成功', async ({ page }) => {
    await controlledSession(page, { landing: LANDING_TASK_CENTER, activities: [] });
    await openRoute(page, 'pc/result');

    const app = page.locator(APP);
    await expect(app).toContainText('尚未写入服务端记录', { timeout: 20_000 });
    await expect(app).toContainText('当前无待处理事项');
    // 空态不得伪造服务端记录或默认成功状态。
    await expect(app).not.toContainText('已由应用服务写入真实记录');
    await expect(app).not.toContainText('服务端状态');
    await expect(app).not.toContainText('累计');
    await expect(app).not.toContainText(ACTIVITY_RECORDS[0].activity_id);
  });
});
