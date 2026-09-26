import React from 'react';

export interface IconBaseProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  glow?: boolean;
  variant?: 'dark' | 'light' | 'monochrome';
  showContainer?: boolean;
  conceptId?: 'shield-v-fusion' | 'diamond-sentinel' | 'obsidian-sovereign' | 'vf-monogram' | 'aegis-hex' | 'fusion-kinetic';
  'aria-label'?: string;
}

/* ========================================================================= */
/* 1. VULNFUSION BRAND LOGO: OFFICIAL SHIELD + V + DATA FUSION               */
/* ========================================================================= */
export const VulnFusionBrandIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  variant = 'dark',
  showContainer = false,
  conceptId = 'shield-v-fusion',
  ...props
}) => {
  const isLight = variant === 'light';
  const isMono = variant === 'monochrome';

  // Palette values
  const shieldOuterRim = isMono ? '#0F172A' : isLight ? '#2563A6' : '#E8EEF5';
  const shieldFillLeft = isMono ? '#0F172A' : isLight ? '#102A43' : '#102A43';
  const shieldFillRight = isMono ? '#1E293B' : isLight ? '#0B1F33' : '#0B1F33';
  const vLeftArm = isMono ? '#FFFFFF' : isLight ? '#FFFFFF' : '#FFFFFF';
  const vRightArm = isMono ? '#CBD5E1' : isLight ? '#3B82C4' : '#3B82C4';
  const dataNodeColor = isMono ? '#94A3B8' : isLight ? '#2563A6' : '#5FA8D3';
  const telemetryLineColor = isMono ? '#475569' : isLight ? 'rgba(37,99,166,0.5)' : 'rgba(95,168,211,0.55)';
  const squircleBg = isMono ? '#FFFFFF' : isLight ? '#F8FAFC' : '#071522';
  const squircleStroke = isMono ? '#CBD5E1' : isLight ? '#E2E8F0' : 'rgba(95,168,211,0.35)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
      aria-label="VulnFusion Executive Brand Mark — Shield + V + Data Fusion"
      role="img"
      style={{ objectFit: 'contain' }}
      {...props}
    >
      <title>VulnFusion — Asset Intelligence & Vulnerability Management</title>
      <defs>
        <linearGradient id="vf-shield-body-l" x1="12" y1="9" x2="24" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B3A5A" />
          <stop offset="50%" stopColor="#102A43" />
          <stop offset="100%" stopColor="#0B1F33" />
        </linearGradient>

        <linearGradient id="vf-shield-body-r" x1="24" y1="9" x2="36" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#102A43" />
          <stop offset="60%" stopColor="#0B1F33" />
          <stop offset="100%" stopColor="#06121E" />
        </linearGradient>

        <linearGradient id="vf-v-left" x1="14" y1="14" x2="24" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="vf-v-right" x1="24" y1="14" x2="34" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FA8D3" />
          <stop offset="50%" stopColor="#3B82C4" />
          <stop offset="100%" stopColor="#2563A6" />
        </linearGradient>

        {glow && (
          <filter id="vf-subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={glow ? 'url(#vf-subtle-glow)' : undefined}>
        {/* Optional Executive Squircle Container Tile */}
        {showContainer && (
          <rect
            x="3.5"
            y="3.5"
            width="41"
            height="41"
            rx="11"
            fill={squircleBg}
            stroke={squircleStroke}
            strokeWidth="1.2"
          />
        )}

        {/* Ingestion Telemetry Link Channels */}
        <line x1="8" y1="23.5" x2="13.5" y2="23.5" stroke={telemetryLineColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="34.5" y1="23.5" x2="40" y2="23.5" stroke={telemetryLineColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="15" y1="9.5" x2="18" y2="13" stroke={telemetryLineColor} strokeWidth="0.9" />
        <line x1="33" y1="9.5" x2="30" y2="13" stroke={telemetryLineColor} strokeWidth="0.9" />

        {/* 4 Subtle Data Fusion Ingestion Nodes */}
        <rect x="7" y="22.5" width="2.2" height="2.2" rx="0.5" fill={dataNodeColor} />
        <rect x="38.8" y="22.5" width="2.2" height="2.2" rx="0.5" fill={dataNodeColor} />
        <rect x="14.2" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />
        <rect x="32" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />

        {/* Solid Executive Armor Shield Base */}
        <path
          d="M24 7.5L12 12.8V24.5C12 32.2 17.2 38.6 24 40.8C30.8 38.6 36 32.2 36 24.5V12.8L24 7.5Z"
          fill={isMono ? shieldFillLeft : 'url(#vf-shield-body-l)'}
          stroke={shieldOuterRim}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Shield Right Facet */}
        <path
          d="M24 8.5L34.8 13.3V24.5C34.8 31.4 30.2 37.2 24 39.4V8.5Z"
          fill={isMono ? shieldFillRight : 'url(#vf-shield-body-r)'}
        />

        {/* Shield Inner Silver Bevel Trim */}
        <path
          d="M24 10.2L13.8 14.8V24.5C13.8 31 18.2 36.6 24 38.6C29.8 36.6 34.2 31 34.2 24.5V14.8L24 10.2Z"
          fill="none"
          stroke="rgba(232, 238, 245, 0.22)"
          strokeWidth="0.8"
        />

        {/* Geometric Integrated 'V' Mark */}
        <path
          d="M16 15.5H20.2L24 29.8L21.2 29.8L16 15.5Z"
          fill={isMono ? vLeftArm : 'url(#vf-v-left)'}
        />
        <path
          d="M32 15.5H27.8L24 29.8L26.8 29.8L32 15.5Z"
          fill={isMono ? vRightArm : 'url(#vf-v-right)'}
        />

        <line x1="24" y1="9.5" x2="24" y2="39.5" stroke="rgba(232, 238, 245, 0.35)" strokeWidth="0.8" />

        {/* Central Convergence Apex Nexus */}
        <polygon
          points="24,28.2 26,30.8 24,33.4 22,30.8"
          fill="#FFFFFF"
          stroke="#3B82C4"
          strokeWidth="0.6"
        />
        <circle cx="24" cy="30.8" r="0.9" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

/* ========================================================================= */
/* 2. ASSET INTELLIGENCE ICON: Heterogeneous Infrastructure Cluster          */
/* ========================================================================= */
export const AssetIntelligenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Asset Intelligence: Heterogeneous Infrastructure Ingestion"
    {...props}
  >
    <defs>
      <linearGradient id="ai-server-top" x1="8" y1="8" x2="22" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="ai-server-front" x1="8" y1="14" x2="22" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#021B33" />
      </linearGradient>
      <linearGradient id="ai-cloud-node" x1="26" y1="6" x2="42" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
      <linearGradient id="ai-workstation" x1="6" y1="28" x2="20" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="ai-nexus-core" x1="26" y1="26" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
    </defs>

    {/* Convergence Identity Lines (Multi-source to Unified Asset) */}
    <path d="M15 16L34 34" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.65" />
    <path d="M34 14L34 34" stroke="#818CF8" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.65" />
    <path d="M14 34L34 34" stroke="#34D399" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.65" />

    {/* Top-Left: Dimensional Server Chassis */}
    <g transform="translate(0, 0)">
      {/* Top Isometric Face */}
      <path d="M14 7L22 11L14 15L6 11L14 7Z" fill="url(#ai-server-top)" stroke="#7DD3FC" strokeWidth="0.75" />
      {/* Front Face */}
      <path d="M6 11L14 15V21L6 17V11Z" fill="url(#ai-server-front)" stroke="#0284C7" strokeWidth="0.75" />
      {/* Side Face */}
      <path d="M14 15L22 11V17L14 21V15Z" fill="#0C2340" stroke="#0284C7" strokeWidth="0.75" />
      {/* Server LED Indicators */}
      <circle cx="9" cy="14" r="0.8" fill="#38BDF8" />
      <circle cx="11.5" cy="15" r="0.8" fill="#34D399" />
    </g>

    {/* Top-Right: Cloud Resource Hex-Node */}
    <g transform="translate(4, 0)">
      <path d="M30 6L37 10V18L30 22L23 18V10L30 6Z" fill="url(#ai-cloud-node)" stroke="#A5B4FC" strokeWidth="0.75" />
      <circle cx="30" cy="14" r="3" fill="#1E1B4B" stroke="#C7D2FE" strokeWidth="0.75" />
      <path d="M28 14H32M30 12V16" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
    </g>

    {/* Bottom-Left: Workstation / Endpoint Node */}
    <g transform="translate(0, 4)">
      <rect x="6" y="27" width="13" height="9" rx="1.5" fill="#0F172A" stroke="#34D399" strokeWidth="0.8" />
      <rect x="8" y="29" width="9" height="5" rx="0.5" fill="#064E3B" opacity="0.6" />
      <line x1="8" y1="38" x2="17" y2="38" stroke="#34D399" strokeWidth="1" strokeLinecap="round" />
      <line x1="12.5" y1="36" x2="12.5" y2="38" stroke="#34D399" strokeWidth="1" />
    </g>

    {/* Bottom-Right: Central Normalized Intelligence Hub (The Golden Canonical Entity) */}
    <g transform="translate(0, 0)">
      {/* Outer Halo */}
      <circle cx="34" cy="34" r="10" fill="#031E38" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 2" />
      {/* Faceted Core Diamond */}
      <path d="M34 26L42 34L34 42L26 34L34 26Z" fill="url(#ai-nexus-core)" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="34" cy="34" r="3.5" fill="#FFFFFF" />
      <circle cx="34" cy="34" r="1.5" fill="#0369A1" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 3. ASSET CORRELATION ICON: 3-Source Convergence into Unified Nexus        */
/* ========================================================================= */
export const AssetCorrelationIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Asset Correlation: Multi-Source Telemetry Convergence"
    {...props}
  >
    <defs>
      <linearGradient id="ac-source-qualys" x1="4" y1="4" x2="16" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="ac-source-tenable" x1="4" y1="32" x2="16" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="ac-source-rapid7" x1="4" y1="18" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="ac-unified-gem" x1="28" y1="16" x2="44" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0B132B" />
      </linearGradient>
    </defs>

    {/* Dynamic Convergence Laser Vectors */}
    <path d="M12 10C20 14 26 19 33 24" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 24L33 24" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 38C20 34 26 29 33 24" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />

    {/* Telemetry Particles on vectors */}
    <circle cx="21" cy="16" r="1.5" fill="#BAE6FD" />
    <circle cx="23" cy="24" r="1.5" fill="#FED7AA" />
    <circle cx="21" cy="32" r="1.5" fill="#DDD6FE" />

    {/* Source Node 1 (Top: Qualys Cyan) */}
    <g>
      <circle cx="10" cy="10" r="6" fill="#0C2340" stroke="#00F0FF" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="3" fill="url(#ac-source-qualys)" />
      <circle cx="10" cy="10" r="1" fill="#FFFFFF" />
    </g>

    {/* Source Node 2 (Middle: Rapid7 Amber) */}
    <g>
      <circle cx="10" cy="24" r="6" fill="#2A1705" stroke="#FB923C" strokeWidth="1.2" />
      <circle cx="10" cy="24" r="3" fill="url(#ac-source-rapid7)" />
      <circle cx="10" cy="24" r="1" fill="#FFFFFF" />
    </g>

    {/* Source Node 3 (Bottom: Tenable Violet) */}
    <g>
      <circle cx="10" cy="38" r="6" fill="#1C1033" stroke="#A855F7" strokeWidth="1.2" />
      <circle cx="10" cy="38" r="3" fill="url(#ac-source-tenable)" />
      <circle cx="10" cy="38" r="1" fill="#FFFFFF" />
    </g>

    {/* Central Unified Asset: 3D Faceted Diamond Nexus */}
    <g>
      {/* Outer Glow Boundary */}
      <circle cx="35" cy="24" r="11" fill="#031E38" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 2" />

      {/* Dimensional Prism Facets */}
      <path d="M35 15L43 24L35 33L27 24L35 15Z" fill="url(#ac-unified-gem)" stroke="#7DD3FC" strokeWidth="1.2" />
      <path d="M35 15L35 33" stroke="#E0F2FE" strokeWidth="1" strokeLinecap="round" />
      <path d="M27 24L43 24" stroke="#7DD3FC" strokeWidth="0.8" />

      {/* Core Verification Spark */}
      <circle cx="35" cy="24" r="3" fill="#FFFFFF" />
      <circle cx="35" cy="24" r="1.2" fill="#0284C7" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 4. DETERMINISTIC EVIDENCE ICON: Layered Evidence Planes & Verification Seal*/
/* ========================================================================= */
export const DeterministicEvidenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Deterministic Evidence: Multi-Layer Telemetry Proof Stack"
    {...props}
  >
    <defs>
      <linearGradient id="ev-layer-3" x1="8" y1="24" x2="36" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#031E38" />
      </linearGradient>
      <linearGradient id="ev-layer-2" x1="10" y1="18" x2="38" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0B3056" />
      </linearGradient>
      <linearGradient id="ev-layer-1" x1="12" y1="12" x2="40" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="ev-seal" x1="26" y1="20" x2="44" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Layer 3 (Base Evidence Plane: Serial & MAC) */}
    <path d="M22 28L36 34L22 40L8 34L22 28Z" fill="url(#ev-layer-3)" stroke="#1E3A5F" strokeWidth="0.9" />
    <line x1="14" y1="33" x2="20" y2="36" stroke="#475569" strokeWidth="0.8" />

    {/* Layer 2 (Middle Evidence Plane: Network IP & Routing) */}
    <path d="M22 20L36 26L22 32L8 26L22 20Z" fill="url(#ev-layer-2)" stroke="#0284C7" strokeWidth="1" />
    <line x1="14" y1="25" x2="26" y2="30" stroke="#38BDF8" strokeWidth="0.8" />

    {/* Layer 1 (Top Evidence Plane: Hostname & Canonical FQDN) */}
    <path d="M22 12L36 18L22 24L8 18L22 12Z" fill="url(#ev-layer-1)" stroke="#BAE6FD" strokeWidth="1.2" />
    {/* Micro Evidence Code Rows */}
    <line x1="16" y1="16.5" x2="24" y2="20" stroke="#F8FAFC" strokeWidth="1" strokeLinecap="round" />
    <line x1="18" y1="19" x2="28" y2="23" stroke="#E0F2FE" strokeWidth="0.8" />

    {/* Verification Interlock Laser Spine */}
    <line x1="22" y1="8" x2="22" y2="40" stroke="#00F0FF" strokeWidth="1.2" strokeDasharray="1.5 1.5" />

    {/* Deterministic Golden Verification Seal (Bottom Right Anchor) */}
    <g transform="translate(4, 4)">
      <circle cx="34" cy="30" r="8" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
      <circle cx="34" cy="30" r="5.5" fill="url(#ev-seal)" />
      {/* Precision Geometric Seal Check */}
      <path d="M31.5 30L33.5 32L36.5 28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 5. SECURITY INTELLIGENCE ICON: Dimensional Security Core & Network Radar  */
/* ========================================================================= */
export const SecurityIntelligenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Security Intelligence: Fortress Core & Signal Topology"
    {...props}
  >
    <defs>
      <linearGradient id="si-shield-hull" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0B1B2B" />
        <stop offset="100%" stopColor="#030712" />
      </linearGradient>
      <linearGradient id="si-shield-ring" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <radialGradient id="si-core-glow" cx="24" cy="24" r="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="70%" stopColor="#0284C7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Outer Dimensional Shield Plate */}
    <path
      d="M24 5L8 12V23C8 33 15 41.5 24 44.5C33 41.5 40 33 40 23V12L24 5Z"
      fill="url(#si-shield-hull)"
      stroke="url(#si-shield-ring)"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* Ambient Glow Field */}
    <circle cx="24" cy="24" r="11" fill="url(#si-core-glow)" />

    {/* Internal Protected Network Mesh */}
    <g>
      {/* Mesh Vector Lines */}
      <line x1="24" y1="16" x2="17" y2="24" stroke="#38BDF8" strokeWidth="0.9" opacity="0.8" />
      <line x1="24" y1="16" x2="31" y2="24" stroke="#38BDF8" strokeWidth="0.9" opacity="0.8" />
      <line x1="17" y1="24" x2="24" y2="32" stroke="#818CF8" strokeWidth="0.9" opacity="0.8" />
      <line x1="31" y1="24" x2="24" y2="32" stroke="#818CF8" strokeWidth="0.9" opacity="0.8" />
      <line x1="17" y1="24" x2="31" y2="24" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

      {/* Network Nodes */}
      <circle cx="24" cy="16" r="2.2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.75" />
      <circle cx="17" cy="24" r="2.2" fill="#818CF8" stroke="#FFFFFF" strokeWidth="0.75" />
      <circle cx="31" cy="24" r="2.2" fill="#818CF8" stroke="#FFFFFF" strokeWidth="0.75" />
      <circle cx="24" cy="32" r="2.2" fill="#34D399" stroke="#FFFFFF" strokeWidth="0.75" />

      {/* Central Defensive Core */}
      <circle cx="24" cy="24" r="3.8" fill="#0C2340" stroke="#00F0FF" strokeWidth="1" />
      <circle cx="24" cy="24" r="1.8" fill="#FFFFFF" />
    </g>

    {/* Defensive Orbital Telemetry Arc */}
    <path
      d="M14 18C16 14 20 12 24 12C28 12 32 14 34 18"
      stroke="#38BDF8"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray="2 2"
    />
  </svg>
);

/* ========================================================================= */
/* 6. FINDINGS INTELLIGENCE ICON: Vulnerability Point & Exposure Vector       */
/* ========================================================================= */
export const FindingsIntelligenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Findings Intelligence: Vulnerability Vector & Remediation Target"
    {...props}
  >
    <defs>
      <linearGradient id="fi-cube-top" x1="12" y1="6" x2="36" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="fi-cube-left" x1="12" y1="18" x2="24" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#050B14" />
      </linearGradient>
      <linearGradient id="fi-cube-right" x1="24" y1="18" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#090514" />
      </linearGradient>
      <radialGradient id="fi-breach-glow" cx="30" cy="22" r="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="60%" stopColor="#E11D48" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Isometric System Infrastructure Block */}
    <g>
      {/* Top Face */}
      <path d="M24 6L38 13L24 20L10 13L24 6Z" fill="url(#fi-cube-top)" stroke="#334155" strokeWidth="1" />
      {/* Left Face */}
      <path d="M10 13L24 20V36L10 29V13Z" fill="url(#fi-cube-left)" stroke="#1E293B" strokeWidth="1" />
      {/* Right Face */}
      <path d="M24 20L38 13V29L24 36V20Z" fill="url(#fi-cube-right)" stroke="#4338CA" strokeWidth="1" />
    </g>

    {/* Breach Glow */}
    <circle cx="30" cy="22" r="9" fill="url(#fi-breach-glow)" />

    {/* Highlighted Vulnerability Breach Point */}
    <g>
      {/* Exposure Pathway Vector */}
      <line x1="30" y1="22" x2="43" y2="15" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="22" x2="30" y2="37" stroke="#FB7185" strokeWidth="1.2" strokeDasharray="2 2" />

      {/* Dimensional CVE Breach Node */}
      <circle cx="30" cy="22" r="5" fill="#4C0519" stroke="#F43F5E" strokeWidth="1.2" />
      <circle cx="30" cy="22" r="2.8" fill="#F43F5E" />
      <circle cx="30" cy="22" r="1" fill="#FFFFFF" />

      {/* Target Crosshair Calipers */}
      <path d="M26 22H23M37 22H34M30 18V15M30 29V26" stroke="#FDA4AF" strokeWidth="0.9" strokeLinecap="round" />
    </g>

    {/* Left Face System Status Indicator */}
    <g opacity="0.85">
      <line x1="13" y1="19" x2="20" y2="23" stroke="#38BDF8" strokeWidth="0.8" />
      <line x1="13" y1="23" x2="18" y2="26" stroke="#64748B" strokeWidth="0.8" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 7. SOURCE INTELLIGENCE ICON: Multi-Spectral Scanner Ingestion Core        */
/* ========================================================================= */
export const SourceIntelligenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Source Intelligence: 4-Channel Telemetry Stream Ingestion"
    {...props}
  >
    <defs>
      <linearGradient id="src-hub-plate" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0B132B" />
      </linearGradient>
      <radialGradient id="src-core-pulse" cx="24" cy="24" r="7" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F0FF" />
        <stop offset="100%" stopColor="#0284C7" />
      </radialGradient>
    </defs>

    {/* Four Ingestion Channels Converging from 4 Quadrants */}
    {/* 1. Top-Left: Qualys Stream (Cyan) */}
    <path d="M8 8L19 19" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="3.5" fill="#0C2340" stroke="#00F0FF" strokeWidth="1" />
    <circle cx="8" cy="8" r="1.2" fill="#FFFFFF" />

    {/* 2. Top-Right: Tenable Stream (Violet) */}
    <path d="M40 8L29 19" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
    <circle cx="40" cy="8" r="3.5" fill="#1E1035" stroke="#A855F7" strokeWidth="1" />
    <circle cx="40" cy="8" r="1.2" fill="#FFFFFF" />

    {/* 3. Bottom-Left: Rapid7 Stream (Orange) */}
    <path d="M8 40L19 29" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="40" r="3.5" fill="#2B1405" stroke="#FB923C" strokeWidth="1" />
    <circle cx="8" cy="40" r="1.2" fill="#FFFFFF" />

    {/* 4. Bottom-Right: Wiz Stream (Emerald) */}
    <path d="M40 40L29 29" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
    <circle cx="40" cy="40" r="3.5" fill="#063224" stroke="#34D399" strokeWidth="1" />
    <circle cx="40" cy="40" r="1.2" fill="#FFFFFF" />

    {/* Central Ingestion Hub Ring */}
    <circle cx="24" cy="24" r="9" fill="url(#src-hub-plate)" stroke="#38BDF8" strokeWidth="1.2" />
    <circle cx="24" cy="24" r="5" fill="url(#src-core-pulse)" />
    <circle cx="24" cy="24" r="2" fill="#FFFFFF" />

    {/* Intake Vector Teeth */}
    <line x1="24" y1="12" x2="24" y2="15" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" />
    <line x1="24" y1="33" x2="24" y2="36" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" />
    <line x1="12" y1="24" x2="15" y2="24" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" />
    <line x1="33" y1="24" x2="36" y2="24" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/* ========================================================================= */
/* 8. LIFECYCLE & OBSERVATION ICON: Asset Core & Chrono-Observation Orbit    */
/* ========================================================================= */
export const AssetLifecycleIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Asset Lifecycle: Chronological Observation Engine"
    {...props}
  >
    <defs>
      <linearGradient id="lc-orbit-active" x1="12" y1="6" x2="42" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="lc-orbit-aging" x1="42" y1="24" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>

    {/* Orbital Background Track */}
    <circle cx="24" cy="24" r="16" stroke="#1E293B" strokeWidth="2.5" />

    {/* Sector 1: First Seen & Active Observation (Emerald / Cyan Arc) */}
    <path
      d="M24 8C32.8366 8 40 15.1634 40 24"
      stroke="url(#lc-orbit-active)"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    {/* Sector 2: Aging Telemetry (Amber Arc) */}
    <path
      d="M40 24C40 32.8366 32.8366 40 24 40"
      stroke="url(#lc-orbit-aging)"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />

    {/* Sector 3: Dormant/Stale Path */}
    <path
      d="M24 40C15.1634 40 8 32.8366 8 24C8 15.1634 15.1634 8 24 8"
      stroke="#334155"
      strokeWidth="1.5"
      strokeDasharray="2 3"
    />

    {/* Central Monitored Asset Object */}
    <g>
      <rect x="18" y="18" width="12" height="12" rx="3" fill="#0C2340" stroke="#38BDF8" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="2.5" fill="#38BDF8" />
      <circle cx="24" cy="24" r="1" fill="#FFFFFF" />
    </g>

    {/* Observation Pointer Compass Needle */}
    <line x1="24" y1="24" x2="36" y2="12" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="12" r="2.5" fill="#34D399" stroke="#FFFFFF" strokeWidth="0.75" />

    {/* Chrono Tick Marks */}
    <circle cx="24" cy="8" r="1.5" fill="#38BDF8" />
    <circle cx="40" cy="24" r="1.5" fill="#F59E0B" />
    <circle cx="24" cy="40" r="1.5" fill="#64748B" />
  </svg>
);

