/**
 * Synthetic presentation data stays in memory.
 * Real sessions must not write that dataset, and must not use a caller-supplied
 * organization id as a tenant.
 */
export const syncService = {
  async syncDemoDataIfNeeded(_candidateOrganizationId?: string | null) {
    return;
  },
};
