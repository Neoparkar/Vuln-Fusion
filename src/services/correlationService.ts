import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const correlationService = {
  async getCorrelations(organizationId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('correlations')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },
};
