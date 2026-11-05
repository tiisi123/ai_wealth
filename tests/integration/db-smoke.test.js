import test from 'node:test';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';
import { applyFixtureKnowledge } from '../../scripts/seed/fixtureKnowledge.js';

// Explicit opt-in: a developer .env may define DATABASE_URL, so an env-presence
// check alone would make `npm test` try to hit a non-running local database.
const runDbTests = process.env.W1_DB_SMOKE === 'true';
const skip = runDbTests ? false : 'requires W1_DB_SMOKE=true and a migrated/seeded PostgreSQL';

let container;
let app;

function ensureApp() {
  if (!app) {
    container = createContainer();
    app = createApp(container);
  }
  return app;
}

test.after(async () => {
  await container?.db.close();
});

test('migration created vector(1536), hnsw index and both migration records', { skip }, async () => {
  ensureApp();
  const column = await container.db.query(
    `SELECT format_type(a.atttypid, a.atttypmod) AS column_type
       FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
      WHERE c.relname = 'knowledge_chunks' AND a.attname = 'embedding'`
  );
  assert.equal(column.rows[0]?.column_type, 'vector(1536)');
  const index = await container.db.query(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'knowledge_chunks' AND indexdef ILIKE '%hnsw%'`
  );
  assert.ok(index.rowCount >= 1, 'hnsw index is missing');
  const migrations = await container.db.query('SELECT filename FROM schema_migrations ORDER BY filename');
  assert.ok(migrations.rowCount >= 2);
});

test('exactly one ACTIVE data version and one ACTIVE knowledge version', { skip }, async () => {
  ensureApp();
  const data = await container.db.query(`SELECT version FROM data_versions WHERE status = 'ACTIVE'`);
  const knowledge = await container.db.query(`SELECT version, embedding_model, vector_dim FROM knowledge_versions WHERE status = 'ACTIVE'`);
  assert.equal(data.rowCount, 1);
  assert.equal(data.rows[0].version, 'demo-2026-09-28-v1');
  assert.equal(knowledge.rowCount, 1);
  assert.equal(knowledge.rows[0].version, 'knowledge-demo-v1');
  assert.equal(knowledge.rows[0].embedding_model, container.config.EMBEDDING_MODEL_NAME);
  assert.equal(Number(knowledge.rows[0].vector_dim), 1536);
});

test('fixture knowledge status is ACTIVE with a vector for every chunk', { skip }, async () => {
  ensureApp();
  const status = await container.knowledgeService.status();
  assert.equal(status.status, 'ACTIVE');
  assert.ok(status.chunk_count > 0);
  assert.equal(status.vector_count, status.chunk_count);
  assert.equal(Number(status.vector_dim), 1536);
  assert.equal(status.embedding_model, container.config.EMBEDDING_MODEL_NAME);
});

test('re-running the W1 fixture seed step is idempotent', { skip }, async () => {
  ensureApp();
  const before = await container.db.query(`SELECT count(*)::int AS n FROM knowledge_versions WHERE status='ACTIVE'`);
  await applyFixtureKnowledge(container);
  const after = await container.db.query(`SELECT count(*)::int AS n FROM knowledge_versions WHERE status='ACTIVE'`);
  assert.equal(before.rows[0].n, 1);
  assert.equal(after.rows[0].n, 1);
});

test('/ready is green in W1 database + fixture AI mode', { skip }, async () => {
  const response = await request(ensureApp()).get('/ready').expect(200);
  assert.equal(response.body.ready, true);
  assert.equal(response.body.data_mode, 'database');
  assert.equal(response.body.ai_mode, 'fixture');
  assert.equal(response.body.checks.knowledge, true);
});

test('session is really persisted in PostgreSQL, not node memory', { skip }, async () => {
  const created = await request(ensureApp()).post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;
  const stored = await container.db.query(
    `SELECT session_id, customer_id, version FROM app_sessions WHERE session_id = $1`,
    [sessionId]
  );
  assert.equal(stored.rowCount, 1);
  assert.equal(stored.rows[0].customer_id, 'customer-001');
  assert.equal(stored.rows[0].version, 1);
});

test('research_qa retrieves chunks through real pgvector and reports fixture mode', { skip }, async () => {
  const created = await request(ensureApp()).post('/api/sessions').send({}).expect(201);
  const response = await request(app).post('/api/ai/generate').send({
    session_id: created.body.session.session_id,
    session_version: created.body.session.version,
    request_id: randomUUID(),
    task_type: 'research_qa',
    input: { question: '降息对固收+可能有什么影响？' },
    product_ids: [],
    source_ids: []
  }).expect(200);
  assert.equal(response.body.execution_mode, 'fixture');
  assert.ok(response.body.evidence.chunk_ids.length > 0);
  assert.ok(response.body.citations.length > 0);
  assert.equal(response.body.model, container.config.MODEL_NAME);
});