/* ========================================================================= */
/* 9. RISK & EXPOSURE ICON: Node Exposure Vector & Critical Breach Path      */
/* ========================================================================= */
export const RiskExposureIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Risk & Exposure: Threat Trajectory & Defense Node"
    {...props}
  >
    <defs>
      <linearGradient id="rk-threat-ray" x1="6" y1="42" x2="38" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
    </defs>

    {/* Threat Exposure Pathway Beam */}
    <line x1="8" y1="40" x2="38" y2="12" stroke="url(#rk-threat-ray)" strokeWidth="2.5" strokeLinecap="round" />

    {/* Perimeter Defense Concentric Rings */}
    <circle cx="36" cy="14" r="10" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
    <circle cx="36" cy="14" r="6" fill="#450A0A" stroke="#EF4444" strokeWidth="1.2" />
    <circle cx="36" cy="14" r="2.5" fill="#FCA5A5" />

    {/* Impact Node at Base */}
    <circle cx="10" cy="38" r="4" fill="#1C1917" stroke="#F59E0B" strokeWidth="1.2" />
    <circle cx="10" cy="38" r="1.5" fill="#FDE047" />

    {/* Intercept / Mitigation Firewall Wedge */}
    <path
      d="M20 22L28 30"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="24" cy="26" r="2" fill="#38BDF8" />
  </svg>
);

