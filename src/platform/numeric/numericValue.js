import { DataValueError } from '../http/errors.js';

// PostgreSQL 的 NUMERIC 列经 pg 驱动以**字符串**返回（例如 "168420.00"、"0.0215"），
// 而 fixture 数据是 number。只读计算入口的确定性公式（利息、权重、集中度、收益估算）
// 必须在这两种表现之上得到同一结果，因此服务入口统一经这里把数据源数值归一为 number。
//
// 规则（不做任何“宽容修正”）：
// - number：有限值直接返回；NaN / ±Infinity 视为非法。
// - string：仅接受可无损解析的十进制写法（允许正负号与小数，允许首尾空白）；
//   空串、指数写法 1e3、"0x10"、"Infinity"、" 1 000" 等一律非法。
// - null / undefined / 布尔 / 对象：一律非法（缺失不等于 0）。
// 非法值抛 400 VALIDATION_ERROR（DataValueError）并标注 field / reason，绝不静默当作 0。

// 十进制文本：可选符号 + 整数部分或 .小数 部分；不接受指数、十六进制、千分位。
const DECIMAL_TEXT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export const NUMERIC_INVALID_REASONS = Object.freeze({
  MISSING: 'missing',
  NOT_A_NUMBER: 'not_a_number',
  NOT_FINITE: 'not_finite',
  BELOW_MINIMUM: 'below_minimum',
  ABOVE_MAXIMUM: 'above_maximum'
});

function describe(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return typeof value;
}

function parseStrict(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== 'string') return Number.NaN;
  const text = value.trim();
  if (!text) return Number.NaN;
  if (!DECIMAL_TEXT.test(text)) return Number.NaN;
  return Number(text);
}

/**
 * 严格解析数据源数值。null/undefined 走 missing，其余非法走 not_a_number/not_finite。
 * 返回 { ok, value?, reason? }，不抛错，供需要区分“缺失”与“非法”的调用方使用。
 */
export function inspectNumeric(value) {
  if (value === null || value === undefined) return { ok: false, reason: NUMERIC_INVALID_REASONS.MISSING };
  const parsed = parseStrict(value);
  if (!Number.isFinite(parsed)) {
    return {
      ok: false,
      reason: typeof value === 'string' || typeof value === 'number'
        ? NUMERIC_INVALID_REASONS.NOT_A_NUMBER
        : NUMERIC_INVALID_REASONS.NOT_FINITE
    };
  }
  return { ok: true, value: parsed };
}

/**
 * 必填数值：非法即抛 400 VALIDATION_ERROR。
 * options.field：错误详情里的字段名（如 'principal'、'holdings.amount'）。
 */
export function toFiniteNumber(value, { field = null } = {}) {
  const inspected = inspectNumeric(value);
  if (!inspected.ok) {
    const label = field || '数值';
    const message = inspected.reason === NUMERIC_INVALID_REASONS.MISSING
      ? `${label} 缺失，无法计算`
      : `${label} 不是有效的有限数值`;
    throw new DataValueError(message, {
      fields: field ? [field] : [],
      field,
      reason: inspected.reason,
      received: describe(value)
    });
  }
  return inspected.value;
}

/**
 * 带闭区间约束的必填数值：[minimum, maximum] 之外的有限数值同样拒绝，
 * 防止超出业务口径的脏数据进入确定性计算。
 */
export function toBoundedNumber(value, { field = null, minimum, maximum } = {}) {
  const parsed = toFiniteNumber(value, { field });
  if (minimum !== undefined && parsed < minimum) {
    throw new DataValueError(`${field || '数值'} 小于允许下限 ${minimum}`, {
      fields: field ? [field] : [],
      field,
      reason: NUMERIC_INVALID_REASONS.BELOW_MINIMUM,
      received: describe(value),
      minimum
    });
  }
  if (maximum !== undefined && parsed > maximum) {
    throw new DataValueError(`${field || '数值'} 超出允许上限 ${maximum}`, {
      fields: field ? [field] : [],
      field,
      reason: NUMERIC_INVALID_REASONS.ABOVE_MAXIMUM,
      received: describe(value),
      maximum
    });
  }
  return parsed;
}

/**
 * 可选数值（例如 holdings.return_rate 可以为 NULL）：
 * 缺失（null/undefined/空串）→ null；存在但非法 → 400 VALIDATION_ERROR，绝不当作 null 掩盖脏数据。
 */
export function toOptionalNumber(value, { field = null } = {}) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return toFiniteNumber(value, { field });
}
