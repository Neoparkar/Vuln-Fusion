import React from 'react';
import { IconBaseProps } from './VulnFusionIcons';

export type ExecutiveLogoId =
  | 'shield-v-fusion' // PRIMARY CONCEPT: Official Executive Shield + V + Data Fusion
  | 'diamond-sentinel' // Alternate Concept: Clean Sapphire Shield with Prism Core
  | 'obsidian-sovereign' // Alternate Concept: Heavy Titanium Armor
  | 'vf-monogram' // Alternate Concept: Precision Interlocking VF Monogram
  | 'aegis-hex' // Alternate Concept: Hexagonal Aerospace Aegis
  | 'fusion-kinetic'; // Alternate Concept: Dimensional Kinetic Fusion Shield

export interface ExecutiveLogoMeta {
  id: ExecutiveLogoId;
  name: string;
  tagline: string;
  description: string;
  style: string;
  colors: string[];
  recommendedFor: string;
  isPrimary?: boolean;
}

export const EXECUTIVE_LOGO_OPTIONS: ExecutiveLogoMeta[] = [
  {
    id: 'shield-v-fusion',
    name: 'Shield + V + Data Fusion (Official Brand)',
    tagline: 'Executive Enterprise Shield with Integrated V and Unified Data Ingestion Nodes',
    description:
      'The authoritative VulnFusion corporate identity. Built on deep navy (#0B1F33) and executive blue (#2563A6) with a precision silver-white (#E8EEF5) integrated V mark and 4 subtle telemetry data nodes symbolizing multiple security vendor feeds (Qualys, Tenable, Rapid7, Wiz) converging into unified intelligence.',
    style: 'Executive Enterprise / Confident & Trustworthy',
    colors: ['#0B1F33', '#2563A6', '#3B82C4', '#E8EEF5', '#5FA8D3'],
    recommendedFor: 'Enterprise CISO Dashboards, Boardroom Reports, Production Identity, Favicon',
    isPrimary: true,
  },
  {
    id: 'diamond-sentinel',
    name: 'The Diamond Sentinel',
    tagline: 'Sapphire Defense Shield with Faceted Beacon Core',
    description:
      'Sleek dual-facet sapphire shield with an illuminated diamond prism core within a dark squircle frame.',
    style: 'High-Contrast Sapphire / Clean Mark',
    colors: ['#0077B6', '#00B4D8', '#FFFFFF', '#0B1524'],
    recommendedFor: 'Compact Indicator Badges, Mobile Header',
  },
  {
    id: 'obsidian-sovereign',
    name: 'The Obsidian Sovereign',
    tagline: 'Titanium & Cobalt Beveled Armor with Dual-Tone Fusion Nexus',
    description:
      'Aerospace-grade beveled armor shield in obsidian and deep cobalt, highlighted by champagne gold edges and a central deterministic nexus. Conveys rock-solid enterprise defense.',
    style: 'Enterprise Heavy Armor / Fortune 500 Authority',
    colors: ['#38BDF8', '#F59E0B', '#0F172A', '#E2E8F0'],
    recommendedFor: 'Enterprise CISO Briefings, Boardroom Presentations',
  },
  {
    id: 'vf-monogram',
    name: 'The Quantum VF Monogram',
    tagline: 'Precision Interlocking Monogram with Laser Convergence',
    description:
      'A razor-sharp geometric monogram weaving "V" (Vuln) and "F" (Fusion) into an interlocking cyber emblem with electric cyan containment lines and an amber core.',
    style: 'Modern Tech Powerhouse / Iconic Monogram',
    colors: ['#00F0FF', '#FF6B00', '#1E293B', '#FFFFFF'],
    recommendedFor: 'Developer & Security Engineering Workflows',
  },
  {
    id: 'aegis-hex',
    name: 'The Aegis Hex Prism',
    tagline: 'Refractive Hexagonal Crystal Shield with Focus Core',
    description:
      'Symmetric hexagonal defense perimeter housing crystalline facets that channel multiple telemetry inputs into a single focus point.',
    style: 'Deterministic Precision / Mathematical Rigor',
    colors: ['#00E5FF', '#3B82C4', '#1E1B4B', '#FFFFFF'],
    recommendedFor: 'Analytical Workflows, Deep Evidence Correlation',
  },
  {
    id: 'fusion-kinetic',
    name: 'The Fusion Kinetic Shield',
    tagline: 'Dimensional Armor with Central X-Fusion & Stream Trails',
    description:
      'The multi-dimensional steel shield with the copper-trimmed central "X" core and energetic orange-cyan telemetry streams branching rightward.',
    style: 'Dynamic & Kinetic / Threat Ingestion Streams',
    colors: ['#EA580C', '#00D2FF', '#152738', '#FFFFFF'],
    recommendedFor: 'Live Telemetry Feeds, Ingestion Monitor',
  },
];