/* ========================================================================= */
/* 10. EXECUTIVE INTELLIGENCE ICON: Geodesic Command Sphere / Intelligence Core*/
/* ========================================================================= */
export const ExecutiveIntelligenceIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Executive Intelligence: Command Core & Geodesic Neural Sphere"
    {...props}
  >
    <defs>
      <radialGradient id="ei-sphere-glow" cx="24" cy="24" r="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#0284C7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0B132B" stopOpacity="0.9" />
      </radialGradient>
      <linearGradient id="ei-ring-grad" x1="6" y1="12" x2="42" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
    </defs>

    {/* Geodesic Outer Sphere Background */}
    <circle cx="24" cy="24" r="17" fill="url(#ei-sphere-glow)" stroke="#38BDF8" strokeWidth="1.2" />

    {/* 3D Longitudinal / Latitudinal Spatial Grid */}
    <ellipse cx="24" cy="24" rx="17" ry="6.5" stroke="#7DD3FC" strokeWidth="0.8" opacity="0.6" />
    <ellipse cx="24" cy="24" rx="7" ry="17" stroke="#7DD3FC" strokeWidth="0.8" opacity="0.6" />

    {/* Equator Command Ring */}
    <ellipse cx="24" cy="24" rx="19" ry="8" stroke="url(#ei-ring-grad)" strokeWidth="1.2" strokeDasharray="4 2" />

    {/* Neural Intelligence Mesh Points */}
    <g>
      <line x1="24" y1="11" x2="16" y2="24" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.8" />
      <line x1="24" y1="11" x2="32" y2="24" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.8" />
      <line x1="16" y1="24" x2="24" y2="37" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.8" />
      <line x1="32" y1="24" x2="24" y2="37" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.8" />

      {/* Synchronized Intelligence Nodes */}
      <circle cx="24" cy="11" r="2" fill="#FFFFFF" />
      <circle cx="16" cy="24" r="2" fill="#38BDF8" />
      <circle cx="32" cy="24" r="2" fill="#818CF8" />
      <circle cx="24" cy="37" r="2" fill="#34D399" />

      {/* Central Super-Node */}
      <circle cx="24" cy="24" r="4.5" fill="#031E38" stroke="#00F0FF" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 11. TEST COMMAND CENTER ICON: Dimensional Validation Console & Assertions */
