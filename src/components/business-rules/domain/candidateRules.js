import { createHash } from 'node:crypto';
import { InsufficientEvidenceError, ValidationError } from '../../../platform/http/errors.js';

function riskRank(value) {
  const match = String(value || '').match(/R([1-5])/i);
  return match ? Number(match[1]) : null;
}

function monthsFromText(value) {
  const text = String(value || '');
  const year = text.match(/(\d+(?:\.\d+)?)\s*年/);
  const month = text.match(/(\d+(?:\.\d+)?)\s*(?:个月|月)/);
  const day = text.match(/(\d+(?:\.\d+)?)\s*天/);
  if (year) return Number(year[1]) * 12;
  if (month) return Number(month[1]);
  if (day) return Number(day[1]) / 30;
  return 0;
}

function goalTermMonths(value) {
  const text = String(value || '').replace(/\s/g, '');
  const range = text.match(/(\d+(?:\.\d+)?)[–—-](\d+(?:\.\d+)?)年/);
  if (range) return Number(range[2]) * 12;
  const single = text.match(/(\d+(?:\.\d+)?)年/);
  return single ? Number(single[1]) * 12 : null;
}

export function isCandidateEligible({ product, customer, goal }) {
  if (product.sale_status !== 'ON_SALE') return { eligible: false, reason: 'not_on_sale' };
  if (product.type !== '保险') {
    const productRisk = riskRank(product.risk);
    const customerRisk = riskRank(customer.risk_level);
    const goalRisk = riskRank(goal.risk);
    if (!productRisk || !customerRisk || !goalRisk) return { eligible: false, reason: 'risk_level_unknown' };
    if (productRisk > customerRisk) return { eligible: false, reason: 'risk_above_customer' };
    if (productRisk > goalRisk) return { eligible: false, reason: 'risk_above_goal' };
  }
  const holdingMonths = monthsFromText(product.liquidity);
  const liquidityNeedsOneYear = /一年内|1\s*年/.test(String(goal?.liquidity || ''));
  const termLimit = goalTermMonths(goal.term);
  if ((liquidityNeedsOneYear && holdingMonths > 12) || (termLimit && holdingMonths > termLimit)) {
    return { eligible: false, reason: 'holding_period_exceeds_liquidity_or_term' };
  }
  return { eligible: true, reason: 'risk_term_liquidity_sale_checked' };
}

export function selectCandidates({ products, customer, goal, limit = 10 }) {
  if (!customer?.authorized) throw new InsufficientEvidenceError('未授权客户不能生成候选产品');
  if (!goal?.risk || !goal?.term || !goal?.liquidity) throw new ValidationError('候选筛选缺少风险、期限或流动性条件');
  if (!riskRank(goal.risk) || !riskRank(customer.risk_level)) throw new ValidationError('客户和目标风险等级必须明确');
  if (riskRank(goal.risk) > riskRank(customer.risk_level)) throw new ValidationError('目标风险不能超过客户风险等级');
  const ranked = products
    .map((product) => ({ product, result: isCandidateEligible({ product, customer, goal }) }))
    .filter(({ result }) => result.eligible)
    .sort((a, b) => (riskRank(a.product.risk) || 0) - (riskRank(b.product.risk) || 0) || String(a.product.id).localeCompare(String(b.product.id)))
    .slice(0, limit);
  const calculationBasis = JSON.stringify({
    customer: { id: customer.id, risk_level: customer.risk_level },
    goal,
    products: ranked.map(({ product }) => ({ id: product.id, source_timestamp: product.source_timestamp }))
  });
  return {
    calculation_id: `candidate-${createHash('sha256').update(calculationBasis).digest('hex').slice(0, 20)}`,
    candidate_ids: ranked.map(({ product }) => product.id),
    data_ids: ranked.map(({ product }) => `product:${product.id}`),
    reasons: ranked.map(({ product, result }) => ({
      product_id: product.id,
      reason: result.reason,
      explanation: `风险 ${product.risk}，期限/流动性 ${product.liquidity || '以产品规则为准'}，组合角色 ${product.role || '未设置'}`
    })),
    data_as_of: products.map((product) => product.source_timestamp).filter(Boolean).sort().at(-1) || null
  };
}
