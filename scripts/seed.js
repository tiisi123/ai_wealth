import { createContainer } from '../src/compositionRoot.js';
import { applyMigrations, applySeedFiles } from './seed/applyMigrations.js';
import { applyFixtureKnowledge } from './seed/fixtureKnowledge.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for seeding');

// A seed written against a stricter schema than the database has would fail
// with a raw SQL error. Apply pending migrations first so `npm run seed` works
// on a fresh database and stays repeatable afterwards.
await applyMigrations(container);
await applySeedFiles(container);
await applyFixtureKnowledge(container);
await container.db.close();
