import { test, expect } from '@playwright/test';
import { openRoute, state } from './helpers.js';

// W1 候选页三态（成功 / 失败 / 空态）E2E：PR #29 §15.2 的 pc/candidates（#8）与
// m/candidates（#27）目标。覆盖成功（候选行 + candidateCalculation.reasons[].constraints /
// holding_months + 服务端顺序与 calculation_id）、失败（generate_candidates /
// candidate_explain 的 400 / 409 / 422 真实错误，不写成功）、空态（无候选引导，不自动补默认）。
//
// 全部状态由受控契约响应注入：透传真实 POST /api/sessions 响应，只覆盖会话 state 里的
// candidates / candidateCalculation / plan；失败态注入真实错误包络。数值与理由均为受控夹具，
// 不代表真实业务数据验收。F-08b（candidateCalculation.score）用户尚未裁决、明确不在本批，
// 本文件不新增、不断言 score，也不把它写成已批准。

const APP = '#app';
const PC_ROUTE = 'pc/candidates';
const MOBILE_ROUTE = 'm/candidates';

const isSessionCreate = (url) => url.pathname === '/api/sessions';
const isCommand = (url) => /^\/api\/sessions\/[0-9a-f-]{36}\/commands$/i.test(url.pathname);
const isGenerate = (url) => url.pathname === '/api/ai/generate';

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) };
}

// 受控 candidateCalculation：结构与 selectCandidates() 的返回一致，reasons 顺序刻意与
// candidates 顺序不同，用来验证排序依据确实取自服务端 reasons[] 而不是本地数组顺序。
const CALCULATION_ID = 'candidate-3state0a1b2c3d4e5f607';
const REASON_LABEL = '风险、期限、流动性与可售状态均通过校验';
const CONSTRAINTS = {
  customer_risk: 'R3',
  goal_risk: 'R3 平衡型',
  goal_term: '3–5 年',
  goal_liquidity: '大部分可长期投资',
  sale_status: 'ON_SALE'
};

function candidateCalculation() {
  return {
    calculation_id: CALCULATION_ID,
    candidate_ids: ['wealth', 'fund'],
    data_ids: ['product:wealth', 'product:fund'],
    reasons: [
      { product_id: 'fund', reason: 'risk_term_liquidity_sale_checked', holding_months: 24, constraints: { ...CONSTRAINTS }, explanation: '受控契约响应：理由 A' },
      { product_id: 'wealth', reason: 'risk_term_liquidity_sale_checked', holding_months: 6, constraints: { ...CONSTRAINTS }, explanation: '受控契约响应：理由 B' }
    ],
    comparison: {
      comparable: false,
      comparison_basis: null,
      incomparable_reason: 'different_basis',
      missing_product_ids: [],
      items: [
        { product_id: 'wealth', basis: { type: '理财', benchmark: 'period_return', risk: 'R2' }, missing: [] },
        { product_id: 'fund', basis: { type: '基金', benchmark: 'period_return', risk: 'R3' }, missing: [] }
      ]
    },
    data_as_of: '2026-09-28T09:00:00+08:00'
  };
}

const SUCCESS_STATE = {
  authorized: true,
  plan: { cash: 20, bond: 50, equity: 20, protection: 10 },
  candidates: ['wealth', 'fund'],
  candidateCalculation: candidateCalculation(),
  compareSet: [],
  compareSaved: false
};

// 失败态：有配置方案（保证 generate-candidates handler 真的走到服务端命令），但没有候选。
const PC_FAILURE_STATE = {
  authorized: true,
  plan: { cash: 20, bond: 50, equity: 20, protection: 10 },
  candidates: [],
  candidateCalculation: null,
  compareSet: [],
  compareSaved: false
};

// 空态：没有配置方案、没有候选、没有 candidateCalculation。
const EMPTY_STATE = {
  authorized: true,
  plan: null,
  candidates: [],
  candidateCalculation: null,
  compareSet: [],
  compareSaved: false
};

// 透传真实创建会话响应，仅覆盖受控状态字段。会话 id / version 保持真实，
// 后续 /api/demo-data、/api/knowledge、PATCH、命令与生成请求仍然是同一真实会话。
async function openWithState(page, route, patchState) {
  await page.route(isSessionCreate, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const body = await response.json();
    body.session.state = { ...body.session.state, ...patchState };
    await route.fulfill({ response, json: body });
  });
  await openRoute(page, route);
}

