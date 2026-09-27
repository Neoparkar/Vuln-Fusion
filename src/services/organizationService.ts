import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const organizationService = {
  async getUserOrganizations(userId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, created_at)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user organizations:', error.message);
      return [];
    }
    return data || [];
  },

  async ensureDemoMembership(userId: string, email: string) {
    if (!isSupabaseConfigured) return;
    try {
      // Ensure user profile exists
      await supabase.from('users').upsert({
        id: userId,
        email,
        display_name: email.split('@')[0],
        last_login_at: new Date().toISOString(),
      });

      // Check if user is member of VulnFusion Demo org ('00000000-0000-0000-0000-000000000001')
      const demoOrgId = '00000000-0000-0000-0000-000000000001';
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', demoOrgId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMember) {
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', demoOrgId);

        const assignedRole = (count === 0) ? 'admin' : 'user';

        await supabase.from('organization_members').insert({
          organization_id: demoOrgId,
          user_id: userId,
          role: assignedRole,
        });
      }
    } catch (err) {
      console.error('Error ensuring demo organization membership:', err);
    }
  },
};
