import { assertKnowledgeEvidence, sanitizeChunk } from '../domain/knowledge.js';

export class KnowledgeService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async status(options) {
    return this.repository.status(options);
  }

  async list(options) {
    return (await this.repository.list(options)).map(sanitizeChunk);
  }

  async retrieve({ taskType, query, vector, productIds, sourceIds, documentIds, knowledgeVersion, limit = 4 }) {
    const chunks = (await this.repository.search({ query, vector, productIds, sourceIds, documentIds, knowledgeVersion, limit })).map(sanitizeChunk);
    assertKnowledgeEvidence(chunks, taskType);
    return chunks;
  }
}
