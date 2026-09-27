import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const investigationService = {
  async createInvestigation(organizationId: string, userId: string, title: string, assetId?: string) {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('investigations')
        .insert({
          organization_id: organizationId,
          user_id: userId,
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

  async getInvestigations(organizationId: string) {
    if (!isSupabaseConfigured) return [];
    try {
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
