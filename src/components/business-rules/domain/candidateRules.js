import { createHash } from 'node:crypto';
import { InsufficientEvidenceError, ValidationError } from '../../../platform/http/errors.js';
import { normalizeRisk } from './ruleCatalog.js';

const riskRank = normalizeRisk;

// 定期存款按约定期限持有；“提前支取”只说明取款规则，不代表随时赎回，
// 因此必须按名义期限与目标期限比较，不能依赖是否出现“年”字来判断。
const TERM_BEARING_TYPES = new Set(['存款']);

function monthsFromText(value) {
  // 只去除 ASCII 空白：全角空格 0xA0 属于 \s，但它在“12 个月”里是数字与单位的分隔，
  // 去掉后反而无法识别，因此不用 \s。
  const text = String(value || '').replace(/[\t\n\r ]/g, '');
  const year = text.match(/(\d+(?:\.\d+)?)年/);
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

// A07：只有同一口径的比较才可能有效。产品类型、收益指标口径和风险等级表现
// 必须一致，否则不参与排名；没有收益指标时如实记为缺失。
export function comparisonBasis(product) {
  const hasRate = product.annual_rate !== undefined && product.annual_rate !== null;
  const hasReturn = product.latest_return !== undefined && product.latest_return !== null;
  const benchmark = hasRate ? 'annual_rate' : (hasReturn ? 'period_return' : 'missing');
  const text = (value, fallback) => (value !== undefined && value !== null && String(value).trim() ? String(value).trim() : fallback);
  return { type: text(product.type, '未知'), benchmark, risk: text(product.risk, '缺失') };
}

function comparableSignature(basis) {
  // 比较口径以“产品类型 + 风险等级 + 收益指标口径”为准；同类、同风险、同口径才可能形成有效比较。
  const text = (value) => (value === undefined || value === null || String(value).trim() === '' ? '缺失' : String(value).trim().toLowerCase());
  return [text(basis.type), text(basis.risk), text(basis.benchmark)].join('|');
}

/**
 * 候选约束（A06）：可售、风险不高于客户且不高于目标、持有期不超过流动性需求与目标期限。
 * 返回可复算的原因码，缺值时如实拒绝而不是猜测。
 */
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
  // 定期存款以产品期限作为必达持有期，避免“提前支取按活期”被误读为可随时取出。
  const nominalMonths = TERM_BEARING_TYPES.has(product.type) ? monthsFromText(product.name) : 0;
  const requiredMonths = Math.max(holdingMonths, nominalMonths);
  const liquidityNeedsOneYear = /一年内|1\s*年/.test(String(goal?.liquidity || ''));
  const termLimit = goalTermMonths(goal.term);
  if ((liquidityNeedsOneYear && requiredMonths >= 12) || (termLimit && requiredMonths > termLimit)) {
    return { eligible: false, reason: 'holding_period_exceeds_liquidity_or_term', holding_months: requiredMonths };
  }
  return { eligible: true, reason: 'risk_term_liquidity_sale_checked', holding_months: requiredMonths };
}

function comparisonOutcome({ productIds, products }) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = [...new Set(productIds)].map((id) => {
    const product = byId.get(id);
    return {
      product_id: id,
      basis: product ? comparisonBasis(product) : null,
      missing: product ? [] : ['product_not_in_data_version']
    };
  });
  const missing_product_ids = items.filter((item) => !item.basis).map((item) => item.product_id);
  const present = items.filter((item) => item.basis);
  const signatures = new Set(present.map((item) => comparableSignature(item.basis)));
  // 不同口径不做排名；缺失值不编造，只记录为缺失。
  const comparable = items.length >= 2 && missing_product_ids.length === 0 && signatures.size === 1;
  return {
    comparable,
    comparison_basis: comparable ? present[0].basis : null,
    incomparable_reason: comparable ? null : (missing_product_ids.length ? 'missing_values' : (items.length < 2 ? 'fewer_than_two_products' : 'different_basis')),
    missing_product_ids,
    items
  };
}

// 比较集可以保存，但只有 comparable=true 的口径才允许产生排名或优劣结论。
export function compareBasis({ products, productIds }) {
  return comparisonOutcome({ productIds, products });
}

export function selectCandidates({ products, customer, goal, limit = 10 }) {
  if (!customer?.authorized) throw new InsufficientEvidenceError('未授权客户不能生成候选产品');
  if (!goal?.risk || !goal?.term || !goal?.liquidity) throw new ValidationError('候选筛选缺少风险、期限或流动性条件');
  if (!riskRank(goal.risk) || !riskRank(customer.risk_level)) throw new ValidationError('客户和目标风险等级必须明确');
  if (riskRank(goal.risk) > riskRank(customer.risk_level)) throw new ValidationError('目标风险不能超过客户风险等级');
  const eligible = products
    .map((product) => ({ product, result: isCandidateEligible({ product, customer, goal }) }))
    .filter(({ result }) => result.eligible);
  // 候选内部按风险升序排列，并在原因中写明与当前输入的对照；候选排序不替代适当性结论。
  const ranked = eligible
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
      holding_months: result.holding_months,
      constraints: {
        customer_risk: customer.risk_level,
        goal_risk: goal.risk,
        goal_term: goal.term,
        goal_liquidity: goal.liquidity,
        sale_status: product.sale_status
      },
      explanation: `风险 ${product.risk} 不高于客户 ${customer.risk_level} 与目标 ${goal.risk}，期限/流动性 ${product.liquidity || '以产品规则为准'} 满足“${goal.liquidity}”，组合角色 ${product.role || '未设置'}`
    })),
    comparison: comparisonOutcome({ productIds: ranked.map(({ product }) => product.id), products }),
    data_as_of: products.map((product) => product.source_timestamp).filter(Boolean).sort().at(-1) || null
  };
}