/* ========================================================================= */
/* 1. PRIMARY OFFICIAL BRAND: SHIELD + V + DATA FUSION                       */
/* ========================================================================= */
export const ShieldVFusionLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  variant = 'dark',
  showContainer = false,
  ...props
}) => {
  // Color configuration based on executive variant
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
        {/* Executive Shield Gradients */}
        <linearGradient id="sv-shield-body-l" x1="12" y1="9" x2="24" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B3A5A" />
          <stop offset="50%" stopColor="#102A43" />
          <stop offset="100%" stopColor="#0B1F33" />
        </linearGradient>

        <linearGradient id="sv-shield-body-r" x1="24" y1="9" x2="36" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#102A43" />
          <stop offset="60%" stopColor="#0B1F33" />
          <stop offset="100%" stopColor="#06121E" />
        </linearGradient>

        <linearGradient id="sv-v-left" x1="14" y1="14" x2="24" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="sv-v-right" x1="24" y1="14" x2="34" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5FA8D3" />
          <stop offset="50%" stopColor="#3B82C4" />
          <stop offset="100%" stopColor="#2563A6" />
        </linearGradient>

        {glow && (
          <filter id="sv-subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={glow ? 'url(#sv-subtle-glow)' : undefined}>
        {/* 1. Optional Executive Squircle Container Tile */}
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

        {/* 2. Multiple Ingestion Telemetry Link Channels (Data Fusion) */}
        {/* Left Source Channel (Qualys/Tenable) */}
        <line x1="8" y1="23.5" x2="13.5" y2="23.5" stroke={telemetryLineColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
        {/* Right Source Channel (Rapid7/Wiz) */}
        <line x1="34.5" y1="23.5" x2="40" y2="23.5" stroke={telemetryLineColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
        {/* Top-Left Telemetry Input */}
        <line x1="15" y1="9.5" x2="18" y2="13" stroke={telemetryLineColor} strokeWidth="0.9" />
        {/* Top-Right Telemetry Input */}
        <line x1="33" y1="9.5" x2="30" y2="13" stroke={telemetryLineColor} strokeWidth="0.9" />

        {/* 3. 4 Subtle Data Fusion Ingestion Nodes */}
        {/* Left Telemetry Node */}
        <rect x="7" y="22.5" width="2.2" height="2.2" rx="0.5" fill={dataNodeColor} />
        {/* Right Telemetry Node */}
        <rect x="38.8" y="22.5" width="2.2" height="2.2" rx="0.5" fill={dataNodeColor} />
        {/* Top-Left Node */}
        <rect x="14.2" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />
        {/* Top-Right Node */}
        <rect x="32" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />

        {/* 4. Solid Executive Armor Shield Base */}
        {/* Shield Outer Hull Line */}
        <path
          d="M24 7.5L12 12.8V24.5C12 32.2 17.2 38.6 24 40.8C30.8 38.6 36 32.2 36 24.5V12.8L24 7.5Z"
          fill={isMono ? shieldFillLeft : 'url(#sv-shield-body-l)'}
          stroke={shieldOuterRim}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Shield Right Facet (Shaded Dimensionality) */}
        <path
          d="M24 8.5L34.8 13.3V24.5C34.8 31.4 30.2 37.2 24 39.4V8.5Z"
          fill={isMono ? shieldFillRight : 'url(#sv-shield-body-r)'}
        />

        {/* Shield Inner Silver Accent Bevel Trim */}
        <path
          d="M24 10.2L13.8 14.8V24.5C13.8 31 18.2 36.6 24 38.6C29.8 36.6 34.2 31 34.2 24.5V14.8L24 10.2Z"
          fill="none"
          stroke="rgba(232, 238, 245, 0.22)"
          strokeWidth="0.8"
        />

        {/* 5. Geometric Integrated 'V' Mark (VulnFusion Core) */}
        {/* Left Arm of V (Silver-White) */}
        <path
          d="M16 15.5H20.2L24 29.8L21.2 29.8L16 15.5Z"
          fill={isMono ? vLeftArm : 'url(#sv-v-left)'}
        />

        {/* Right Arm of V (Executive Blue) */}
        <path
          d="M32 15.5H27.8L24 29.8L26.8 29.8L32 15.5Z"
          fill={isMono ? vRightArm : 'url(#sv-v-right)'}
        />

        {/* V Central Dividing Precision Spine */}
        <line x1="24" y1="9.5" x2="24" y2="39.5" stroke="rgba(232, 238, 245, 0.35)" strokeWidth="0.8" />

        {/* 6. Central Convergence Apex Nexus (Unified Intelligence Layer) */}
        <polygon
          points="24,28.2 26,30.8 24,33.4 22,30.8"
          fill="#FFFFFF"
          stroke="#3B82C4"
          strokeWidth="0.6"
        />

        {/* Micro Pure White Focus Core */}
        <circle cx="24" cy="30.8" r="0.9" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const VulnFusionShieldVLogo = ShieldVFusionLogo;

/* ========================================================================= */
/* 2. CONCEPT B: THE DIAMOND SENTINEL (Restrained Sapphire Shield)           */
/* ========================================================================= */
export const DiamondSentinelLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  showContainer = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
    aria-label="VulnFusion Diamond Sentinel Logo"
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <defs>
      <linearGradient id="ds-shield-grad" x1="12" y1="12" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82C4" />
        <stop offset="35%" stopColor="#2563A6" />
        <stop offset="80%" stopColor="#102A43" />
        <stop offset="100%" stopColor="#0B1F33" />
      </linearGradient>

      <linearGradient id="ds-shield-left" x1="12" y1="14" x2="24" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E8EEF5" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#2563A6" stopOpacity="0.25" />
      </linearGradient>

      <linearGradient id="ds-shield-right" x1="24" y1="14" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#102A43" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#071522" stopOpacity="0.95" />
      </linearGradient>

      <linearGradient id="ds-diamond-top" x1="24" y1="18" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E8EEF5" />
      </linearGradient>

      <linearGradient id="ds-diamond-bot" x1="24" y1="26" x2="24" y2="33" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5FA8D3" />
        <stop offset="100%" stopColor="#2563A6" />
      </linearGradient>
    </defs>

    {showContainer && (
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11"
        fill="#071522"
        stroke="rgba(95, 168, 211, 0.35)"
        strokeWidth="1.2"
      />
    )}

    {/* Shield Outer */}
    <path
      d="M24 10.5L14 15V24.5C14 31.2 18.2 36.8 24 38.6C29.8 36.8 34 31.2 34 24.5V15L24 10.5Z"
      fill="url(#ds-shield-grad)"
      stroke="#E8EEF5"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />

    {/* Left Bevel */}
    <path
      d="M24 11.5L15 15.5V24.5C15 30.5 18.8 35.6 24 37.4V11.5Z"
      fill="url(#ds-shield-left)"
    />

    {/* Right Bevel */}
    <path
      d="M24 11.5L33 15.5V24.5C33 30.5 29.2 35.6 24 37.4V11.5Z"
      fill="url(#ds-shield-right)"
    />

    <line x1="24" y1="11" x2="24" y2="38" stroke="rgba(232,238,245,0.4)" strokeWidth="0.8" />

    {/* Diamond Prism */}
    <path
      d="M24 18L29 25L24 32L19 25L24 18Z"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.1"
    />
    <path d="M24 18.5L28.5 25H19.5L24 18.5Z" fill="url(#ds-diamond-top)" />
    <path d="M24 31.5L28.5 25H19.5L24 31.5Z" fill="url(#ds-diamond-bot)" />

    <circle cx="24" cy="25" r="1.5" fill="#FFFFFF" />
  </svg>
);

/* ========================================================================= */
/* 3. CONCEPT C: THE OBSIDIAN SOVEREIGN (Enterprise Heavy Armor)             */
/* ========================================================================= */
export const ObsidianSovereignLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  showContainer = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
    aria-label="VulnFusion Obsidian Sovereign Logo"
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <defs>
      <linearGradient id="os-outer-trim" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82C4" />
        <stop offset="50%" stopColor="#2563A6" />
        <stop offset="100%" stopColor="#0B1F33" />
      </linearGradient>
      <linearGradient id="os-plate-body" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
    </defs>

    {showContainer && (
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11"
        fill="#071522"
        stroke="rgba(95, 168, 211, 0.35)"
        strokeWidth="1.2"
      />
    )}

    {/* Outer Armor Rim */}
    <path
      d="M24 6L9 11.5V23.5C9 33.2 15.5 40.5 24 43.5C32.5 40.5 39 33.2 39 23.5V11.5L24 6Z"
      fill="url(#os-plate-body)"
      stroke="url(#os-outer-trim)"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* Inner Gold Bevel Rim */}
    <path
      d="M24 9.5L13 14V23C13 29.8 18 36.2 24 38.8C30 36.2 35 29.8 35 23V14L24 9.5Z"
      fill="#09111E"
      stroke="#F59E0B"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />

    {/* Sovereign Nexus Emblem */}
    <path
      d="M24 16.5L29.5 22L24 30.5L18.5 22L24 16.5Z"
      fill="#2563A6"
      stroke="#E8EEF5"
      strokeWidth="1"
      strokeLinejoin="round"
    />

    <line x1="24" y1="12.5" x2="24" y2="16.5" stroke="#F59E0B" strokeWidth="1.1" strokeLinecap="round" />
    <line x1="24" y1="30.5" x2="24" y2="35.5" stroke="#3B82C4" strokeWidth="1.1" strokeLinecap="round" />
    <circle cx="24" cy="22.5" r="1.8" fill="#FFFFFF" />
  </svg>
);

/* ========================================================================= */
/* 4. CONCEPT D: THE QUANTUM VF MONOGRAM                                     */
/* ========================================================================= */
export const QuantumVFMonogramLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  showContainer = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
    aria-label="VulnFusion Quantum VF Monogram Logo"
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <defs>
      <linearGradient id="vf-mono-v" x1="8" y1="10" x2="28" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5FA8D3" />
        <stop offset="50%" stopColor="#2563A6" />
        <stop offset="100%" stopColor="#102A43" />
      </linearGradient>
    </defs>

    {showContainer && (
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11"
        fill="#071522"
        stroke="rgba(95, 168, 211, 0.35)"
        strokeWidth="1.2"
      />
    )}

    {/* Background Tech Hexagon */}
    <path
      d="M24 5L39 13.5V34.5L24 43L9 34.5V13.5L24 5Z"
      fill="#08101A"
      stroke="#1E293B"
      strokeWidth="1.2"
    />

    {/* 'V' Stroke Vector */}
    <path
      d="M13 14L24 35L29 26L21 21L17 14H13Z"
      fill="url(#vf-mono-v)"
    />
    <path
      d="M13 14L24 35"
      stroke="#E8EEF5"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* 'F' Stroke Vector */}
    <path d="M24 13.5H35" stroke="#FF9F1C" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M24 23.5H32" stroke="#FF9F1C" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="24" y1="13.5" x2="24" y2="35" stroke="#2563A6" strokeWidth="2.2" strokeLinecap="round" />

    <circle cx="24" cy="23.5" r="1.8" fill="#FFFFFF" />
  </svg>
);

