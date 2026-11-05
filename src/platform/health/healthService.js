import fs from 'node:fs/promises';
import path from 'node:path';
import { RULE_VERSION } from '../../fixtures/demoData.js';

const REQUIRED_RULES = ['allocation-balanced-r3', 'allocation-liquid-r2', 'deposit-interest-simple'];

export class HealthService {
  constructor({ config, db, documentStore, knowledgeService, rulesService, logger }) {
    this.config = config;
    this.db = db;
    this.documentStore = documentStore;
    this.knowledgeService = knowledgeService;
    this.rulesService = rulesService;
    this.logger = logger;
  }

  async read() {
    const safe = async (promise, fallback) => {
      try { return await promise; } catch (error) { this.logger?.warn({ err: error }, 'health dependency check failed'); return fallback; }
    };
    const [database, storage, knowledge, rules, frontend] = await Promise.all([
      safe(this.db.health(), { ok: false, reason: 'health_check_failed' }),
      safe(this.documentStore.health(), { ok: false, reason: 'health_check_failed' }),
      safe(this.knowledgeService.status(), { status: 'NOT_READY', knowledge_version: null, document_count: 0, chunk_count: 0, vector_count: 0 }),
      safe(this.rulesService.list(), []),
      this.frontendContract()
    ]);
    const knowledgeReady = knowledge.status === 'ACTIVE'
      && Number(knowledge.chunk_count || 0) > 0
      && Number(knowledge.vector_count || 0) === Number(knowledge.chunk_count)
      && (this.config.DATA_MODE === 'fixture' || (
        Number(knowledge.vector_dim) === Number(this.config.KNOWLEDGE_VECTOR_DIM)
        && knowledge.embedding_model === this.config.EMBEDDING_MODEL_NAME
      ));
    const ruleIds = new Set(rules.filter((rule) => rule.enabled !== false && rule.rule_version === RULE_VERSION).map((rule) => rule.rule_id));
    const rulesReady = REQUIRED_RULES.every((id) => ruleIds.has(id));
    const dataModeReady = this.config.NODE_ENV !== 'production' || this.config.DATA_MODE === 'database';
    return {
      status: 'ok',
      service: 'wealth-prototype-demo',
      instance_id: this.config.INSTANCE_ID,
      node_env: this.config.NODE_ENV,
      data_mode: this.config.DATA_MODE,
      ai_mode: this.config.AI_MODE || 'real',
      dependencies: {
        database,
        shared_document_store: storage,
        knowledge: { ...knowledge, ready: knowledgeReady },
        model: {
          configured: this.config.MODEL_CONFIGURED,
          execution_mode: this.config.AI_MODE === 'fixture' ? 'fixture' : 'real',
          model: this.config.MODEL_NAME || null,
          embedding_model: this.config.EMBEDDING_MODEL_NAME || null
        },
        rules: { ready: rulesReady, count: rules.length, expected_version: RULE_VERSION },
        contract: {
          ready: frontend.ok && frontend.api_version === this.config.API_VERSION && frontend.frontend_contract_version === this.config.FRONTEND_CONTRACT_VERSION,
          api_version: this.config.API_VERSION,
          frontend_contract_version: this.config.FRONTEND_CONTRACT_VERSION
        },
        data_mode: { ready: dataModeReady }
      },
      generated_at: new Date().toISOString()
    };
  }

  async frontendContract() {
    try {
      const html = await fs.readFile(path.join(this.config.PUBLIC_DIR, 'index.html'), 'utf8');
      const apiVersion = html.match(/<meta\s+name=["']api-version["']\s+content=["']([^"']+)["']/i)?.[1] || null;
      const frontendVersion = html.match(/<meta\s+name=["']frontend-contract-version["']\s+content=["']([^"']+)["']/i)?.[1] || null;
      return { ok: true, api_version: apiVersion, frontend_contract_version: frontendVersion };
    } catch {
      return { ok: false, api_version: null, frontend_contract_version: null };
    }
  }

  async ready() {
    const health = await this.read();
    const checks = [
      health.dependencies.database.ok,
      health.dependencies.shared_document_store.ok,
      health.dependencies.knowledge.ready,
      health.dependencies.rules.ready,
      !this.config.REQUIRE_MODEL || health.dependencies.model.configured,
      health.dependencies.contract.ready,
      health.dependencies.data_mode.ready
    ];
    return {
      ...health,
      ready: checks.every(Boolean),
      checks: {
        database: checks[0],
        shared_document_store: checks[1],
        knowledge: checks[2],
        rules: checks[3],
        model: checks[4],
        contract: checks[5],
        data_mode: checks[6]
      }
    };
  }
}
