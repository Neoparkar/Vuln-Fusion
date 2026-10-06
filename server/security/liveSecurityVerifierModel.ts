/**
 * Static model of docs/phase0d_live_security_verification.sql.
 * Parses the migration and the verifier. Does not connect to a database.
 */

export interface ExpectedPolicy {
  policyname: string;
  tablename: string;
  polcmd: string;
  role: string;
  usingExpr: string | null;
  checkExpr: string | null;
}

export interface LivePolicy extends ExpectedPolicy {
  permissive: string;
  roles: string[];
}

export interface ExpectedTrigger {
  tableName: string;
  triggerName: string;
  functionName: string;
  tgtype: number;
}

export interface LiveTrigger {
  tableName: string;
  triggerName: string;
  functionName: string;
  enabledCode: string;
  tgtype: number;
}

export interface FunctionContract {
  name: string;
  identity: string;
  securityDefiner: boolean;
  searchPath: string;
  publicExecute: boolean;
  anonExecute: boolean;
  authenticatedExecute: boolean;
  serviceRoleExecute: 'if_role_exists' | 'not_granted';
}

export interface LiveFunction {
  name: string;
  identity: string;
  prosecdef: boolean;
  searchPath: string;
  prosrc: string;
  anonExecute: boolean | null;
  authenticatedExecute: boolean | null;
  publicExecute: boolean | null;
  serviceRoleExecute: boolean | null;
  overloads: number;
}

export interface RolePresence {
  anon: boolean;
  authenticated: boolean;
  serviceRole: boolean;
}

export const DENY_POLICIES = [
  'org_insert_policy',
  'org_update_policy',
  'org_delete_policy',
  'member_insert_policy',
] as const;

export const USERS_POLICIES = [
  'users_select_policy',
  'users_insert_policy',
  'users_update_policy',
] as const;

export const PROTECTED_TABLES = [
  'users',
  'organizations',
  'organization_members',
  'assets',
  'source_records',
  'findings',
  'correlations',
  'investigations',
  'audit_events',
] as const;

const COMMAND_CODE: Record<string, string> = {
  SELECT: 'r',
  INSERT: 'a',
  UPDATE: 'w',
  DELETE: 'd',
};

const TRIGGER_BEFORE = 2;
const TRIGGER_INSERT = 4;
const TRIGGER_DELETE = 8;
const TRIGGER_UPDATE = 16;
const TRIGGER_ROW = 1;

export function normalizeExpr(expr: string | null): string | null {
  if (expr === null) return null;
  return expr
    .toLowerCase()
    .replace(/\s+/g, '')
    .replaceAll('::pg_catalog.text', '')
    .replaceAll('::text', '')
    .replace(/[()]/g, '');
}

export function normalizeSearchPath(path: string): string {
  return path.toLowerCase().replace(/\s+/g, '');
}

export function normalizeFunctionBody(source: string): string {
  return source.toLowerCase().replace(/\s+/g, '');
}

function extractBalanced(sql: string, openIndex: number): string {
  let depth = 0;
  let quote = false;
  for (let i = openIndex; i < sql.length; i += 1) {
    const ch = sql[i];
    if (quote) {
      if (ch === "'" && sql[i + 1] === "'") {
        i += 1;
        continue;
      }
      if (ch === "'") quote = false;
      continue;
    }
    if (ch === "'") {
      quote = true;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return sql.slice(openIndex + 1, i);
    }
  }
  throw new Error('unbalanced parentheses');
}

export function extractCteBody(sql: string, name: string): string {
  const marker = new RegExp(`\\b${name}\\s*(?:\\([^)]*\\))?\\s*AS\\s*\\(`, 'i');
  const match = marker.exec(sql);
  if (!match) throw new Error(`missing CTE ${name}`);
  const openIndex = match.index + match[0].length - 1;
  return extractBalanced(sql, openIndex);
}

