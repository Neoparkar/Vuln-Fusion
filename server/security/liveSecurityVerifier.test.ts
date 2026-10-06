/**
 * P0-C1 static tests for the live security verifier.
 * These tests parse SQL. They do not connect to Supabase or execute SQL.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DENY_POLICIES,
  PROTECTED_TABLES,
  USERS_POLICIES,
  evaluateFunctions,
  evaluatePolicies,
  evaluateTriggers,
  liveFromExpected,
  liveFunctionsFromContracts,
  liveTriggersFromExpected,
  parseMigrationFunctions,
  parseMigrationPolicies,
  parseMigrationTriggers,
  parseVerifierFunctions,
  parseVerifierPolicies,
  parseVerifierTables,
  parseVerifierTriggers,
  policiesEqual,
  policyKey,
  stripSqlComments,
  type ExpectedPolicy,
  type FunctionContract,
  type LivePolicy,
} from './liveSecurityVerifierModel.ts';

interface VerifierTestResult {
  testId: string;
  testName: string;
  passed: boolean;
  details: string;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migrationSql = readFileSync(resolve(root, 'docs/phase0d_live_security_migration.sql'), 'utf8');
const verifierSql = readFileSync(resolve(root, 'docs/phase0d_live_security_verification.sql'), 'utf8');

function requireTrue(condition: boolean, detail: string): boolean {
  if (!condition) throw new Error(detail);
  return condition;
}

function byName(policies: ExpectedPolicy[], name: string): ExpectedPolicy {
  const found = policies.find(policy => policy.policyname === name);
  if (!found) throw new Error(`missing policy ${name}`);
  return found;
}

function indexPolicies(policies: ExpectedPolicy[]): Map<string, ExpectedPolicy> {
  const indexed = new Map<string, ExpectedPolicy>();
  for (const policy of policies) {
    const key = policyKey(policy);
    if (indexed.has(key)) throw new Error(`duplicate policy ${key}`);
    indexed.set(key, policy);
  }
  return indexed;
}

function cloneLive(policies: LivePolicy[]): LivePolicy[] {
  return policies.map(policy => ({ ...policy, roles: [...policy.roles] }));
}

function gateBody(sql: string): string {
  const start = sql.indexOf('gate_rows AS (');
  const end = sql.indexOf('SELECT section, item, status');
  if (start < 0 || end < start) throw new Error('gate_rows block missing');
  return sql.slice(start, end);
}

function contract(name: string, contracts: FunctionContract[]): FunctionContract {
  const found = contracts.find(item => item.name === name);
  if (!found) throw new Error(`missing function ${name}`);
  return found;
}

function run(): VerifierTestResult[] {
  const migrationPolicies = parseMigrationPolicies(migrationSql);
  const verifierPolicies = parseVerifierPolicies(verifierSql);
  const migrationIndex = indexPolicies(migrationPolicies);
  const verifierIndex = indexPolicies(verifierPolicies);
  const tables = parseVerifierTables(verifierSql);
  const migrationTriggers = parseMigrationTriggers(migrationSql);
  const verifierTriggers = parseVerifierTriggers(verifierSql);
  const migrationFunctions = parseMigrationFunctions(migrationSql);
  const verifierFunctions = parseVerifierFunctions(verifierSql);
  const executable = stripSqlComments(verifierSql);

  const checks: Array<{ testId: string; testName: string; assertion: () => boolean }> = [
    {
      testId: 'P0-C1-01',
      testName: 'expected inventory is 33 policies, 29 authenticated allow, 4 deny, 9 tables',
      assertion: () => {
        const allow = verifierPolicies.filter(policy => policy.role === 'authenticated');
        const deny = verifierPolicies.filter(policy => DENY_POLICIES.includes(policy.policyname as typeof DENY_POLICIES[number]));
        return requireTrue(verifierPolicies.length === 33, `verifier policies ${verifierPolicies.length}`)
          && requireTrue(migrationPolicies.length === 33, `migration policies ${migrationPolicies.length}`)
          && requireTrue(allow.length === 29, `allow ${allow.length}`)
          && requireTrue(deny.length === 4, `deny ${deny.length}`)
          && requireTrue(tables.length === 9, `tables ${tables.length}`)
          && requireTrue(PROTECTED_TABLES.every((table, index) => tables[index] === table), tables.join(','))
          && requireTrue(!tables.includes('connections') && !tables.includes('sync_jobs'), 'connector tables entered the inventory');
      },
    },
    {
      testId: 'P0-C1-02',
      testName: 'verifier policy inventory matches the hardened migration',
      assertion: () => {
        requireTrue(migrationIndex.size === verifierIndex.size, 'inventory sizes differ');
        for (const [key, policy] of migrationIndex) {
          const expected = verifierIndex.get(key);
          requireTrue(expected !== undefined && policiesEqual(policy, expected), `policy drift ${key}`);
        }
        return migrationIndex.size === 33;
      },
    },
    {
      testId: 'P0-C1-03',
      testName: 'users policies record name, command, role, USING, and WITH CHECK',
      assertion: () => {
        const select = byName(verifierPolicies, 'users_select_policy');
        const insert = byName(verifierPolicies, 'users_insert_policy');
        const update = byName(verifierPolicies, 'users_update_policy');
        const migrationSelect = byName(migrationPolicies, 'users_select_policy');
        return requireTrue(USERS_POLICIES.every(name => verifierIndex.has(`users.${name}`)), 'users policy missing')
          && requireTrue(select.tablename === 'users' && select.polcmd === 'r' && select.role === 'authenticated', 'users select shape')
          && requireTrue(select.usingExpr !== null && select.usingExpr.includes('EXISTS') && select.checkExpr === null, 'users select expressions')
          && requireTrue(policiesEqual(select, migrationSelect), 'users select drift')
          && requireTrue(insert.polcmd === 'a' && insert.role === 'authenticated' && insert.usingExpr === null && insert.checkExpr === 'id = auth.uid()', 'users insert')
          && requireTrue(update.polcmd === 'w' && update.role === 'authenticated' && update.usingExpr === 'id = auth.uid()' && update.checkExpr === 'id = auth.uid()', 'users update')
          && requireTrue(verifierSql.includes('users_policies_ok') && gateBody(verifierSql).includes("'USERS POLICIES'"), 'users gate missing');
      },
    },
    {
      testId: 'P0-C1-04',
      testName: 'unexpected legacy policy fails the verifier',
      assertion: () => {
        const live = liveFromExpected(verifierPolicies);
        const clean = evaluatePolicies(verifierPolicies, live);
        live.push({
          policyname: 'legacy_permissive_policy',
          tablename: 'findings',
          polcmd: 'r',
          role: 'authenticated',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          usingExpr: 'true',
          checkExpr: null,
        });
        const dirty = evaluatePolicies(verifierPolicies, live);
        return requireTrue(clean.policyCountOk && clean.legacyAccessOk && clean.unexpectedPolicies.length === 0, 'clean catalog did not pass')
          && requireTrue(dirty.unexpectedPolicies.includes('legacy_permissive_policy'), 'legacy policy ignored')
          && requireTrue(dirty.policyCountOk === false && dirty.legacyAccessOk === false, 'legacy policy did not fail')
          && requireTrue(verifierSql.includes('unexpected_policies = 0'), 'verifier does not fail unexpected policies');
      },
    },
    {
      testId: 'P0-C1-05',
      testName: 'authenticated targeting uses the role array and rejects PUBLIC',
      assertion: () => {
        const live = cloneLive(liveFromExpected(verifierPolicies));
        const asset = live.find(policy => policy.policyname === 'assets_select_policy');
        if (!asset) throw new Error('assets select missing');
        asset.roles = ['public'];
        asset.usingExpr = 'authenticated = authenticated';
        const substituted = evaluatePolicies(verifierPolicies, live);
        const both = cloneLive(liveFromExpected(verifierPolicies));
        const member = both.find(policy => policy.policyname === 'member_select_policy');
        if (!member) throw new Error('member select missing');
        member.roles = ['authenticated', 'public'];
        const mixed = evaluatePolicies(verifierPolicies, both);
        return requireTrue(substituted.authenticatedTargetingOk === false, 'PUBLIC role was accepted')
          && requireTrue(substituted.authenticatedPolicies === 28, `authenticated count ${substituted.authenticatedPolicies}`)
          && requireTrue(mixed.authenticatedTargetingOk === false, 'mixed PUBLIC role was accepted')
          && requireTrue(verifierSql.includes("l.roles::text[] = ARRAY[e.role_name]::text[]"), 'exact role array check missing')
          && requireTrue(!verifierSql.includes("LIKE '%authenticated%'"), 'authenticated check is a text search');
      },
    },
    {
      testId: 'P0-C1-06',
      testName: 'the four deny policies stay deny policies',
      assertion: () => {
        const denyNames = [...DENY_POLICIES];
        const deny = denyNames.map(name => byName(verifierPolicies, name));
        const allowNames = new Set(verifierPolicies.filter(policy => policy.role === 'authenticated').map(policy => policy.policyname));
        const live = cloneLive(liveFromExpected(verifierPolicies));
        const orgInsert = live.find(policy => policy.policyname === 'org_insert_policy');
        if (!orgInsert) throw new Error('org insert missing');
        orgInsert.roles = ['authenticated'];
        const promoted = evaluatePolicies(verifierPolicies, live);
        return requireTrue(deny.every(policy => policy.role === 'public' && !allowNames.has(policy.policyname)), 'deny counted as allow')
          && requireTrue(byName(migrationPolicies, 'org_insert_policy').role === 'public', 'migration deny gained a role')
          && requireTrue(byName(verifierPolicies, 'org_insert_policy').polcmd === 'a' && byName(verifierPolicies, 'org_insert_policy').checkExpr === 'false' && byName(verifierPolicies, 'org_insert_policy').usingExpr === null, 'org insert deny shape')
          && requireTrue(byName(verifierPolicies, 'org_update_policy').polcmd === 'w' && byName(verifierPolicies, 'org_update_policy').usingExpr === 'false' && byName(verifierPolicies, 'org_update_policy').checkExpr === 'false', 'org update deny shape')
          && requireTrue(byName(verifierPolicies, 'org_delete_policy').polcmd === 'd' && byName(verifierPolicies, 'org_delete_policy').usingExpr === 'false' && byName(verifierPolicies, 'org_delete_policy').checkExpr === null, 'org delete deny shape')
          && requireTrue(byName(verifierPolicies, 'member_insert_policy').polcmd === 'a' && byName(verifierPolicies, 'member_insert_policy').checkExpr === 'false', 'member insert deny shape')
          && requireTrue(promoted.denyOk === false && promoted.authenticatedTargetingOk === false, 'promoted deny was still accepted')
          && requireTrue(gateBody(verifierSql).includes('targets_authenticated IS TRUE'), 'deny role check missing');
      },
    },
    {
      testId: 'P0-C1-07',
      testName: 'function privileges match the migration',
      assertion: () => {
        const names = ['user_belongs_to_org', 'user_has_org_role', 'ensure_demo_membership', 'provision_organization_member'];
        requireTrue(names.every(name => verifierFunctions.some(item => item.name === name)), 'verifier function list');
        for (const name of names) {
          const parsed = contract(name, migrationFunctions);
          const listed = verifierFunctions.find(item => item.name === name);
          requireTrue(listed?.identity === parsed.identity, `${name} identity`);
          requireTrue(parsed.securityDefiner, `${name} security definer`);
          requireTrue(parsed.searchPath.replace(/\s+/g, '') === 'public,pg_temp', `${name} search_path`);
        }
        requireTrue(contract('user_belongs_to_org', migrationFunctions).authenticatedExecute, 'helper grant');
        requireTrue(!contract('user_belongs_to_org', migrationFunctions).publicExecute && !contract('user_belongs_to_org', migrationFunctions).anonExecute, 'helper revoke');
        requireTrue(!contract('ensure_demo_membership', migrationFunctions).authenticatedExecute, 'ensure still granted to authenticated');
        requireTrue(!contract('ensure_demo_membership', migrationFunctions).publicExecute && !contract('ensure_demo_membership', migrationFunctions).anonExecute, 'ensure browser revoke');
        requireTrue(!contract('provision_organization_member', migrationFunctions).authenticatedExecute, 'provision browser grant');
        requireTrue(contract('provision_organization_member', migrationFunctions).serviceRoleExecute === 'if_role_exists', 'provision service_role grant');
        const roles = { anon: true, authenticated: true, serviceRole: true };
        const baseline = evaluateFunctions(liveFunctionsFromContracts(migrationFunctions, roles), roles);
        const ensureOpen = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'ensure_demo_membership' ? { ...row, authenticatedExecute: true } : row
        ));
        const provisionAnon = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'provision_organization_member' ? { ...row, anonExecute: true } : row
        ));
        const notDefiner = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'ensure_demo_membership' ? { ...row, prosecdef: false } : row
        ));
        const wrongPath = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'provision_organization_member' ? { ...row, searchPath: 'public' } : row
        ));
        const noService = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'provision_organization_member' ? { ...row, serviceRoleExecute: false } : row
        ));
        const absentService = evaluateFunctions(
          liveFunctionsFromContracts(migrationFunctions, { ...roles, serviceRole: false }),
          { ...roles, serviceRole: false },
        );
        const helperPublic = liveFunctionsFromContracts(migrationFunctions, roles).map(row => (
          row.name === 'user_has_org_role' ? { ...row, publicExecute: true } : row
        ));
        return requireTrue(baseline.status === 'PASS' && baseline.browserProvisionPrivsClosed && baseline.ensureBrowserClosed, `baseline ${baseline.status}`)
          && requireTrue(evaluateFunctions(ensureOpen, roles).status === 'FAIL', 'ensure authenticated execute accepted')
          && requireTrue(evaluateFunctions(provisionAnon, roles).status === 'FAIL', 'provision anon execute accepted')
          && requireTrue(evaluateFunctions(notDefiner, roles).ensureShapeOk === false, 'missing security definer accepted')
          && requireTrue(evaluateFunctions(wrongPath, roles).provisionShapeOk === false, 'wrong search_path accepted')
          && requireTrue(evaluateFunctions(noService, roles).status === 'FAIL', 'missing service_role grant accepted')
          && requireTrue(absentService.status === 'PASS', 'absent service_role failed')
          && requireTrue(evaluateFunctions(helperPublic, roles).helperPrivsOk === false, 'helper PUBLIC execute accepted')
          && requireTrue(executable.includes("search_path_norm = 'public,pg_temp'"), 'verifier search_path check')
          && requireTrue(executable.includes('browser_provision_privs_closed'), 'verifier browser revoke check')
          && requireTrue(executable.includes('service_role_can_execute IS TRUE'), 'verifier service_role check');
      },
    },
    {
      testId: 'P0-C1-08',
      testName: 'security triggers are matched by name, table, function, and type',
      assertion: () => {
        requireTrue(migrationTriggers.length === verifierTriggers.length, 'trigger count');
        for (const trigger of migrationTriggers) {
          const expected = verifierTriggers.find(item => item.triggerName === trigger.triggerName);
          if (!expected) throw new Error(`verifier missing ${trigger.triggerName}`);
          requireTrue(expected.tableName === trigger.tableName && expected.functionName === trigger.functionName && expected.tgtype === trigger.tgtype, `${trigger.triggerName} drift`);
        }
        const names = verifierTriggers.map(trigger => `${trigger.tableName}.${trigger.triggerName}`).sort();
        const expectedNames = [
          'assets.assets_org_immutable',
          'audit_events.audit_events_org_immutable',
          'audit_events.audit_events_sensitive_metadata',
          'correlations.correlations_org_immutable',
          'findings.findings_org_immutable',
          'investigations.investigations_org_immutable',
          'organization_members.organization_members_protect',
          'source_records.source_records_org_immutable',
        ];
        const baseline = evaluateTriggers(verifierTriggers, liveTriggersFromExpected(verifierTriggers));
        const missingMembership = evaluateTriggers(
          verifierTriggers,
          liveTriggersFromExpected(verifierTriggers).filter(trigger => trigger.triggerName !== 'organization_members_protect'),
        );
        const wrongTable = liveTriggersFromExpected(verifierTriggers).map(trigger => (
          trigger.triggerName === 'audit_events_sensitive_metadata' ? { ...trigger, tableName: 'users' } : trigger
        ));
        const wrongFunction = liveTriggersFromExpected(verifierTriggers).map(trigger => (
          trigger.triggerName === 'assets_org_immutable' ? { ...trigger, functionName: 'protect_organization_member_mutations' } : trigger
        ));
        return requireTrue(names.join(',') === expectedNames.join(','), names.join(','))
          && requireTrue(baseline.allExpectedOk && baseline.membershipOk && baseline.orgImmutableOk && baseline.auditMetadataOk, 'baseline triggers')
          && requireTrue(missingMembership.membershipOk === false, 'missing membership trigger accepted')
          && requireTrue(evaluateTriggers(verifierTriggers, wrongTable).auditMetadataOk === false, 'wrong audit table accepted')
          && requireTrue(evaluateTriggers(verifierTriggers, wrongFunction).allExpectedOk === false, 'wrong trigger function accepted')
          && requireTrue(gateBody(verifierSql).includes('organization_members_protect'), 'membership trigger gate')
          && requireTrue(gateBody(verifierSql).includes('audit_events_sensitive_metadata'), 'audit trigger gate');
      },
    },
    {
      testId: 'P0-C1-09',
      testName: 'row counts are informational reads and are not hard-coded',
      assertion: () => {
        const counted = PROTECTED_TABLES.every(table => executable.includes(`count(*) FROM public.${table}`) || executable.includes(`count(*)::bigint AS row_count FROM public.${table}`));
        return requireTrue(counted, 'a protected table has no count')
          && requireTrue(verifierSql.includes("'ROW_COUNT'") && verifierSql.includes("'INFO'"), 'row count report')
          && requireTrue(!gateBody(verifierSql).includes('ROW_COUNT'), 'row count became a gate')
          && requireTrue(!/row_count\s*=\s*\d+/i.test(verifierSql), 'hard-coded row count')
          && requireTrue(!/^\s*(delete|update|truncate|drop\s+table|insert)\b/im.test(executable), 'verifier writes data');
      },
    },
    {
      testId: 'P0-C1-10',
      testName: 'connector security is reported as separate and not covered',
      assertion: () => {
        return requireTrue(verifierSql.includes('connector security migration = separate / not covered'), 'connector status text')
          && requireTrue(verifierSql.includes("'NOT COVERED'"), 'connector status')
          && requireTrue(!/from\s+(public\.)?(connections|sync_jobs)\b/i.test(executable), 'verifier reads connector tables')
          && requireTrue(!tables.includes('connections') && !tables.includes('sync_jobs'), 'connector tables verified here');
      },
    },
    {
      testId: 'P0-C1-11',
      testName: 'missing users policy and exact allow-role catalog are distinguished',
      assertion: () => {
        const removed = liveFromExpected(verifierPolicies).filter(policy => policy.policyname !== 'users_update_policy');
        const missing = evaluatePolicies(verifierPolicies, removed);
        const intact = evaluatePolicies(verifierPolicies, liveFromExpected(verifierPolicies));
        return requireTrue(missing.usersPoliciesOk === false && missing.missingPolicies.includes('users_update_policy'), 'missing users policy accepted')
          && requireTrue(intact.usersPoliciesOk && intact.denyOk && intact.authenticatedTargetingOk && intact.policyCountOk, 'exact catalog failed')
          && requireTrue(intact.authenticatedPolicies === 29 && intact.otherPolicies === 4 && intact.totalPolicies === 33, 'exact counts')
          && requireTrue(gateBody(verifierSql).includes('total_policies = 33') && gateBody(verifierSql).includes('authenticated_policies = 29') && gateBody(verifierSql).includes('other_policies = 4'), 'stale numeric gate')
          && requireTrue(verifierSql.includes('(SELECT count(*) FROM table_facts) = 9'), 'stale table count')
          && requireTrue(verifierSql.includes("status = 'PASS') = 12"), 'stale overall count');
      },
    },
  ];

  return checks.map(check => {
    try {
      const passed = check.assertion();
      return {
        testId: check.testId,
        testName: check.testName,
        passed,
        details: passed ? `${check.testName} assertion held` : `${check.testName} assertion failed`,
      };
    } catch (error) {
      return {
        testId: check.testId,
        testName: check.testName,
        passed: false,
        details: error instanceof Error ? error.message : 'assertion threw',
      };
    }
  });
}

export function executeLiveSecurityVerifierTests(): VerifierTestResult[] {
  return run();
}

const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry.endsWith('liveSecurityVerifier.test.ts')) {
  const results = run();
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.testId} ${result.details}`);
  }
  const failed = results.filter(result => !result.passed).length;
  console.log(`P0-C1 verifier ${results.length - failed}/${results.length} passed`);
  if (failed > 0) process.exit(1);
}
