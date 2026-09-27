import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const assetService = {
  async getAssets(organizationId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async getSourceRecords(organizationId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('source_records')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },
};
