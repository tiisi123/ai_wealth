WITH ranked AS (
  SELECT version,
         ROW_NUMBER() OVER (ORDER BY activated_at DESC NULLS LAST, ingested_at DESC, version DESC) AS position
    FROM data_versions
   WHERE status = 'ACTIVE'
)
UPDATE data_versions dv
   SET status = 'RETIRED'
  FROM ranked
 WHERE dv.version = ranked.version
   AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS data_versions_one_active_idx
  ON data_versions ((status))
  WHERE status = 'ACTIVE';

WITH ranked AS (
  SELECT version,
         ROW_NUMBER() OVER (ORDER BY activated_at DESC NULLS LAST, created_at DESC, version DESC) AS position
    FROM knowledge_versions
   WHERE status = 'ACTIVE'
)
UPDATE knowledge_versions kv
   SET status = 'RETIRED'
  FROM ranked
 WHERE kv.version = ranked.version
   AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_versions_one_active_idx
  ON knowledge_versions ((status))
  WHERE status = 'ACTIVE';

ALTER TABLE product_updates
  ALTER COLUMN value TYPE JSONB
  USING to_jsonb(value);
