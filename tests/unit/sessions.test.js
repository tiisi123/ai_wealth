import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

const goal = { amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' };

function makeContainer() {
  return createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', DATABASE_URL: undefined, REQUIRE_MODEL: false, INSTANCE_ID: 'session-test' } });
}

async function command(container, session, requestId, commandName, input = {}) {
  return container.sessionService.command({ sessionId: session.session_id, expectedVersion: session.version, requestId, command: commandName, input });
}

test('generic session patch cannot forge authorization, plans or candidates', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  await assert.rejects(
    container.sessionService.patch({ sessionId: session.session_id, expectedVersion: 1, requestId: '00000000-0000-4000-8000-000000000101', patch: { authorized: true, plan: { cash: 100 }, candidates: ['fund'] } }),
    (error) => error.code === 'VALIDATION_ERROR'
  );
  assert.equal((await container.sessionService.get(session.session_id)).version, 1);
});

test('validated commands generate allocation and real candidates with idempotent replay', async () => {
  const container = makeContainer();
  const created = await container.sessionService.create();
  const allocation = await command(container, created, '00000000-0000-4000-8000-000000000102', 'generate_allocation', {
    rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal
  });
  assert.equal(allocation.result.status, 'MATCHED');
  assert.deepEqual(allocation.session.state.plan, { cash: 20, bond: 50, equity: 20, protection: 10 });
  assert.equal(allocation.session.state.candidates.length, 0);

  const candidates = await command(container, allocation.session, '00000000-0000-4000-8000-000000000103', 'generate_candidates');
  assert.ok(candidates.result.candidate_ids.length > 0);
  assert.ok(candidates.result.candidate_ids.every((id) => candidates.session.state.candidates.includes(id)));
  const replay = await command(container, allocation.session, '00000000-0000-4000-8000-000000000103', 'generate_candidates');
  assert.deepEqual(replay, candidates);
  assert.equal((await container.sessionService.get(created.session_id)).version, candidates.session.version);
});

test('comparison requires two real products and revocation clears downstream state', async () => {
  const container = makeContainer();
  const created = await container.sessionService.create();
  await assert.rejects(command(container, created, '00000000-0000-4000-8000-000000000104', 'save_comparison', { product_ids: ['fund'] }), /2–3/);
  const compared = await command(container, created, '00000000-0000-4000-8000-000000000105', 'save_comparison', { product_ids: ['fund', 'wealth'] });
  assert.equal(compared.session.state.compareSaved, true);
  const revoked = await command(container, compared.session, '00000000-0000-4000-8000-000000000106', 'set_authorization', { authorized: false });
  assert.equal(revoked.session.state.authorized, false);
  assert.equal(revoked.session.state.plan, null);
  assert.deepEqual(revoked.session.state.candidates, []);
  assert.equal(revoked.session.state.compareSaved, false);
});

test('goal changes invalidate plans, candidates and comparisons', async () => {
  const container = makeContainer();
  const created = await container.sessionService.create();
  const allocation = await command(container, created, '00000000-0000-4000-8000-000000000107', 'generate_allocation', {
    rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal
  });
  const candidates = await command(container, allocation.session, '00000000-0000-4000-8000-000000000108', 'generate_candidates');
  const changed = await container.sessionService.patch({
    sessionId: created.session_id,
    expectedVersion: candidates.session.version,
    requestId: '00000000-0000-4000-8000-000000000109',
    patch: { goal: { ...goal, purpose: '退休储备' } }
  });
  assert.equal(changed.state.plan, null);
  assert.deepEqual(changed.state.candidates, []);
  assert.equal(changed.state.compareSaved, false);
});

test('page-only selection sync command is removed while candidate generation remains', async () => {
  const container = makeContainer();
  const created = await container.sessionService.create();
  await assert.rejects(
    command(container, created, '00000000-0000-4000-8000-000000000110', 'sync_selection'),
    (error) => error.code === 'VALIDATION_ERROR'
  );
  const allocation = await command(container, created, '00000000-0000-4000-8000-000000000111', 'generate_allocation', {
    rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', goal
  });
  const candidates = await command(container, allocation.session, '00000000-0000-4000-8000-000000000112', 'generate_candidates');
  assert.ok(candidates.result.candidate_ids.length > 0);
});
