import { ValidationError } from '../../../platform/http/errors.js';
import { executeRule, validateRule } from '../domain/ruleCatalog.js';
import { compareBasis, selectCandidates } from '../domain/candidateRules.js';
import {
  DEPOSIT_RULE_ID,
  computeSimpleInterest,
  describeDepositFormula,
  normalizeDepositInputs
} from '../domain/depositCalculation.js';

// 只读计算入口的默认规则版本：与当前规则目录一致；调用方可用 rule_version 指定。
// 规则匹配沿用 A23 的精确匹配（rule_id + rule_version），缺版本视为不受支持。
export const DEFAULT_RULE_VERSION = 'rules-demo-v1';

export class BusinessRulesService {
  constructor({ repository, defaultRuleVersion = DEFAULT_RULE_VERSION }) {
    this.repository = repository;
    this.defaultRuleVersion = defaultRuleVersion;
  }

  async list() {
    return this.repository.listActive();
  }

  async matchAndExecute({ ruleId, ruleVersion, inputs }) {
    const rule = await this.repository.findExact(ruleId, ruleVersion);
    if (!rule) return { status: 'UNSUPPORTED_RULE', rule_id: ruleId, rule_version: ruleVersion, missing_fields: [] };
    const validation = validateRule(rule, inputs);
    if (!validation.ok) return { ...validation, rule_id: rule.rule_id, rule_version: rule.rule_version };
    return executeRule(rule, inputs);
  }

  selectCandidates(snapshot, goal, options) {
    return selectCandidates({ products: snapshot.products, customer: snapshot.customer, goal, ...options });
  }

  // A07：比较口径只由产品事实决定；不同口径不排名，缺失值不编造。
  comparison({ products, productIds }) {
    return compareBasis({ products, productIds });
  }

  /**
   * P-04 存款本息确定性计算（只读，无副作用、不写会话）。
   *
   * 签名：calculateDeposit({ principal, annual_rate, years, rate_unit?, rule_version? })
   * - principal: 元，> 0
   * - annual_rate: 年利率；rate_unit='decimal'（默认，规则目录口径）时传 0.0215；
   *                rate_unit='percent' 时传 2.15，入口内 /100
   * - years: 年，> 0
   * 数值可直接传 number 或数据源给的十进制字符串（pg NUMERIC 以字符串返回，如 "0.0215"）；
   * null / 空串 / 指数写法 / 非数字一律 400 VALIDATION_ERROR，绝不静默当作 0。
   * 返回：{ status:'MATCHED', rule_id, rule_version, calculation_id, rate_unit, inputs{numeric},
   *         inputs_echo（回显调用方单位与原始入参）, result{ principal, annual_rate(小数), years, interest,
   *         maturity_amount, formula }, source{...} }
   * 不存在该规则/版本 → { status:'UNSUPPORTED_RULE' }；输入非法 → 抛 VALIDATION_ERROR。
   */
  async calculateDeposit({ principal, annual_rate, years, rate_unit, rule_version } = {}) {
    const normalized = normalizeDepositInputs({ principal, annual_rate, years, rate_unit });
    const rule = await this.repository.findExact(DEPOSIT_RULE_ID, rule_version || this.defaultRuleVersion);
    if (!rule) {
      return {
        status: 'UNSUPPORTED_RULE',
        rule_id: DEPOSIT_RULE_ID,
        rule_version: rule_version || this.defaultRuleVersion,
        missing_fields: []
      };
    }
    const inputs = { principal: normalized.principal, annual_rate: normalized.annual_rate, years: normalized.years };
    const executed = executeRule(rule, inputs);
    // 程序化复算：规则结果必须与本模块同一公式一致，防止规则目录漂移出错误本息。
    const expected = computeSimpleInterest(inputs);
    if (executed.result.interest !== expected.interest || executed.result.maturity_amount !== expected.maturity_amount) {
      throw new ValidationError('存款计算与规则目录不一致，已停止返回结果', {
        rule_id: rule.rule_id,
        rule_version: rule.rule_version,
        expected,
        actual: { interest: executed.result.interest, maturity_amount: executed.result.maturity_amount }
      });
    }
    return {
      ...executed,
      rate_unit: normalized.rate_unit_input,
      inputs,
      // 回显保留调用方原始入参与单位口径（例如 percent 口径回显 2.15），与 inputs 的归一小数区分开。
      inputs_echo: { principal, annual_rate, years, rate_unit: normalized.rate_unit_input },
      result: { ...executed.result, formula: describeDepositFormula(inputs) }
    };
  }

  /**
   * 通用确定性规则执行（只读）。必须显式给出 rule_version，遵守 A23 精确匹配；
   * 规则不存在返回 { status:'UNSUPPORTED_RULE' }，而不是抛出“找不到规则版本”。
   */
  async executeDeterministic(ruleId, inputs, ruleVersion) {
    if (!ruleVersion) throw new ValidationError('确定性规则执行必须显式指定 rule_version（A23 精确匹配）', { fields: ['rule_version'], rule_id: ruleId });
    const rule = await this.repository.findExact(ruleId, ruleVersion);
    if (!rule) return { status: 'UNSUPPORTED_RULE', rule_id: ruleId, rule_version: ruleVersion, missing_fields: [] };
    return executeRule(rule, inputs);
  }
}