function unescapeSqlString(literal: string): string | null {
  const trimmed = literal.trim();
  if (/^null(?:::[a-z0-9_]+)?$/i.test(trimmed)) return null;
  if (!trimmed.startsWith("'")) return trimmed;
  let out = '';
  for (let i = 1; i < trimmed.length; i += 1) {
    if (trimmed[i] === "'") {
      if (trimmed[i + 1] === "'") {
        out += "'";
        i += 1;
        continue;
      }
      break;
    }
    out += trimmed[i];
  }
  return out;
}

function splitTuples(body: string): string[][] {
  const valuesAt = body.search(/\bVALUES\b/i);
  const source = valuesAt >= 0 ? body.slice(valuesAt + 'VALUES'.length) : body;
  const tuples: string[][] = [];
  let quote = false;
  let depth = 0;
  let field = '';
  let fields: string[] | null = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      field += ch;
      if (ch === "'" && source[i + 1] === "'") {
        field += source[i + 1];
        i += 1;
        continue;
      }
      if (ch === "'") quote = false;
      continue;
    }
    if (ch === "'") {
      quote = true;
      field += ch;
      continue;
    }
    if (ch === '(') {
      if (depth === 0) {
        fields = [];
        field = '';
      } else {
        field += ch;
      }
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth -= 1;
      if (depth === 0 && fields) {
        fields.push(field);
        tuples.push(fields);
        fields = null;
        field = '';
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === ',' && depth === 1 && fields) {
      fields.push(field);
      field = '';
      continue;
    }
    if (depth >= 1) field += ch;
  }
  return tuples;
}

function tupleToPolicy(fields: string[]): ExpectedPolicy {
  if (fields.length !== 6) throw new Error(`policy tuple width ${fields.length}`);
  return {
    policyname: unescapeSqlString(fields[0]) ?? '',
    tablename: unescapeSqlString(fields[1]) ?? '',
    polcmd: unescapeSqlString(fields[2]) ?? '',
    role: unescapeSqlString(fields[3]) ?? '',
    usingExpr: unescapeSqlString(fields[4]),
    checkExpr: unescapeSqlString(fields[5]),
  };
}

export function parseVerifierPolicies(sql: string): ExpectedPolicy[] {
  const special = splitTuples(extractCteBody(sql, 'special_policies')).map(tupleToPolicy);
  const operational = splitTuples(extractCteBody(sql, 'operational_tables')).map(fields => {
    if (fields.length !== 1) throw new Error('operational table tuple width');
    return unescapeSqlString(fields[0]) ?? '';
  });
  const expectedBody = extractCteBody(sql, 'expected_policies');
  const templates: Array<{ suffix: string; polcmd: string; role: string; usingExpr: string | null; checkExpr: string | null }> = [];
  const template = /SELECT\s+tablename\s+\|\|\s+'(_[a-z_]+)'\s*,\s*tablename\s*,\s*'([radw])'\s*,\s*'([a-z_]+)'\s*,\s*(NULL::text|'(?:''|[^'])*')\s*,\s*(NULL::text|'(?:''|[^'])*')/gi;
  for (const match of expectedBody.matchAll(template)) {
    templates.push({
      suffix: match[1],
      polcmd: match[2],
      role: match[3],
      usingExpr: unescapeSqlString(match[4]),
      checkExpr: unescapeSqlString(match[5]),
    });
  }
  if (templates.length !== 4) throw new Error(`expected 4 operational templates, found ${templates.length}`);
  const generated = operational.flatMap(tablename => templates.map(item => ({
    policyname: `${tablename}${item.suffix}`,
    tablename,
    polcmd: item.polcmd,
    role: item.role,
    usingExpr: item.usingExpr,
    checkExpr: item.checkExpr,
  })));
  return [...special, ...generated];
}

export function parseVerifierTables(sql: string): string[] {
  return splitTuples(extractCteBody(sql, 'expected_tables')).map(fields => {
    if (fields.length !== 1) throw new Error('expected table tuple width');
    return unescapeSqlString(fields[0]) ?? '';
  });
}

