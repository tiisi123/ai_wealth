import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { customer, products, holdings, knowledgeChunks, DATA_VERSION, RULE_VERSION, KNOWLEDGE_VERSION } from '../../src/fixtures/demoData.js';
import { rules } from '../../src/fixtures/rules.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const seed = fs.readFileSync(path.join(projectRoot, 'db/seeds/001_demo.sql'), 'utf8');

function section(table) {
  const marker = `INSERT INTO ${table}`;
  const start = seed.indexOf(marker);
  assert.notEqual(start, -1, `seed is missing ${table}`);
  const next = seed.indexOf('INSERT INTO', start + marker.length);
  return seed.slice(start, next === -1 ? seed.length : next);
}

function firstIds(text) {
  return [...text.matchAll(/^\s*\('([^']+)'/gm)].map((match) => match[1]);
}

function holdingRows(text) {
  return [...text.matchAll(/^\s*\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+)/gm)]
    .map((match) => ({ id: match[1], product_id: match[3], amount: Number(match[5]), return_rate: Number(match[6]) }));
}

const sorted = (values) => [...values].sort();

test('product ids in JS fixtures and SQL seed are identical', () => {
  assert.deepEqual(sorted(firstIds(section('products'))), sorted(products.map((product) => product.id)));
});

test('holding ids, product links, amounts and return rates are identical', () => {
  const sqlRows = holdingRows(section('holdings'));
  assert.deepEqual(sorted(sqlRows.map((row) => row.id)), sorted(holdings.map((row) => row.id)));
  for (const fixtureHolding of holdings) {
    const sqlRow = sqlRows.find((row) => row.id === fixtureHolding.id);
    assert.ok(sqlRow, `seed is missing ${fixtureHolding.id}`);
    assert.equal(sqlRow.product_id, fixtureHolding.product_id);
    assert.equal(sqlRow.amount, Number(fixtureHolding.amount));
    assert.equal(sqlRow.return_rate, Number(fixtureHolding.return_rate));
  }
});

test('rule ids and knowledge chunk ids are identical', () => {
  assert.deepEqual(sorted(firstIds(section('rules'))), sorted(rules.map((rule) => rule.rule_id)));
  assert.deepEqual(sorted(firstIds(section('knowledge_chunks'))), sorted(knowledgeChunks.map((chunk) => chunk.chunk_id)));
});

test('version identifiers are shared by both data sources', () => {
  for (const version of [DATA_VERSION, RULE_VERSION, KNOWLEDGE_VERSION]) {
    assert.ok(seed.includes(`'${version}'`), `seed is missing version ${version}`);
  }
  assert.ok(seed.includes(`'${customer.id}'`));
});

test('SQL seed keeps STAGING knowledge so W2 real indexing is not short-circuited', () => {
  const knowledgeVersions = section('knowledge_versions');
  assert.match(knowledgeVersions, /'STAGING'/);
  assert.match(knowledgeVersions, /'pending-real-embedding'/);
  assert.doesNotMatch(knowledgeVersions, /'ACTIVE'[\s\S]*activated_at=NOW\(\)/);
});

test('fixture vectors are produced by the shared generator, not pasted into the seed', () => {
  const chunkSection = section('knowledge_chunks');
  assert.ok(!/\[[0-9.,]{200,}\]/.test(chunkSection), 'seed must not embed raw 1536-value vectors');
});
