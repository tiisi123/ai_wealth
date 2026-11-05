CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS data_versions (
  version TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STAGING', 'ACTIVE', 'RETIRED', 'FAILED')),
  source_timestamp TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  quality_status TEXT NOT NULL DEFAULT 'PENDING',
  error_report JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  region TEXT,
  authorized BOOLEAN NOT NULL DEFAULT FALSE,
  data_as_of DATE NOT NULL,
  data_version TEXT REFERENCES data_versions(version),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT NOT NULL,
  data_version TEXT NOT NULL REFERENCES data_versions(version),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  risk TEXT NOT NULL,
  role TEXT,
  latest_return NUMERIC,
  drawdown NUMERIC,
  annual_rate NUMERIC,
  fee NUMERIC,
  coverage NUMERIC,
  annual_premium NUMERIC,
  liquidity TEXT,
  sale_status TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality_status TEXT NOT NULL DEFAULT 'VERIFIED',
  PRIMARY KEY (product_id, data_version)
);

CREATE INDEX IF NOT EXISTS products_active_idx ON products(product_id, data_version, sale_status);

CREATE TABLE IF NOT EXISTS holdings (
  holding_id TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  product_id TEXT NOT NULL,
  data_version TEXT NOT NULL REFERENCES data_versions(version),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  return_rate NUMERIC,
  source_id TEXT NOT NULL DEFAULT 'inhouse-standard-package',
  source_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (holding_id, data_version)
);

CREATE INDEX IF NOT EXISTS holdings_customer_idx ON holdings(customer_id, data_version);

CREATE TABLE IF NOT EXISTS rules (
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  name TEXT NOT NULL,
  applicable_scenario TEXT NOT NULL,
  required_inputs JSONB NOT NULL,
  conditions JSONB NOT NULL,
  action JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rule_id, rule_version)
);

CREATE INDEX IF NOT EXISTS rules_enabled_idx ON rules(enabled, applicable_scenario);

CREATE TABLE IF NOT EXISTS knowledge_versions (
  version TEXT PRIMARY KEY,
  embedding_model TEXT NOT NULL,
  vector_dim INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STAGING', 'ACTIVE', 'RETIRED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  error_report JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  document_id TEXT NOT NULL,
  knowledge_version TEXT NOT NULL REFERENCES knowledge_versions(version),
  title TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ,
  storage_uri TEXT,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (document_id, knowledge_version)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  chunk_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  knowledge_version TEXT NOT NULL REFERENCES knowledge_versions(version),
  source_id TEXT NOT NULL,
  product_id TEXT,
  page INTEGER,
  text TEXT NOT NULL,
  embedding vector(1536),
  content_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chunk_id, knowledge_version),
  FOREIGN KEY (document_id, knowledge_version) REFERENCES knowledge_documents(document_id, knowledge_version)
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_version_idx ON knowledge_chunks(knowledge_version, source_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS app_sessions (
  session_id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  state_json JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours')
);

CREATE INDEX IF NOT EXISTS app_sessions_customer_idx ON app_sessions(customer_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS session_mutations (
  session_id UUID NOT NULL REFERENCES app_sessions(session_id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, request_id)
);

CREATE TABLE IF NOT EXISTS ai_requests (
  request_id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES app_sessions(session_id),
  task_type TEXT NOT NULL,
  model TEXT,
  embedding_model TEXT,
  knowledge_version TEXT,
  evidence_json JSONB NOT NULL,
  response_json JSONB,
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'SUCCEEDED', 'FAILED')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_runs (
  run_id UUID PRIMARY KEY,
  kind TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'SUCCEEDED', 'FAILED')),
  error_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS import_runs_success_hash_idx ON import_runs(kind, source_hash) WHERE status = 'SUCCEEDED';

CREATE TABLE IF NOT EXISTS product_updates (
  product_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value NUMERIC,
  quality_status TEXT NOT NULL DEFAULT 'VERIFIED',
  PRIMARY KEY (product_id, metric_name, source_id, source_timestamp)
);

CREATE TABLE IF NOT EXISTS acceptance_checks (
  check_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'BLOCKED', 'NOT_RUN')) DEFAULT 'NOT_RUN',
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ
);
