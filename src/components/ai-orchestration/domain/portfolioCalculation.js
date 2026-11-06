import { createHash } from 'node:crypto';
import { InsufficientEvidenceError } from '../../../platform/http/errors.js';

// P-15：持仓组合的唯一确定性口径。证据包（诊断任务）与只读计算入口共用本实现，
// 避免出现两套分母。所有输出金额均为元，比率为小数（0.4176 = 41.76%）。
//
// 口径（不得混用）：
// - all_assets：分母 = 全部可投资持仓市值（保险保单金额不在持仓表内，不参与合计）。
// - equity_assets：分母 = 权益类持仓市值（type === '基金' 或产品 role 含“权益”）；
//   无权益持仓、或权益持仓缺少收益基准时该口径不可用（available=false），不返回 0%。
export const CONCENTRATION_BASIS = Object.freeze({
  ALL_ASSETS: 'all_assets',
  EQUITY_ASSETS: 'equity_assets'
});

export const PORTFOLIO_CALCULATION_VERSION = 'portfolio-unverified-return-v1';

// 当前持仓事实只有累计收益率（return_rate），没有期初市值或现金分红，
// 因此“持有收益”只能按成本还原估算：收益 = 现值 × r / (1 + r)。
// 这不是账务级收益：amount 是估算值，页面不得单独展示为实际到账收益。
export const HOLDING_RETURN_BASIS = 'amount_x_rate_over_1_plus_rate';
// 持仓累计收益率已由数据源提供（holding.return_rate），该字段本身是权威事实；
// 但由此反推的收益金额与总收益率只能是估算，level 恒为 estimated。
export const HOLDING_RETURN_LEVEL = 'estimated';

function isEquityProduct(product) {
  if (!product) return false;
  if (product.type === '基金') return true;
  return /权益/.test(String(product.role || ''));
}

function money(value) {
  return Number(value.toFixed(2));
}

function ratio(value) {
  return Number(value.toFixed(6));
}

function normalizeHolding(holding) {
  const holdingId = holding.id || holding.holding_id;
  return {
    holding_id: holdingId,
    product_id: holding.product_id,
    amount: holding.amount,
    return_rate: holding.return_rate
  };
}

/**
 * 计算持仓组合。输入必须来自同一数据版本（调用方负责），产品按 product_id 匹配。
 * 金额非法即抛 INSUFFICIENT_EVIDENCE（消息与证据包保持同文案），空持仓抛“暂无持仓”文案。
 */
