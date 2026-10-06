-- ============================================================================
-- PHASE 0D-A SURGICAL LIVE SECURITY MIGRATION
-- PREPARED ONLY. DO NOT TREAT THIS FILE AS ALREADY APPLIED.
--
-- Source of truth: src/db/schema.sql (Phase 0A security objects).
-- This script does not copy src/db/phase0c_connector_security.sql.
--
-- Non-destructive: no DROP TABLE, TRUNCATE, DELETE, or row updates.
-- Replacing policies, functions, and triggers is the security change.
-- Existing ensure_demo_membership() execute revokes are repeated, not granted back.
-- ============================================================================

BEGIN;

-- RLS is already enabled on the live project. Repeat so this script is sufficient.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Functions. Bodies match src/db/schema.sql.
-- ----------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION user_belongs_to_org(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_belongs_to_org(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION user_belongs_to_org(UUID) TO authenticated;

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

REVOKE ALL ON FUNCTION user_has_org_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_has_org_role(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION user_has_org_role(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION ensure_demo_membership()
RETURNS VOID AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION ensure_demo_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION ensure_demo_membership() FROM anon;
REVOKE ALL ON FUNCTION ensure_demo_membership() FROM authenticated;

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

-- ----------------------------------------------------------------------------
-- Remove every current policy on the nine browser tables, including permissive
-- policies whose names differ from the repository. Then install the same
-- authenticated allow policies as src/db/schema.sql.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  target_table text;
  policy_row record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'users',
    'organizations',
    'organization_members',
    'assets',
    'source_records',
    'findings',
    'correlations',
    'investigations',
    'audit_events'
  ]
  LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, target_table);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = users.id
  ));

CREATE POLICY users_insert_policy ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY users_update_policy ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY org_select_policy ON organizations
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(id));

CREATE POLICY org_insert_policy ON organizations
  FOR INSERT WITH CHECK (false);

CREATE POLICY org_update_policy ON organizations
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY org_delete_policy ON organizations
  FOR DELETE USING (false);

CREATE POLICY member_select_policy ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_belongs_to_org(organization_id));

CREATE POLICY member_insert_policy ON organization_members
  FOR INSERT WITH CHECK (false);

CREATE POLICY member_update_policy ON organization_members
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid())
  WITH CHECK (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid());

CREATE POLICY member_delete_policy ON organization_members
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin') AND user_id <> auth.uid());

CREATE POLICY assets_select_policy ON assets
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY assets_insert_policy ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY assets_update_policy ON assets
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY assets_delete_policy ON assets
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin'));

CREATE POLICY source_records_select_policy ON source_records
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY source_records_insert_policy ON source_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY source_records_update_policy ON source_records
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY source_records_delete_policy ON source_records
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin'));

CREATE POLICY findings_select_policy ON findings
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY findings_insert_policy ON findings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY findings_update_policy ON findings
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY findings_delete_policy ON findings
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin'));

CREATE POLICY correlations_select_policy ON correlations
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY correlations_insert_policy ON correlations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY correlations_update_policy ON correlations
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager')) WITH CHECK (user_has_org_role(organization_id, 'manager'));

CREATE POLICY correlations_delete_policy ON correlations
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'admin'));

CREATE POLICY investigations_select_policy ON investigations
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY investigations_insert_policy ON investigations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

CREATE POLICY investigations_update_policy ON investigations
  FOR UPDATE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid())
  WITH CHECK (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

CREATE POLICY investigations_delete_policy ON investigations
  FOR DELETE
  TO authenticated
  USING (user_has_org_role(organization_id, 'manager') AND user_id = auth.uid());

CREATE POLICY audit_events_select_policy ON audit_events
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_org(organization_id));

CREATE POLICY audit_events_insert_policy ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IS NOT NULL
    AND user_belongs_to_org(organization_id)
  );

-- ----------------------------------------------------------------------------
-- Triggers. Bodies match src/db/schema.sql.
-- ----------------------------------------------------------------------------

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

COMMIT;
