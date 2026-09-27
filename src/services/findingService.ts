import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const findingService = {
  async getFindings(organizationId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('findings')
      .select('*')
      .eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },
};
