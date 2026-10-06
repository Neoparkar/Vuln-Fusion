-- ============================================================================
-- PHASE 0C CONNECTOR SECURITY SCHEMA
-- Repository migration only. This file is NOT applied to the live Supabase
-- project. Do not treat these policies as live enforcement.
-- Depends on organizations and user_has_org_role() from src/db/schema.sql.
-- credential_reference is an opaque server-side pointer. It is not a secret.
-- ============================================================================

CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled', 'ready', 'error')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_tested_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    last_error_code TEXT,
    credential_reference TEXT,
    configuration_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT connections_id_org_uniq UNIQUE (id, organization_id),
    CONSTRAINT connections_credential_reference_opaque CHECK (
        credential_reference IS NULL
        OR (
            char_length(credential_reference) BETWEEN 1 AND 128
            AND credential_reference ~ '^vault:[A-Za-z0-9:._/-]+$'
        )
    )
);

CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    cursor TEXT,
    records_processed INTEGER NOT NULL DEFAULT 0 CHECK (records_processed >= 0),
    records_created INTEGER NOT NULL DEFAULT 0 CHECK (records_created >= 0),
    records_updated INTEGER NOT NULL DEFAULT 0 CHECK (records_updated >= 0),
    records_skipped INTEGER NOT NULL DEFAULT 0 CHECK (records_skipped >= 0),
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key TEXT NOT NULL,
    CONSTRAINT fk_sync_job_connection
        FOREIGN KEY (connection_id, organization_id)
        REFERENCES connections(id, organization_id)
        ON DELETE CASCADE,
    CONSTRAINT sync_jobs_idempotency UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_connections_org_id ON connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_org_id ON sync_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connection_id ON sync_jobs(connection_id);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS connections_select_policy ON connections;
DROP POLICY IF EXISTS connections_insert_policy ON connections;
DROP POLICY IF EXISTS connections_update_policy ON connections;
DROP POLICY IF EXISTS connections_delete_policy ON connections;
DROP POLICY IF EXISTS sync_jobs_select_policy ON sync_jobs;
DROP POLICY IF EXISTS sync_jobs_insert_policy ON sync_jobs;
DROP POLICY IF EXISTS sync_jobs_update_policy ON sync_jobs;

-- Viewers cannot read connection rows or credential references.
CREATE POLICY connections_select_policy ON connections
  FOR SELECT
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager'));

CREATE POLICY connections_insert_policy ON connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_org_role(organization_id, 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY connections_update_policy ON connections
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager'))
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY connections_delete_policy ON connections
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin'));

CREATE POLICY sync_jobs_select_policy ON sync_jobs
  FOR SELECT
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager'));

CREATE POLICY sync_jobs_insert_policy ON sync_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY sync_jobs_update_policy ON sync_jobs
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager'))
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE OR REPLACE FUNCTION protect_connection_mutations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'connection tenant cannot be reassigned';
    END IF;
    IF auth.uid() IS NOT NULL AND NOT user_has_org_role(OLD.organization_id, 'admin') THEN
      IF NEW.credential_reference IS DISTINCT FROM OLD.credential_reference
         OR NEW.provider IS DISTINCT FROM OLD.provider
         OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'only an administrator can change connection credentials or provider';
      END IF;
    END IF;
  END IF;
  IF NEW.configuration_metadata::text ~* '(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|jwt|credential|bearer[[:space:]])' THEN
    RAISE EXCEPTION 'connection metadata must not contain credentials';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS connections_protect ON connections;
CREATE TRIGGER connections_protect
  BEFORE INSERT OR UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION protect_connection_mutations();

CREATE OR REPLACE FUNCTION protect_sync_job_mutations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.connection_id IS DISTINCT FROM OLD.connection_id THEN
      RAISE EXCEPTION 'sync job tenant cannot be reassigned';
    END IF;
  END IF;
  IF NEW.error_message IS NOT NULL AND NEW.error_message ~* '(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|jwt|credential|bearer[[:space:]])' THEN
    RAISE EXCEPTION 'sync error message must not contain credentials';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS sync_jobs_protect ON sync_jobs;
CREATE TRIGGER sync_jobs_protect
  BEFORE INSERT OR UPDATE ON sync_jobs
  FOR EACH ROW EXECUTE FUNCTION protect_sync_job_mutations();
