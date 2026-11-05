import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Shared by scripts/migrate.js and scripts/seed.js. A seed must never run
 * against a database whose migrations have not been applied first (the CI
 * jobs run `npm run migrate && npm run seed` as separate steps).
 */
export async function applyMigrations(container) {
  const directory = path.join(container.config.PROJECT_ROOT, 'db/migrations');
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();

  const applied = await container.db.withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:migrations']);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const names = [];
    for (const filename of files) {
      const recorded = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
      if (recorded.rowCount) continue;
      const sql = await fs.readFile(path.join(directory, filename), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
      names.push(filename);
      container.logger.info({ filename }, 'migration applied');
    }
    return names;
  });

  return { applied, total: files.length };
}

/**
 * Applies every db/seeds/*.sql file in one transaction under a seed advisory
 * lock, so a failure half-way leaves no partial fixture data and concurrent
 * seeds serialize. applyFixtureKnowledge takes its own lock in a separate
 * transaction afterwards, which keeps the lock order identical to before.
 */
export async function applySeedFiles(container) {
  const directory = path.join(container.config.PROJECT_ROOT, 'db/seeds');
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  const contents = await Promise.all(files.map(async (filename) => ({ filename, sql: await fs.readFile(path.join(directory, filename), 'utf8') })));

  await container.db.withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:seed']);
    for (const { filename, sql } of contents) {
      await client.query(sql);
      container.logger.info({ filename }, 'seed applied');
    }
  });

  return { files: files };
}
