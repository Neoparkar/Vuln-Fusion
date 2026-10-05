import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authorizeAuditEvent } from '../tenancy/organizationAuthority';
import { loadOwnMemberships } from './organizationService';

export const auditService = {
  async logEvent(
    organizationId: string | null,
    userId: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ) {
    if (!isSupabaseConfigured || !userId || !organizationId) return;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user || userData.user.id !== userId) return;

      const loaded = await loadOwnMemberships(userData.user.id);
      if (!loaded.ok) return;

      const decision = authorizeAuditEvent({
        actorUserId: userData.user.id,
        memberships: loaded.memberships,
        requestedOrganizationId: organizationId,
        requestedUserId: userId,
        metadata: metadata ?? {},
      });
      if (!decision.allowed || !decision.organizationId) return;

      await supabase.from('audit_events').insert({
        organization_id: decision.organizationId,
        user_id: userData.user.id,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata ?? {},
      });
    } catch (err) {
      console.error('Error logging audit event');
    }
  },
};