export function parseVerifierTriggers(sql: string): ExpectedTrigger[] {
  return splitTuples(extractCteBody(sql, 'expected_triggers')).map(fields => {
    if (fields.length !== 4) throw new Error('trigger tuple width');
    return {
      tableName: unescapeSqlString(fields[0]) ?? '',
      triggerName: unescapeSqlString(fields[1]) ?? '',
      functionName: unescapeSqlString(fields[2]) ?? '',
      tgtype: Number(fields[3].trim()),
    };
  });
}

export function parseVerifierFunctions(sql: string): Array<{ name: string; identity: string }> {
  return splitTuples(extractCteBody(sql, 'expected_functions')).map(fields => {
    if (fields.length !== 2) throw new Error('function tuple width');
    return {
      name: unescapeSqlString(fields[0]) ?? '',
      identity: unescapeSqlString(fields[1]) ?? '',
    };
  });
}

function extractClause(body: string, keyword: string): string | null {
  const match = new RegExp(`\\b${keyword}\\b`, 'i').exec(body);
  if (!match) return null;
  let i = match.index + match[0].length;
  while (body[i] && /\s/.test(body[i])) i += 1;
  if (body[i] !== '(') throw new Error(`expected parentheses after ${keyword}`);
  return extractBalanced(body, i).trim();
}

export function parseMigrationPolicies(sql: string): ExpectedPolicy[] {
  const policies: ExpectedPolicy[] = [];
  const re = /CREATE POLICY\s+([a-z0-9_]+)\s+ON\s+([a-z0-9_]+)\s+/gi;
  for (const match of sql.matchAll(re)) {
    const start = match.index + match[0].length;
    const end = sql.indexOf(';', start);
    if (end < 0) throw new Error(`unterminated policy ${match[1]}`);
    const body = sql.slice(start, end);
    const command = /FOR\s+(SELECT|INSERT|UPDATE|DELETE)/i.exec(body);
    if (!command) throw new Error(`missing command for ${match[1]}`);
    const roleMatch = /\bTO\s+([a-z0-9_]+)/i.exec(body);
    const role = roleMatch ? roleMatch[1].toLowerCase() : 'public';
    policies.push({
      policyname: match[1],
      tablename: match[2],
      polcmd: COMMAND_CODE[command[1].toUpperCase()],
      role,
      usingExpr: extractClause(body, 'USING'),
      checkExpr: extractClause(body, 'WITH CHECK'),
    });
  }
  return policies;
}

function functionIdentity(args: string): string {
  const trimmed = args.trim();
  if (!trimmed) return '';
  return trimmed.split(',').map(part => {
    const bits = part.trim().split(/\s+/);
    return `${bits[0]} ${bits.slice(1).join(' ').toLowerCase()}`;
  }).join(', ');
}

