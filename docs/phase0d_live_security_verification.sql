-- ============================================================================
-- PHASE P0-C1 LIVE SECURITY VERIFICATION
-- READ ONLY. Catalog SELECTs and informational count(*) reads only.
-- Reconciled to docs/phase0d_live_security_migration.sql.
-- Expected protected tables: 9. Expected policies: 33.
-- Browser-facing ALLOW policies: 29, each targeted at role authenticated.
-- Intentional DENY policies: 4 (org_insert_policy, org_update_policy,
-- org_delete_policy, member_insert_policy). Those four stay PUBLIC deny
-- policies and are not counted as authenticated allow policies.
-- Connector tables (connections, sync_jobs) are not part of this migration.
-- Do not run this against a database you do not administer.
-- This script does not call user_belongs_to_org, user_has_org_role,
-- ensure_demo_membership, or provision_organization_member.
-- This script does not INSERT, UPDATE, DELETE, TRUNCATE, or DROP.
-- A passing copy of the repository is not a live result. Status values below
-- are computed only from the database session that executes this file.
-- relforcerowsecurity is reported. A false value is not a failure by itself.
-- If anon or authenticated is absent, privilege gates return NOT VERIFIED.
-- Row counts are informational and are not a pass/fail gate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table existence and row-level security flags
-- ----------------------------------------------------------------------------
WITH expected(ord, table_name) AS (
  VALUES
    (1, 'users'),
    (2, 'organizations'),
    (3, 'organization_members'),
    (4, 'assets'),
    (5, 'source_records'),
    (6, 'findings'),
    (7, 'correlations'),
    (8, 'investigations'),
    (9, 'audit_events')
)
SELECT
  e.table_name,
  c.relname IS NOT NULL AS table_exists,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM expected e
LEFT JOIN pg_class c
  ON c.relname = e.table_name
 AND c.relkind = 'r'
 AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY e.ord;

-- ----------------------------------------------------------------------------
-- 2. Policy inventory
--    command, roles, USING, and WITH CHECK are the catalog text, unchanged.
-- ----------------------------------------------------------------------------
SELECT
  p.tablename,
  p.policyname,
  p.permissive,
  p.cmd AS command,
  pol.polcmd::text AS command_code,
  p.roles::text AS roles,
  p.qual AS using_expression,
  p.with_check AS check_expression
FROM pg_policies p
JOIN pg_class c
  ON c.relname = p.tablename
 AND c.relkind = 'r'
 AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
JOIN pg_policy pol
  ON pol.polrelid = c.oid
 AND pol.polname = p.policyname
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    'users',
    'organizations',
    'organization_members',
    'assets',
    'source_records',
    'findings',
    'correlations',
    'investigations',
    'audit_events'
  )
ORDER BY p.tablename, p.policyname;

SELECT
  count(*) AS total_policies,
  count(*) FILTER (WHERE 'authenticated'::name = ANY(p.roles)) AS policies_with_authenticated,
  count(*) FILTER (WHERE NOT ('authenticated'::name = ANY(p.roles))) AS policies_without_authenticated
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    'users',
    'organizations',
    'organization_members',
    'assets',
    'source_records',
    'findings',
    'correlations',
    'investigations',
    'audit_events'
  );