/* ========================================================================= */
/* 5. CONCEPT E: THE AEGIS HEX PRISM                                         */
/* ========================================================================= */
export const AegisHexPrismLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  showContainer = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
    aria-label="VulnFusion Aegis Hex Prism Logo"
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <defs>
      <linearGradient id="ah-outer" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82C4" />
        <stop offset="50%" stopColor="#2563A6" />
        <stop offset="100%" stopColor="#0B1F33" />
      </linearGradient>
    </defs>

    {showContainer && (
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11"
        fill="#071522"
        stroke="rgba(95, 168, 211, 0.35)"
        strokeWidth="1.2"
      />
    )}

    {/* Hex Shield Outer */}
    <path
      d="M24 6L38 14V30L24 38L10 30V14L24 6Z"
      fill="#07111D"
      stroke="url(#ah-outer)"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* Facet Top-Left */}
    <path d="M24 8L12 15L24 24V8Z" fill="#1B3A5A" opacity="0.85" />
    {/* Facet Top-Right */}
    <path d="M24 8L36 15L24 24V8Z" fill="#102A43" opacity="0.95" />
    {/* Facet Bottom-Left */}
    <path d="M24 36L12 29L24 24V36Z" fill="#0C2340" opacity="0.95" />
    {/* Facet Bottom-Right */}
    <path d="M24 36L36 29L24 24V36Z" fill="#06121E" opacity="0.98" />

    {/* Inner Precision Hex */}
    <path
      d="M24 16.5L30.5 20.2V27.8L24 31.5L17.5 27.8V20.2L24 16.5Z"
      fill="#050C16"
      stroke="#5FA8D3"
      strokeWidth="1.1"
    />

    <circle cx="24" cy="24" r="1.6" fill="#FFFFFF" />
  </svg>
);

