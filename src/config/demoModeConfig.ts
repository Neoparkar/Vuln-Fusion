// ============================================================================
// TEMPORARY HACKATHON PRESENTATION MODE
// REMOVE AFTER HACKATHON
// NOT FOR PRODUCTION AUTHENTICATION
// ============================================================================

export const VULNFUSION_DEMO_MODE = true;

export const DEMO_CREDENTIALS = {
  email: 'demo@vulnfusion.local',
  password: 'VulnFusion-Demo-2026!',
  displayName: 'VulnFusion Demo Admin',
  role: 'admin' as const,
  userId: 'demo-presentation-admin-001',
  orgId: '00000000-0000-0000-0000-000000000001',
};

export const DEMO_SESSION_STORAGE_KEY = 'vulnfusion_presentation_session_marker';
