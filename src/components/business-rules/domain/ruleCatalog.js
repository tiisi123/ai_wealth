import { createHash } from 'node:crypto';
import { ValidationError } from '../../../platform/http/errors.js';

export function normalizeRisk(value) {
  const match = String(value || '').match(/R([1-5])/i);
  return match ? Number(match[1]) : null;
}

function normalizedText(value) {
  return String(value || '').replace(/\s/g, '');
}

export function validateRule(rule, inputs) {
  if (!rule || !rule.enabled) {
    return { ok: false, status: 'UNSUPPORTED_RULE', missing_fields: [], reason: 'rule_disabled_or_missing' };
  }
  const missing_fields = rule.required_inputs.filter((field) => {
    const value = inputs?.[field];
    return value === undefined || value === null || value === '';
  });
  if (missing_fields.length) {
    return { ok: false, status: 'NEED_CONFIRMATION', missing_fields, reason: 'required_inputs_missing' };
  }
  if (rule.rule_id.startsWith('allocation-')) {
    if (inputs.authorized !== true) {
      return { ok: false, status: 'NEED_CONFIRMATION', missing_fields: ['authorized'], reason: 'authorization_required' };
    }
    const amount = Number(String(inputs.amount).replace(/[¥,\s]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, status: 'NEED_CONFIRMATION', missing_fields: ['amount'], reason: 'amount_must_be_positive' };
    }
    const risk = normalizeRisk(inputs.risk);
    if (rule.rule_id === 'allocation-balanced-r3') {
      if (risk !== 3) return { ok: false, status: 'UNSUPPORTED_RULE', missing_fields: [], reason: 'risk_mismatch' };
      if (!['3–5年', '3-5年', '3—5年'].includes(normalizedText(inputs.term))) {
        return { ok: false, status: 'UNSUPPORTED_RULE', missing_fields: [], reason: 'term_mismatch' };
      }
    }
    if (rule.rule_id === 'allocation-liquid-r2') {
      if (!risk || risk > 2) return { ok: false, status: 'UNSUPPORTED_RULE', missing_fields: [], reason: 'risk_mismatch' };
      if (!/一年内|1年/.test(normalizedText(inputs.liquidity))) {
        return { ok: false, status: 'UNSUPPORTED_RULE', missing_fields: [], reason: 'liquidity_mismatch' };
      }
    }
  }
  return { ok: true, status: 'MATCHED', missing_fields: [] };
}

export function executeRule(rule, inputs) {
  const validation = validateRule(rule, inputs);
  if (!validation.ok) return { ...validation, rule_id: rule?.rule_id, rule_version: rule?.rule_version };
  const calculationId = `calc-${rule.rule_id}-${createHash('sha256').update(JSON.stringify({ rule_version: rule.rule_version, inputs })).digest('hex').slice(0, 16)}`;

  if (rule.rule_id === 'deposit-interest-simple') {
    const principal = Number(inputs.principal);
    const annual_rate = Number(inputs.annual_rate);
    const years = Number(inputs.years);
    if (![principal, annual_rate, years].every(Number.isFinite) || principal <= 0 || annual_rate < 0 || years <= 0) {
      throw new ValidationError('存款测算输入必须为有效的正数', { fields: ['principal', 'annual_rate', 'years'] });
    }
    const interest = Number((principal * annual_rate * years).toFixed(2));
    return {
      status: 'MATCHED',
      rule_id: rule.rule_id,
      rule_version: rule.rule_version,
      result: { principal, annual_rate, years, interest, maturity_amount: Number((principal + interest).toFixed(2)) },
      calculation_id: calculationId
    };
  }

  const percentages = Object.values(rule.action).filter((value) => typeof value === 'number');
  if (percentages.length && percentages.reduce((sum, value) => sum + value, 0) !== 100) {
    throw new ValidationError('配置规则比例必须合计 100%', { rule_id: rule.rule_id });
  }
  return {
    status: 'MATCHED',
    rule_id: rule.rule_id,
    rule_version: rule.rule_version,
    result: { ...rule.action },
    calculation_id: calculationId
  };
}
