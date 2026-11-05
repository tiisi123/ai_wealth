import fs from 'node:fs/promises';
import path from 'node:path';
import { createContainer } from '../src/compositionRoot.js';
import { applyMigrations } from './lib/apply-migrations.js';
import { applyFixtureKnowledge } from './seed/fixtureKnowledge.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for seeding');

// A seed written against a stricter schema than the database has would fail
// with a raw SQL error. Apply pending migrations first so `npm run seed` works
// on a fresh database and stays repeatable afterwards.
await applyMigrations(container);

const directory = path.join(container.config.PROJECT_ROOT, 'db/seeds');
const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
const contents = await Promise.all(files.map(async (filename) => ({ filename, sql: await fs.readFile(path.join(directory, filename), 'utf8') })));

// One transaction for every seed file: a failure half-way leaves no partial
// fixture data behind, and the advisory lock serializes concurrent seeds.
// applyFixtureKnowledge takes the same knowledge-version lock inside its own
// transaction, so keeping it outside keeps the lock order identical.
await container.db.withTransaction(async (client) => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['wealth-demo:seed']);
  for (const { filename, sql } of contents) {
    await client.query(sql);
    container.logger.info({ filename }, 'seed applied');
  }
});

await applyFixtureKnowledge(container);
await container.db.close();
