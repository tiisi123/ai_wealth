import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fixtureEmbedding,
  fixtureVectorLiteral,
  FIXTURE_VECTOR_DIM,
  FIXTURE_EMBEDDING_MODEL
} from '../../src/fixtures/fixtureVector.js';

function cosine(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

test('fixture embedding is deterministic, finite and 1536-dimensional', () => {
  const first = fixtureEmbedding('A500 季报与风险说明');
  const second = fixtureEmbedding('A500 季报与风险说明');
  assert.deepEqual(first, second);
  assert.equal(first.length, FIXTURE_VECTOR_DIM);
  assert.ok(first.every((value) => Number.isFinite(value)));
});

test('different text produces a different vector', () => {
  assert.notDeepEqual(fixtureEmbedding('固收+策略月报'), fixtureEmbedding('存款计息规则'));
});

test('any query/chunk pair clears the 0.2 relevance floor used by pgvector search', () => {
  const chunks = [
    'A500 近期波动主要来自行业权重调整',
    '降息预期可能支持债券部分表现',
    '投保前需确认既往症除外责任',
    '到期利息按本金乘以年利率和年数计算'
  ].map((text) => fixtureEmbedding(text));
  const queries = ['降息对固收+可能有什么影响？', 'fund', 'task_type'].map((text) => fixtureEmbedding(text));
  for (const query of queries) {
    for (const chunk of chunks) {
      assert.ok(1 - (1 - cosine(query, chunk)) >= 0.2, 'cosine similarity must clear the relevance floor');
      assert.ok(cosine(query, chunk) >= 0.2);
    }
  }
});

test('reference chunk is its own strict Top-1 (fixed recall regression)', () => {
  const texts = ['chunk-a', 'chunk-b', 'chunk-c', 'chunk-d'];
  const vectors = texts.map((text) => fixtureEmbedding(text));
  const reference = vectors[0];
  const ranked = texts
    .map((text, index) => ({ text, distance: 1 - cosine(reference, vectors[index]) }))
    .sort((left, right) => left.distance - right.distance);
  assert.equal(ranked[0].text, 'chunk-a');
  assert.ok(Math.abs(ranked[0].distance) < 1e-9, 'self-distance is zero up to float rounding');
  assert.ok(ranked[1].distance > 1e-4, 'other chunks are separated well beyond float noise');
});

test('vector literal is valid pgvector array syntax', () => {
  const literal = fixtureVectorLiteral('doc-deposit-rules');
  assert.match(literal, /^\[-?\d+(\.\d+)?(,-?\d+(\.\d+)?)*\]$/);
  assert.equal(literal.slice(1, -1).split(',').length, FIXTURE_VECTOR_DIM);
});

test('fixture embedding model identifier is stable', () => {
  assert.equal(FIXTURE_EMBEDDING_MODEL, 'fixture-deterministic-1536');
  assert.equal(FIXTURE_VECTOR_DIM, 1536);
});
