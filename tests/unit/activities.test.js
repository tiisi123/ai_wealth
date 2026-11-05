import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

function makeContainer() {
  return createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'real',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'activities-test'
    }
  });
}

const command = (container, sessionId, version, requestId, input) =>
  container.sessionService.command({ sessionId, expectedVersion: version, requestId, command: 'record_activity', input });

test('record_activity writes a server-owned activity record', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const result = await command(container, session.session_id, session.version, '00000000-0000-4000-8000-000000001001', { kind: 'task-center', title: '任务中心' });

  assert.equal(result.result.status, 'APPLIED');
  assert.match(result.result.activity_id, /^[0-9a-f-]{36}$/i);
  assert.match(result.result.created_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(result.result.kind, 'task-center');
  assert.equal(result.result.data_version, 'demo-2026-09-28-v1');
  assert.equal(result.session.version, 2);
  assert.equal(result.session.state.activities.length, 1);
});

test('record_activity rejects kinds outside the whitelist', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  await assert.rejects(
    command(container, session.session_id, session.version, '00000000-0000-4000-8000-000000001002', { kind: 'download' }),
    (error) => error.code === 'VALIDATION_ERROR'
  );
});

test('browser cannot write activities through the generic PATCH', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  await assert.rejects(
    container.sessionService.patch({
      sessionId: session.session_id,
      expectedVersion: session.version,
      requestId: '00000000-0000-4000-8000-000000001003',
      patch: { activities: [{ activity_id: 'forged', kind: 'save', created_at: 'x' }] }
    }),
    (error) => error.code === 'VALIDATION_ERROR'
  );
});

test('same request_id does not append a second activity', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const args = { sessionId: session.session_id, expectedVersion: session.version, requestId: '00000000-0000-4000-8000-000000001004', command: 'record_activity', input: { kind: 'brief' } };
  const first = await container.sessionService.command(args);
  const replay = await container.sessionService.command(args);
  assert.deepEqual(replay, first);
  const current = await container.sessionService.get(session.session_id);
  assert.equal(current.state.activities.length, 1);
});

test('revoking authorization clears activity records', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const written = await command(container, session.session_id, session.version, '00000000-0000-4000-8000-000000001005', { kind: 'save' });
  const revoked = await container.sessionService.command({
    sessionId: session.session_id,
    expectedVersion: written.session.version,
    requestId: '00000000-0000-4000-8000-000000001006',
    command: 'set_authorization',
    input: { authorized: false }
  });
  assert.equal(revoked.session.state.authorized, false);
  assert.deepEqual(revoked.session.state.activities, []);
});
