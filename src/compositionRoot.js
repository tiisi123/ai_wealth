import { config as defaultConfig, resolveModelConfigured, withFixtureModelDefaults } from './config/env.js';
import { createLogger } from './platform/logging/logger.js';
import { Database } from './platform/db/pool.js';
import { SharedDocumentStore } from './platform/storage/sharedDocumentStore.js';
import { RuleRepository } from './components/business-rules/infrastructure/ruleRepository.js';
import { BusinessRulesService } from './components/business-rules/application/businessRulesService.js';
import { KnowledgeRepository } from './components/data-knowledge/infrastructure/knowledgeRepository.js';
import { KnowledgeService } from './components/data-knowledge/application/knowledgeService.js';
import { DemoDataRepository } from './components/demo-data/infrastructure/demoDataRepository.js';
import { DemoDataService } from './components/demo-data/application/demoDataService.js';
import { PortfolioService } from './components/demo-data/application/portfolioService.js';
import { SessionRepository } from './components/sessions/infrastructure/sessionRepository.js';
import { SessionService } from './components/sessions/application/sessionService.js';
import { OpenAICompatibleClient } from './components/ai-orchestration/infrastructure/openaiCompatibleClient.js';
import { FixtureModelClient } from './components/ai-orchestration/infrastructure/fixtureModelClient.js';
import { AiOrchestrator } from './components/ai-orchestration/application/aiOrchestrator.js';
import { HealthService } from './platform/health/healthService.js';

export function createContainer(overrides = {}) {
  const mergedConfig = withFixtureModelDefaults({ ...defaultConfig, ...(overrides.config || {}) });
  const config = {
    ...mergedConfig,
    MODEL_BASE_URL: mergedConfig.MODEL_BASE_URL?.replace(/\/$/, '') || undefined,
    DB_ENABLED: Boolean(mergedConfig.DATABASE_URL),
    MODEL_CONFIGURED: resolveModelConfigured(mergedConfig)
  };
  if (config.NODE_ENV === 'production' && config.DATA_MODE !== 'database') throw new Error('production requires DATA_MODE=database');
  if (config.NODE_ENV === 'production' && config.AI_MODE === 'fixture') throw new Error('production forbids AI_MODE=fixture');
  if (config.DATA_MODE === 'database' && Number(config.KNOWLEDGE_VECTOR_DIM) !== 1536) {
    throw new Error('database mode requires KNOWLEDGE_VECTOR_DIM=1536 to match the vector(1536) migration');
  }
  const logger = overrides.logger || createLogger(config);
  const db = overrides.db || new Database(config, logger);
  const documentStore = overrides.documentStore || new SharedDocumentStore(config.DOCUMENT_STORE_PATH);
  const ruleRepository = overrides.ruleRepository || new RuleRepository({ db, dataMode: config.DATA_MODE });
  const rulesService = overrides.rulesService || new BusinessRulesService({ repository: ruleRepository });
  const knowledgeRepository = overrides.knowledgeRepository || new KnowledgeRepository({ db, dataMode: config.DATA_MODE, config });
  const knowledgeService = overrides.knowledgeService || new KnowledgeService({ repository: knowledgeRepository });
  const dataRepository = overrides.dataRepository || new DemoDataRepository({ db, dataMode: config.DATA_MODE });
  const dataService = overrides.dataService || new DemoDataService({ repository: dataRepository });
  // §8.1 #5：持仓收益/贡献/集中度的只读计算（与证据包同一 portfolioCalculation 口径）。
  const portfolioService = overrides.portfolioService || new PortfolioService({ dataService });
  const sessionRepository = overrides.sessionRepository || new SessionRepository({ db, dataMode: config.DATA_MODE });
  const sessionService = overrides.sessionService || new SessionService({ repository: sessionRepository, dataService, rulesService });
  const modelClient = overrides.modelClient || (config.AI_MODE === 'fixture'
    ? new FixtureModelClient({ config })
    : new OpenAICompatibleClient({ config, logger }));
  const aiOrchestrator = overrides.aiOrchestrator || new AiOrchestrator({ client: modelClient, dataService, knowledgeService, rulesService, sessionService, logger, db, config });
  const healthService = overrides.healthService || new HealthService({ config, db, documentStore, knowledgeService, rulesService, logger });

  return { config, logger, db, documentStore, ruleRepository, rulesService, knowledgeRepository, knowledgeService, dataRepository, dataService, portfolioService, sessionRepository, sessionService, modelClient, aiOrchestrator, healthService };
}
