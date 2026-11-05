import fs from 'node:fs/promises';
import path from 'node:path';
import { createContainer } from '../src/compositionRoot.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for migrations');

const files = (await fs.readdir(path.join(container.config.PROJECT_ROOT, 'db/migrations')))
  .filter((file) => file.endsWith('.sql'))
  .sort();

await container.db.withTransaction(async (client) => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:migrations']);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  for (const filename of files) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
    if (applied.rowCount) continue;
    const sql = await fs.readFile(path.join(container.config.PROJECT_ROOT, 'db/migrations', filename), 'utf8');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
    container.logger.info({ filename }, 'migration applied');
  }
});

await container.db.close();
