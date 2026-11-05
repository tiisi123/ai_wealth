import { createContainer } from '../src/compositionRoot.js';
import { applyMigrations } from './seed/applyMigrations.js';

const container = createContainer();
if (!container.db.enabled) throw new Error('DATABASE_URL is required for migrations');

const { applied, total } = await applyMigrations(container);
container.logger.info({ applied, total }, applied.length ? 'migrations applied' : 'schema already up to date');

await container.db.close();