/* ========================================================================= */
export const TestCommandCenterIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Test Command Center: Continuous Deterministic Assertion Console"
    {...props}
  >
    <defs>
      <linearGradient id="tc-console-plate" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0B132B" />
      </linearGradient>
      <linearGradient id="tc-check-pass" x1="28" y1="24" x2="42" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Isometric Terminal Chassis */}
    <rect x="6" y="8" width="36" height="32" rx="4" fill="url(#tc-console-plate)" stroke="#38BDF8" strokeWidth="1.2" />

    {/* Terminal Header Bar */}
    <path d="M6 14H42" stroke="#334155" strokeWidth="1" />
    <circle cx="11" cy="11" r="1.5" fill="#EF4444" />
    <circle cx="15" cy="11" r="1.5" fill="#F59E0B" />
    <circle cx="19" cy="11" r="1.5" fill="#10B981" />

    {/* Verification Assertion Tracks */}
    <g transform="translate(4, 4)">
      {/* Test Row 1 */}
      <circle cx="8" cy="16" r="2" fill="#10B981" />
      <line x1="13" y1="16" x2="26" y2="16" stroke="#E2E8F0" strokeWidth="1.2" strokeLinecap="round" />

      {/* Test Row 2 */}
      <circle cx="8" cy="22" r="2" fill="#10B981" />
      <line x1="13" y1="22" x2="22" y2="22" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

      {/* Test Row 3 */}
      <circle cx="8" cy="28" r="2" fill="#38BDF8" />
      <line x1="13" y1="28" x2="24" y2="28" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    </g>

    {/* Large Precision Assertion Pass Stamp (Bottom Right) */}
    <g transform="translate(4, 4)">
      <circle cx="32" cy="25" r="7.5" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
      <path d="M29 25L31.5 27.5L35.5 23" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 12. ATTENTION QUEUE / UNCERTAINTY RADAR ICON                              */
