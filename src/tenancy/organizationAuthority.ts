/**
 * Organization authority for real sessions.
 *
 * A server writer must call resolveAuthorizedOrganization with memberships
 * loaded for the authenticated user id from the verified session.
 * candidateOrganizationId is an untrusted input. It never selects a tenant
 * by itself, and a service-role writer must not trust a request body.
 *
 * No service-role credential belongs in this module, in Vite env vars,
 * in browser storage, or in Git.
 */

export const DEMO_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export type TenancyRole = 'admin' | 'manager' | 'user';

export interface TenancyMembership {
  organizationId: string;
  userId: string;
  role: TenancyRole;
}

export type OrganizationResolutionStatus =
  | 'resolved'
  | 'missing_membership'
  | 'ambiguous_membership'
  | 'candidate_rejected'
  | 'query_failed'
  | 'unconfigured'
  | 'unauthenticated';

export interface OrganizationResolution {
  status: OrganizationResolutionStatus;
  organizationId: string | null;
  role: TenancyRole;
  failClosed: boolean;
}

export interface OrganizationScope {
  organizationId: string | null;
  role: TenancyRole;
  source: 'presentation' | 'membership' | 'fail_closed';
}

export type ProtectedMutation =
  | 'asset_insert'
  | 'asset_update'
  | 'asset_delete'
  | 'source_record_insert'
  | 'source_record_update'
  | 'source_record_delete'
  | 'finding_insert'
  | 'finding_update'
  | 'finding_delete'
  | 'correlation_insert'
  | 'correlation_update'
  | 'correlation_delete'
  | 'investigation_insert'
  | 'investigation_update'
  | 'investigation_delete'
  | 'member_insert'
  | 'member_role_update'
  | 'member_delete'
  | 'organization_insert'
  | 'organization_update'
  | 'audit_insert';

const ROLE_RANK: Record<TenancyRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

const MUTATION_MINIMUM_ROLE: Record<ProtectedMutation, TenancyRole | 'denied'> = {
  asset_insert: 'manager',
  asset_update: 'manager',
  asset_delete: 'admin',
  source_record_insert: 'manager',
  source_record_update: 'manager',
  source_record_delete: 'admin',
  finding_insert: 'manager',
  finding_update: 'manager',
  finding_delete: 'admin',
  correlation_insert: 'manager',
  correlation_update: 'manager',
  correlation_delete: 'admin',
  investigation_insert: 'manager',
  investigation_update: 'manager',
  investigation_delete: 'manager',
  member_insert: 'denied',
  member_role_update: 'admin',
  member_delete: 'admin',
  organization_insert: 'denied',
  organization_update: 'denied',
  audit_insert: 'user',
};

const SENSITIVE_KEY = /(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|^token$|authorization|jwt|credential|service[_-]?role)/i;
const SENSITIVE_TEXT = /bearer\s+\S+|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|api[_-]?key\s*[:=]|password\s*[:=]/i;

export function normalizeTenancyRole(role: unknown): TenancyRole {
  if (role === 'admin' || role === 'manager' || role === 'user') return role;
  return 'user';
}

export function roleSatisfies(actor: TenancyRole, required: TenancyRole): boolean {
  return ROLE_RANK[actor] >= ROLE_RANK[required];
}

export function mutationAllowed(actor: TenancyRole, mutation: ProtectedMutation): boolean {
  const required = MUTATION_MINIMUM_ROLE[mutation];
  if (required === 'denied') return false;
  return roleSatisfies(actor, required);
}

function failClosed(status: OrganizationResolutionStatus): OrganizationResolution {
  return {
    status,
    organizationId: null,
    role: 'user',
    failClosed: true,
  };
}

function ownMemberships(userId: string, memberships: TenancyMembership[]): TenancyMembership[] {
  return memberships.filter(membership =>
    membership.userId === userId &&
    typeof membership.organizationId === 'string' &&
    membership.organizationId.trim() !== ''
  );
}

