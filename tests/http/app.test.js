import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

function makeApp() {
  const container = createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', AI_MODE: 'real', DATABASE_URL: undefined, REQUIRE_MODEL: false, INSTANCE_ID: 'test', MODEL_BASE_URL: undefined, MODEL_API_KEY: undefined, MODEL_NAME: undefined, EMBEDDING_MODEL_NAME: undefined, KNOWLEDGE_VECTOR_DIM: 1536 } });
  return { app: createApp(container), container };
}

test('health exposes contract versions without secrets', async () => {
  const { app } = makeApp();
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.api_version, 'v1');
  assert.equal(response.body.frontend_contract_version, '2026-11-02.1');
  assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'MODEL_API_KEY'), false);
});

test('demo data does not accept a browser-supplied customer identity', async () => {
  const { app } = makeApp();
  const response = await request(app).get('/api/demo-data?customer_id=someone-else').expect(200);
  assert.equal(response.body.customer.id, 'customer-001');
});

test('fixture readiness and shared session optimistic locking work', async () => {
  const { app } = makeApp();
  await request(app).get('/ready').expect(200).expect((response) => assert.equal(response.body.ready, true));
  const created = await request(app).post('/api/sessions').send({}).expect(201);
  const session = created.body.session;
  const updated = await request(app).patch(`/api/sessions/${session.session_id}`).send({ expected_version: 1, request_id: '00000000-0000-4000-8000-000000000001', patch: { compareSet: ['fund', 'wealth'] } }).expect(200);
  assert.equal(updated.body.session.version, 2);
  await request(app).patch(`/api/sessions/${session.session_id}`).send({ expected_version: 1, request_id: '00000000-0000-4000-8000-000000000002', patch: { compareSet: ['fund'] } }).expect(409);
});

test('AI endpoint reports unavailable model rather than returning a canned answer', async () => {
  const { app } = makeApp();
  const created = await request(app).post('/api/sessions').send({}).expect(201);
  await request(app).post('/api/ai/generate').send({ session_id: created.body.session.session_id, session_version: created.body.session.version, request_id: '00000000-0000-4000-8000-000000000003', task_type: 'assistant_qa', input: { question: '帮我看组合' } }).expect(503).expect((response) => assert.equal(response.body.error.code, 'DEPENDENCY_UNAVAILABLE'));
});

test('HTTP session commands enforce the allocation-to-candidates flow and revoke sensitive data', async () => {
  const { app } = makeApp();
  const created = await request(app).post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;
  const goal = { amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' };
  const allocation = await request(app).post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 1,
    request_id: '00000000-0000-4000-8000-000000000201',
    command: 'generate_allocation',
    input: { rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal }
  }).expect(200);
  const candidates = await request(app).post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: allocation.body.session.version,
    request_id: '00000000-0000-4000-8000-000000000202',
    command: 'generate_candidates', input: {}
  }).expect(200);
  assert.ok(candidates.body.session.state.candidates.length > 0);
  const revoked = await request(app).post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: candidates.body.session.version,
    request_id: '00000000-0000-4000-8000-000000000203',
    command: 'set_authorization', input: { authorized: false }
  }).expect(200);
  assert.equal(revoked.body.session.state.plan, null);
  const data = await request(app).get(`/api/demo-data?session_id=${sessionId}`).expect(200);
  assert.deepEqual(data.body.holdings, []);
});

test('retired page-only HTTP endpoints are removed without affecting shared APIs', async () => {
  const { app } = makeApp();
  await request(app).get('/api/rules').expect(404);
  await request(app).get('/api/health').expect(200);
  await request(app).get('/api/knowledge').expect(200);
});

test('database mode fails readiness cleanly when the shared database is absent', async () => {
  const container = createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'database', DATABASE_URL: undefined, REQUIRE_MODEL: true, INSTANCE_ID: 'test-db', KNOWLEDGE_VECTOR_DIM: 1536 } });
  const app = createApp(container);
  const response = await request(app).get('/ready').expect(503);
  assert.equal(response.body.ready, false);
  assert.equal(response.body.checks.database, false);
});
