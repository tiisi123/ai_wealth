import test from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../src/compositionRoot.js';

function makeContainer(generateResult) {
  const modelClient = {
    configured: true,
    async embed() { return { embedding: Array.from({ length: 1536 }, () => 0.01), model: 'embedding-test', latency_ms: 1 }; },
    async generate() { return { ...generateResult, model: 'generation-test', finish_reason: 'stop', latency_ms: 2 }; }
  };
  return createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', AI_MODE: 'real', DATABASE_URL: undefined, REQUIRE_MODEL: false, INSTANCE_ID: 'ai-test', EMBEDDING_MODEL_NAME: 'embedding-test', MODEL_NAME: 'generation-test', KNOWLEDGE_VECTOR_DIM: 1536 }, modelClient });
}

test('research generation returns only evidence-backed citations', async () => {
  const container = makeContainer({ text: '基于本次证据的研究回答', citations: ['chunk-a500-001'], risks: ['仅供参考'] });
  const session = await container.sessionService.create();
  const result = await container.aiOrchestrator.generate({ sessionId: session.session_id, sessionVersion: session.version, requestId: '00000000-0000-4000-8000-000000000011', taskType: 'research_qa', input: { question: 'A500 波动原因' } });
  assert.equal(result.text, '基于本次证据的研究回答');
  assert.deepEqual(result.evidence.chunk_ids, ['chunk-a500-001']);
  assert.equal(result.model, 'generation-test');
});

test('rule matching executes the stored action and ignores model supplied action values', async () => {
  const container = makeContainer({ rule_id: 'allocation-balanced-r3', rule_version: 'rules-demo-v1', extracted_inputs: { amount: '500000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资', authorized: true }, confidence: 0.98, text: '已匹配规则', citations: ['rule:allocation-balanced-r3'], risks: [] });
  const session = await container.sessionService.create();
  const result = await container.aiOrchestrator.generate({ sessionId: session.session_id, sessionVersion: session.version, requestId: '00000000-0000-4000-8000-000000000012', taskType: 'rule_match', input: { amount: '500000', term: '3–5 年', risk: 'R3 平衡型', purpose: '教育金储备', liquidity: '大部分可长期投资' } });
  assert.equal(result.status, 'MATCHED');
  assert.deepEqual(result.result, { cash: 20, bond: 50, equity: 20, protection: 10 });
  assert.equal(result.extracted_inputs.authorized, true);
});

test('AI input cannot override server-owned customer fields', async () => {
  const container = makeContainer({ text: 'ignored', citations: ['chunk-a500-001'], risks: [] });
  const session = await container.sessionService.create();
  await assert.rejects(
    container.aiOrchestrator.generate({ sessionId: session.session_id, sessionVersion: session.version, requestId: '00000000-0000-4000-8000-000000000013', taskType: 'assistant_qa', input: { question: '组合', customer_id: 'someone-else' } }),
    (error) => error.code === 'VALIDATION_ERROR'
  );
});

test('AI rejects fabricated prefixed citations', async () => {
  const container = makeContainer({ text: '伪造引用', citations: ['data:not-exist', 'calc:fabricated'], risks: [] });
  const session = await container.sessionService.create();
  await assert.rejects(
    container.aiOrchestrator.generate({ sessionId: session.session_id, sessionVersion: session.version, requestId: '00000000-0000-4000-8000-000000000014', taskType: 'research_qa', input: { question: 'A500 波动原因' } }),
    (error) => error.code === 'VALIDATION_ERROR' && error.details.invalid_citations.length === 2
  );
});

test('successful AI request replay does not call the model twice', async () => {
  let generationCalls = 0;
  const modelClient = {
    configured: true,
    async embed() { return { embedding: Array.from({ length: 1536 }, () => 0.01), model: 'embedding-test', latency_ms: 1 }; },
    async generate() {
      generationCalls += 1;
      return { text: '可重放回答', citations: ['chunk-a500-001'], risks: [], model: 'generation-test', finish_reason: 'stop', latency_ms: 2 };
    }
  };
  const container = createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', AI_MODE: 'real', DATABASE_URL: undefined, REQUIRE_MODEL: false, EMBEDDING_MODEL_NAME: 'embedding-test', KNOWLEDGE_VECTOR_DIM: 1536 }, modelClient });
  const session = await container.sessionService.create();
  const args = { sessionId: session.session_id, sessionVersion: session.version, requestId: '00000000-0000-4000-8000-000000000015', taskType: 'research_qa', input: { question: 'A500 波动原因' } };
  const first = await container.aiOrchestrator.generate(args);
  const replay = await container.aiOrchestrator.generate(args);
  assert.deepEqual(replay, first);
  assert.equal(generationCalls, 1);
});

test('AI response is rejected when the session advances during generation', async () => {
  let container;
  const modelClient = {
    configured: true,
    async embed() { return { embedding: Array.from({ length: 1536 }, () => 0.01), model: 'embedding-test', latency_ms: 1 }; },
    async generate() {
      await container.sessionService.patch({ sessionId: session.session_id, expectedVersion: 1, requestId: '00000000-0000-4000-8000-000000000017', patch: { lastQuestion: '新的用户问题' } });
      return { text: '旧回答', citations: ['chunk-a500-001'], risks: [], model: 'generation-test', finish_reason: 'stop', latency_ms: 2 };
    }
  };
  container = createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', AI_MODE: 'real', DATABASE_URL: undefined, REQUIRE_MODEL: false, EMBEDDING_MODEL_NAME: 'embedding-test', KNOWLEDGE_VECTOR_DIM: 1536 }, modelClient });
  const session = await container.sessionService.create();
  await assert.rejects(
    container.aiOrchestrator.generate({ sessionId: session.session_id, sessionVersion: 1, requestId: '00000000-0000-4000-8000-000000000016', taskType: 'research_qa', input: { question: 'A500 波动原因' } }),
    (error) => error.code === 'VERSION_CONFLICT'
  );
});