function errorBody(code, message, status) {
  return {
    error: { code, message, details: { source: 'e2e-controlled-contract' } },
    request_id: '00000000-0000-4000-8000-0000000000e2'
  };
}

test.describe('P-16/H-02 pc/candidates：候选池三态', () => {
  test('成功：候选行、reasons/constraints/holding_months 与服务端顺序均来自 candidateCalculation', async ({ page }) => {
    await openWithState(page, PC_ROUTE, SUCCESS_STATE);
    const app = page.locator(APP);
    const rows = page.locator('#app tbody tr');

    await expect(app).toContainText('为林女士找到 2 个候选', { timeout: 20_000 });
    await expect(app).toContainText('排序值、理由与约束取自服务端 candidateCalculation');
    await expect(app).toContainText(CALCULATION_ID);
    await expect(rows).toHaveCount(2);
    // PC 按 session.candidates（服务端写入）顺序给 rankText 的位置；约束取 reasons[] 里对应 product_id 的记录。
    await expect(rows.nth(0)).toContainText('第 1 条（服务端 candidateCalculation 顺序：风险档由低到高、同档按 product_id）');
    await expect(rows.nth(0)).toContainText('持有期 6 个月');
    await expect(rows.nth(1)).toContainText('第 2 条（服务端 candidateCalculation 顺序：风险档由低到高、同档按 product_id）');
    await expect(rows.nth(1)).toContainText('持有期 24 个月');
    await expect(app).toContainText(REASON_LABEL);
    // reasons[].constraints 的五个字段与 holding_months 均可见。
    await expect(app).toContainText('目标期限 3–5 年');
    await expect(app).toContainText('流动性需求「大部分可长期投资」');
    await expect(app).toContainText('风险 客户 R3 / 目标 R3 平衡型');
    await expect(app).toContainText('可售状态 ON_SALE');
    await expect(app).toContainText('约束（candidateCalculation.reasons[]）');
    // 不是缺来源时的兜底文案，也不是旧的固定适配文案。
    await expect(app).not.toContainText('服务端未返回该候选的 candidateCalculation 理由');
    await expect(app).not.toContainText('适配你的资金期限');
  });

  for (const [label, status, code, message] of [
    ['400 VALIDATION_ERROR', 400, 'VALIDATION_ERROR', '候选筛选缺少风险、期限或流动性条件'],
    ['409 VERSION_CONFLICT', 409, 'VERSION_CONFLICT', '请先生成有效配置方案'],
    ['422 INSUFFICIENT_EVIDENCE', 422, 'INSUFFICIENT_EVIDENCE', '未授权客户不能生成候选产品']
  ]) {
    test(`失败：generate_candidates ${label} 显示真实错误且不写成功`, async ({ page }) => {
      let sent = null;
      await page.route(isCommand, (route) => {
        sent = route.request().postDataJSON();
        return route.fulfill(json(errorBody(code, message, status), status));
      });
      await openWithState(page, PC_ROUTE, PC_FAILURE_STATE);

      await page.locator('#app [data-action="generate-candidates"]').first().click();
      const app = page.locator(APP);
      await expect(app).toContainText('操作未完成', { timeout: 20_000 });
      await expect(app).toContainText(message);
      await expect(app).toContainText('未展示成功结果');
      await expect(app).not.toContainText('候选池已生成');
      await expect(app).not.toContainText('配置方案与候选已生成');
      expect(sent?.command).toBe('generate_candidates');
      const after = await state(page);
      expect(after.landing?.id).toBe('action-error');
      expect(after.candidates?.length ?? 0).toBe(0);
    });
  }

  test('空态：无候选显示去配置页引导，不自动补默认产品', async ({ page }) => {
    await openWithState(page, PC_ROUTE, EMPTY_STATE);
    const app = page.locator(APP);

    await expect(app).toContainText('当前没有候选产品', { timeout: 20_000 });
    await expect(app).toContainText('请先完成资产配置');
    await expect(app).toContainText('系统不会补入默认产品，也不会展示空的候选表');
    await expect(app).toContainText('去做资产配置');
    await expect(page.locator('#app a[data-route="m/allocation"]')).toHaveCount(1);
    await expect(page.locator('#app tbody tr')).toHaveCount(0);
    await expect(app).not.toContainText('为林女士找到');
    await expect(app).not.toContainText('候选池已生成');
    await expect(app).not.toContainText('稳盈固收180天');
    expect((await state(page)).candidates?.length ?? 0).toBe(0);
  });
});