/**
 * Resolve the tenant for an authenticated user.
 * Membership rows must already be limited to data loaded for that user.
 * A supplied organization id is accepted only when one of those rows matches it.
 */
export function resolveAuthorizedOrganization(input: {
  configured: boolean;
  authenticatedUserId: string | null;
  memberships: TenancyMembership[] | null;
  queryFailed: boolean;
  candidateOrganizationId?: string | null;
}): OrganizationResolution {
  if (!input.configured) return failClosed('unconfigured');
  if (input.queryFailed || input.memberships == null) return failClosed('query_failed');
  if (!input.authenticatedUserId) return failClosed('unauthenticated');

  const own = ownMemberships(input.authenticatedUserId, input.memberships);
  const candidate = typeof input.candidateOrganizationId === 'string'
    ? input.candidateOrganizationId.trim()
    : '';

  if (candidate) {
    const match = own.find(membership => membership.organizationId === candidate);
    if (!match) return failClosed('candidate_rejected');
    return {
      status: 'resolved',
      organizationId: match.organizationId,
      role: normalizeTenancyRole(match.role),
      failClosed: false,
    };
  }

  if (own.length === 0) return failClosed('missing_membership');
  if (own.length > 1) return failClosed('ambiguous_membership');

  const membership = own[0];
  return {
    status: 'resolved',
    organizationId: membership.organizationId,
    role: normalizeTenancyRole(membership.role),
    failClosed: false,
  };
}

export function deriveAuthorizedOrganizationId(input: {
  configured: boolean;
  authenticatedUserId: string | null;
  memberships: TenancyMembership[] | null;
  queryFailed: boolean;
  candidateOrganizationId?: string | null;
}): string | null {
  return resolveAuthorizedOrganization(input).organizationId;
}

export function organizationScopeForSession(input: {
  isPresentationSession: boolean;
  presentationRole: TenancyRole | null;
  resolution: OrganizationResolution | null;
}): OrganizationScope {
  if (input.isPresentationSession && input.presentationRole) {
    return {
      organizationId: DEMO_ORGANIZATION_ID,
      role: input.presentationRole,
      source: 'presentation',
    };
  }

  if (input.resolution?.status === 'resolved' && input.resolution.organizationId) {
    return {
      organizationId: input.resolution.organizationId,
      role: input.resolution.role,
      source: 'membership',
    };
  }

  return {
    organizationId: null,
    role: 'user',
    source: 'fail_closed',
  };
}

export interface MembershipInsertDecision {
  allowed: boolean;
  assignedRole: TenancyRole | null;
  reason:
    | 'presentation_does_not_provision'
    | 'unauthenticated'
    | 'demo_org_claim_denied'
    | 'self_join_denied'
    | 'first_member_admin_denied'
    | 'authenticated_insert_denied';
}

/**
 * Authenticated sessions cannot insert memberships.
 * An empty organization does not grant administrator.
 * The demo organization is not claimable from this path.
 * Explicit membership creation belongs to a trusted provisioning action
 * outside the browser session.
 */
export function evaluateAuthenticatedMembershipInsert(input: {
  actorUserId: string | null;
  targetUserId: string;
  organizationId: string;
  requestedRole: TenancyRole;
  existingMemberCount: number;
  isPresentationSession: boolean;
}): MembershipInsertDecision {
  if (input.isPresentationSession) {
    return { allowed: false, assignedRole: null, reason: 'presentation_does_not_provision' };
  }
  if (!input.actorUserId) {
    return { allowed: false, assignedRole: null, reason: 'unauthenticated' };
  }
  if (input.organizationId === DEMO_ORGANIZATION_ID) {
    return { allowed: false, assignedRole: null, reason: 'demo_org_claim_denied' };
  }
  if (input.actorUserId === input.targetUserId) {
    return { allowed: false, assignedRole: null, reason: 'self_join_denied' };
  }
  if (input.requestedRole === 'admin' && input.existingMemberCount <= 0) {
    return { allowed: false, assignedRole: null, reason: 'first_member_admin_denied' };
  }
  return { allowed: false, assignedRole: null, reason: 'authenticated_insert_denied' };
}