export function parseMigrationFunctions(sql: string): FunctionContract[] {
  const contracts: FunctionContract[] = [];
  const chunks = sql.split(/(?=CREATE OR REPLACE FUNCTION\s+)/);
  for (const chunk of chunks) {
    const header = /^CREATE OR REPLACE FUNCTION\s+([a-z0-9_]+)\s*\(([^)]*)\)/i.exec(chunk);
    if (!header) continue;
    const language = /\$\$[\s\S]*?\$\$\s*LANGUAGE[\s\S]*?;/i.exec(chunk);
    if (!language) throw new Error(`missing language clause for ${header[1]}`);
    const tail = language[0];
    contracts.push({
      name: header[1],
      identity: functionIdentity(header[2]),
      securityDefiner: /SECURITY\s+DEFINER/i.test(tail),
      searchPath: (/search_path\s*=\s*([^;]+)/i.exec(tail)?.[1] ?? '').trim(),
      publicExecute: !new RegExp(`REVOKE ALL ON FUNCTION\\s+${header[1]}\\s*\\([^)]*\\)\\s+FROM\\s+PUBLIC`, 'i').test(sql),
      anonExecute: !new RegExp(`REVOKE ALL ON FUNCTION\\s+${header[1]}\\s*\\([^)]*\\)\\s+FROM\\s+anon`, 'i').test(sql),
      authenticatedExecute: new RegExp(`GRANT EXECUTE ON FUNCTION\\s+${header[1]}\\s*\\([^)]*\\)\\s+TO\\s+authenticated`, 'i').test(sql)
        && !new RegExp(`REVOKE ALL ON FUNCTION\\s+${header[1]}\\s*\\([^)]*\\)\\s+FROM\\s+authenticated`, 'i').test(sql),
      serviceRoleExecute: new RegExp(`GRANT EXECUTE ON FUNCTION\\s+${header[1]}\\s*\\([^)]*\\)\\s+TO\\s+service_role`, 'i').test(sql)
        ? 'if_role_exists'
        : 'not_granted',
    });
  }
  return contracts;
}

export function triggerTypeBits(events: string[]): number {
  let bits = TRIGGER_ROW | TRIGGER_BEFORE;
  for (const event of events) {
    if (event === 'INSERT') bits |= TRIGGER_INSERT;
    if (event === 'DELETE') bits |= TRIGGER_DELETE;
    if (event === 'UPDATE') bits |= TRIGGER_UPDATE;
  }
  return bits;
}

export function parseMigrationTriggers(sql: string): ExpectedTrigger[] {
  const triggers: ExpectedTrigger[] = [];
  const re = /CREATE TRIGGER\s+([a-z0-9_]+)\s+BEFORE\s+((?:INSERT|UPDATE|DELETE|OR|\s)+?)\s+ON\s+([a-z0-9_]+)\s+FOR EACH ROW EXECUTE FUNCTION\s+([a-z0-9_]+)\s*\(\s*\)/gi;
  for (const match of sql.matchAll(re)) {
    const events = match[2].split(/\s+OR\s+/i).map(item => item.trim().toUpperCase());
    triggers.push({
      triggerName: match[1],
      tableName: match[3],
      functionName: match[4],
      tgtype: triggerTypeBits(events),
    });
  }
  return triggers;
}

export function policyKey(policy: ExpectedPolicy): string {
  return `${policy.tablename}.${policy.policyname}`;
}

export function policiesEqual(left: ExpectedPolicy, right: ExpectedPolicy): boolean {
  return left.policyname === right.policyname
    && left.tablename === right.tablename
    && left.polcmd === right.polcmd
    && left.role === right.role
    && normalizeExpr(left.usingExpr) === normalizeExpr(right.usingExpr)
    && normalizeExpr(left.checkExpr) === normalizeExpr(right.checkExpr);
}

export function rolesMatch(roles: string[], expectedRole: string): boolean {
  return roles.length === 1 && roles[0] === expectedRole;
}

export interface PolicyEvaluation {
  totalPolicies: number;
  authenticatedPolicies: number;
  otherPolicies: number;
  missingPolicies: string[];
  unexpectedPolicies: string[];
  policyCountOk: boolean;
  authenticatedTargetingOk: boolean;
  denyOk: boolean;
  usersPoliciesOk: boolean;
  legacyAccessOk: boolean;
  structureFailures: string[];
}

