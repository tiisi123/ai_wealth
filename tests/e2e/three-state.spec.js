import { test, expect } from '@playwright/test';
import { openRoute } from './helpers.js';

// 三个页面的服务端三态（成功 / 失败 / 空态）断言，范围严格限定：
// - P-01 pc/architecture：GET /api/health 成功态；
// - P-04 m/deposit 与 pc/product-deposit：GET /api/calculations/deposit 成功 / 失败 / 空态；
// - P-15 m/holdings：GET /api/calculations/portfolio 成功态。
// 每条断言只读页面真实可见文本（toContainText），不断言内部变量。
// 注入的响应结构取自当前 main 的真实返回：src/interfaces/http/controllers.js、
// businessRulesService.calculateDeposit、portfolioService.calculate、healthService.read。
// 只使用这些接口已经会返回的字段；数值是受控响应夹具，不代表真实模型输出或验收结论。

const APP = '#app';
// P-04 覆盖手机存款页与 PC 存款洞察页：两页共用同一 depositCard 渲染与同一接口，
// 三态断言对每个页面逐页验证。PC 页由 stacked 前端 PR #26 补上目录读取后的重渲染
// 与区间事实空值守卫后才可用，本 PR 只恢复断言范围，不改生产代码。
const DEPOSIT_PAGES = ['m/deposit', 'pc/product-deposit'];

// 历史版本写死在页面上的固定指标；任何状态下都不允许再出现。
const HARDCODED_INDICATORS = ['99.98%', '18,426', '94.6%'];
// 浏览器旧实现自算的固定本息；现在页面金额只能来自服务端响应本身。
const BROWSER_FIXED_MATURITY = '¥532,250.00';

const HEALTH_ROUTE = '**/api/health';
const DEMO_DATA_ROUTE = '**/api/demo-data**';
const DEPOSIT_ROUTE = '**/api/calculations/deposit**';
const PORTFOLIO_ROUTE = '**/api/calculations/portfolio**';

function json(body, status = 200) {
  return { status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) };
}

// healthService.read() + controllers.health 的顶层结构，dependencies 字段全部取自真实实现。
function healthOk() {
  return {
    status: 'ok',
    service: 'wealth-prototype-demo',
    instance_id: 'e2e-three-state',
    node_env: 'test',
    data_mode: 'database',
    ai_mode: 'fixture',
    dependencies: {
      database: { ok: true },
      shared_document_store: { ok: true },
      knowledge: {
        status: 'ACTIVE',
        knowledge_version: 'knowledge-demo-v1',
        document_count: 4,
        chunk_count: 12,
        vector_count: 12,
        ready: true
      },
      model: {
        configured: true,
        execution_mode: 'fixture',
        model: 'fixture-generate-1',
        embedding_model: 'fixture-embedding-1'
      },
      rules: { ready: true, count: 3, expected_version: 'rules-demo-v1' },
      contract: { ready: true, api_version: 'v1', frontend_contract_version: '2026-11-02.1' },
      data_mode: { ready: true }
    },
    generated_at: '2026-09-28T09:30:00.000Z',
    api_version: 'v1',
    frontend_contract_version: '2026-11-02.1'
  };
}

// controllers.calculateDeposit：MATCHED 时原样返回规则目录结果 + api_version（2xx）。
// 输入非法由 errorMiddleware 返回 400 VALIDATION_ERROR。
// 本金 / 利率 / 期限刻意与浏览器旧硬编码本息（¥532,250）不同：页面金额必须来自该响应。
function depositMatched() {
  const principal = 400000;
  const annualRate = 0.03;
  const years = 2;
  const interest = Number((principal * annualRate * years).toFixed(2));
  return {
    status: 'MATCHED',
    rule_id: 'deposit-interest-simple',
    rule_version: 'rules-demo-v1',
    result: {
      principal,
      annual_rate: annualRate,
      years,
      interest,
      maturity_amount: Number((principal + interest).toFixed(2)),
      formula: `利息 = 本金 × 年利率 × 年数 = ${principal} × ${annualRate} × ${years}`
    },
    calculation_id: 'calc-deposit-interest-simple-5f1c2a7b9d3e4f60',
    rate_unit: 'percent',
    inputs: { principal, annual_rate: annualRate, years },
    inputs_echo: { principal: String(principal), annual_rate: String(annualRate * 100), years: String(years), rate_unit: 'percent' },
    api_version: 'v1'
  };
}

