// ============================================================================
// TEMPORARY HACKATHON PRESENTATION MODE
// REMOVE AFTER HACKATHON
// NOT FOR PRODUCTION AUTHENTICATION
// The demo organization id is the presentation tenant only.
// Real Supabase sessions do not join it from this module.
// ============================================================================

import { DEMO_ORGANIZATION_ID } from '../tenancy/organizationAuthority';

export const VULNFUSION_DEMO_MODE = true;

export const DEMO_CREDENTIALS = {
  email: 'demo@vulnfusion.local',
  password: 'VulnFusion-Demo-2026!',
  displayName: 'VulnFusion Demo Admin',
  role: 'admin' as const,
  userId: 'demo-presentation-admin-001',
  orgId: DEMO_ORGANIZATION_ID,
};

export const DEMO_SESSION_STORAGE_KEY = 'vulnfusion_presentation_session_marker';