export function computePortfolio({ holdings, products, dataAsOf = null }) {
  if (!Array.isArray(holdings)) throw new InsufficientEvidenceError('本地持仓计算缺少有效持仓金额', { task_type: 'diagnosis_explain' });
  if (!holdings.length) throw new InsufficientEvidenceError('当前客户暂无可计算的持仓', { task_type: 'portfolio_calculation' });
  const productById = new Map((products || []).map((product) => [product.id, product]));
  const inputs = holdings
    .map((holding) => normalizeHolding(holding))
    .sort((a, b) => String(a.holding_id).localeCompare(String(b.holding_id)));
  if (inputs.some((holding) => !holding.holding_id || !Number.isFinite(holding.amount) || holding.amount < 0)) {
    throw new InsufficientEvidenceError('本地持仓计算缺少有效持仓金额', { task_type: 'diagnosis_explain' });
  }
  const total = inputs.reduce((sum, holding) => sum + holding.amount, 0);
  if (!(total > 0)) throw new InsufficientEvidenceError('投资持仓合计必须大于零', { task_type: 'diagnosis_explain' });

  const weights = inputs.map((holding) => ({
    holding_id: holding.holding_id,
    product_id: holding.product_id,
    data_id: `holding:${holding.holding_id}`,
    weight: holding.amount / total
  }));
  const maxConcentration = Math.max(...weights.map((holding) => holding.weight));

  const positions = inputs.map((holding) => {
    const product = productById.get(holding.product_id) || null;
    const equity = isEquityProduct(product);
    const rate = Number.isFinite(holding.return_rate) ? holding.return_rate : null;
    // r <= -100% 时成本还原无意义，按缺失处理而不是编造一个极大负数。
    const returnComputable = rate !== null && rate > -1;
    const estimatedReturnAmount = returnComputable ? money((holding.amount * rate) / (1 + rate)) : null;
    return {
      holding_id: holding.holding_id,
      product_id: holding.product_id,
      product_name: product?.name || null,
      product_type: product?.type || null,
      role: product?.role || null,
      is_equity: equity,
      amount: holding.amount,
      return_rate: rate,
      return_amount: estimatedReturnAmount,
      contribution_to_total_return: null
    };
  });

  const equityPositions = positions.filter((position) => position.is_equity);
  const equityTotal = equityPositions.reduce((sum, position) => sum + position.amount, 0);
  const equityAvailable = equityTotal > 0;
  const maxEquityPosition = equityPositions.reduce((best, position) => (!best || position.amount > best.amount ? position : best), null);

  // 任何一笔持仓缺少收益基准时整笔收益按不可用处理，不对缺失部分补 0。
  const returnAvailable = positions.every((position) => position.return_amount !== null);
  const estimatedTotalReturn = returnAvailable ? money(positions.reduce((sum, position) => sum + position.return_amount, 0)) : null;
  const verifiedCostBase = returnAvailable
    ? positions.reduce((sum, position) => sum + position.amount - position.return_amount, 0)
    : null;
  const totalReturnRate = returnAvailable && verifiedCostBase > 0 ? ratio(estimatedTotalReturn / verifiedCostBase) : null;
  if (returnAvailable && estimatedTotalReturn !== 0) {
    for (const position of positions) {
      position.contribution_to_total_return = ratio(position.return_amount / estimatedTotalReturn);
    }
  }

  return {
    calculation_id: `portfolio-${createHash('sha256').update(JSON.stringify(inputs)).digest('hex').slice(0, 20)}`,
    calculation_version: PORTFOLIO_CALCULATION_VERSION,
    data_ids: inputs.map((holding) => `holding:${holding.holding_id}`),
    data_as_of: dataAsOf,
    currency: 'CNY',
    total_amount: total,
    weights,
    max_concentration: maxConcentration,
    max_concentration_basis: CONCENTRATION_BASIS.ALL_ASSETS,
    max_concentration_holding_id: weights.find((holding) => holding.weight === maxConcentration)?.holding_id || null,
    positions,
    equity: {
      available: equityAvailable,
      unavailable_reason: equityAvailable ? null : 'no_equity_positions',
      amount: equityAvailable ? equityTotal : 0,
      share_of_total: equityAvailable ? ratio(equityTotal / total) : null,
      count: equityPositions.length,
      concentrations: equityAvailable
        ? equityPositions
          .map((position) => ({
            holding_id: position.holding_id,
            product_id: position.product_id,
            product_name: position.product_name,
            amount: position.amount,
            basis: CONCENTRATION_BASIS.EQUITY_ASSETS,
            fraction: ratio(position.amount / equityTotal)
          }))
          .sort((a, b) => b.fraction - a.fraction)
        : [],
      max_concentration: equityAvailable ? ratio(maxEquityPosition.amount / equityTotal) : null,
      max_concentration_basis: equityAvailable ? CONCENTRATION_BASIS.EQUITY_ASSETS : null,
      max_concentration_holding_id: equityAvailable ? maxEquityPosition.holding_id : null,
      max_concentration_product_id: equityAvailable ? maxEquityPosition.product_id : null
    },
    holding_return: {
      available: returnAvailable,
      unavailable_reason: returnAvailable ? null : 'missing_return_rate',
      basis: HOLDING_RETURN_BASIS,
      level: HOLDING_RETURN_LEVEL,
      source_rates_verified: returnAvailable,
      amount: estimatedTotalReturn,
      rate: totalReturnRate,
      note: '由当前持仓累计收益率按成本还原估算，未含现金分红与交易流水，不视为账务级收益'
    }
  };
}

// 证据包只需原有字段；只读计算入口使用完整结果。
export function toEvidenceCalculation(portfolio) {
  return {
    calculation_id: portfolio.calculation_id,
    data_ids: portfolio.data_ids,
    total_amount: portfolio.total_amount,
    weights: portfolio.weights,
    max_concentration: portfolio.max_concentration
  };
}
