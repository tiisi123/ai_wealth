import { fixtureVectorLiteral } from '../../src/fixtures/fixtureVector.js';

export const W1_KNOWLEDGE_VERSION = 'knowledge-demo-v1';

/**
 * W1-only seed step. W1 and W2 share the same SQL seed; only AI_MODE=fixture
 * injects deterministic stand-in vectors and activates the knowledge version.
 * The real `scripts/knowledge/index.js` path (real Embedding, STAGING -> ACTIVE
 * promotion, import audit) is untouched and remains a W2 pipeline step.
 */
export async function applyFixtureKnowledge(container) {
  if (container.config.AI_MODE !== 'fixture') return null;

  const version = W1_KNOWLEDGE_VERSION;
  const model = container.config.EMBEDDING_MODEL_NAME;
  const dim = Number(container.config.KNOWLEDGE_VECTOR_DIM);
  if (!model || !Number.isInteger(dim) || dim <= 0) {
    throw new Error('AI_MODE=fixture requires EMBEDDING_MODEL_NAME and a positive KNOWLEDGE_VECTOR_DIM');
  }

  await container.db.withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`wealth-demo:knowledge-version:${version}`]);
    const { rows } = await client.query(
      `SELECT chunk_id, text FROM knowledge_chunks WHERE knowledge_version = $1 ORDER BY chunk_id`,
      [version]
    );
    if (!rows.length) throw new Error(`no knowledge chunks found for ${version}`);

    for (const row of rows) {
      await client.query(
        `UPDATE knowledge_chunks SET embedding = $1::vector, updated_at = NOW()
          WHERE chunk_id = $2 AND knowledge_version = $3`,
        [fixtureVectorLiteral(row.text, dim), row.chunk_id, version]
      );
    }

    const counts = await client.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(embedding)::int AS embedded,
              (COUNT(*) FILTER (WHERE embedding IS NOT NULL AND vector_dims(embedding) = $2))::int AS matching_dim
         FROM knowledge_chunks WHERE knowledge_version = $1`,
      [version, dim]
    );
    const vectorCounts = counts.rows[0];
    if (!vectorCounts || vectorCounts.total === 0 || vectorCounts.total !== vectorCounts.embedded || vectorCounts.total !== vectorCounts.matching_dim) {
      throw new Error('fixture knowledge vectors are incomplete or dimension-mismatched; version will not be activated');
    }

    const regression = await client.query(
      `WITH reference AS (
         SELECT chunk_id, embedding FROM knowledge_chunks
          WHERE knowledge_version = $1 ORDER BY chunk_id LIMIT 1
       )
       SELECT kc.chunk_id, r.chunk_id AS reference_chunk_id
         FROM knowledge_chunks kc CROSS JOIN reference r
        WHERE kc.knowledge_version = $1
        ORDER BY kc.embedding <=> r.embedding
        LIMIT 1`,
      [version]
    );
    if (!regression.rowCount || regression.rows[0].chunk_id !== regression.rows[0].reference_chunk_id) {
      throw new Error('fixture vector Top-1 self-recall regression failed; version will not be activated');
    }

    await client.query(`UPDATE knowledge_versions SET status='RETIRED' WHERE status='ACTIVE' AND version <> $1`, [version]);
    await client.query(
      `UPDATE knowledge_versions
          SET status='ACTIVE', embedding_model=$2, vector_dim=$3, activated_at=NOW()
        WHERE version=$1`,
      [version, model, dim]
    );
  });

  container.logger.info({ version, model, dim }, 'W1 fixture knowledge version activated');
  return { version, model, dim };
}