export function evaluatePolicies(expected: ExpectedPolicy[], live: LivePolicy[]): PolicyEvaluation {
  const missingPolicies: string[] = [];
  const structureFailures: string[] = [];
  const matches = expected.map(item => {
    const found = live.find(policy => policy.policyname === item.policyname && policy.tablename === item.tablename);
    if (!found) missingPolicies.push(item.policyname);
    const structureOk = Boolean(
      found
      && found.polcmd === item.polcmd
      && found.permissive === 'PERMISSIVE'
      && rolesMatch(found.roles, item.role)
      && normalizeExpr(found.usingExpr) === normalizeExpr(item.usingExpr)
      && normalizeExpr(found.checkExpr) === normalizeExpr(item.checkExpr),
    );
    if (found && !structureOk) structureFailures.push(item.policyname);
    return {
      expected: item,
      live: found,
      structureOk,
      targetsAuthenticated: Boolean(found && found.roles.includes('authenticated')),
    };
  });
  const unexpectedPolicies = live
    .filter(policy => !expected.some(item => item.policyname === policy.policyname && item.tablename === policy.tablename))
    .map(policy => policy.policyname);
  const authenticatedPolicies = live.filter(policy => policy.roles.includes('authenticated')).length;
  const otherPolicies = live.filter(policy => !policy.roles.includes('authenticated')).length;
  const authenticatedTargetsOk = matches
    .filter(item => item.expected.role === 'authenticated')
    .every(item => item.live !== undefined && rolesMatch(item.live.roles, 'authenticated'));
  const denyNotAuthenticated = DENY_POLICIES.every(name => {
    const match = matches.find(item => item.expected.policyname === name);
    return match?.targetsAuthenticated !== true;
  });
  const denyOk = DENY_POLICIES.every(name => matches.find(item => item.expected.policyname === name)?.structureOk === true);
  const usersPoliciesOk = USERS_POLICIES.length === 3
    && USERS_POLICIES.every(name => matches.find(item => item.expected.policyname === name)?.structureOk === true);
  const policyCountOk = live.length === 33
    && authenticatedPolicies === 29
    && otherPolicies === 4
    && missingPolicies.length === 0
    && unexpectedPolicies.length === 0;
  const legacyAccessOk = unexpectedPolicies.length === 0 && missingPolicies.length === 0;
  return {
    totalPolicies: live.length,
    authenticatedPolicies,
    otherPolicies,
    missingPolicies,
    unexpectedPolicies,
    policyCountOk,
    authenticatedTargetingOk: authenticatedTargetsOk && authenticatedPolicies === 29 && denyNotAuthenticated,
    denyOk,
    usersPoliciesOk,
    legacyAccessOk,
    structureFailures,
  };
}

export function liveFromExpected(expected: ExpectedPolicy[]): LivePolicy[] {
  return expected.map(policy => ({
    ...policy,
    permissive: 'PERMISSIVE',
    roles: [policy.role],
  }));
}

export interface FunctionEvaluation {
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  helpersShapeOk: boolean;
  ensureShapeOk: boolean;
  provisionShapeOk: boolean;
  helperPrivsOk: boolean;
  browserProvisionPrivsClosed: boolean;
  ensureBrowserClosed: boolean;
}

const EXPECTED_IDENTITIES: Record<string, string> = {
  user_belongs_to_org: 'org_id uuid',
  user_has_org_role: 'org_id uuid, req_role text',
  ensure_demo_membership: '',
  provision_organization_member: 'target_org uuid, target_user uuid, target_role text',
};

function shapeOk(row: LiveFunction | undefined, identity: string, body?: (source: string) => boolean): boolean {
  if (!row || row.overloads !== 1) return false;
  if (row.identity !== identity) return false;
  if (!row.prosecdef) return false;
  if (normalizeSearchPath(row.searchPath) !== 'public,pg_temp') return false;
  if (body && !body(row.prosrc)) return false;
  return true;
}

function browserClosed(row: LiveFunction | undefined): boolean {
  return Boolean(
    row
    && row.authenticatedExecute === false
    && row.anonExecute === false
    && row.publicExecute === false,
  );
}

