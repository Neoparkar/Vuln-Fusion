import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requireAuthorizedOrganization } from './organizationService';

export const assetService = {
  async getAssets(candidateOrganizationId: string) {
    if (!isSupabaseConfigured) return [];
    const organizationId = await requireAuthorizedOrganization(candidateOrganizationId);
    if (!organizationId) return [];
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async getSourceRecords(candidateOrganizationId: string) {
    if (!isSupabaseConfigured) return [];
    const organizationId = await requireAuthorizedOrganization(candidateOrganizationId);
    if (!organizationId) return [];
    const { data, error } = await supabase
      .from('source_records')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },
};
