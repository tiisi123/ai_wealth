import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
import { FIXTURE_EMBEDDING_MODEL, FIXTURE_GENERATION_MODEL, FIXTURE_VECTOR_DIM } from '../fixtures/fixtureVector.js';

dotenv.config();

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const optionalNonEmpty = z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), z.string().trim().min(1).optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  INSTANCE_ID: z.string().trim().min(1).default('local'),
  DATABASE_URL: optionalNonEmpty,
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  DOCUMENT_STORE_PATH: z.string().trim().min(1).default('./var/documents'),
  DATA_MODE: z.enum(['database', 'fixture']).default('database'),
  AI_MODE: z.enum(['real', 'fixture']).default('real'),
  REQUIRE_MODEL: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  MODEL_BASE_URL: optionalNonEmpty,
  MODEL_API_KEY: optionalNonEmpty,
  MODEL_NAME: optionalNonEmpty,
  EMBEDDING_MODEL_NAME: optionalNonEmpty,
  MODEL_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  KNOWLEDGE_VECTOR_DIM: z.coerce.number().int().positive().default(1536),
  API_VERSION: z.string().trim().min(1).default('v1'),
  FRONTEND_CONTRACT_VERSION: z.string().trim().min(1).default('2026-11-02.1'),
  CORS_ORIGIN: z.string().trim().optional()
});

export function withFixtureModelDefaults(config) {
  if (config.AI_MODE !== 'fixture') return config;
  // Always override: a developer .env may contain real model names or a
  // different vector dimension, but W1 must never present a fixture answer as
  // coming from a real model, and database mode hard-requires vector(1536).
  return {
    ...config,
    MODEL_NAME: FIXTURE_GENERATION_MODEL,
    EMBEDDING_MODEL_NAME: FIXTURE_EMBEDDING_MODEL,
    KNOWLEDGE_VECTOR_DIM: FIXTURE_VECTOR_DIM
  };
}

export function resolveModelConfigured(config) {
  if (config.AI_MODE === 'fixture') return Boolean(config.MODEL_NAME && config.EMBEDDING_MODEL_NAME);
  return Boolean(config.MODEL_BASE_URL && config.MODEL_API_KEY && config.MODEL_NAME && config.EMBEDDING_MODEL_NAME);
}

export function loadConfig(overrides = {}) {
  const parsed = schema.parse({ ...process.env, ...overrides });
  const documentStorePath = path.isAbsolute(parsed.DOCUMENT_STORE_PATH)
    ? parsed.DOCUMENT_STORE_PATH
    : path.resolve(projectRoot, parsed.DOCUMENT_STORE_PATH);
  const config = {
    ...withFixtureModelDefaults(parsed),
    PROJECT_ROOT: projectRoot,
    PUBLIC_DIR: path.join(projectRoot, 'public'),
    DB_ENABLED: Boolean(parsed.DATABASE_URL),
    DOCUMENT_STORE_PATH: documentStorePath,
    MODEL_BASE_URL: parsed.MODEL_BASE_URL?.replace(/\/$/, '') || undefined
  };

  return { ...config, MODEL_CONFIGURED: resolveModelConfigured(config) };
}

export const config = loadConfig();
