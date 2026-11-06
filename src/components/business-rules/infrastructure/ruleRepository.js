import { rules as fixtureRules } from '../../../fixtures/rules.js';

export class RuleRepository {
  constructor({ db, dataMode }) {
    this.db = db;
    this.dataMode = dataMode;
  }

  async listActive() {
    if (this.dataMode === 'fixture' || !this.db.enabled) return fixtureRules;
    const { rows } = await this.db.query(
      `SELECT rule_id, rule_version, name, applicable_scenario, required_inputs, conditions, action, enabled
         FROM rules WHERE enabled = TRUE ORDER BY rule_id`
    );
    return rows;
  }

  // A23：规则匹配必须同时命中 rule_id 与 rule_version；缺版本或版本不符都视为不受支持，
  // 不允许回退到“目录中同名规则的最新版本”静默执行。
  async find(ruleId, version) {
    const all = await this.listActive();
    return all.find((rule) => rule.rule_id === ruleId && (!version || rule.rule_version === version)) || null;
  }

  async findExact(ruleId, version) {
    if (!ruleId || !version) return null;
    const all = await this.listActive();
    return all.find((rule) => rule.rule_id === ruleId && rule.rule_version === version) || null;
  }
}
