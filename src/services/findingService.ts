import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requireAuthorizedOrganization } from './organizationService';

export const findingService = {
  async getFindings(candidateOrganizationId: string) {
    if (!isSupabaseConfigured) return [];
    const organizationId = await requireAuthorizedOrganization(candidateOrganizationId);
    if (!organizationId) return [];
    const { data, error } = await supabase
      .from('findings')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },
};