/* ========================================================================= */
/* 6. CONCEPT F: THE KINETIC FUSION SHIELD (Refined Alternate)              */
/* ========================================================================= */
export const FusionKineticLogo: React.FC<IconBaseProps> = ({
  size = 32,
  className = '',
  glow = false,
  showContainer = false,
  ...props
}) => (
  <svg
    width={typeof size === 'number' ? size * 1.3 : size}
    height={size}
    viewBox="0 0 96 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 transition-transform duration-150 ${className}`}
    aria-label="VulnFusion Kinetic Shield Logo"
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <defs>
      <linearGradient id="fk-copper" x1="6" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      <linearGradient id="fk-shield" x1="12" y1="8" x2="44" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#152738" />
        <stop offset="100%" stopColor="#050C14" />
      </linearGradient>
    </defs>

    <g>
      {/* Streams */}
      <path d="M37 23 C47 14 59 9 86 9 C73 12 58 17 47 27 Z" fill="#EA580C" opacity="0.9" />
      <path d="M42 27 C53 18 67 15 92 16 C77 18 61 25 51 30 Z" fill="#3B82C4" opacity="0.85" />
      <path d="M34 29 C47 24 63 22 81 22 C67 25 53 30 42 32 Z" fill="#C2410C" opacity="0.8" />
      <path d="M39 35 C49 44 63 53 87 52 C71 50 55 43 44 36 Z" fill="#2563A6" opacity="0.75" />

      {/* Shield Base */}
      <path
        d="M28 6 C36 6 44 8 48 10 C51 21 50 34 46 43 C40 51 33 57 28 59 C23 57 16 51 10 43 C6 34 5 21 8 10 C12 8 20 6 28 6 Z"
        fill="url(#fk-copper)"
      />
      <path
        d="M28 8 C35 8 42 10 45 11.5 C47 21 46 33 43 41 C38 48 32 53 28 55 C24 53 18 48 13 41 C10 33 9 21 11 11.5 C14 10 21 8 28 8 Z"
        fill="url(#fk-shield)"
      />

      {/* Cross Bars */}
      <line x1="19" y1="22" x2="37" y2="40" stroke="#3B82C4" strokeWidth="3" strokeLinecap="round" />
      <line x1="19" y1="40" x2="37" y2="22" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="28" cy="31" r="5" fill="#0A1522" stroke="#E8EEF5" strokeWidth="1" />
      <circle cx="28" cy="31" r="2" fill="#FFFFFF" />
    </g>
  </svg>
);

/* Dynamic Resolver for Active Executive Logo */
export const renderExecutiveLogo = (
  logoId: ExecutiveLogoId = 'shield-v-fusion',
  props: IconBaseProps = {}
): React.ReactNode => {
  switch (logoId) {
    case 'shield-v-fusion':
      return <ShieldVFusionLogo {...props} />;
    case 'diamond-sentinel':
      return <DiamondSentinelLogo {...props} />;
    case 'obsidian-sovereign':
      return <ObsidianSovereignLogo {...props} />;
    case 'vf-monogram':
      return <QuantumVFMonogramLogo {...props} />;
    case 'aegis-hex':
      return <AegisHexPrismLogo {...props} />;
    case 'fusion-kinetic':
      return <FusionKineticLogo {...props} />;
    default:
      return <ShieldVFusionLogo {...props} />;
  }
};