-- ----------------------------------------------------------------------------
-- 4. Functions: signature, definer, search_path, owner, execute privileges.
--    Privilege probes do not run the functions.
-- ----------------------------------------------------------------------------
WITH expected(ord, proname, identity_arguments) AS (
  VALUES
    (1, 'user_belongs_to_org', 'org_id uuid'),
    (2, 'user_has_org_role', 'org_id uuid, req_role text'),
    (3, 'ensure_demo_membership', ''),
    (4, 'provision_organization_member', 'target_org uuid, target_user uuid, target_role text')
),
funcs AS (
  SELECT
    e.ord,
    e.proname AS expected_name,
    e.identity_arguments AS expected_identity_arguments,
    p.oid,
    CASE
      WHEN p.oid IS NULL THEN NULL
      ELSE pg_get_function_identity_arguments(p.oid)
    END AS identity_arguments,
    p.prosecdef AS security_definer,
    (
      SELECT split_part(cfg, '=', 2)
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
      WHERE split_part(cfg, '=', 1) = 'search_path'
      LIMIT 1
    ) AS search_path,
    CASE WHEN p.oid IS NULL THEN NULL ELSE pg_get_userbyid(p.proowner) END AS owner,
    CASE
      WHEN p.oid IS NULL THEN NULL
      WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN NULL
      ELSE has_function_privilege('anon', p.oid, 'EXECUTE')
    END AS anon_can_execute,
    CASE
      WHEN p.oid IS NULL THEN NULL
      WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN NULL
      ELSE has_function_privilege('authenticated', p.oid, 'EXECUTE')
    END AS authenticated_can_execute,
    CASE
      WHEN p.oid IS NULL THEN NULL
      ELSE has_function_privilege('public', p.oid, 'EXECUTE')
    END AS public_can_execute,
    CASE
      WHEN p.oid IS NULL THEN NULL
      WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN NULL
      ELSE has_function_privilege('service_role', p.oid, 'EXECUTE')
    END AS service_role_can_execute,
    CASE
      WHEN e.proname = 'ensure_demo_membership' THEN p.prosrc
      ELSE NULL
    END AS ensure_body_source,
    (
      SELECT count(*)
      FROM pg_proc p2
      JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
      WHERE n2.nspname = 'public'
        AND p2.proname = e.proname
    ) AS public_overload_count
  FROM expected e
  LEFT JOIN LATERAL (
    SELECT p.*
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = e.proname
  ) p ON true
)
SELECT
  expected_name,
  expected_identity_arguments,
  identity_arguments,
  security_definer,
  search_path,
  owner,
  anon_can_execute,
  authenticated_can_execute,
  public_can_execute,
  service_role_can_execute,
  ensure_body_source,
  public_overload_count
FROM funcs
ORDER BY ord, identity_arguments NULLS FIRST;

-- ----------------------------------------------------------------------------
-- 5. Triggers on the nine protected tables, including timing text from the catalog.
--    Expected security triggers are matched by name, table, function, and type bits.
-- ----------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled::text AS enabled_code,
  CASE t.tgenabled::text
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    WHEN 'R' THEN 'replica'
    WHEN 'A' THEN 'always'
    ELSE t.tgenabled::text
  END AS enabled_status,
  t.tgtype AS trigger_type_bits,
  proc.proname AS trigger_function,
  proc.prosecdef AS function_security_definer,
  proc.proconfig::text AS function_config,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc proc ON proc.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT t.tgisinternal
  AND c.relname IN (
    'users',
    'organizations',
    'organization_members',
    'assets',
    'source_records',
    'findings',
    'correlations',
    'investigations',
    'audit_events'
  )
ORDER BY c.relname, t.tgname;

-- ----------------------------------------------------------------------------
-- 6. Informational row counts. Read only. Not a pass/fail gate.
--    Counts are computed from the live tables and are not hard-coded.
-- ----------------------------------------------------------------------------
SELECT 'users'::text AS table_name, count(*)::bigint AS row_count FROM public.users
UNION ALL SELECT 'organizations', count(*) FROM public.organizations
UNION ALL SELECT 'organization_members', count(*) FROM public.organization_members
UNION ALL SELECT 'assets', count(*) FROM public.assets
UNION ALL SELECT 'source_records', count(*) FROM public.source_records
UNION ALL SELECT 'findings', count(*) FROM public.findings
UNION ALL SELECT 'correlations', count(*) FROM public.correlations
UNION ALL SELECT 'investigations', count(*) FROM public.investigations
UNION ALL SELECT 'audit_events', count(*) FROM public.audit_events
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 7. Connector security is a separate unapplied artifact.
--    This statement does not read connections or sync_jobs.
-- ----------------------------------------------------------------------------
SELECT
  'CONNECTOR'::text AS section,
  'NOT COVERED'::text AS status,
  'connector security migration = separate / not covered'::text AS detail;

