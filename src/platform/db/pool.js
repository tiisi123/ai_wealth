import pg from 'pg';
import { DependencyUnavailableError } from '../http/errors.js';

const { Pool } = pg;

export class Database {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.pool = config.DATABASE_URL
      ? new Pool({
          connectionString: config.DATABASE_URL,
          ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
          max: 10,
          application_name: `wealth-demo-${config.INSTANCE_ID}`
        })
      : null;
  }

  get enabled() {
    return Boolean(this.pool);
  }

  async query(text, params = []) {
    if (!this.pool) {
      throw new DependencyUnavailableError('DATABASE_URL is not configured', { dependency: 'postgresql' });
    }
    return this.pool.query(text, params);
  }

  async withTransaction(work) {
    if (!this.pool) {
      throw new DependencyUnavailableError('DATABASE_URL is not configured', { dependency: 'postgresql' });
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async health() {
    if (!this.pool && this.config.DATA_MODE === 'fixture') return { ok: true, mode: 'fixture', reason: 'local development only' };
    if (!this.pool) return { ok: false, mode: 'not_configured', reason: 'DATABASE_URL missing' };
    try {
      await this.pool.query('SELECT 1');
      return { ok: true, mode: 'postgresql' };
    } catch (error) {
      this.logger.warn({ err: error }, 'database health check failed');
      return { ok: false, mode: 'postgresql', reason: 'connection_failed' };
    }
  }

  async close() {
    await this.pool?.end();
  }
}