// portfolioService.calculate 的 available=true 返回（字段取自 portfolioCalculation.computePortfolio，
// 数值按同一公式内部一致计算）。
function portfolioAvailable() {
  return {
    available: true,
    unavailable_reason: null,
    data_version: 'demo-2026-09-28-v1',
    data_as_of: '2026-09-28',
    calculation: {
      calculation_id: 'portfolio-0f5e2a9c41d7b863e4a1',
      calculation_version: 'portfolio-unverified-return-v1',
      data_ids: ['holding:holding-001', 'holding:holding-002', 'holding:holding-003'],
      data_as_of: '2026-09-28',
      currency: 'CNY',
      total_amount: 718420,
      weights: [
        { holding_id: 'holding-001', product_id: 'fund', data_id: 'holding:holding-001', weight: 0.234431 },
        { holding_id: 'holding-002', product_id: 'wealth', data_id: 'holding:holding-002', weight: 0.347986 },
        { holding_id: 'holding-003', product_id: 'deposit', data_id: 'holding:holding-003', weight: 0.417583 }
      ],
      max_concentration: 0.417583,
      max_concentration_basis: 'all_assets',
      max_concentration_holding_id: 'holding-003',
      positions: [
        { holding_id: 'holding-001', product_id: 'fund', product_name: '易方达中证A500联接A', product_type: '基金', role: '权益增长', is_equity: true, amount: 168420, return_rate: 0.1842, return_amount: 26197.4, contribution_to_total_return: 0.635158 },
        { holding_id: 'holding-002', product_id: 'wealth', product_name: '稳盈固收180天', product_type: '理财', role: '稳健底仓', is_equity: false, amount: 250000, return_rate: 0.0362, return_amount: 8733.84, contribution_to_total_return: 0.211753 },
        { holding_id: 'holding-003', product_id: 'deposit', product_name: '安心定期3年', product_type: '存款', role: '确定性现金', is_equity: false, amount: 300000, return_rate: 0.0215, return_amount: 6314.24, contribution_to_total_return: 0.153089 }
      ],
      equity: {
        available: true,
        unavailable_reason: null,
        amount: 168420,
        share_of_total: 0.234431,
        count: 1,
        concentrations: [{ holding_id: 'holding-001', product_id: 'fund', product_name: '易方达中证A500联接A', amount: 168420, basis: 'equity_assets', fraction: 1 }],
        max_concentration: 1,
        max_concentration_basis: 'equity_assets',
        max_concentration_holding_id: 'holding-001',
        max_concentration_product_id: 'fund'
      },
      holding_return: {
        available: true,
        unavailable_reason: null,
        basis: 'amount_x_rate_over_1_plus_rate',
        level: 'estimated',
        source_rates_verified: true,
        amount: 41245.48,
        rate: 0.060908,
        note: '由当前持仓累计收益率按成本还原估算，未含现金分红与交易流水，不视为账务级收益'
      }
    },
    basis: 'all_assets',
    conventions: {
      currency: 'CNY',
      amount_unit: '元',
      ratio_unit: '小数（0.4176 = 41.76%）',
      rounding: { amount: '2 位小数', ratio: '6 位小数' }
    },
    api_version: 'v1'
  };
}

test.describe('P-01 能力总览（pc/architecture）：GET /api/health 成功态', () => {
  test('成功：展示 api_version 与 dependencies 状态，且不含硬编码指标', async ({ page }) => {
    // session-sync.js 建立会话时也读一次 /api/health（只核对契约版本），
    // 夹具包含真实契约版本，会话照常建立；页面自身的健康读取得到同一成功响应。
    await page.route(HEALTH_ROUTE, (route) => route.fulfill(json(healthOk())));
    await openRoute(page, 'pc/architecture');

    const app = page.locator(APP);
    await expect(app).toContainText('api_version v1', { timeout: 20_000 });
    await expect(app).toContainText('frontend_contract_version 2026-11-02.1');
    await expect(app).toContainText('AI_MODE=fixture');
    await expect(app).toContainText('服务字段（GET /api/health）');
    await expect(app).toContainText('规则版本期望');
    await expect(app).toContainText('rules-demo-v1');
    await expect(app).toContainText('知识库版本');
    await expect(app).toContainText('knowledge-demo-v1');
    await expect(app).toContainText('知识片段数');
    // dependencies 逐项按服务端自己的字段展示：数据库/共享文档存储读 ok，其余读 ready。
    await expect(app).toContainText('数据库');
    await expect(app).toContainText('共享文档存储');
    await expect(app).toContainText('正常');
    await expect(app).toContainText('知识库');
    await expect(app).toContainText('就绪');
    await expect(app).toContainText('前后端契约');
    await expect(app).toContainText('一致');
    await expect(app).toContainText('AI 生成服务');
    await expect(app).toContainText('已配置');
    for (const text of HARDCODED_INDICATORS) await expect(app).not.toContainText(text);
  });
});