/* ========================================================================= */
export const AttentionRadarIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Attention Radar: Conflicting Telemetry & Uncertainty Radar"
    {...props}
  >
    <defs>
      <radialGradient id="ar-glow" cx="24" cy="24" r="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Radar Scan Disc */}
    <circle cx="24" cy="24" r="17" fill="#181206" stroke="#F59E0B" strokeWidth="1.2" />
    <circle cx="24" cy="24" r="11" stroke="#D97706" strokeWidth="0.8" strokeDasharray="3 2" />
    <circle cx="24" cy="24" r="5" stroke="#F59E0B" strokeWidth="0.8" />

    {/* Crosshair Axes */}
    <line x1="24" y1="7" x2="24" y2="41" stroke="#78350F" strokeWidth="0.8" />
    <line x1="7" y1="24" x2="41" y2="24" stroke="#78350F" strokeWidth="0.8" />

    {/* Amber Attention Sweep Vector */}
    <path d="M24 24L37 13" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 24L37 13A17 17 0 0 0 24 7Z" fill="url(#ar-glow)" opacity="0.75" />

    {/* Conflicting Target Node A */}
    <circle cx="34" cy="16" r="3" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.8" />

    {/* Conflicting Target Node B */}
    <circle cx="16" cy="31" r="2.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="0.8" />

    {/* Center Pivot Caliper */}
    <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
  </svg>
);

