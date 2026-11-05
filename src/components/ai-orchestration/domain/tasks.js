import { ValidationError } from '../../../platform/http/errors.js';

export const TASK_TYPES = [
  'rule_match',
  'assistant_qa',
  'research_qa',
  'diagnosis_explain',
  'candidate_explain',
  'product_explain',
  'report_summary',
  'writing_draft'
];

export const TASK_TYPE_SET = new Set(TASK_TYPES);

export function assertTaskType(taskType) {
  if (!TASK_TYPE_SET.has(taskType)) {
    throw new ValidationError('unsupported task_type', { allowed: TASK_TYPES, received: taskType });
  }
}

export function taskRequiresStructuredFacts(taskType) {
  return ['assistant_qa', 'diagnosis_explain', 'candidate_explain', 'product_explain', 'rule_match'].includes(taskType);
}

export function sanitizeTaskInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('input must be an object');
  const forbidden = new Set(['session_id', 'request_id', 'customer_id', 'customer_context', 'holdings', 'products', 'system_prompt', 'model', 'vector', 'embedding', 'authorized']);

  function copy(value, path = 'input') {
    if (Array.isArray(value)) return value.map((item, index) => copy(item, `${path}[${index}]`));
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      if (forbidden.has(key)) throw new ValidationError('input contains server-owned fields', { fields: [`${path}.${key}`] });
      result[key] = copy(nested, `${path}.${key}`);
    }
    return result;
  }

  return copy(input);
}

export function systemPromptFor(taskType) {
  return [
    '你是财富智服演示系统中的受控内容生成模块。',
    '只能使用证据上下文回答，必须区分事实、计算和观点。不得修改产品事实、风险等级、规则动作或业务状态；不得输出交易指令、收益承诺、核保或理赔结论。',
    `当前任务类型：${taskType}。输出严格为 JSON。内容生成任务返回 {"text": string, "citations": string[], "risks": string[]}。`,
    'citations 必须逐项使用本次证据中的精确 ID：知识用 chunk_id，结构化事实用 data_id，计算用 calculation_id，规则用 rule:rule_id；不得创造 ID，内容生成至少引用一项。',
    taskType === 'rule_match' ? '规则匹配任务返回 {"rule_id": string|null, "rule_version": string|null, "extracted_inputs": object, "confidence": number, "text": string, "citations": string[], "risks": string[]}。只能从 rule_candidates 选择 rule_id。' : ''
  ].filter(Boolean).join('\n');
}