-- ----------------------------------------------------------------------------
-- 12. Live gate. Earlier statements are the raw catalog evidence.
--     This statement repeats the reads and computes PASS, FAIL, or NOT VERIFIED.
--     OVERALL is BLOCKED when a required fact cannot be read, and FAIL when a
--     required fact is present and does not match.
-- ----------------------------------------------------------------------------
WITH expected_tables(table_name) AS (
  VALUES
    ('users'),
    ('organizations'),
    ('organization_members'),
    ('assets'),
    ('source_records'),
    ('findings'),
    ('correlations'),
    ('investigations'),
    ('audit_events')
),
table_facts AS (
  SELECT
    e.table_name,
    c.relname IS NOT NULL AS table_exists,
    COALESCE(c.relrowsecurity, false) AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM expected_tables e
  LEFT JOIN pg_class c
    ON c.relname = e.table_name
   AND c.relkind = 'r'
   AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
),
special_policies(policyname, tablename, polcmd, role_name, using_expr, check_expr) AS (
  VALUES
    ('users_select_policy', 'users', 'r', 'authenticated', 'id = auth.uid() OR EXISTS (SELECT 1 FROM organization_members om1 JOIN organization_members om2 ON om1.organization_id = om2.organization_id WHERE om1.user_id = auth.uid() AND om2.user_id = users.id)', NULL::text),
    ('users_insert_policy', 'users', 'a', 'authenticated', NULL::text, 'id = auth.uid()'),
    ('users_update_policy', 'users', 'w', 'authenticated', 'id = auth.uid()', 'id = auth.uid()'),
    ('org_select_policy', 'organizations', 'r', 'authenticated', 'user_belongs_to_org(id)', NULL::text),
    ('org_insert_policy', 'organizations', 'a', 'public', NULL::text, 'false'),
    ('org_update_policy', 'organizations', 'w', 'public', 'false', 'false'),
    ('org_delete_policy', 'organizations', 'd', 'public', 'false', NULL::text),
    ('member_select_policy', 'organization_members', 'r', 'authenticated', 'user_id = auth.uid() OR user_belongs_to_org(organization_id)', NULL::text),
    ('member_insert_policy', 'organization_members', 'a', 'public', NULL::text, 'false'),
    ('member_update_policy', 'organization_members', 'w', 'authenticated', 'user_has_org_role(organization_id, ''admin'') AND user_id <> auth.uid()', 'user_has_org_role(organization_id, ''admin'') AND user_id <> auth.uid()'),
    ('member_delete_policy', 'organization_members', 'd', 'authenticated', 'user_has_org_role(organization_id, ''admin'') AND user_id <> auth.uid()', NULL::text),
    ('investigations_select_policy', 'investigations', 'r', 'authenticated', 'user_belongs_to_org(organization_id)', NULL::text),
    ('investigations_insert_policy', 'investigations', 'a', 'authenticated', NULL::text, 'user_has_org_role(organization_id, ''manager'') AND user_id = auth.uid()'),
    ('investigations_update_policy', 'investigations', 'w', 'authenticated', 'user_has_org_role(organization_id, ''manager'') AND user_id = auth.uid()', 'user_has_org_role(organization_id, ''manager'') AND user_id = auth.uid()'),
    ('investigations_delete_policy', 'investigations', 'd', 'authenticated', 'user_has_org_role(organization_id, ''manager'') AND user_id = auth.uid()', NULL::text),
    ('audit_events_select_policy', 'audit_events', 'r', 'authenticated', 'user_belongs_to_org(organization_id)', NULL::text),
    ('audit_events_insert_policy', 'audit_events', 'a', 'authenticated', NULL::text, 'user_id = auth.uid() AND organization_id IS NOT NULL AND user_belongs_to_org(organization_id)')
),
operational_tables(tablename) AS (
  VALUES
    ('assets'),
    ('source_records'),
    ('findings'),
    ('correlations')
),
expected_policies AS (
  SELECT * FROM special_policies
  UNION ALL
  SELECT tablename || '_select_policy', tablename, 'r', 'authenticated', 'user_belongs_to_org(organization_id)', NULL::text
  FROM operational_tables
  UNION ALL
  SELECT tablename || '_insert_policy', tablename, 'a', 'authenticated', NULL::text, 'user_has_org_role(organization_id, ''manager'')'
  FROM operational_tables
  UNION ALL
  SELECT tablename || '_update_policy', tablename, 'w', 'authenticated', 'user_has_org_role(organization_id, ''manager'')', 'user_has_org_role(organization_id, ''manager'')'
  FROM operational_tables
  UNION ALL
  SELECT tablename || '_delete_policy', tablename, 'd', 'authenticated', 'user_has_org_role(organization_id, ''admin'')', NULL::text
  FROM operational_tables
),
live_policies AS (
  SELECT
    p.tablename,
    p.policyname,
    p.permissive,
    p.cmd::text AS command,
    pol.polcmd::text AS polcmd,
    p.roles,
    p.qual AS using_expression,
    p.with_check AS check_expression,
    CASE
      WHEN p.qual IS NULL THEN NULL
      ELSE regexp_replace(
        replace(
          replace(regexp_replace(lower(p.qual), '[[:space:]]+', '', 'g'), '::pg_catalog.text', ''),
          '::text', ''
        ),
        '[()]', '', 'g'
      )
    END AS using_norm,
    CASE
      WHEN p.with_check IS NULL THEN NULL
      ELSE regexp_replace(
        replace(
          replace(regexp_replace(lower(p.with_check), '[[:space:]]+', '', 'g'), '::pg_catalog.text', ''),
          '::text', ''
        ),
        '[()]', '', 'g'
      )
    END AS check_norm
  FROM pg_policies p
  JOIN pg_class c
    ON c.relname = p.tablename
   AND c.relkind = 'r'
   AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  JOIN pg_policy pol
    ON pol.polrelid = c.oid
   AND pol.polname = p.policyname
  WHERE p.schemaname = 'public'
    AND p.tablename IN (SELECT table_name FROM expected_tables)
),
expected_norm AS (
  SELECT
    e.policyname,
    e.tablename,
    e.polcmd,
    e.role_name,
    e.using_expr,
    e.check_expr,
    CASE
      WHEN e.using_expr IS NULL THEN NULL
      ELSE regexp_replace(
        replace(
          replace(regexp_replace(lower(e.using_expr), '[[:space:]]+', '', 'g'), '::pg_catalog.text', ''),
          '::text', ''
        ),
        '[()]', '', 'g'
      )
    END AS using_norm,
    CASE
      WHEN e.check_expr IS NULL THEN NULL
      ELSE regexp_replace(
        replace(
          replace(regexp_replace(lower(e.check_expr), '[[:space:]]+', '', 'g'), '::pg_catalog.text', ''),
          '::text', ''
        ),
        '[()]', '', 'g'
      )
    END AS check_norm
  FROM expected_policies e
),
policy_match AS (
  SELECT
    e.policyname,
    e.tablename,
    e.polcmd AS expected_polcmd,
    e.role_name AS expected_role,
    l.command,
    l.polcmd,
    l.permissive,
    l.roles::text AS roles,
    l.using_expression,
    l.check_expression,
    l.using_norm,
    l.check_norm,
    (
      l.policyname IS NOT NULL
      AND l.polcmd = e.polcmd
      AND l.permissive = 'PERMISSIVE'
      AND l.roles::text[] = ARRAY[e.role_name]::text[]
      AND l.using_norm IS NOT DISTINCT FROM e.using_norm
      AND l.check_norm IS NOT DISTINCT FROM e.check_norm
    ) AS structure_ok,
    (
      l.policyname IS NOT NULL
      AND l.roles::text[] = ARRAY[e.role_name]::text[]
    ) AS role_ok,
    (
      l.roles IS NOT NULL
      AND 'authenticated'::name = ANY(l.roles)
    ) AS targets_authenticated
  FROM expected_norm e
  LEFT JOIN live_policies l
    ON l.tablename = e.tablename
   AND l.policyname = e.policyname
),
missing_policies AS (
  SELECT policyname, tablename
  FROM policy_match
  WHERE command IS NULL
),
unexpected_policies AS (
  SELECT l.policyname, l.tablename, l.command, l.roles::text AS roles, l.using_expression, l.check_expression
  FROM live_policies l
  WHERE NOT EXISTS (
    SELECT 1
    FROM expected_policies e
    WHERE e.policyname = l.policyname
      AND e.tablename = l.tablename
  )
),
expected_functions(proname, identity_arguments) AS (
  VALUES
    ('user_belongs_to_org', 'org_id uuid'),
    ('user_has_org_role', 'org_id uuid, req_role text'),
    ('ensure_demo_membership', ''),
    ('provision_organization_member', 'target_org uuid, target_user uuid, target_role text')
),
function_rows AS (
  SELECT
    e.proname,
    e.identity_arguments AS expected_identity,
    p.oid,
    CASE
      WHEN p.oid IS NULL THEN NULL
      ELSE pg_get_function_identity_arguments(p.oid)
    END AS identity_arguments,
    p.prosecdef,
    p.prosrc,
    CASE WHEN p.oid IS NULL THEN NULL ELSE pg_get_userbyid(p.proowner) END AS owner,
    (
      SELECT split_part(cfg, '=', 2)
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
      WHERE split_part(cfg, '=', 1) = 'search_path'
      LIMIT 1
    ) AS search_path,
    (
      SELECT regexp_replace(split_part(cfg, '=', 2), '[[:space:]]+', '', 'g')
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
      WHERE split_part(cfg, '=', 1) = 'search_path'
      LIMIT 1
    ) AS search_path_norm,
    CASE
      WHEN p.oid IS NULL OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN NULL
      ELSE has_function_privilege('anon', p.oid, 'EXECUTE')
    END AS anon_can_execute,
    CASE
      WHEN p.oid IS NULL OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN NULL
      ELSE has_function_privilege('authenticated', p.oid, 'EXECUTE')
    END AS authenticated_can_execute,
    CASE
      WHEN p.oid IS NULL THEN NULL
      ELSE has_function_privilege('public', p.oid, 'EXECUTE')
    END AS public_can_execute,
    CASE
      WHEN p.oid IS NULL OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN NULL
      ELSE has_function_privilege('service_role', p.oid, 'EXECUTE')
    END AS service_role_can_execute,
    (
      SELECT count(*)
      FROM pg_proc p2
      JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
      WHERE n2.nspname = 'public'
        AND p2.proname = e.proname
    ) AS overload_count
  FROM expected_functions e
  LEFT JOIN LATERAL (
    SELECT p.*
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = e.proname
  ) p ON true
),
roles_present AS (
  SELECT
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AS anon_exists,
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AS authenticated_exists,
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') AS service_role_exists
),
expected_triggers(table_name, trigger_name, function_name, tgtype) AS (
  VALUES
    ('organization_members', 'organization_members_protect', 'protect_organization_member_mutations', 31),
    ('assets', 'assets_org_immutable', 'reject_organization_id_change', 19),
    ('source_records', 'source_records_org_immutable', 'reject_organization_id_change', 19),
    ('findings', 'findings_org_immutable', 'reject_organization_id_change', 19),
    ('correlations', 'correlations_org_immutable', 'reject_organization_id_change', 19),
    ('investigations', 'investigations_org_immutable', 'reject_organization_id_change', 19),
    ('audit_events', 'audit_events_org_immutable', 'reject_organization_id_change', 19),
    ('audit_events', 'audit_events_sensitive_metadata', 'reject_sensitive_audit_metadata', 23)
),
row_counts AS (
  SELECT 'users'::text AS table_name, count(*)::bigint AS row_count FROM public.users
  UNION ALL SELECT 'organizations', count(*) FROM public.organizations
  UNION ALL SELECT 'organization_members', count(*) FROM public.organization_members
  UNION ALL SELECT 'assets', count(*) FROM public.assets
  UNION ALL SELECT 'source_records', count(*) FROM public.source_records
  UNION ALL SELECT 'findings', count(*) FROM public.findings
  UNION ALL SELECT 'correlations', count(*) FROM public.correlations
  UNION ALL SELECT 'investigations', count(*) FROM public.investigations
  UNION ALL SELECT 'audit_events', count(*) FROM public.audit_events
),
live_triggers AS (
  SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    t.tgenabled::text AS enabled_code,
    t.tgtype,
    proc.proname AS function_name,
    pg_get_triggerdef(t.oid) AS definition
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc proc ON proc.oid = t.tgfoid
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND c.relname IN (SELECT table_name FROM expected_tables)
),
trigger_match AS (
  SELECT
    e.table_name,
    e.trigger_name,
    e.function_name AS expected_function,
    e.tgtype AS expected_tgtype,
    l.function_name,
    l.enabled_code,
    l.tgtype,
    l.definition,
    (
      l.trigger_name IS NOT NULL
      AND l.function_name = e.function_name
      AND l.enabled_code IN ('O', 'A')
      AND l.tgtype = e.tgtype
    ) AS trigger_ok
  FROM expected_triggers e
  LEFT JOIN live_triggers l
    ON l.table_name = e.table_name
   AND l.trigger_name = e.trigger_name
),
flags AS (
  SELECT
    (
      (SELECT count(*) FROM table_facts) = 9
      AND COALESCE(bool_and(table_exists AND rls_enabled), false)
    ) AS rls_ok
  FROM table_facts
),
policy_flags AS (
  SELECT
    (SELECT count(*) FROM live_policies) AS total_policies,
    (SELECT count(*) FROM live_policies WHERE 'authenticated'::name = ANY(roles)) AS authenticated_policies,
    (SELECT count(*) FROM live_policies WHERE NOT ('authenticated'::name = ANY(roles))) AS other_policies,
    (SELECT count(*) FROM missing_policies) AS missing_policies,
    (SELECT count(*) FROM unexpected_policies) AS unexpected_policies,
    COALESCE((
      SELECT bool_and(role_ok)
      FROM policy_match
      WHERE expected_role = 'authenticated'
    ), false) AS authenticated_targets_ok,
    COALESCE((
      SELECT bool_and(structure_ok)
      FROM policy_match
      WHERE policyname IN (
        'org_insert_policy',
        'org_update_policy',
        'org_delete_policy',
        'member_insert_policy'
      )
    ), false) AS deny_ok,
    COALESCE((
      SELECT count(*) = 3 AND bool_and(structure_ok)
      FROM policy_match
      WHERE policyname IN (
        'users_select_policy',
        'users_insert_policy',
        'users_update_policy'
      )
    ), false) AS users_policies_ok,
    COALESCE((
      SELECT bool_and(structure_ok)
      FROM policy_match
      WHERE tablename IN (
        'assets',
        'source_records',
        'findings',
        'correlations',
        'investigations',
        'audit_events'
      )
    ), false) AS tenant_ok,
    COALESCE((
      SELECT bool_and(structure_ok)
      FROM policy_match
      WHERE policyname IN ('audit_events_select_policy', 'audit_events_insert_policy')
    ), false) AS audit_policies_ok,
    COALESCE((
      SELECT bool_and(structure_ok)
      FROM policy_match
      WHERE policyname IN ('member_update_policy', 'member_delete_policy')
    ), false) AS member_write_ok,
    COALESCE((
      SELECT bool_and(structure_ok)
      FROM policy_match
      WHERE policyname IN ('member_select_policy', 'org_select_policy')
    ), false) AS membership_read_ok,
    NOT EXISTS (
      SELECT 1
      FROM live_policies
      WHERE tablename = 'organization_members'
        AND polcmd = 'a'
        AND NOT (
          policyname = 'member_insert_policy'
          AND using_norm IS NULL
          AND check_norm = 'false'
        )
    ) AS membership_row_creation_contained,
    NOT EXISTS (
      SELECT 1
      FROM live_policies
      WHERE tablename = 'audit_events'
        AND polcmd IN ('w', 'd', '*')
    ) AS audit_has_no_mutation_policy,
    NOT EXISTS (
      SELECT 1
      FROM live_policies
      WHERE 'public'::name = ANY(roles)
        AND NOT (
          policyname IN (
            'org_insert_policy',
            'org_update_policy',
            'org_delete_policy',
            'member_insert_policy'
          )
          AND (
            (polcmd = 'a' AND using_norm IS NULL AND check_norm = 'false')
            OR (polcmd = 'w' AND using_norm = 'false' AND check_norm = 'false')
            OR (polcmd = 'd' AND using_norm = 'false' AND check_norm IS NULL)
          )
        )
    ) AS no_public_allow_policy
),
function_flags AS (
  SELECT
    COALESCE((
      SELECT bool_and(
        overload_count = 1
        AND identity_arguments = expected_identity
        AND prosecdef
        AND search_path_norm = 'public,pg_temp'
      )
      FROM function_rows
      WHERE proname IN ('user_belongs_to_org', 'user_has_org_role')
    ), false) AS helpers_shape_ok,
    COALESCE((
      SELECT bool_and(
        overload_count = 1
        AND identity_arguments IS NOT DISTINCT FROM expected_identity
        AND prosecdef
        AND search_path_norm = 'public,pg_temp'
        AND regexp_replace(lower(COALESCE(prosrc, '')), '[[:space:]]+', '', 'g') IN ('beginreturn;end;', 'beginreturn;end')
      )
      FROM function_rows
      WHERE proname = 'ensure_demo_membership'
    ), false) AS ensure_shape_ok,
    COALESCE((
      SELECT bool_and(
        overload_count = 1
        AND identity_arguments = expected_identity
        AND prosecdef
        AND search_path_norm = 'public,pg_temp'
      )
      FROM function_rows
      WHERE proname = 'provision_organization_member'
    ), false) AS provision_shape_ok,
    COALESCE((
      SELECT bool_and(
        authenticated_can_execute IS TRUE
        AND anon_can_execute IS FALSE
        AND public_can_execute IS FALSE
      )
      FROM function_rows
      WHERE proname IN ('user_belongs_to_org', 'user_has_org_role')
    ), false) AS helper_privs_ok,
    COALESCE((
      SELECT bool_and(
        authenticated_can_execute IS FALSE
        AND anon_can_execute IS FALSE
        AND public_can_execute IS FALSE
      )
      FROM function_rows
      WHERE proname IN ('ensure_demo_membership', 'provision_organization_member')
    ), false) AS browser_provision_privs_closed
  FROM roles_present
),
gate_rows AS (
  SELECT 1 AS ord, 'RLS' AS item,
    CASE WHEN (SELECT rls_ok FROM flags) THEN 'PASS' ELSE 'FAIL' END AS status
  UNION ALL
  SELECT 2, 'POLICY COUNT',
    CASE
      WHEN (SELECT total_policies = 33 AND authenticated_policies = 29 AND other_policies = 4 AND missing_policies = 0 AND unexpected_policies = 0 FROM policy_flags)
        THEN 'PASS'
      ELSE 'FAIL'
    END
  UNION ALL
  SELECT 3, 'AUTHENTICATED POLICY TARGETING',
    CASE
      WHEN (
        SELECT authenticated_targets_ok
          AND authenticated_policies = 29
          AND NOT EXISTS (
            SELECT 1
            FROM policy_match
            WHERE policyname IN (
              'org_insert_policy',
              'org_update_policy',
              'org_delete_policy',
              'member_insert_policy'
            )
              AND targets_authenticated IS TRUE
          )
        FROM policy_flags
      ) THEN 'PASS'
      ELSE 'FAIL'
    END
  UNION ALL
  SELECT 4, 'DENY POLICIES',
    CASE WHEN (SELECT deny_ok FROM policy_flags) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 5, 'FUNCTION PRIVILEGES',
    CASE
      WHEN NOT (SELECT helpers_shape_ok AND ensure_shape_ok AND provision_shape_ok FROM function_flags) THEN 'FAIL'
      WHEN NOT (SELECT anon_exists AND authenticated_exists FROM roles_present) THEN 'NOT VERIFIED'
      WHEN NOT (SELECT helper_privs_ok AND browser_provision_privs_closed FROM function_flags) THEN 'FAIL'
      WHEN (SELECT service_role_exists FROM roles_present)
        AND NOT (
          SELECT service_role_can_execute IS TRUE
          FROM function_rows
          WHERE proname = 'provision_organization_member'
        ) THEN 'FAIL'
      ELSE 'PASS'
    END
  UNION ALL
  SELECT 6, 'DEMO BOOTSTRAP CONTAINMENT',
    CASE
      WHEN NOT (SELECT ensure_shape_ok FROM function_flags) THEN 'FAIL'
      WHEN NOT (SELECT membership_row_creation_contained FROM policy_flags) THEN 'FAIL'
      WHEN NOT (SELECT anon_exists AND authenticated_exists FROM roles_present) THEN 'NOT VERIFIED'
      WHEN NOT (
        SELECT bool_and(
          authenticated_can_execute IS FALSE
          AND anon_can_execute IS FALSE
          AND public_can_execute IS FALSE
        )
        FROM function_rows
        WHERE proname = 'ensure_demo_membership'
      ) THEN 'FAIL'
      ELSE 'PASS'
    END
  UNION ALL
  SELECT 7, 'MEMBERSHIP PROTECTION',
    CASE
      WHEN NOT (
        SELECT COALESCE(bool_and(trigger_ok), false)
        FROM trigger_match
        WHERE trigger_name = 'organization_members_protect'
      ) THEN 'FAIL'
      WHEN NOT (SELECT member_write_ok AND membership_row_creation_contained FROM policy_flags) THEN 'FAIL'
      ELSE 'PASS'
    END
  UNION ALL
  SELECT 8, 'ORG IMMUTABILITY',
    CASE
      WHEN (
        SELECT count(*) = 6 AND COALESCE(bool_and(trigger_ok), false)
        FROM trigger_match
        WHERE trigger_name LIKE '%\_org\_immutable' ESCAPE '\'
      ) THEN 'PASS'
      ELSE 'FAIL'
    END
  UNION ALL
  SELECT 9, 'AUDIT PROTECTION',
    CASE
      WHEN NOT (SELECT audit_policies_ok AND audit_has_no_mutation_policy FROM policy_flags) THEN 'FAIL'
      WHEN NOT (
        SELECT COALESCE(bool_and(trigger_ok), false)
        FROM trigger_match
        WHERE trigger_name = 'audit_events_sensitive_metadata'
      ) THEN 'FAIL'
      ELSE 'PASS'
    END
  UNION ALL
  SELECT 10, 'TENANT ISOLATION POLICY STRUCTURE',
    CASE WHEN (SELECT tenant_ok FROM policy_flags) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 11, 'UNEXPECTED LEGACY ACCESS',
    CASE
      WHEN (
        SELECT unexpected_policies = 0
          AND missing_policies = 0
          AND no_public_allow_policy
          AND membership_row_creation_contained
          AND membership_read_ok
          AND member_write_ok
        FROM policy_flags
      ) THEN 'PASS'
      ELSE 'FAIL'
    END
  UNION ALL
  SELECT 12, 'USERS POLICIES',
    CASE
      WHEN (SELECT users_policies_ok FROM policy_flags) THEN 'PASS'
      ELSE 'FAIL'
    END
)
SELECT section, item, status, table_name, command, roles, using_expression, check_expression, detail
FROM (
  SELECT
    10 AS sort_key,
    'TABLE' AS section,
    table_name AS item,
    CASE WHEN table_exists AND rls_enabled THEN 'PRESENT' ELSE 'MISSING_OR_RLS_OFF' END AS status,
    table_name,
    NULL::text AS command,
    NULL::text AS roles,
    NULL::text AS using_expression,
    NULL::text AS check_expression,
    'rls_enabled=' || COALESCE(rls_enabled::text, 'MISSING')
      || '; rls_forced=' || COALESCE(rls_forced::text, 'MISSING') AS detail
  FROM table_facts

  UNION ALL
  SELECT
    20,
    'POLICY',
    policyname,
    CASE WHEN structure_ok THEN 'MATCH' ELSE 'MISMATCH' END,
    tablename,
    command,
    roles,
    using_expression,
    check_expression,
    'expected_role=' || expected_role || '; expected_command_code=' || expected_polcmd
  FROM policy_match

  UNION ALL
  SELECT
    30,
    'UNEXPECTED_POLICY',
    policyname,
    'UNEXPECTED',
    tablename,
    command,
    roles,
    using_expression,
    check_expression,
    NULL::text
  FROM unexpected_policies

  UNION ALL
  SELECT
    40,
    'FUNCTION',
    proname,
    CASE
      WHEN oid IS NULL
        OR overload_count <> 1
        OR identity_arguments IS DISTINCT FROM expected_identity
        OR prosecdef IS NOT TRUE
        OR search_path_norm IS DISTINCT FROM 'public,pg_temp'
      THEN 'MISMATCH'
      ELSE 'PRESENT'
    END,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    'identity=' || COALESCE(identity_arguments, 'MISSING')
      || '; security_definer=' || COALESCE(prosecdef::text, 'MISSING')
      || '; search_path=' || COALESCE(search_path, 'MISSING')
      || '; owner=' || COALESCE(owner, 'MISSING')
      || '; anon_execute=' || COALESCE(anon_can_execute::text, 'NOT VERIFIED')
      || '; authenticated_execute=' || COALESCE(authenticated_can_execute::text, 'NOT VERIFIED')
      || '; public_execute=' || COALESCE(public_can_execute::text, 'NOT VERIFIED')
      || '; service_role_execute=' || COALESCE(service_role_can_execute::text, 'ROLE ABSENT')
      || '; overloads=' || overload_count::text
  FROM function_rows

  UNION ALL
  SELECT
    50,
    'TRIGGER',
    trigger_name,
    CASE WHEN trigger_ok THEN 'MATCH' ELSE 'MISMATCH' END,
    table_name,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    COALESCE(definition, 'MISSING')
      || '; enabled_code=' || COALESCE(enabled_code, 'MISSING')
      || '; type_bits=' || COALESCE(tgtype::text, 'MISSING')
      || '; function=' || COALESCE(function_name, 'MISSING')
  FROM trigger_match

  UNION ALL
  SELECT
    60,
    'ROW_COUNT',
    table_name,
    'INFO',
    table_name,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    'informational row_count=' || row_count::text || '; no rows were modified'
  FROM row_counts

  UNION ALL
  SELECT
    70,
    'CONNECTOR',
    'connector security migration',
    'NOT COVERED',
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    'connector security migration = separate / not covered; connections and sync_jobs are not protected by this migration'

  UNION ALL
  SELECT
    90,
    'GATE',
    'P0-C1 LIVE SECURITY VERIFICATION',
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text

  UNION ALL
  SELECT
    100 + ord,
    'GATE',
    item,
    status,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text
  FROM gate_rows

  UNION ALL
  SELECT
    200,
    'GATE',
    'OVERALL',
    CASE
      WHEN EXISTS (SELECT 1 FROM gate_rows WHERE status = 'FAIL') THEN 'FAIL'
      WHEN EXISTS (SELECT 1 FROM gate_rows WHERE status = 'NOT VERIFIED') THEN 'BLOCKED'
      WHEN (SELECT count(*) FROM gate_rows WHERE status = 'PASS') = 12 THEN 'PASS'
      ELSE 'BLOCKED'
    END,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text,
    NULL::text
) report
ORDER BY sort_key, item;