export const UncertaintyRadarIcon = AttentionRadarIcon;

/* ========================================================================= */
/* 13. CLOUD INFRASTRUCTURE & K8S ICON                                       */
/* ========================================================================= */
export const CloudInfrastructureIcon: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Cloud Infrastructure & Orchestrated Container Mesh"
    {...props}
  >
    <defs>
      <linearGradient id="ci-cloud" x1="10" y1="12" x2="38" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
    </defs>

    {/* Cloud Mesh Contour */}
    <path
      d="M17 34H33C37.4183 34 41 30.4183 41 26C41 21.9067 37.922 18.5323 33.9161 18.0645C33.4357 12.3855 28.6922 8 22.8667 8C17.6534 8 13.2676 11.5034 12.0838 16.3218C8.65759 17.1594 6 20.276 6 24C6 28.4183 9.58172 32 14 32H17"
      fill="#0B132B"
      stroke="#38BDF8"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* Internal K8s Pod Hex-Nodes */}
    <g transform="translate(0, 2)">
      <circle cx="18" cy="22" r="2.5" fill="#38BDF8" />
      <circle cx="28" cy="18" r="2.5" fill="#818CF8" />
      <circle cx="30" cy="26" r="2.5" fill="#34D399" />
      <line x1="18" y1="22" x2="28" y2="18" stroke="#7DD3FC" strokeWidth="0.8" />
      <line x1="28" y1="18" x2="30" y2="26" stroke="#7DD3FC" strokeWidth="0.8" />
      <line x1="18" y1="22" x2="30" y2="26" stroke="#7DD3FC" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
    </g>
  </svg>
);

