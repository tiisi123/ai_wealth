import { InsufficientEvidenceError } from '../../../platform/http/errors.js';

export const knowledgeTaskTypes = new Set([
  'assistant_qa',
  'research_qa',
  'diagnosis_explain',
  'candidate_explain',
  'product_explain',
  'report_summary',
  'writing_draft'
]);

export function requiresKnowledge(taskType) {
  return knowledgeTaskTypes.has(taskType);
}

export function assertKnowledgeEvidence(chunks, taskType) {
  if (requiresKnowledge(taskType) && (!chunks || chunks.length === 0)) {
    throw new InsufficientEvidenceError('当前授权范围内没有足够的知识片段，已停止生成', { task_type: taskType });
  }
}

export function sanitizeChunk(chunk) {
  return {
    chunk_id: chunk.chunk_id,
    document_id: chunk.document_id,
    title: chunk.title,
    source_id: chunk.source_id,
    product_id: chunk.product_id,
    source_timestamp: chunk.source_timestamp,
    data_as_of: chunk.data_as_of || chunk.source_timestamp,
    page: chunk.page,
    text: chunk.text,
    score: Number(chunk.score ?? 0),
    knowledge_version: chunk.knowledge_version
  };
}
