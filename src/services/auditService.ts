import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const auditService = {
  async logEvent(organizationId: string | null, userId: string | null, action: string, entityType?: string, entityId?: string, metadata?: any) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      await supabase.from('audit_events').insert({
        organization_id: organizationId || DEMO_ORG_ID,
        user_id: userId,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || {},
      });
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  },
};