/**
 * Role stored by an explicit trusted provision.
 * The member count is ignored so an empty organization cannot upgrade the role.
 */
export function roleForExplicitProvision(requestedRole: string, existingMemberCount: number): TenancyRole | null {
  void existingMemberCount;
  if (requestedRole === 'admin' || requestedRole === 'manager' || requestedRole === 'user') {
    return requestedRole;
  }
  return null;
}

function lastAdministratorBlocked(
  members: { userId: string; role: TenancyRole }[],
  targetUserId: string,
  nextRole: TenancyRole | null
): boolean {
  const target = members.find(member => member.userId === targetUserId);
  if (!target || target.role !== 'admin') return false;
  if (nextRole === 'admin') return false;
  return members.filter(member => member.role === 'admin').length <= 1;
}

export function evaluateMemberRoleChange(input: {
  actorUserId: string;
  members: { userId: string; role: TenancyRole }[];
  targetUserId: string;
  nextRole: TenancyRole;
}): { allowed: boolean; reason: string } {
  const actor = input.members.find(member => member.userId === input.actorUserId);
  if (!actor || actor.role !== 'admin') {
    return { allowed: false, reason: 'admin_required' };
  }
  if (lastAdministratorBlocked(input.members, input.targetUserId, input.nextRole)) {
    return { allowed: false, reason: 'last_administrator' };
  }
  if (input.actorUserId === input.targetUserId) {
    return { allowed: false, reason: 'self_role_change' };
  }
  return { allowed: true, reason: 'allowed' };
}

export function evaluateMemberRemoval(input: {
  actorUserId: string;
  members: { userId: string; role: TenancyRole }[];
  targetUserId: string;
}): { allowed: boolean; reason: string } {
  const actor = input.members.find(member => member.userId === input.actorUserId);
  if (!actor || actor.role !== 'admin') {
    return { allowed: false, reason: 'admin_required' };
  }
  if (lastAdministratorBlocked(input.members, input.targetUserId, null)) {
    return { allowed: false, reason: 'last_administrator' };
  }
  if (input.actorUserId === input.targetUserId) {
    return { allowed: false, reason: 'self_removal' };
  }
  return { allowed: true, reason: 'allowed' };
}

function containsSensitive(value: unknown, depth: number): boolean {
  if (depth > 8) return true;
  if (typeof value === 'string') return SENSITIVE_TEXT.test(value);
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.some(entry => containsSensitive(entry, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) =>
      SENSITIVE_KEY.test(key) || containsSensitive(entry, depth + 1)
    );
  }
  return true;
}

export function auditMetadataIsSafe(metadata: unknown): boolean {
  if (metadata == null) return true;
  if (typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  return !containsSensitive(metadata, 0);
}

export function authorizeAuditEvent(input: {
  actorUserId: string;
  memberships: TenancyMembership[];
  requestedOrganizationId: string | null;
  requestedUserId: string | null;
  metadata: unknown;
}): { allowed: boolean; organizationId: string | null; reason: string } {
  if (!input.requestedUserId || input.requestedUserId !== input.actorUserId) {
    return { allowed: false, organizationId: null, reason: 'user_mismatch' };
  }
  if (!input.requestedOrganizationId) {
    return { allowed: false, organizationId: null, reason: 'missing_organization' };
  }
  const membership = input.memberships.find(row =>
    row.userId === input.actorUserId && row.organizationId === input.requestedOrganizationId
  );
  if (!membership) {
    return { allowed: false, organizationId: null, reason: 'cross_tenant' };
  }
  if (!auditMetadataIsSafe(input.metadata)) {
    return { allowed: false, organizationId: null, reason: 'sensitive_metadata' };
  }
  return { allowed: true, organizationId: membership.organizationId, reason: 'allowed' };
}
