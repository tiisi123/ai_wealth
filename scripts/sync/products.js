import fs from 'node:fs/promises';
import { createContainer } from '../../src/compositionRoot.js';

const METRICS = {
  latest_return: { column: 'latest_return', numeric: true },
  drawdown: { column: 'drawdown', numeric: true },
  annual_rate: { column: 'annual_rate', numeric: true },
  fee: { column: 'fee', numeric: true, nonNegative: true },
  coverage: { column: 'coverage', numeric: true, nonNegative: true },
  annual_premium: { column: 'annual_premium', numeric: true, nonNegative: true },
  risk: { column: 'risk', text: true },
  liquidity: { column: 'liquidity', text: true },
  sale_status: { column: 'sale_status', text: true }
};
const CRITICAL_METRICS = new Set(['risk', 'liquidity', 'sale_status']);

function validateUpdate(update, index) {
  if (!update || typeof update !== 'object' || Array.isArray(update)) throw new Error(`updates[${index}] must be an object`);
  for (const field of ['product_id', 'metric_name', 'source_id', 'source_timestamp']) {
    if (typeof update[field] !== 'string' || !update[field].trim()) throw new Error(`updates[${index}].${field} must be a non-empty string`);
  }
  if (!Number.isFinite(Date.parse(update.source_timestamp))) throw new Error(`updates[${index}].source_timestamp must be a valid timestamp`);
  const metric = METRICS[update.metric_name];
  if (!metric) throw new Error(`updates[${index}].metric_name is not allowed: ${update.metric_name}`);
  if (metric.numeric && (typeof update.value !== 'number' || !Number.isFinite(update.value))) {
    throw new Error(`updates[${index}].value must be a finite number for ${update.metric_name}`);
  }
  if (metric.nonNegative && update.value < 0) throw new Error(`updates[${index}].value must be non-negative for ${update.metric_name}`);
  if (metric.text && (typeof update.value !== 'string' || !update.value.trim())) {
    throw new Error(`updates[${index}].value must be a non-empty string for ${update.metric_name}`);
  }
  if (update.metric_name === 'sale_status' && !['ON_SALE', 'OFF_SALE'].includes(update.value)) {
    throw new Error(`updates[${index}].value must be ON_SALE or OFF_SALE`);
  }
  if (update.metric_name === 'risk' && !(/R[1-5]/i.test(update.value) || update.value === '保障')) {
    throw new Error(`updates[${index}].value must contain R1-R5 or 保障`);
  }
  if (update.quality_status !== undefined && !['VERIFIED', 'PENDING', 'STALE', 'FAILED'].includes(update.quality_status)) {
    throw new Error(`updates[${index}].quality_status is not allowed`);
  }
}

async function invalidateSessions(client, productId) {
  const result = await client.query(
    `UPDATE app_sessions
        SET state_json = state_json || jsonb_build_object(
              'candidates', '[]'::jsonb,
              'candidateCalculation', 'null'::jsonb,
              'compareSet', '[]'::jsonb,
              'compareSaved', FALSE,
              'careSubmitted', FALSE,
              'researchUsedInCandidates', FALSE,
              'selectPoolSynced', FALSE
            ),
            version = version + 1,
            updated_at = NOW()
      WHERE ((jsonb_typeof(state_json->'candidates') = 'array' AND (
                state_json->'candidates' ? $1
                OR state_json->'candidates' @> $2::jsonb
                OR state_json->'candidates' @> $3::jsonb
              ))
             OR (jsonb_typeof(state_json->'compareSet') = 'array' AND (
                state_json->'compareSet' ? $1
                OR state_json->'compareSet' @> $2::jsonb
                OR state_json->'compareSet' @> $3::jsonb
              )))`,
    [productId, JSON.stringify([{ product_id: productId }]), JSON.stringify([{ id: productId }])]
  );
  return result.rowCount;
}

const filePath = process.argv[2];
if (!filePath) throw new Error('usage: npm run sync:products -- path/to/updates.json');
const updates = JSON.parse(await fs.readFile(filePath, 'utf8'));
if (!Array.isArray(updates)) throw new Error('product update file must be an array');
updates.forEach(validateUpdate);
const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for product sync');

let applied = 0;
let stale = 0;
let sessionsInvalidated = 0;
await container.db.withTransaction(async (client) => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:product-sync']);
  for (const update of updates) {
    const metric = METRICS[update.metric_name];
    const qualityStatus = update.quality_status || 'VERIFIED';
    await client.query(
      `INSERT INTO product_updates(product_id,metric_name,source_id,source_timestamp,value,quality_status)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       ON CONFLICT (product_id,metric_name,source_id,source_timestamp)
       DO UPDATE SET value=EXCLUDED.value,quality_status=EXCLUDED.quality_status,received_at=NOW()`,
      [update.product_id, update.metric_name, update.source_id, update.source_timestamp, JSON.stringify(update.value), qualityStatus]
    );

    const target = await client.query(
      `SELECT p.product_id, p.data_version, p.${metric.column} AS current_value
         FROM products p
         JOIN data_versions dv ON dv.version = p.data_version AND dv.status = 'ACTIVE'
        WHERE p.product_id = $1
        FOR UPDATE OF p`,
      [update.product_id]
    );
    if (!target.rowCount) {
      stale += 1;
      continue;
    }
    const product = target.rows[0];
    const newerMetric = await client.query(
      `SELECT 1 FROM product_updates
        WHERE product_id = $1 AND metric_name = $2 AND source_timestamp > $3
        LIMIT 1`,
      [update.product_id, update.metric_name, update.source_timestamp]
    );
    if (newerMetric.rowCount) {
      stale += 1;
      continue;
    }
    const result = await client.query(
      `UPDATE products
          SET ${metric.column} = $1,
              source_id = CASE WHEN source_timestamp <= $3 THEN $2 ELSE source_id END,
              source_timestamp = GREATEST(source_timestamp, $3::timestamptz),
              quality_status = CASE WHEN source_timestamp <= $3 THEN $4 ELSE quality_status END,
              ingested_at = NOW()
        WHERE product_id = $5 AND data_version = $6
        RETURNING product_id`,
      [update.value, update.source_id, update.source_timestamp, qualityStatus, update.product_id, product.data_version]
    );
    if (!result.rowCount) {
      stale += 1;
      continue;
    }
    applied += 1;
    if (CRITICAL_METRICS.has(update.metric_name) && product.current_value !== update.value) {
      sessionsInvalidated += await invalidateSessions(client, update.product_id);
    }
  }
});
await container.db.close();
console.log(JSON.stringify({ status: 'SUCCEEDED', received: updates.length, applied, stale, sessions_invalidated: sessionsInvalidated }));
