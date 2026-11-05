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

-- Guarded so 002 is a clean no-op when re-applied (all ten statements here are
-- idempotent). Re-application happens when schema_migrations is lost while the
-- data survives, which apply-migrations.js now recovers from automatically.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'product_updates'
       AND column_name = 'value'
       AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE product_updates
      ALTER COLUMN value TYPE JSONB
      USING to_jsonb(value);
  END IF;
END
$$;
