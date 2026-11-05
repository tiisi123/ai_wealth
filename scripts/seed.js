import fs from 'node:fs/promises';
import path from 'node:path';
import { createContainer } from '../src/compositionRoot.js';
import { applyFixtureKnowledge } from './seed/fixtureKnowledge.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for seeding');
const files = (await fs.readdir(path.join(container.config.PROJECT_ROOT, 'db/seeds'))).filter((file) => file.endsWith('.sql')).sort();
for (const filename of files) {
  await container.db.query(await fs.readFile(path.join(container.config.PROJECT_ROOT, 'db/seeds', filename), 'utf8'));
  container.logger.info({ filename }, 'seed applied');
}
await applyFixtureKnowledge(container);
await container.db.close();