test.describe('P-04 存款本息（m/deposit 与 pc/product-deposit）：GET /api/calculations/deposit 三态', () => {
  test('成功：本息与 calculation_id 来自服务端结果，不出现浏览器固定金额', async ({ page }) => {
    const matched = depositMatched();
    await page.route(DEPOSIT_ROUTE, (route) => route.fulfill(json(matched)));
    for (const route of DEPOSIT_PAGES) {
      await openRoute(page, route);
      const app = page.locator(APP);
      // 这个金额只可能来自注入的服务端响应；页脚静态文案里也有「服务端计算结果」，
      // 因此先以金额确认成功卡片确实渲染出来。
      await expect(app).toContainText('¥424,000.00', { timeout: 20_000 });
      await expect(app).toContainText('服务端计算结果');
      await expect(app).toContainText('到期本息');
      await expect(app).toContainText('利息');
      await expect(app).toContainText('¥24,000.00');
      await expect(app).toContainText(matched.calculation_id);
      await expect(app).toContainText('rules-demo-v1');
      await expect(app).toContainText('单利测算');
      await expect(app).not.toContainText('未获得服务端结果，本次不展示任何金额');
      await expect(app).not.toContainText(BROWSER_FIXED_MATURITY);
    }
  });

  test('失败：400 展示真实错误码与错误消息，不展示任何金额', async ({ page }) => {
    await page.route(DEPOSIT_ROUTE, (route) => route.fulfill(json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '年利率必须为不小于 0 的有效数值',
        details: { fields: ['annual_rate'] }
      },
      request_id: '00000000-0000-4000-8000-0000000000d1'
    }, 400)));
    for (const route of DEPOSIT_PAGES) {
      await openRoute(page, route);
      const app = page.locator(APP);
      await expect(app).toContainText('服务端错误 VALIDATION_ERROR', { timeout: 20_000 });
      await expect(app).toContainText('年利率必须为不小于 0 的有效数值');
      await expect(app).toContainText('未获得服务端结果，本次不展示任何金额');
      await expect(app).not.toContainText(BROWSER_FIXED_MATURITY);
      await expect(app).not.toContainText('calculation_id');
    }
  });

  test('空态：服务端快照没有挂牌利率时显示该期限暂无挂牌利率', async ({ page }) => {
    // 服务端不套用默认利率：产品快照缺少挂牌年利率时页面落空态，不发起计算也不展示金额。
    // 其余快照字段按真实响应原样透传，只去掉存款产品的 annual_rate。
    await page.route(DEMO_DATA_ROUTE, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      for (const product of body?.products || []) {
        if (product.id === 'deposit') product.annual_rate = null;
      }
      await route.fulfill({ response, json: body });
    });
    for (const route of DEPOSIT_PAGES) {
      // openRoute 会先等共享会话就绪（demo-data 已应用）再断言，
      // 因此这里断言的是快照落地后的最终空态，而不是同步前的初始渲染。
      await openRoute(page, route);
      const app = page.locator(APP);
      await expect(app).toContainText('该期限暂无挂牌利率', { timeout: 20_000 });
      await expect(app).toContainText('本页不套用默认利率');
      await expect(app).not.toContainText(BROWSER_FIXED_MATURITY);
      await expect(app).not.toContainText('calculation_id');
    }
  });
});

test.describe('P-15 持仓诊断（m/holdings）：GET /api/calculations/portfolio 成功态', () => {
  test('成功：两种集中度口径并列且分母写明，收益标明估算', async ({ page }) => {
    const portfolio = portfolioAvailable();
    await page.route(PORTFOLIO_ROUTE, (route) => route.fulfill(json(portfolio)));
    await openRoute(page, 'm/holdings');

    const app = page.locator(APP);
    await expect(app).toContainText('服务端计算结果', { timeout: 20_000 });
    await expect(app).toContainText('集中度（两种分母口径，不可混用）');
    // 全资产口径：max_concentration / basis=all_assets。
    await expect(app).toContainText('最大单产品权重 · 全资产口径');
    await expect(app).toContainText('basis=all_assets');
    await expect(app).toContainText('41.76%');
    // 权益资产口径：equity.max_concentration / basis=equity_assets。
    await expect(app).toContainText('最大单产品权重 · 权益资产口径');
    await expect(app).toContainText('basis=equity_assets');
    await expect(app).toContainText('100.00%');
    // 两种分母各自写明，不混用。
    await expect(app).toContainText('全资产口径的分母是全部持仓市值（保险保费不在持仓内，不参与合计）');
    await expect(app).toContainText('权益资产口径的分母只是权益类持仓市值');
    await expect(app).toContainText('持有收益（服务端估算）');
    await expect(app).toContainText('¥41,245.48');
    await expect(app).toContainText('不视为账务级收益');
    await expect(app).toContainText(portfolio.calculation.calculation_id);
    await expect(app).not.toContainText('服务端计算失败');
    await expect(app).not.toContainText('该口径不可用（无权益持仓）');
  });
});