export function evaluateFunctions(rows: LiveFunction[], roles: RolePresence): FunctionEvaluation {
  const find = (name: string) => rows.find(row => row.name === name);
  const helpers = ['user_belongs_to_org', 'user_has_org_role'].map(find);
  const ensure = find('ensure_demo_membership');
  const provision = find('provision_organization_member');
  const helpersShapeOk = helpers.every(row => shapeOk(row, EXPECTED_IDENTITIES[row?.name ?? '']));
  const ensureShapeOk = shapeOk(ensure, '', source => {
    const normalized = normalizeFunctionBody(source);
    return normalized === 'beginreturn;end;' || normalized === 'beginreturn;end';
  });
  const provisionShapeOk = shapeOk(provision, EXPECTED_IDENTITIES.provision_organization_member);
  const helperPrivsOk = helpers.every(row => row?.authenticatedExecute === true && row.anonExecute === false && row.publicExecute === false);
  const browserProvisionPrivsClosed = browserClosed(ensure) && browserClosed(provision);
  const ensureBrowserClosed = browserClosed(ensure);
  let status: FunctionEvaluation['status'] = 'PASS';
  if (!helpersShapeOk || !ensureShapeOk || !provisionShapeOk) status = 'FAIL';
  else if (!roles.anon || !roles.authenticated) status = 'NOT VERIFIED';
  else if (!helperPrivsOk || !browserProvisionPrivsClosed) status = 'FAIL';
  else if (roles.serviceRole && provision?.serviceRoleExecute !== true) status = 'FAIL';
  return {
    status,
    helpersShapeOk,
    ensureShapeOk,
    provisionShapeOk,
    helperPrivsOk,
    browserProvisionPrivsClosed,
    ensureBrowserClosed,
  };
}

export function liveFunctionsFromContracts(contracts: FunctionContract[], roles: RolePresence): LiveFunction[] {
  return contracts
    .filter(contract => contract.name in EXPECTED_IDENTITIES)
    .map(contract => ({
      name: contract.name,
      identity: contract.identity,
      prosecdef: contract.securityDefiner,
      searchPath: contract.searchPath,
      prosrc: contract.name === 'ensure_demo_membership' ? 'BEGIN RETURN; END;' : 'BEGIN RETURN FALSE; END;',
      anonExecute: roles.anon ? contract.anonExecute : null,
      authenticatedExecute: roles.authenticated ? contract.authenticatedExecute : null,
      publicExecute: contract.publicExecute,
      serviceRoleExecute: roles.serviceRole
        ? contract.serviceRoleExecute === 'if_role_exists'
        : null,
      overloads: 1,
    }));
}

export interface TriggerEvaluation {
  allExpectedOk: boolean;
  membershipOk: boolean;
  orgImmutableOk: boolean;
  auditMetadataOk: boolean;
  failures: string[];
}

export function evaluateTriggers(expected: ExpectedTrigger[], live: LiveTrigger[]): TriggerEvaluation {
  const failures: string[] = [];
  const matches = expected.map(item => {
    const found = live.find(trigger => trigger.tableName === item.tableName && trigger.triggerName === item.triggerName);
    const ok = Boolean(
      found
      && found.functionName === item.functionName
      && (found.enabledCode === 'O' || found.enabledCode === 'A')
      && found.tgtype === item.tgtype,
    );
    if (!ok) failures.push(`${item.tableName}.${item.triggerName}`);
    return { item, ok };
  });
  const immutable = matches.filter(item => item.item.triggerName.endsWith('_org_immutable'));
  return {
    allExpectedOk: matches.every(item => item.ok),
    membershipOk: matches.some(item => item.item.triggerName === 'organization_members_protect' && item.item.tableName === 'organization_members' && item.ok),
    orgImmutableOk: immutable.length === 6 && immutable.every(item => item.ok),
    auditMetadataOk: matches.some(item => item.item.triggerName === 'audit_events_sensitive_metadata' && item.item.tableName === 'audit_events' && item.ok),
    failures,
  };
}

export function liveTriggersFromExpected(expected: ExpectedTrigger[]): LiveTrigger[] {
  return expected.map(trigger => ({
    ...trigger,
    enabledCode: 'O',
  }));
}

export function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
}