test.describe('P-16 m/candidates：候选推荐三态', () => {
  test('成功：排序/约束取 reasons[]，服务端顺序与 calculation_id 可见', async ({ page }) => {
    await openWithState(page, MOBILE_ROUTE, SUCCESS_STATE);
    const app = page.locator(APP);
    const items = page.locator('#app .mobile-product');

    await expect(app).toContainText(`candidateCalculation ${CALCULATION_ID}`, { timeout: 20_000 });
    await expect(app).toContainText('已关联配置方案');
    await expect(items).toHaveCount(2);
    // m/candidates 用 reasons.filter(ids) 的顺序（fund → wealth），而非 candidates 数组顺序。
    await expect(items.nth(0)).toContainText('第 1 条（风险档由低到高、同档按 product_id）');
    await expect(items.nth(0)).toContainText('持有期 24 个月');
    await expect(items.nth(1)).toContainText('第 2 条（风险档由低到高、同档按 product_id）');
    await expect(items.nth(1)).toContainText('持有期 6 个月');
    await expect(app).toContainText('排序依据：');
    await expect(app).toContainText('约束：');
    await expect(app).toContainText(REASON_LABEL);
    await expect(app).toContainText('目标期限 3–5 年');
    await expect(app).toContainText('流动性需求「大部分可长期投资」');
    await expect(app).toContainText('风险 客户 R3 / 目标 R3 平衡型');
    await expect(app).toContainText('可售状态 ON_SALE');
    await expect(app).toContainText('候选排序、排序依据与约束均取自服务端 candidateCalculation.reasons[]（constraints / holding_months）');
    // 不是无 candidateCalculation 时的兜底文案，也不是旧的固定适配文案。
    await expect(app).not.toContainText('服务端尚未返回 candidateCalculation');
    await expect(app).not.toContainText('适配你的资金期限');
  });

  for (const [label, status, code, message] of [
    ['422 INSUFFICIENT_EVIDENCE', 422, 'INSUFFICIENT_EVIDENCE', '当前授权范围内没有足够的知识片段，已停止生成'],
    ['400 VALIDATION_ERROR', 400, 'VALIDATION_ERROR', 'candidate_explain 请求缺少有效 product_ids']
  ]) {
    test(`失败：candidate_explain ${label} 显示真实错误且不写成功`, async ({ page }) => {
      let sent = null;
      await page.route(isGenerate, (route) => {
        sent = route.request().postDataJSON();
        return route.fulfill(json(errorBody(code, message, status), status));
      });
      await openWithState(page, MOBILE_ROUTE, SUCCESS_STATE);

      await page.locator('#app [data-action="m-candidate-reason"]').first().click();
      const app = page.locator(APP);
      await expect(app).toContainText('AI 生成失败', { timeout: 20_000 });
      await expect(app).toContainText(message);
      await expect(app).toContainText('未写入成功结果');
      await expect(app).toContainText('FAILED');
      await expect(app).not.toContainText('为什么推荐它');
      await expect(app).not.toContainText('候选池已生成');
      expect(sent?.task_type).toBe('candidate_explain');
      expect((await state(page)).landing?.id).toBe('ai-error');
    });
  }

  test('空态：无候选显示去配置页引导，不自动补默认产品', async ({ page }) => {
    await openWithState(page, MOBILE_ROUTE, EMPTY_STATE);
    const app = page.locator(APP);

    await expect(app).toContainText('尚未生成真实候选。请先完成资产配置并生成候选，系统不会补入默认产品。', { timeout: 20_000 });
    await expect(app).toContainText('去做资产配置');
    await expect(page.locator('#app [data-action="go-allocation"]')).toHaveCount(1);
    await expect(page.locator('#app .mobile-product')).toHaveCount(0);
    await expect(app).not.toContainText('已关联配置方案');
    await expect(app).not.toContainText('候选池已生成');
    await expect(app).not.toContainText('稳盈固收180天');
    expect((await state(page)).candidates?.length ?? 0).toBe(0);
  });
});
