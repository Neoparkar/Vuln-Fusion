-- ============================================================================
-- VULNFUSION DATABASE SCHEMA & HARDENED RLS MIGRATION (PostgreSQL / Supabase)
-- Repository requirement. Applying this file is a separate live-database step.
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 4. ASSETS TABLE (with composite unique key for cross-org reference integrity)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assets_id_org_uniq UNIQUE (id, organization_id)
);

-- 5. SOURCE RECORDS TABLE (composite FK ensures asset belongs to same organization)
CREATE TABLE IF NOT EXISTS source_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID,
    source TEXT NOT NULL CHECK (source IN ('Qualys', 'Tenable', 'Rapid7', 'Wiz')),
    hostname TEXT,
    ip_address TEXT,
    mac_address TEXT,
    bios_uuid TEXT,
    cloud_resource_id TEXT,
    raw_identity JSONB NOT NULL DEFAULT '{}'::jsonb,
    observed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_source_record_asset
        FOREIGN KEY (asset_id, organization_id)
        REFERENCES assets(id, organization_id)
        ON DELETE SET NULL
);

-- 6. FINDINGS TABLE (composite FK ensures asset belongs to same organization; supports CVE, vendor IDs, WIZ-ISSUE, etc.)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID,
    source TEXT NOT NULL,
    vulnerability_id TEXT NOT NULL,
    vulnerability_id_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    title TEXT NOT NULL,
    description TEXT,
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_finding_asset
        FOREIGN KEY (asset_id, organization_id)
        REFERENCES assets(id, organization_id)
        ON DELETE SET NULL
);

-- 7. CORRELATIONS TABLE (composite FK ensures asset belongs to same organization)
CREATE TABLE IF NOT EXISTS correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    decision TEXT NOT NULL CHECK (decision IN ('CORRELATED', 'REVIEW_REQUIRED', 'SEPARATE')),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_correlation_asset
        FOREIGN KEY (asset_id, organization_id)
        REFERENCES assets(id, organization_id)
        ON DELETE CASCADE
);

-- 8. INVESTIGATIONS TABLE (composite FK ensures asset belongs to same organization)
CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_investigation_asset
        FOREIGN KEY (asset_id, organization_id)
        REFERENCES assets(id, organization_id)
        ON DELETE SET NULL
);

