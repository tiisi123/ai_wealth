import { NotFoundError } from '../../../platform/http/errors.js';
import { executeRule, validateRule } from '../domain/ruleCatalog.js';
import { selectCandidates } from '../domain/candidateRules.js';

export class BusinessRulesService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async list() {
    return this.repository.listActive();
  }

  async matchAndExecute({ ruleId, ruleVersion, inputs }) {
    const rule = await this.repository.find(ruleId, ruleVersion);
    if (!rule) return { status: 'UNSUPPORTED_RULE', rule_id: ruleId, rule_version: ruleVersion, missing_fields: [] };
    const validation = validateRule(rule, inputs);
    if (!validation.ok) return { ...validation, rule_id: rule.rule_id, rule_version: rule.rule_version };
    return executeRule(rule, inputs);
  }

  async executeDeterministic(ruleId, inputs) {
    const rule = await this.repository.find(ruleId);
    if (!rule) throw new NotFoundError(`Rule ${ruleId} not found`);
    return executeRule(rule, inputs);
  }

  selectCandidates(snapshot, goal, options) {
    return selectCandidates({ products: snapshot.products, customer: snapshot.customer, goal, ...options });
  }
}
