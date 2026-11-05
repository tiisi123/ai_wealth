import { randomUUID } from 'node:crypto';
import { defaultSessionState } from '../../../fixtures/demoData.js';

export class SessionRepository {
  constructor({ db, dataMode }) {
    this.db = db;
    this.dataMode = dataMode;
    this.sessions = new Map();
    this.mutations = new Map();
  }

  async create({ customerId, state }) {
    const sessionId = randomUUID();
    const initialState = state || { ...defaultSessionState(), customerId };
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      const record = { session_id: sessionId, customer_id: customerId, state: initialState, version: 1, status: 'ACTIVE' };
      this.sessions.set(sessionId, record);
      return record;
    }
    const { rows } = await this.db.query(
      `INSERT INTO app_sessions(session_id, customer_id, state_json, version, status)
       VALUES ($1, $2, $3::jsonb, 1, 'ACTIVE')
       RETURNING session_id, customer_id, state_json AS state, version, status, created_at, updated_at, expires_at`,
      [sessionId, customerId, JSON.stringify(initialState)]
    );
    return rows[0];
  }

  async find(sessionId) {
    if (this.dataMode === 'fixture' || !this.db.enabled) return this.sessions.get(sessionId) || null;
    const { rows } = await this.db.query(
      `SELECT session_id, customer_id, state_json AS state, version, status, created_at, updated_at, expires_at
         FROM app_sessions WHERE session_id = $1`,
      [sessionId]
    );
    return rows[0] || null;
  }

  async findMutation(sessionId, requestId) {
    if (this.dataMode === 'fixture' || !this.db.enabled) return this.mutations.get(`${sessionId}:${requestId}`) || null;
    const { rows } = await this.db.query(
      `SELECT result_json AS result FROM session_mutations WHERE session_id = $1 AND request_id = $2`,
      [sessionId, requestId]
    );
    return rows[0]?.result || null;
  }

  async update({ sessionId, expectedVersion, patch, requestId, result }) {
    const storedResult = (updated) => (result === undefined ? updated : { session: updated, result });
    if (this.dataMode === 'fixture' || !this.db.enabled) {
      const prior = this.mutations.get(`${sessionId}:${requestId}`);
      if (prior) return prior.session || prior;
      const current = this.sessions.get(sessionId);
      if (!current || current.version !== expectedVersion) return null;
      const updated = { ...current, state: { ...current.state, ...patch }, version: current.version + 1, updated_at: new Date().toISOString() };
      this.sessions.set(sessionId, updated);
      this.mutations.set(`${sessionId}:${requestId}`, storedResult(updated));
      return updated;
    }
    return this.db.withTransaction(async (client) => {
      const priorResult = await client.query(
        `SELECT result_json AS result FROM session_mutations WHERE session_id = $1 AND request_id = $2`,
        [sessionId, requestId]
      );
      if (priorResult.rows[0]) {
        const prior = priorResult.rows[0].result;
        return prior.session || prior;
      }
      const { rows } = await client.query(
        `UPDATE app_sessions
            SET state_json = state_json || $3::jsonb, version = version + 1, updated_at = NOW()
          WHERE session_id = $1 AND version = $2 AND status = 'ACTIVE'
        RETURNING session_id, customer_id, state_json AS state, version, status, created_at, updated_at, expires_at`,
        [sessionId, expectedVersion, JSON.stringify(patch)]
      );
      if (!rows[0]) return null;
      await client.query(
        `INSERT INTO session_mutations(session_id, request_id, result_json) VALUES ($1, $2, $3::jsonb)`,
        [sessionId, requestId, JSON.stringify(storedResult(rows[0]))]
      );
      return rows[0];
    });
  }
}