/* ========================================================================= */
/* 14. EXPORT FORMAT ICONS: PDF, CSV, JSON, HTML, MARKDOWN                   */
/* ========================================================================= */

// 14.1 EXPORT PDF
export const ExportPdfIcon: React.FC<IconBaseProps> = ({
  size = 28,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Export PDF Document"
    {...props}
  >
    <path d="M10 6C10 4.89543 10.8954 4 12 4H26L34 12V34C34 35.1046 33.1046 36 32 36H12C10.8954 36 10 35.1046 10 34V6Z" fill="#1C1417" stroke="#F43F5E" strokeWidth="1.2" />
    <path d="M26 4V12H34" fill="#2E1017" stroke="#F43F5E" strokeWidth="1.2" />
    {/* PDF Badge */}
    <rect x="13" y="16" width="14" height="6" rx="1.5" fill="#F43F5E" />
    <text x="15" y="20.5" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    {/* Report Lines */}
    <line x1="14" y1="26" x2="28" y2="26" stroke="#FDA4AF" strokeWidth="1" strokeLinecap="round" />
    <line x1="14" y1="30" x2="24" y2="30" stroke="#FDA4AF" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 14.2 EXPORT CSV
export const ExportCsvIcon: React.FC<IconBaseProps> = ({
  size = 28,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Export CSV Spreadsheet"
    {...props}
  >
    <path d="M10 6C10 4.89543 10.8954 4 12 4H26L34 12V34C34 35.1046 33.1046 36 32 36H12C10.8954 36 10 35.1046 10 34V6Z" fill="#0C1D16" stroke="#34D399" strokeWidth="1.2" />
    <path d="M26 4V12H34" fill="#063224" stroke="#34D399" strokeWidth="1.2" />
    {/* CSV Spreadsheet Grid Matrix */}
    <rect x="14" y="16" width="16" height="15" rx="1" fill="#064E3B" stroke="#34D399" strokeWidth="0.8" />
    <line x1="14" y1="21" x2="30" y2="21" stroke="#34D399" strokeWidth="0.8" />
    <line x1="14" y1="26" x2="30" y2="26" stroke="#34D399" strokeWidth="0.8" />
    <line x1="22" y1="16" x2="22" y2="31" stroke="#34D399" strokeWidth="0.8" />
  </svg>
);

// 14.3 EXPORT JSON
export const ExportJsonIcon: React.FC<IconBaseProps> = ({
  size = 28,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Export JSON Payload"
    {...props}
  >
    <path d="M10 6C10 4.89543 10.8954 4 12 4H26L34 12V34C34 35.1046 33.1046 36 32 36H12C10.8954 36 10 35.1046 10 34V6Z" fill="#071826" stroke="#00F0FF" strokeWidth="1.2" />
    <path d="M26 4V12H34" fill="#022B4A" stroke="#00F0FF" strokeWidth="1.2" />
    {/* Brackets { } */}
    <text x="14" y="25" fill="#00F0FF" fontSize="11" fontWeight="bold" fontFamily="monospace">{'{ }'}</text>
  </svg>
);

// 14.4 EXPORT HTML
export const ExportHtmlIcon: React.FC<IconBaseProps> = ({
  size = 28,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Export HTML Web Report"
    {...props}
  >
    <rect x="8" y="8" width="24" height="24" rx="3" fill="#0A1629" stroke="#38BDF8" strokeWidth="1.2" />
    <path d="M8 14H32" stroke="#1E293B" strokeWidth="1" />
    <circle cx="12" cy="11" r="1" fill="#38BDF8" />
    <circle cx="15" cy="11" r="1" fill="#38BDF8" />
    {/* Code Tag < / > */}
    <path d="M15 22L12 25L15 28" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 22L28 25L25 28" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="21" y1="21" x2="19" y2="29" stroke="#7DD3FC" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 14.5 EXPORT MARKDOWN
export const ExportMarkdownIcon: React.FC<IconBaseProps> = ({
  size = 28,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${className}`}
    aria-label="Export Markdown Documentation"
    {...props}
  >
    <path d="M10 6C10 4.89543 10.8954 4 12 4H26L34 12V34C34 35.1046 33.1046 36 32 36H12C10.8954 36 10 35.1046 10 34V6Z" fill="#1C1507" stroke="#FBBF24" strokeWidth="1.2" />
    <path d="M26 4V12H34" fill="#332408" stroke="#FBBF24" strokeWidth="1.2" />
    {/* Markdown MD Text & Down Arrow */}
    <text x="13" y="24" fill="#FBBF24" fontSize="8" fontWeight="bold" fontFamily="monospace">M↓</text>
    <line x1="14" y1="28" x2="26" y2="28" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" />
  </svg>
);
