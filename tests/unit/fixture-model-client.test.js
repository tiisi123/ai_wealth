import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';
import { FixtureModelClient } from '../../src/components/ai-orchestration/infrastructure/fixtureModelClient.js';
import { FIXTURE_EMBEDDING_MODEL, FIXTURE_GENERATION_MODEL, FIXTURE_VECTOR_DIM } from '../../src/fixtures/fixtureVector.js';

function makeContainer(overrides = {}) {
  return createContainer({
    config: {
      NODE_ENV: 'test',
      DATA_MODE: 'fixture',
      AI_MODE: 'fixture',
      DATABASE_URL: undefined,
      REQUIRE_MODEL: false,
      INSTANCE_ID: 'fixture-ai-test',
      MODEL_BASE_URL: undefined,
      MODEL_API_KEY: undefined,
      KNOWLEDGE_VECTOR_DIM: 1536,
      ...overrides
    }
  });
}

test('AI_MODE=fixture wires the deterministic client and fills safe model names', () => {
  const container = makeContainer();
  assert.ok(container.modelClient instanceof FixtureModelClient);
  assert.equal(container.modelClient.configured, true);
  assert.equal(container.config.MODEL_NAME, FIXTURE_GENERATION_MODEL);
  assert.equal(container.config.EMBEDDING_MODEL_NAME, FIXTURE_EMBEDDING_MODEL);
  assert.equal(container.config.MODEL_CONFIGURED, true);
  assert.equal(container.config.KNOWLEDGE_VECTOR_DIM, FIXTURE_VECTOR_DIM);
});

test('fixture mode forces 1536 dimensions even when .env sets another value', () => {
  const container = makeContainer({ KNOWLEDGE_VECTOR_DIM: 1024 });
  assert.equal(container.config.KNOWLEDGE_VECTOR_DIM, 1536);
});

test('production refuses AI_MODE=fixture', () => {
  assert.throws(
    () => makeContainer({ NODE_ENV: 'production', DATA_MODE: 'database' }),
    /production forbids AI_MODE=fixture/
  );
});

test('fixture embed satisfies the orchestrator dimension and model checks', async () => {
  const container = makeContainer();
  const result = await container.modelClient.embed('A500 波动原因');
  assert.equal(result.embedding.length, FIXTURE_VECTOR_DIM);
  assert.equal(result.model, FIXTURE_EMBEDDING_MODEL);
  assert.ok(result.embedding.every((value) => Number.isFinite(value)));
});

test('research_qa closes end-to-end with evidence-backed citations and execution_mode', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const result = await container.aiOrchestrator.generate({
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: '00000000-0000-4000-8000-000000000101',
    taskType: 'research_qa',
    input: { question: 'A500' }
  });
  assert.equal(result.execution_mode, 'fixture');
  assert.equal(result.model, FIXTURE_GENERATION_MODEL);
  assert.ok(result.citations.length > 0);
  assert.deepEqual(result.evidence.chunk_ids, ['chunk-a500-001']);
  assert.ok(result.text.includes('演示桩'));
});

test('rule_match returns a catalog rule and the backend still executes the action', async () => {
  const container = makeContainer();
  const session = await container.sessionService.create();
  const result = await container.aiOrchestrator.generate({
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: '00000000-0000-4000-8000-000000000102',
    taskType: 'rule_match',
    input: {
      amount: '¥500,000', term: '3–5 年', risk: 'R3 平衡型',
      purpose: '教育金储备', liquidity: '大部分可长期投资'
    }
  });
  assert.equal(result.execution_mode, 'fixture');
  assert.equal(result.status, 'MATCHED');
  assert.equal(result.rule_id, 'allocation-balanced-r3');
  assert.deepEqual(result.result, { cash: 20, bond: 50, equity: 20, protection: 10 });
  assert.deepEqual(result.citations, ['rule:allocation-balanced-r3']);
});

test('replaying the same request_id does not generate twice', async () => {
  const container = makeContainer();
  let calls = 0;
  const original = container.modelClient.generate.bind(container.modelClient);
  container.modelClient.generate = async (args) => { calls += 1; return original(args); };
  const session = await container.sessionService.create();
  const args = {
    sessionId: session.session_id,
    sessionVersion: session.version,
    requestId: '00000000-0000-4000-8000-000000000103',
    taskType: 'research_qa',
    input: { question: 'A500' }
  };
  const first = await container.aiOrchestrator.generate(args);
  const replay = await container.aiOrchestrator.generate(args);
  assert.deepEqual(replay, first);
  assert.equal(calls, 1);
});

test('stub never invents citations outside the evidence whitelist', async () => {
  const container = makeContainer();
  const output = await container.modelClient.generate({
    system: 'ignored',
    user: JSON.stringify({
      task_type: 'research_qa',
      input: { question: 'A500' },
      product_ids: [],
      source_ids: [],
      evidence: {
        structured_facts: { holdings: [], products: [] },
        calculations: [],
        knowledge_chunks: [{ chunk_id: 'chunk-a500-001' }],
        rule_candidates: []
      }
    })
  });
  assert.deepEqual(output.citations, ['chunk-a500-001']);
  assert.equal(output.execution_mode, 'fixture');
  assert.ok(Array.isArray(output.risks));
});
