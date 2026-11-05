import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePackage } from '../../scripts/import/validate.js';
import { createContainer } from '../../src/compositionRoot.js';

function validPackage() {
  return {
    data_version: 'demo-v2',
    as_of: '2026-11-02T09:00:00+08:00',
    customers: [{ customer_id: 'customer-001', display_name: '测试客户', risk_level: 'R3', authorized: true }],
    products: [{ product_id: 'fund', name: '测试基金', type: '基金', risk: 'R3', source_id: 'test-source', source_timestamp: '2026-11-02T09:00:00+08:00' }],
    holdings: [{ holding_id: 'holding-001', customer_id: 'customer-001', product_id: 'fund', amount: 1000 }],
    documents: [{ document_id: 'doc-1', title: '测试报告', source_id: 'research', chunks: [{ chunk_id: 'chunk-1', text: '真实材料' }] }]
  };
}

test('import validation accepts a complete coherent package', () => {
  assert.deepEqual(validatePackage(validPackage()), []);
});

test('import validation rejects empty snapshots and dangling references', () => {
  const empty = validPackage();
  empty.products = [];
  empty.holdings = [];
  assert.ok(validatePackage(empty).some((error) => error.path === 'products'));
  const dangling = validPackage();
  dangling.holdings[0].product_id = 'missing';
  assert.ok(validatePackage(dangling).some((error) => error.path === 'holdings[0]'));
});

test('import validation rejects duplicate chunks and empty document text', () => {
  const value = validPackage();
  value.documents[0].chunks.push({ chunk_id: 'chunk-1', text: '' });
  const errors = validatePackage(value);
  assert.ok(errors.some((error) => error.reason === 'duplicate chunk_id'));
  assert.ok(errors.some((error) => error.reason === 'chunk_id and non-empty text required'));
});

test('production cannot start with fixture state and database vectors must match the migration', () => {
  assert.throws(() => createContainer({ config: { NODE_ENV: 'production', DATA_MODE: 'fixture', AI_MODE: 'real' } }), /DATA_MODE=database/);
  assert.throws(() => createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'database', AI_MODE: 'real', KNOWLEDGE_VECTOR_DIM: 768 } }), /KNOWLEDGE_VECTOR_DIM=1536/);
  assert.doesNotThrow(() => createContainer({ config: { NODE_ENV: 'test', DATA_MODE: 'fixture', AI_MODE: 'real', KNOWLEDGE_VECTOR_DIM: 1024 } }));
});
