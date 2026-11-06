import test from 'node:test';
import assert from 'node:assert/strict';
import { PortfolioService } from '../../src/components/demo-data/application/portfolioService.js';
import { DemoDataService } from '../../src/components/demo-data/application/demoDataService.js';
import { DemoDataRepository } from '../../src/components/demo-data/infrastructure/demoDataRepository.js';

// P-15：持仓组合确定性计算的契约测试。
// 通过真实的 DemoDataService + fixture 仓库驱动 PortfolioService，覆盖：
// 金额合计与权重的可复算性、集中度分母口径（all_assets vs equity_assets）、
// 未授权与空持仓的“不可用”语义，以及 holding_return 只能标记为估算。
// 注意：这里的 168420/250000/300000 是 fixture 输入，本文件只验证公式与口径，
// 不是真实持仓、不是真实模型输出、也不构成生产验收结论。

const FIXTURE_HOLDINGS = [
  { id: 'holding-001', product_id: 'fund', amount: 168420, return_rate: 0.1842 },
  { id: 'holding-002', product_id: 'wealth', amount: 250000, return_rate: 0.0362 },
  { id: 'holding-003', product_id: 'deposit', amount: 300000, return_rate: 0.0215 }
];

const FIXTURE_PRODUCTS = [
  { id: 'fund', name: '易方达中证A500联接A', type: '基金', role: '权益增长' },
  { id: 'wealth', name: '稳盈固收180天', type: '理财', role: '稳健底仓' },
  { id: 'deposit', name: '安心定期3年', type: '存款', role: '确定性现金' },
  { id: 'bondfund', name: '华安稳健增利 12 个月', type: '基金', role: '稳健底仓' }
];

function fixtureService() {
  const repository = new DemoDataRepository({ db: { enabled: false }, dataMode: 'fixture' });
  return new PortfolioService({ dataService: new DemoDataService({ repository }) });
}

function stubService({ holdings, products = FIXTURE_PRODUCTS, authorized = true }) {
  const dataService = {
    getCustomerContext: async ({ authorized: requested } = {}) => ({
      customer: { id: 'customer-test', authorized },
      holdings: requested === true && authorized ? holdings : [],
      products,
      data_version: 'test-version',
      data_as_of: '2026-09-28'
    })
  };
  return new PortfolioService({ dataService });
}

function round2(value) {
  return Number(value.toFixed(2));
}

function round6(value) {
  return Number(value.toFixed(6));
}

test('three holdings produce a reproducible total and weights that sum to 1', async () => {
  const service = fixtureService();
  const result = await service.calculate({ customerId: 'customer-001', authorized: true });

  assert.equal(result.available, true);
  assert.equal(result.unavailable_reason, null);
  const calculation = result.calculation;

  // 业务不变量：合计 = Σ 持仓金额。
  assert.equal(calculation.total_amount, 718420);
  assert.equal(calculation.total_amount, FIXTURE_HOLDINGS.reduce((sum, holding) => sum + holding.amount, 0));
  assert.equal(calculation.currency, 'CNY');

  // 权重必须可由“金额 / 合计”独立复算，且覆盖全部持仓。
  assert.equal(calculation.weights.length, FIXTURE_HOLDINGS.length);
  let weightSum = 0;
  for (const weight of calculation.weights) {
    const holding = FIXTURE_HOLDINGS.find((item) => item.id === weight.holding_id);
    assert.ok(holding, `weight must reference a real holding (${weight.holding_id})`);
    assert.equal(weight.weight, holding.amount / calculation.total_amount);
    weightSum += weight.weight;
  }
  assert.ok(Math.abs(weightSum - 1) < 1e-12, `weights must sum to 1, got ${weightSum}`);

  // 金额为 CNY 2 位小数口径。
  for (const position of calculation.positions) {
    assert.equal(round2(position.amount), position.amount);
  }
});

