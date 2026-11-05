import crypto from 'node:crypto';
import { createContainer } from '../../src/compositionRoot.js';
import { readPackage, validatePackage } from './validate.js';

const filePath = process.argv[2];
if (!filePath) throw new Error('usage: npm run import:run -- path/to/package.json');
const { value, hash } = await readPackage(filePath);
const errors = validatePackage(value);
if (errors.length) {
  console.error(JSON.stringify({ valid: false, errors }, null, 2));
  process.exit(1);
}

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for import');
const runId = crypto.randomUUID();
const knowledgeVersion = value.knowledge_version || `knowledge-${value.data_version}`;
const documents = value.documents || [];

// Objects are content-addressed and written before any database row references them.
// A database failure can leave an unreferenced object, but cannot damage ACTIVE data.
for (const document of documents) {
  if (typeof document.content === 'string') {
    const contentHash = crypto.createHash('sha256').update(document.content).digest('hex');
    const storagePath = `${encodeURIComponent(knowledgeVersion)}/${encodeURIComponent(document.document_id)}/${contentHash}.txt`;
    await container.documentStore.write(storagePath, document.content);
    document.storage_uri = storagePath;
  }
}

await container.db.withTransaction(async (client) => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:import']);
  if (documents.length) {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`wealth-demo:knowledge-version:${knowledgeVersion}`]);
  }

  const prior = await client.query(`SELECT run_id FROM import_runs WHERE kind = 'business-data' AND source_hash = $1 AND status = 'SUCCEEDED'`, [hash]);
  if (prior.rowCount) return;

  const existingData = await client.query('SELECT status FROM data_versions WHERE version = $1 FOR UPDATE', [value.data_version]);
  if (existingData.rowCount) {
    const status = existingData.rows[0].status;
    throw new Error(`data_version already exists (${status}); use a new version instead of mixing snapshots`);
  }
  if (documents.length) {
    const existingKnowledge = await client.query('SELECT status FROM knowledge_versions WHERE version = $1 FOR UPDATE', [knowledgeVersion]);
    if (existingKnowledge.rowCount) {
      const status = existingKnowledge.rows[0].status;
      throw new Error(`knowledge_version already exists (${status}); use a new version instead of modifying it in place`);
    }
  }

  await client.query(`INSERT INTO import_runs(run_id, kind, source_name, source_hash, status) VALUES ($1, 'business-data', $2, $3, 'STARTED')`, [runId, filePath, hash]);
  await client.query(`INSERT INTO data_versions(version, source_name, status, source_timestamp, quality_status) VALUES ($1, $2, 'STAGING', $3, 'PENDING')`, [value.data_version, filePath, value.as_of]);

  for (const customer of value.customers) {
    await client.query(`INSERT INTO customers(customer_id, display_name, risk_level, region, authorized, data_as_of, data_version) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (customer_id) DO UPDATE SET display_name=EXCLUDED.display_name,risk_level=EXCLUDED.risk_level,region=EXCLUDED.region,authorized=EXCLUDED.authorized,data_as_of=EXCLUDED.data_as_of,data_version=EXCLUDED.data_version,updated_at=NOW()`, [customer.customer_id, customer.display_name, customer.risk_level, customer.region || null, Boolean(customer.authorized), value.as_of, value.data_version]);
  }
  for (const product of value.products) {
    await client.query(`INSERT INTO products(product_id,data_version,name,type,risk,role,latest_return,drawdown,annual_rate,fee,coverage,annual_premium,liquidity,sale_status,source_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [product.product_id, value.data_version, product.name, product.type, product.risk, product.role || null, product.latest_return ?? null, product.drawdown ?? null, product.annual_rate ?? null, product.fee ?? null, product.coverage ?? null, product.annual_premium ?? null, product.liquidity || null, product.sale_status || 'ON_SALE', product.source_id, product.source_timestamp]);
  }
  for (const holding of value.holdings) {
    await client.query(`INSERT INTO holdings(holding_id,customer_id,product_id,data_version,amount,return_rate,source_id,source_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [holding.holding_id, holding.customer_id, holding.product_id, value.data_version, holding.amount, holding.return_rate ?? null, holding.source_id || filePath, holding.source_timestamp || value.as_of]);
  }

  await client.query(`UPDATE data_versions SET status='RETIRED' WHERE status='ACTIVE' AND version <> $1`, [value.data_version]);
  await client.query(`UPDATE data_versions SET status='ACTIVE', quality_status='VERIFIED', activated_at=NOW() WHERE version=$1`, [value.data_version]);

  if (documents.length) {
    await client.query(`INSERT INTO knowledge_versions(version, embedding_model, vector_dim, status) VALUES ($1, $2, $3, 'STAGING')`, [knowledgeVersion, value.embedding_model || 'pending-real-embedding', value.vector_dim || container.config.KNOWLEDGE_VECTOR_DIM]);
    for (const document of documents) {
      await client.query(`INSERT INTO knowledge_documents(document_id,knowledge_version,title,source_id,source_timestamp,storage_uri,page_count) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [document.document_id, knowledgeVersion, document.title, document.source_id, document.source_timestamp || value.as_of, document.storage_uri || null, document.page_count || null]);
      for (const chunk of document.chunks) {
        const contentHash = crypto.createHash('sha256').update(chunk.text).digest('hex');
        await client.query(`INSERT INTO knowledge_chunks(chunk_id,document_id,knowledge_version,source_id,product_id,page,text,content_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (chunk_id,knowledge_version) DO UPDATE SET text=EXCLUDED.text,product_id=EXCLUDED.product_id,page=EXCLUDED.page,content_hash=EXCLUDED.content_hash,embedding=CASE WHEN knowledge_chunks.content_hash IS DISTINCT FROM EXCLUDED.content_hash THEN NULL ELSE knowledge_chunks.embedding END,updated_at=NOW()`, [chunk.chunk_id, document.document_id, knowledgeVersion, document.source_id, chunk.product_id || null, chunk.page || null, chunk.text, contentHash]);
      }
    }
  }
  await client.query(`UPDATE import_runs SET status='SUCCEEDED', finished_at=NOW() WHERE run_id=$1`, [runId]);
});
await container.db.close();
console.log(JSON.stringify({ status: 'SUCCEEDED', source_hash: hash, data_version: value.data_version, knowledge_version: documents.length ? knowledgeVersion : null }));
