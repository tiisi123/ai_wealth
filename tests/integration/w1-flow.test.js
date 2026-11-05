import test from 'node:test';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createContainer } from '../../src/compositionRoot.js';
import { createApp } from '../../src/app.js';

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

const GOAL = {
  amount: '¥500,000',
  term: '3–5 年',
  risk: 'R3 平衡型',
  purpose: '教育金储备',
  liquidity: '大部分可长期投资'
};

// ai_requests.request_id is a global PK: a fixed id collides with the prior
// run's rows (different session_id) and surfaces as 409 on re-run.
const requestId = () => randomUUID();

test('W1 mobile/PC main flow closes against real PostgreSQL with fixture AI', { skip }, async () => {
  const api = request(ensureApp());

  const created = await api.post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;
  assert.equal(created.body.session.version, 1);

  const ruleMatch = await api.post('/api/ai/generate').send({
    session_id: sessionId,
    session_version: 1,
    request_id: requestId(),
    task_type: 'rule_match',
    input: { question: '请匹配配置规则', ...GOAL },
    product_ids: [],
    source_ids: []
  }).expect(200);
  assert.equal(ruleMatch.body.execution_mode, 'fixture');
  assert.equal(ruleMatch.body.status, 'MATCHED');
  assert.equal(ruleMatch.body.rule_id, 'allocation-balanced-r3');

  const allocation = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 1,
    request_id: requestId(),
    command: 'generate_allocation',
    input: { rule_id: ruleMatch.body.rule_id, rule_version: ruleMatch.body.rule_version, goal: GOAL }
  }).expect(200);
  assert.equal(allocation.body.result.status, 'MATCHED');
  assert.equal(allocation.body.session.version, 2);

  const candidates = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 2,
    request_id: requestId(),
    command: 'generate_candidates',
    input: {}
  }).expect(200);
  const generated = candidates.body.session.state.candidates;
  assert.ok(generated.length >= 2, 'candidate generation must return comparable products');

  const refreshed = await api.get(`/api/sessions/${sessionId}`).expect(200);
  assert.equal(refreshed.body.session.version, 3);
  assert.deepEqual(refreshed.body.session.state.candidates, generated);
  assert.ok(refreshed.body.session.state.plan);

  const comparison = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 3,
    request_id: requestId(),
    command: 'save_comparison',
    input: { product_ids: generated.slice(0, 2) }
  }).expect(200);
  assert.equal(comparison.body.session.state.compareSaved, true);

  const care = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 4,
    request_id: requestId(),
    command: 'submit_care',
    input: {}
  }).expect(200);
  assert.equal(care.body.result.status, 'WAITING_FOR_MANAGER');
  assert.equal(care.body.session.version, 5);
});

test('stale version returns 409 and replaying a request_id does not advance state', { skip }, async () => {
  const api = request(ensureApp());
  const created = await api.post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;

  const replayId = requestId();
  const first = await api.patch(`/api/sessions/${sessionId}`).send({
    expected_version: 1, request_id: replayId, patch: { lastQuestion: '组合怎么样' }
  }).expect(200);
  assert.equal(first.body.session.version, 2);

  await api.patch(`/api/sessions/${sessionId}`).send({
    expected_version: 1, request_id: requestId(), patch: { lastQuestion: '过期的提问' }
  }).expect(409);

  const replay = await api.patch(`/api/sessions/${sessionId}`).send({
    expected_version: 1, request_id: replayId, patch: { lastQuestion: '组合怎么样' }
  }).expect(200);
  assert.equal(replay.body.session.version, 2);
  assert.deepEqual(replay.body.session, first.body.session);
});

test('revoking authorization clears plan, candidates and comparison', { skip }, async () => {
  const api = request(ensureApp());
  const created = await api.post('/api/sessions').send({}).expect(201);
  const sessionId = created.body.session.session_id;

  const allocation = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 1,
    request_id: requestId(),
    command: 'generate_allocation',
    input: { rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal: GOAL }
  }).expect(200);
  assert.equal(allocation.body.session.version, 2);

  await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 2, request_id: requestId(), command: 'generate_candidates', input: {}
  }).expect(200);

  const revoked = await api.post(`/api/sessions/${sessionId}/commands`).send({
    expected_version: 3,
    request_id: requestId(),
    command: 'set_authorization',
    input: { authorized: false }
  }).expect(200);
  assert.equal(revoked.body.session.state.authorized, false);
  assert.equal(revoked.body.session.state.plan, null);
  assert.deepEqual(revoked.body.session.state.candidates, []);
  assert.equal(revoked.body.session.state.compareSaved, false);

  await api.post(`/api/ai/generate`).send({
    session_id: sessionId,
    session_version: revoked.body.session.version,
    request_id: requestId(),
    task_type: 'assistant_qa',
    input: { question: '还能生成吗' },
    product_ids: [],
    source_ids: []
  }).expect(422);
});
