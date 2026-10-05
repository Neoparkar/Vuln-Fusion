import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requireAuthorizedOrganization } from './organizationService';

export const investigationService = {
  async createInvestigation(candidateOrganizationId: string, userId: string, title: string, assetId?: string) {
    if (!isSupabaseConfigured) return null;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user || userData.user.id !== userId) return null;
      const organizationId = await requireAuthorizedOrganization(candidateOrganizationId);
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('investigations')
        .insert({
          organization_id: organizationId,
          user_id: userData.user.id,
          asset_id: assetId || null,
          title,
          status: 'OPEN',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating investigation:', err);
      return null;
    }
  },

  async getInvestigations(candidateOrganizationId: string) {
    if (!isSupabaseConfigured) return [];
    try {
      const organizationId = await requireAuthorizedOrganization(candidateOrganizationId);
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('investigations')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching investigations:', err);
      return [];
    }
  },
};
