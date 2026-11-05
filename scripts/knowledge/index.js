import { createContainer } from '../../src/compositionRoot.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for knowledge indexing');
if (!container.modelClient.configured) throw new Error('MODEL_BASE_URL/MODEL_API_KEY/MODEL_NAME/EMBEDDING_MODEL_NAME are required');
const version = process.argv[2] || 'knowledge-demo-v1';
const expectedModel = container.config.EMBEDDING_MODEL_NAME;
const expectedDim = Number(container.config.KNOWLEDGE_VECTOR_DIM);
if (!Number.isInteger(expectedDim) || expectedDim <= 0) throw new Error('KNOWLEDGE_VECTOR_DIM must be a positive integer');

await container.db.withTransaction(async (client) => {
  // Imports take the same locks, so a version cannot change while it is indexed.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:import']);
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`wealth-demo:knowledge-version:${version}`]);

  const versionResult = await client.query('SELECT version, status, embedding_model, vector_dim FROM knowledge_versions WHERE version = $1 FOR UPDATE', [version]);
  const knowledgeVersion = versionResult.rows[0];
  if (!knowledgeVersion) throw new Error(`knowledge version not found: ${version}`);
  if (knowledgeVersion.status === 'ACTIVE' && (knowledgeVersion.embedding_model !== expectedModel || Number(knowledgeVersion.vector_dim) !== expectedDim)) {
    throw new Error('embedding model/dimension changes require a new STAGING knowledge version');
  }

  const { rows } = await client.query(
    `SELECT chunk_id, text, content_hash, embedding, vector_dims(embedding) AS actual_vector_dim
       FROM knowledge_chunks
      WHERE knowledge_version = $1
      ORDER BY chunk_id`,
    [version]
  );
  for (const row of rows) {
    const reusable = row.embedding !== null
      && knowledgeVersion.embedding_model === expectedModel
      && Number(knowledgeVersion.vector_dim) === expectedDim
      && Number(row.actual_vector_dim) === expectedDim;
    if (reusable) continue;

    const result = await container.modelClient.embed(row.text);
    if (result.model !== expectedModel) throw new Error(`embedding model mismatch: expected ${expectedModel}, got ${result.model}`);
    if (!Array.isArray(result.embedding) || result.embedding.length !== expectedDim || result.embedding.some((value) => !Number.isFinite(value))) {
      throw new Error(`embedding dimension or value mismatch: expected ${expectedDim}, got ${result.embedding?.length}`);
    }
    const updated = await client.query(
      `UPDATE knowledge_chunks
          SET embedding = $1::vector, updated_at = NOW()
        WHERE chunk_id = $2 AND knowledge_version = $3 AND content_hash = $4`,
      [JSON.stringify(result.embedding), row.chunk_id, version, row.content_hash]
    );
    if (updated.rowCount !== 1) throw new Error(`knowledge chunk changed during indexing: ${row.chunk_id}`);
  }

  const count = await client.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(embedding)::int AS embedded,
            (COUNT(*) FILTER (WHERE embedding IS NOT NULL AND vector_dims(embedding) = $2))::int AS matching_dim
       FROM knowledge_chunks
      WHERE knowledge_version = $1`,
    [version, expectedDim]
  );
  const vectors = count.rows[0];
  if (!vectors || vectors.total === 0 || vectors.total !== vectors.embedded || vectors.total !== vectors.matching_dim) {
    throw new Error('knowledge version has incomplete or dimension-mismatched vectors; it will not be activated');
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
    throw new Error('fixed vector recall regression did not return the reference chunk at Top-1');
  }

  await client.query(`UPDATE knowledge_versions SET status='RETIRED' WHERE status='ACTIVE' AND version <> $1`, [version]);
  await client.query(`UPDATE knowledge_versions SET embedding_model=$2, vector_dim=$3, status='ACTIVE', activated_at=NOW() WHERE version=$1`, [version, expectedModel, expectedDim]);
});
await container.db.close();
console.log(JSON.stringify({ status: 'ACTIVE', knowledge_version: version, embedding_model: expectedModel, vector_dim: expectedDim }));
