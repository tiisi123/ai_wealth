import { knowledgeChunks, KNOWLEDGE_VERSION } from '../../../fixtures/demoData.js';

const MIN_RELEVANCE_SCORE = 0.2;

export class KnowledgeRepository {
  constructor({ db, dataMode, config = {} }) {
    this.db = db;
    this.dataMode = dataMode;
    this.config = config;
  }

  async status({ knowledgeVersion } = {}) {
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      if (knowledgeVersion && knowledgeVersion !== KNOWLEDGE_VERSION) return { status: 'NOT_READY', knowledge_version: knowledgeVersion, document_count: 0, chunk_count: 0, vector_count: 0 };
      return { status: 'ACTIVE', knowledge_version: KNOWLEDGE_VERSION, document_count: 4, chunk_count: knowledgeChunks.length, vector_count: knowledgeChunks.length, vector_dim: Number(this.config.KNOWLEDGE_VECTOR_DIM || 1536), embedding_model: this.config.EMBEDDING_MODEL_NAME || 'fixture-disabled' };
    }
    const params = knowledgeVersion ? [knowledgeVersion] : [];
    const { rows } = await this.db.query(
      `SELECT kv.version AS knowledge_version, kv.status, kv.vector_dim, kv.embedding_model,
              COUNT(DISTINCT kd.document_id)::int AS document_count,
              COUNT(DISTINCT kc.chunk_id)::int AS chunk_count,
              (COUNT(DISTINCT kc.chunk_id) FILTER (WHERE kc.embedding IS NOT NULL))::int AS vector_count
         FROM knowledge_versions kv
         LEFT JOIN knowledge_documents kd ON kd.knowledge_version = kv.version
         LEFT JOIN knowledge_chunks kc
           ON kc.document_id = kd.document_id AND kc.knowledge_version = kd.knowledge_version
        WHERE ${knowledgeVersion ? 'kv.version = $1' : "kv.status = 'ACTIVE'"}
        GROUP BY kv.version, kv.status, kv.vector_dim, kv.embedding_model
        ORDER BY kv.activated_at DESC NULLS LAST LIMIT 1`,
      params
    );
    return rows[0] || { status: 'NOT_READY', knowledge_version: knowledgeVersion || null, document_count: 0, chunk_count: 0, vector_count: 0 };
  }

  async list({ limit = 50, knowledgeVersion } = {}) {
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      return knowledgeVersion && knowledgeVersion !== KNOWLEDGE_VERSION ? [] : knowledgeChunks.slice(0, limit);
    }
    const { rows } = await this.db.query(
      `SELECT kc.chunk_id, kc.document_id, kd.title, kc.source_id, kc.product_id, kd.source_timestamp, kc.page, kc.text,
              kc.knowledge_version, kc.updated_at
         FROM knowledge_chunks kc
         JOIN knowledge_documents kd
           ON kd.document_id = kc.document_id AND kd.knowledge_version = kc.knowledge_version
         JOIN knowledge_versions kv ON kv.version = kc.knowledge_version
        WHERE (($1::text IS NULL AND kv.status = 'ACTIVE') OR kv.version = $1)
        ORDER BY kd.title, kc.page LIMIT $2`,
      [knowledgeVersion || null, limit]
    );
    return rows;
  }

  async search({ vector, query, limit = 4, productIds = [], sourceIds = [], documentIds = [], knowledgeVersion } = {}) {
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      if (knowledgeVersion && knowledgeVersion !== KNOWLEDGE_VERSION) return [];
      const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
      return knowledgeChunks
        .filter((chunk) => !sourceIds.length || sourceIds.includes(chunk.source_id))
        .filter((chunk) => !productIds.length || !chunk.product_id || productIds.includes(chunk.product_id))
        .filter((chunk) => !documentIds.length || documentIds.includes(chunk.document_id))
        .map((chunk) => ({ ...chunk, score: terms.length ? terms.filter((term) => `${chunk.title} ${chunk.text}`.toLowerCase().includes(term)).length / terms.length : chunk.score }))
        .filter((chunk) => chunk.score >= MIN_RELEVANCE_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const params = [JSON.stringify(vector), limit, knowledgeVersion || null];
    const filters = [];
    for (const [column, values] of [['product_id', productIds], ['source_id', sourceIds], ['document_id', documentIds]]) {
      if (values.length) {
        params.push(values);
        filters.push(`AND kc.${column} = ANY($${params.length}::text[])`);
      }
    }
    params.push(MIN_RELEVANCE_SCORE);
    const scoreParam = params.length;
    const { rows } = await this.db.query(
      `SELECT kc.chunk_id, kc.document_id, kd.title, kc.source_id, kc.product_id, kd.source_timestamp, kc.page, kc.text,
              kc.knowledge_version, 1 - (kc.embedding <=> $1::vector) AS score
         FROM knowledge_chunks kc
         JOIN knowledge_documents kd
           ON kd.document_id = kc.document_id AND kd.knowledge_version = kc.knowledge_version
         JOIN knowledge_versions kv ON kv.version = kc.knowledge_version
        WHERE kc.embedding IS NOT NULL
          AND (($3::text IS NULL AND kv.status = 'ACTIVE') OR kv.version = $3)
          ${filters.join(' ')}
          AND 1 - (kc.embedding <=> $1::vector) >= $${scoreParam}
        ORDER BY kc.embedding <=> $1::vector LIMIT $2`,
      params
    );
    return rows;
  }
}