test('max_concentration uses the all-assets basis and equals the largest weight across products', async () => {
  const service = fixtureService();
  const result = await service.calculate({ customerId: 'customer-001', authorized: true });
  const { calculation } = result;

  assert.equal(calculation.max_concentration_basis, 'all_assets');
  // 跨产品最大权重 = 300000 / 718420（约 41.76%），持有的是金额最大的那笔。
  assert.equal(calculation.max_concentration, 300000 / 718420);
  assert.equal(round6(calculation.max_concentration), 0.417583);
  assert.equal(Number((calculation.max_concentration * 100).toFixed(2)), 41.76);
  assert.equal(calculation.max_concentration, Math.max(...calculation.weights.map((weight) => weight.weight)));
  assert.equal(calculation.max_concentration_holding_id, 'holding-003');
  // 对外声明的分母口径必须包含 all_assets，且与计算结果的 max_concentration_basis 一致。
  assert.equal(result.basis.ALL_ASSETS, 'all_assets');
  assert.equal(result.basis.EQUITY_ASSETS, 'equity_assets');
  assert.equal(calculation.max_concentration_basis, result.basis.ALL_ASSETS);
});

test('equity concentration is computed on the equity_assets basis and differs from the all-assets basis', async () => {
  const service = fixtureService();
  const { calculation } = await service.calculate({ customerId: 'customer-001', authorized: true });
  const equity = calculation.equity;

  assert.equal(equity.available, true);
  assert.equal(equity.max_concentration_basis, 'equity_assets');
  assert.equal(equity.amount, 168420);
  assert.equal(equity.count, 1);
  assert.equal(equity.max_concentration, 1);
  assert.equal(equity.share_of_total, round6(168420 / 718420));

  // 两种分母必须明确区分：同一个权益持仓在两个口径下的权重不同。
  assert.notEqual(equity.max_concentration_basis, calculation.max_concentration_basis);
  assert.notEqual(equity.max_concentration, calculation.max_concentration);
  assert.ok(equity.max_concentration > calculation.max_concentration, 'equity-only share must exceed share of all assets');
  for (const item of equity.concentrations) {
    assert.equal(item.basis, 'equity_assets');
    assert.equal(item.holding_id, 'holding-001');
    assert.equal(item.fraction, 168420 / 168420);
  }
});

test('equity denominator excludes non-equity holdings so its weights do not blend with all-assets', async () => {
  // 两笔权益 + 一笔非权益：权益口径分母只能包含权益市值。
  const service = stubService({
    holdings: [
      { id: 'h-1', product_id: 'fund', amount: 300000, return_rate: 0.1 },
      { id: 'h-2', product_id: 'bondfund', amount: 100000, return_rate: 0.04 },
      { id: 'h-3', product_id: 'deposit', amount: 600000, return_rate: 0.02 }
    ]
  });
  const { calculation } = await service.calculate({ authorized: true });

  assert.equal(calculation.total_amount, 1000000);
  assert.equal(calculation.equity.amount, 400000);
  assert.equal(calculation.equity.count, 2);
  // fund 占权益 75%，但只占全部资产 30%：两口径不能混用。
  assert.equal(calculation.equity.max_concentration, 0.75);
  assert.equal(calculation.equity.share_of_total, 0.4);
  assert.equal(calculation.max_concentration, 0.6);
  assert.equal(calculation.max_concentration_basis, 'all_assets');

  // 权益持仓的集中度合计为 1。
  const equityFractionSum = calculation.equity.concentrations.reduce((sum, item) => sum + item.fraction, 0);
  assert.ok(Math.abs(equityFractionSum - 1) < 1e-5, `equity fractions must sum to 1, got ${equityFractionSum}`);
});

test('no equity holdings marks the equity basis unavailable instead of reporting 0%', async () => {
  const service = stubService({
    holdings: [{ id: 'h-deposit', product_id: 'deposit', amount: 500000, return_rate: 0.0215 }]
  });
  const { calculation } = await service.calculate({ authorized: true });

  assert.equal(calculation.equity.available, false);
  assert.equal(calculation.equity.max_concentration, null);
  assert.equal(calculation.equity.max_concentration_basis, null);
  assert.equal(calculation.equity.share_of_total, null);
  assert.equal(calculation.equity.unavailable_reason, 'no_equity_positions');
  assert.deepEqual(calculation.equity.concentrations, []);
});

test('unauthorized callers get available:false and no holding details', async () => {
  const service = fixtureService();
  const result = await service.calculate({ customerId: 'customer-001', authorized: false });

  assert.equal(result.available, false);
  assert.equal(result.unavailable_reason, 'unauthorized');
  const calculation = result.calculation;
  assert.equal(calculation.calculation_id, null);
  assert.equal(calculation.total_amount, null);
  assert.deepEqual(calculation.weights, []);
  assert.deepEqual(calculation.positions, []);
  assert.equal(calculation.max_concentration, null);
  assert.equal(calculation.equity.available, false);
  assert.equal(calculation.holding_return.available, false);
  assert.equal(calculation.holding_return.amount, null);

  // 不得泄露任何持仓明细字段。
  const serialized = JSON.stringify(result);
  for (const holding of FIXTURE_HOLDINGS) {
    assert.equal(serialized.includes(holding.id), false, `unauthorized payload leaked ${holding.id}`);
  }
  assert.equal(serialized.includes('168420'), false);
});

