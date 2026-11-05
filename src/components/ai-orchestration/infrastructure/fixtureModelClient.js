import { fixtureEmbedding, FIXTURE_VECTOR_DIM } from '../../../fixtures/fixtureVector.js';

const RISKS = ['演示桩输出，非真实模型结果', '内容仅供流程演示，不构成投资建议'];

function evidenceIds(evidence) {
  const facts = evidence?.structured_facts || {};
  const data = [
    facts.customer?.data_id,
    ...(facts.holdings || []).map((holding) => holding.data_id),
    ...(facts.products || []).map((product) => product.data_id)
  ].filter(Boolean);
  return {
    data,
    calculations: (evidence?.calculations || []).map((calculation) => calculation.calculation_id).filter(Boolean),
    chunks: (evidence?.knowledge_chunks || []).map((chunk) => chunk.chunk_id).filter(Boolean),
    rules: (evidence?.rule_candidates || []).filter((rule) => rule.enabled !== false)
  };
}

function pickAllocationRule(rules, input) {
  const allocations = rules.filter((rule) => rule.applicable_scenario === 'asset_allocation');
  const balanced = allocations.find((rule) => rule.rule_id === 'allocation-balanced-r3');
  const liquid = allocations.find((rule) => rule.rule_id === 'allocation-liquid-r2');
  if (/R1|R2/.test(String(input?.risk || '')) && liquid) return liquid;
  return balanced || allocations[0] || null;
}

function citationsFor(taskType, ids, selectedRule) {
  if (taskType === 'rule_match') {
    return selectedRule ? [`rule:${selectedRule.rule_id}`] : [];
  }
  const picked = [];
  const add = (id) => { if (id && !picked.includes(id)) picked.push(id); };
  for (const id of ids.chunks.slice(0, 2)) add(id);
  for (const id of ids.data.slice(0, 2)) add(id);
  for (const id of ids.calculations.slice(0, 2)) add(id);
  for (const rule of ids.rules.slice(0, 1)) add(`rule:${rule.rule_id}`);
  return picked;
}

/**
 * Deterministic replacement for OpenAICompatibleClient in W1.
 *
 * It still receives the exact same `{ system, user }` contract, so every
 * orchestrator guard (citation whitelist, rule catalog, session version,
 * evidence sufficiency, 409 replay) keeps running unchanged. It only removes
 * the external model/Embedding dependency.
 */
export class FixtureModelClient {
  constructor({ config }) {
    this.config = config;
  }

  get configured() {
    return true;
  }

  async embed(input) {
    const dim = Number(this.config.KNOWLEDGE_VECTOR_DIM) || FIXTURE_VECTOR_DIM;
    return {
      embedding: fixtureEmbedding(input, dim),
      model: this.config.EMBEDDING_MODEL_NAME,
      latency_ms: 1
    };
  }

  async generate({ user }) {
    let payload = {};
    try {
      payload = JSON.parse(user);
    } catch {
      payload = {};
    }
    const taskType = payload.task_type || 'unknown';
    const input = payload.input || {};
    const ids = evidenceIds(payload.evidence);
    const selectedRule = taskType === 'rule_match' ? pickAllocationRule(ids.rules, input) : null;
    const citations = citationsFor(taskType, ids, selectedRule);
    const text = `[演示桩/fixture] ${taskType}：基于本次证据包（${citations.length} 项引用）生成的确定性示例内容，不代表真实模型输出，不构成投资建议。`;

    const output = {
      text,
      citations,
      risks: [...RISKS],
      ...(taskType === 'rule_match' ? {
        rule_id: selectedRule?.rule_id ?? null,
        rule_version: selectedRule?.rule_version ?? null,
        extracted_inputs: { ...input, authorized: true },
        confidence: selectedRule ? 0.99 : 0
      } : {})
    };

    return {
      ...output,
      execution_mode: 'fixture',
      model: this.config.MODEL_NAME,
      finish_reason: 'stop',
      latency_ms: 1
    };
  }
}
