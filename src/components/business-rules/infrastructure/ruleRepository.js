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

  async find(ruleId, version) {
    const all = await this.listActive();
    return all.find((rule) => rule.rule_id === ruleId && (!version || rule.rule_version === version)) || null;
  }
}