test('authorized flag alone is not enough while the data source reports an unauthorized customer', async () => {
  const service = stubService({ holdings: FIXTURE_HOLDINGS, authorized: false });
  const result = await service.calculate({ authorized: true });
  assert.equal(result.available, false);
  assert.equal(result.unavailable_reason, 'unauthorized');
});

test('empty holdings return no_holdings rather than a fabricated zero total', async () => {
  const service = stubService({ holdings: [] });
  const result = await service.calculate({ authorized: true });

  assert.equal(result.available, false);
  assert.equal(result.unavailable_reason, 'no_holdings');
  assert.equal(result.calculation.total_amount, null);
  assert.notEqual(result.calculation.total_amount, 0);
  assert.deepEqual(result.calculation.weights, []);
  assert.equal(result.calculation.holding_return.available, false);
  assert.equal(result.calculation.holding_return.amount, null);
});

test('holding_return is flagged as an estimate and is reproducible from holdings', async () => {
  const service = fixtureService();
  const result = await service.calculate({ customerId: 'customer-001', authorized: true });
  const { calculation } = result;
  const holdingReturn = calculation.holding_return;

  assert.equal(holdingReturn.available, true);
  assert.equal(holdingReturn.level, 'estimated');
  assert.equal(holdingReturn.basis, 'amount_x_rate_over_1_plus_rate');
  // 口径必须对外声明为“估算”，且与其他不可用/可用的计算区分开。
  assert.equal(result.conventions.holding_return.level, 'estimated');

  // 收益金额必须能由“现值 × r / (1 + r)”逐笔复算后加总。
  const expectedByHolding = new Map(
    FIXTURE_HOLDINGS.map((holding) => [holding.id, round2((holding.amount * holding.return_rate) / (1 + holding.return_rate))])
  );
  for (const position of calculation.positions) {
    assert.equal(position.return_amount, expectedByHolding.get(position.holding_id), `return_amount mismatch for ${position.holding_id}`);
  }
  const expectedTotal = round2([...expectedByHolding.values()].reduce((sum, value) => sum + value, 0));
  assert.equal(holdingReturn.amount, expectedTotal);

  // 估算口径必须被显式标注，不能被表述为实际到账收益。
  assert.match(String(holdingReturn.note || ''), /估算/);
});

test('any holding missing a return rate makes the whole return estimate unavailable instead of zero-filled', async () => {
  const service = stubService({
    holdings: [
      { id: 'h-1', product_id: 'fund', amount: 300000, return_rate: 0.1 },
      { id: 'h-2', product_id: 'wealth', amount: 100000 }
    ]
  });
  const { calculation } = await service.calculate({ authorized: true });

  assert.equal(calculation.holding_return.available, false);
  assert.equal(calculation.holding_return.amount, null);
  assert.equal(calculation.holding_return.unavailable_reason, 'missing_return_rate');
  const missing = calculation.positions.find((position) => position.holding_id === 'h-2');
  assert.equal(missing.return_amount, null);
});

test('portfolio calculation is deterministic for the same holdings', async () => {
  const service = fixtureService();
  const first = await service.calculate({ customerId: 'customer-001', authorized: true });
  const second = await service.calculate({ customerId: 'customer-001', authorized: true });
  assert.deepEqual(first, second);
  assert.equal(first.calculation.calculation_id, second.calculation.calculation_id);
  assert.match(first.calculation.calculation_id, /^portfolio-[0-9a-f]{20}$/);
});

test('insurance premium is not part of any holdings total', async () => {
  const service = stubService({
    holdings: [{ id: 'h-1', product_id: 'deposit', amount: 300000, return_rate: 0.0215 }],
    products: [...FIXTURE_PRODUCTS, { id: 'insurance', name: '安享长期医疗', type: '保险', role: '医疗保障', annual_premium: 3280 }]
  });
  const { calculation } = await service.calculate({ authorized: true });
  assert.equal(calculation.total_amount, 300000);
  assert.equal(calculation.positions.some((position) => position.product_id === 'insurance'), false);
});
