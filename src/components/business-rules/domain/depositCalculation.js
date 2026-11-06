import { ValidationError } from '../../../platform/http/errors.js';

// P-04：存款本息确定性计算。规则目录 deposit-interest-simple 的公式是
// principal × annual_rate × years，其中 annual_rate 是**小数**（2.15% 必须传 0.0215）。
// 为杜绝把百分数 2.15 直接传入被放大 100 倍，这里提供两种显式单位口径：
// - rate_unit: 'decimal'   → annual_rate = 0.0215
// - rate_unit: 'percent'   → annual_rate = 2.15，入口内除以 100
// rate_unit 缺省为 'decimal'（与规则目录的历史约定一致）。
export const DEPOSIT_RATE_UNITS = Object.freeze(['decimal', 'percent']);
export const DEPOSIT_DEFAULT_RATE_UNIT = 'decimal';
export const DEPOSIT_RULE_ID = 'deposit-interest-simple';
// 小数口径下的合理上限：200% 年利率。超过即视为单位误用（例如把 2.15 当小数传）。
export const DEPOSIT_MAX_ANNUAL_RATE_DECIMAL = 2;
// 百分比口径下的合理上限（单位 %）。
export const DEPOSIT_MAX_ANNUAL_RATE_PERCENT = 100;
export const DEPOSIT_MAX_PRINCIPAL = 1e12;
export const DEPOSIT_MAX_YEARS = 100;

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const text = value.replace(/[¥￥,\s]/g, '');
    if (!text) return Number.NaN;
    return Number(text);
  }
  return Number.NaN;
}

/**
 * 把调用方传入的 (principal, annual_rate, years, rate_unit?) 归一为规则所需的小数口径。
 * 非法输入抛 VALIDATION_ERROR 并列出字段，不静默修正、不套用默认值。
 */
export function normalizeDepositInputs(inputs = {}) {
  const rateUnit = inputs.rate_unit === undefined || inputs.rate_unit === null || inputs.rate_unit === ''
    ? DEPOSIT_DEFAULT_RATE_UNIT
    : String(inputs.rate_unit);
  if (!DEPOSIT_RATE_UNITS.includes(rateUnit)) {
    throw new ValidationError('rate_unit 只能是 decimal 或 percent', { fields: ['rate_unit'], rate_unit: inputs.rate_unit });
  }
  const principal = parseNumber(inputs.principal);
  const rawRate = parseNumber(inputs.annual_rate);
  const years = parseNumber(inputs.years);
  if (!Number.isFinite(principal) || principal <= 0 || principal > DEPOSIT_MAX_PRINCIPAL) {
    throw new ValidationError('本金必须为大于 0 的有效金额（元）', { fields: ['principal'], principal: inputs.principal });
  }
  if (!Number.isFinite(rawRate) || rawRate < 0) {
    throw new ValidationError('年利率必须为不小于 0 的有效数值', { fields: ['annual_rate'], annual_rate: inputs.annual_rate });
  }
  if (!Number.isFinite(years) || years <= 0 || years > DEPOSIT_MAX_YEARS) {
    throw new ValidationError(`期限必须为 0 到 ${DEPOSIT_MAX_YEARS} 年之间的有效数值`, { fields: ['years'], years: inputs.years });
  }
  const annualRate = rateUnit === 'percent' ? rawRate / 100 : rawRate;
  const limit = rateUnit === 'percent' ? DEPOSIT_MAX_ANNUAL_RATE_PERCENT / 100 : DEPOSIT_MAX_ANNUAL_RATE_DECIMAL;
  if (annualRate > limit) {
    throw new ValidationError(`年利率超出上限（${rateUnit === 'percent' ? `${DEPOSIT_MAX_ANNUAL_RATE_PERCENT}%` : `${DEPOSIT_MAX_ANNUAL_RATE_DECIMAL}`}），请检查单位`, {
      fields: ['annual_rate', 'rate_unit'],
      annual_rate: inputs.annual_rate,
      rate_unit: rateUnit,
      hint: rateUnit === 'percent' ? '百分数请传 rate_unit: "percent" 或换算为小数 0.0215' : '若传入的是百分数（如 2.15），请传 rate_unit: "percent"'
    });
  }
  return { rate_unit_input: rateUnit, principal, annual_rate: annualRate, years };
}

/** 只校验并归一，不构造规则结果；供业务层在调用规则目录前使用。 */
export function depositInputsForRule(inputs) {
  const normalized = normalizeDepositInputs(inputs);
  return { principal: normalized.principal, annual_rate: normalized.annual_rate, years: normalized.years };
}

export function describeDepositFormula({ principal, annual_rate: annualRate, years }) {
  return `利息 = 本金 × 年利率 × 年数 = ${principal} × ${annualRate} × ${years}`;
}

/**
 * 纯函数验算（与规则目录同一公式），用于在规则执行前后复算。
 * 小数口径、四舍五入到分。
 */
export function computeSimpleInterest({ principal, annual_rate: annualRate, years }) {
  const interest = Number((principal * annualRate * years).toFixed(2));
  return {
    interest,
    maturity_amount: Number((principal + interest).toFixed(2))
  };
}