-- 9. AUDIT EVENTS TABLE (Hardened: organization_id NOT NULL for tenant isolation)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_source_records_org_id ON source_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_source_records_asset_id ON source_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_source_records_observed ON source_records(observed_at);
CREATE INDEX IF NOT EXISTS idx_findings_org_id ON findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_findings_asset_id ON findings(asset_id);
CREATE INDEX IF NOT EXISTS idx_correlations_org_id ON correlations(organization_id);
CREATE INDEX IF NOT EXISTS idx_investigations_org_id ON investigations(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_org_id ON audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is member of organization (Hardened search_path & execution privs)
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION user_belongs_to_org(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_belongs_to_org(UUID) TO authenticated;

-- Helper function: Check if current user has required role hierarchy (admin > manager > user)
CREATE OR REPLACE FUNCTION user_has_org_role(org_id UUID, req_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = org_id AND user_id = auth.uid();

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF req_role = 'user' THEN
    RETURN user_role IN ('user', 'manager', 'admin');
  ELSIF req_role = 'manager' THEN
    RETURN user_role IN ('manager', 'admin');
  ELSIF req_role = 'admin' THEN
    RETURN user_role = 'admin';
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION user_has_org_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_has_org_role(UUID, TEXT) TO authenticated;

-- Demo membership is not a production bootstrap.
-- This function no longer inserts a row and no longer grants administrator
-- when an organization has zero members. Authenticated sessions cannot execute it.
CREATE OR REPLACE FUNCTION ensure_demo_membership()
RETURNS VOID AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION ensure_demo_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION ensure_demo_membership() FROM anon;
REVOKE ALL ON FUNCTION ensure_demo_membership() FROM authenticated;

-- Explicit trusted provisioning. The requested role is stored as given.
-- An empty organization does not upgrade the role to administrator.
-- Browser sessions cannot execute this function. Service role bypasses RLS
-- and is rejected here when auth.uid() is present.
CREATE OR REPLACE FUNCTION provision_organization_member(target_org UUID, target_user UUID, target_role TEXT)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'authenticated sessions cannot provision organization membership';
  END IF;
  IF target_role NOT IN ('admin', 'manager', 'user') THEN
    RAISE EXCEPTION 'invalid organization role';
  END IF;
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (target_org, target_user, target_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION provision_organization_member(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION provision_organization_member(UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION provision_organization_member(UUID, UUID, TEXT) FROM authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION provision_organization_member(UUID, UUID, TEXT) TO service_role;
  END IF;
END $$;

-- Drop existing policies safely for idempotency
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;

DROP POLICY IF EXISTS org_select_policy ON organizations;
DROP POLICY IF EXISTS org_insert_policy ON organizations;
DROP POLICY IF EXISTS org_update_policy ON organizations;
DROP POLICY IF EXISTS org_delete_policy ON organizations;

DROP POLICY IF EXISTS member_select_policy ON organization_members;
DROP POLICY IF EXISTS member_insert_policy ON organization_members;
DROP POLICY IF EXISTS member_update_policy ON organization_members;
DROP POLICY IF EXISTS member_delete_policy ON organization_members;

DROP POLICY IF EXISTS assets_select_policy ON assets;
DROP POLICY IF EXISTS assets_insert_policy ON assets;
DROP POLICY IF EXISTS assets_update_policy ON assets;
DROP POLICY IF EXISTS assets_delete_policy ON assets;

DROP POLICY IF EXISTS source_records_select_policy ON source_records;
DROP POLICY IF EXISTS source_records_insert_policy ON source_records;
DROP POLICY IF EXISTS source_records_update_policy ON source_records;
DROP POLICY IF EXISTS source_records_delete_policy ON source_records;

DROP POLICY IF EXISTS findings_select_policy ON findings;
DROP POLICY IF EXISTS findings_insert_policy ON findings;
DROP POLICY IF EXISTS findings_update_policy ON findings;
DROP POLICY IF EXISTS findings_delete_policy ON findings;

DROP POLICY IF EXISTS correlations_select_policy ON correlations;
DROP POLICY IF EXISTS correlations_insert_policy ON correlations;
DROP POLICY IF EXISTS correlations_update_policy ON correlations;
DROP POLICY IF EXISTS correlations_delete_policy ON correlations;

DROP POLICY IF EXISTS investigations_select_policy ON investigations;
DROP POLICY IF EXISTS investigations_insert_policy ON investigations;
DROP POLICY IF EXISTS investigations_update_policy ON investigations;
DROP POLICY IF EXISTS investigations_delete_policy ON investigations;

DROP POLICY IF EXISTS audit_events_select_policy ON audit_events;
DROP POLICY IF EXISTS audit_events_insert_policy ON audit_events;

-- ============================================================================
-- EXPLICIT RLS POLICIES
-- ============================================================================

-- 1. USERS POLICIES
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = users.id
  ));

CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 2. ORGANIZATIONS POLICIES
CREATE POLICY org_select_policy ON organizations
  FOR SELECT USING (user_belongs_to_org(id));

-- Organizations are provisioned outside the browser. Members may read their own orgs.
CREATE POLICY org_insert_policy ON organizations
  FOR INSERT WITH CHECK (false);

CREATE POLICY org_update_policy ON organizations
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY org_delete_policy ON organizations
  FOR DELETE USING (false);

-- 3. ORGANIZATION MEMBERS POLICIES
-- No authenticated self-insert. Role changes and removals require administrator.
-- A member cannot change or remove their own row.
CREATE POLICY member_select_policy ON organization_members
  FOR SELECT USING (user_id = auth.uid() OR user_belongs_to_org(organization_id));

CREATE POLICY member_insert_policy ON organization_members
  FOR INSERT WITH CHECK (false);

CREATE POLICY member_update_policy ON organization_members
  FOR UPDATE
  USING (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid())
  WITH CHECK (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid());

CREATE POLICY member_delete_policy ON organization_members
  FOR DELETE USING (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid());

-- 4. ASSETS POLICIES
-- Viewer reads. Security Ops and Administrator insert and update. Administrator deletes.
CREATE POLICY assets_select_policy ON assets
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY assets_insert_policy ON assets
  FOR INSERT WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY assets_update_policy ON assets
  FOR UPDATE USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY assets_delete_policy ON assets
  FOR DELETE USING (user_has_org_role(organization_id, 'admin'));

-- 5. SOURCE RECORDS POLICIES
CREATE POLICY source_records_select_policy ON source_records
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY source_records_insert_policy ON source_records
  FOR INSERT WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY source_records_update_policy ON source_records
  FOR UPDATE USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY source_records_delete_policy ON source_records
  FOR DELETE USING (user_has_org_role(organization_id, 'admin'));

-- 6. FINDINGS POLICIES
CREATE POLICY findings_select_policy ON findings
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY findings_insert_policy ON findings
  FOR INSERT WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY findings_update_policy ON findings
  FOR UPDATE USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY findings_delete_policy ON findings
  FOR DELETE USING (user_has_org_role(organization_id, 'admin'));

-- 7. CORRELATIONS POLICIES
CREATE POLICY correlations_select_policy ON correlations
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY correlations_insert_policy ON correlations
  FOR INSERT WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY correlations_update_policy ON correlations
  FOR UPDATE USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY correlations_delete_policy ON correlations
  FOR DELETE USING (user_has_org_role(organization_id, 'admin'));

-- 8. INVESTIGATIONS POLICIES
-- Security Ops and Administrator may create and maintain their own investigations.
CREATE POLICY investigations_select_policy ON investigations
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY investigations_insert_policy ON investigations
  FOR INSERT WITH CHECK (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

CREATE POLICY investigations_update_policy ON investigations
  FOR UPDATE
  USING (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid())
  WITH CHECK (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

CREATE POLICY investigations_delete_policy ON investigations
  FOR DELETE USING (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

-- 9. AUDIT EVENTS POLICIES
-- Inserts stay inside the caller's membership and must name the caller.
-- There is no update or delete policy.
CREATE POLICY audit_events_select_policy ON audit_events
  FOR SELECT USING (user_belongs_to_org(organization_id));

CREATE POLICY audit_events_insert_policy ON audit_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND organization_id IS NOT NULL
    AND user_belongs_to_org(organization_id)
  );

-- ============================================================================
-- MEMBERSHIP AND AUDIT GUARDS
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_organization_member_mutations()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'authenticated sessions cannot insert organization memberships';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'organization membership identity cannot be reassigned';
    END IF;
    IF OLD.user_id = auth.uid() AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'users cannot change their own role';
    END IF;
    IF OLD.role = 'admin' AND NEW.role IS DISTINCT FROM 'admin' THEN
      SELECT COUNT(*) INTO admin_count
      FROM organization_members
      WHERE organization_id = OLD.organization_id AND role = 'admin';
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'cannot demote the last administrator';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO admin_count
      FROM organization_members
      WHERE organization_id = OLD.organization_id AND role = 'admin';
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'cannot remove the last administrator';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS organization_members_protect ON organization_members;
CREATE TRIGGER organization_members_protect
  BEFORE INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION protect_organization_member_mutations();

CREATE OR REPLACE FUNCTION reject_organization_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id cannot cross tenants';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS assets_org_immutable ON assets;
CREATE TRIGGER assets_org_immutable
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

DROP TRIGGER IF EXISTS source_records_org_immutable ON source_records;
CREATE TRIGGER source_records_org_immutable
  BEFORE UPDATE ON source_records
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

DROP TRIGGER IF EXISTS findings_org_immutable ON findings;
CREATE TRIGGER findings_org_immutable
  BEFORE UPDATE ON findings
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

DROP TRIGGER IF EXISTS correlations_org_immutable ON correlations;
CREATE TRIGGER correlations_org_immutable
  BEFORE UPDATE ON correlations
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

DROP TRIGGER IF EXISTS investigations_org_immutable ON investigations;
CREATE TRIGGER investigations_org_immutable
  BEFORE UPDATE ON investigations
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

DROP TRIGGER IF EXISTS audit_events_org_immutable ON audit_events;
CREATE TRIGGER audit_events_org_immutable
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_organization_id_change();

CREATE OR REPLACE FUNCTION reject_sensitive_audit_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'audit user_id must match the authenticated user';
  END IF;
  IF NEW.metadata::text ~* '(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|jwt|credential|service[_-]?role|bearer[[:space:]])' THEN
    RAISE EXCEPTION 'audit metadata must not contain credentials';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS audit_events_sensitive_metadata ON audit_events;
CREATE TRIGGER audit_events_sensitive_metadata
  BEFORE INSERT OR UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_sensitive_audit_metadata();

-- ============================================================================
-- SEED DATA: VULNFUSION DEMO WORKSPACE
-- ============================================================================
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'VulnFusion Demo')
ON CONFLICT (id) DO NOTHING;
