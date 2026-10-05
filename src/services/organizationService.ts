import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  deriveAuthorizedOrganizationId,
  normalizeTenancyRole,
  resolveAuthorizedOrganization,
  type OrganizationResolution,
  type TenancyMembership,
} from '../tenancy/organizationAuthority';

/**
 * Role written when a real session has no membership row.
 * An empty organization does not grant administrator.
 * Real sessions do not insert a membership to obtain this role.
 */
export function roleForMissingMembership(_existingOrgMemberCount: number | null | undefined): 'user' {
  return 'user';
}

export async function loadOwnMemberships(userId: string): Promise<
  | { ok: true; memberships: TenancyMembership[] }
  | { ok: false }
> {
  if (!isSupabaseConfigured || !userId) return { ok: false };
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id, user_id, role')
    .eq('user_id', userId);

  if (error || !data) return { ok: false };

  return {
    ok: true,
    memberships: data.map(row => ({
      organizationId: String(row.organization_id),
      userId: String(row.user_id),
      role: normalizeTenancyRole(row.role),
    })),
  };
}

/**
 * Tenant for the signed-in Supabase user.
 * candidateOrganizationId is verified against membership and is not authoritative.
 * This function does not join the demo organization.
 */
export async function resolveSessionOrganization(candidateOrganizationId?: string | null): Promise<OrganizationResolution> {
  if (!isSupabaseConfigured) {
    return resolveAuthorizedOrganization({
      configured: false,
      authenticatedUserId: null,
      memberships: null,
      queryFailed: false,
      candidateOrganizationId,
    });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return resolveAuthorizedOrganization({
      configured: true,
      authenticatedUserId: null,
      memberships: null,
      queryFailed: true,
      candidateOrganizationId,
    });
  }

  const loaded = await loadOwnMemberships(userData.user.id);
  if (!loaded.ok) {
    return resolveAuthorizedOrganization({
      configured: true,
      authenticatedUserId: userData.user.id,
      memberships: null,
      queryFailed: true,
      candidateOrganizationId,
    });
  }

  return resolveAuthorizedOrganization({
    configured: true,
    authenticatedUserId: userData.user.id,
    memberships: loaded.memberships,
    queryFailed: false,
    candidateOrganizationId,
  });
}

export async function requireAuthorizedOrganization(candidateOrganizationId?: string | null): Promise<string | null> {
  const resolution = await resolveSessionOrganization(candidateOrganizationId);
  return resolution.status === 'resolved' ? resolution.organizationId : null;
}

export const organizationService = {
  async getUserOrganizations(userId: string) {
    const loaded = await loadOwnMemberships(userId);
    if (!loaded.ok) return [];
    return loaded.memberships.map(membership => ({
      organization_id: membership.organizationId,
      role: membership.role,
    }));
  },

  async touchOwnProfile(userId: string, email: string) {
    if (!isSupabaseConfigured || !userId) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || userData.user.id !== userId) return;
    const { error } = await supabase.from('users').upsert({
      id: userData.user.id,
      email: email || userData.user.email || '',
      display_name: (email || userData.user.email || 'user').split('@')[0],
      last_login_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Error updating own user profile:', error.message);
    }
  },

  deriveAuthorizedOrganizationId,
};
