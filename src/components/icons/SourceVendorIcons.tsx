import React, { useState, useRef, useEffect } from 'react';
import { SourceTool, SourceObservationSummary } from '../../types/vulnfusion';
import { Server, Check } from 'lucide-react';

export interface SourceLogoProps extends React.SVGProps<SVGSVGElement> {
  sourceTool?: string | null;
  size?: number | string;
  className?: string;
  'aria-label'?: string;
}

/* ========================================================================= */
/* 1. RAPID7 — EXACT OFFICIAL ORANGE STYLIZED 7 LOGO                        */
/* ========================================================================= */
export const Rapid7Logo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Rapid7 source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    {/* Official Rapid7 Orange Stylized 7 Mark */}
    <path
      d="M3.5 4H20.5V8.5L13.2 20H7.8L15 8.5H3.5V4Z"
      fill="#EA580C"
    />
  </svg>
);

export const Rapid7SourceIcon = Rapid7Logo;

/* ========================================================================= */
/* 2. TENABLE — EXACT OFFICIAL DARK NAVY CIRCLE + WHITE GEOMETRIC SHAPE      */
/* ========================================================================= */
export const TenableLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Tenable source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    {/* Dark navy circular mark */}
    <circle cx="12" cy="12" r="10.5" fill="#00205B" />
    {/* White geometric interconnected shape */}
    <g fill="#FFFFFF" stroke="#FFFFFF" strokeLinejoin="round" strokeLinecap="round">
      <path
        d="M12 5.5L17.2 8.5V14.5L12 17.5L6.8 14.5V8.5L12 5.5Z"
        fill="none"
        strokeWidth="1.4"
      />
      <path
        d="M12 5.5V17.5M6.8 8.5L17.2 14.5M6.8 14.5L17.2 8.5"
        strokeWidth="1.1"
      />
      <circle cx="12" cy="5.5" r="1.3" stroke="none" />
      <circle cx="17.2" cy="8.5" r="1.3" stroke="none" />
      <circle cx="17.2" cy="14.5" r="1.3" stroke="none" />
      <circle cx="12" cy="17.5" r="1.3" stroke="none" />
      <circle cx="6.8" cy="14.5" r="1.3" stroke="none" />
      <circle cx="6.8" cy="8.5" r="1.3" stroke="none" />
      <circle cx="12" cy="11.5" r="1.6" stroke="none" />
    </g>
  </svg>
);

export const TenableSourceIcon = TenableLogo;

/* ========================================================================= */
/* 3. QUALYS — EXACT OFFICIAL RED SHIELD + WHITE STYLIZED Q                  */
/* ========================================================================= */
export const QualysLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Qualys source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    {/* Red shield-shaped mark */}
    <path
      d="M12 2.5L3.5 6V12.5C3.5 17.5 7.2 21.2 12 22.5C16.8 21.2 20.5 17.5 20.5 12.5V6L12 2.5Z"
      fill="#ED1C24"
    />
    {/* White stylized Q */}
    <circle cx="11.5" cy="11.5" r="4" stroke="#FFFFFF" strokeWidth="1.9" fill="none" />
    <path d="M14 14L17.2 17.2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const QualysSourceIcon = QualysLogo;

/* ========================================================================= */
/* 4. WIZ — EXACT OFFICIAL BLUE ROUNDED-SQUARE + WHITE 4-POINT SPARKLE       */
/* ========================================================================= */
export const WizLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Wiz source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    {/* Blue rounded-square mark */}
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#0075FF" />
    {/* White four-point sparkle */}
    <path
      d="M12 5.5C12 9.1 14.9 12 18.5 12C14.9 12 12 14.9 12 18.5C12 14.9 9.1 12 5.5 12C9.1 12 12 9.1 12 5.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const WizSourceIcon = WizLogo;

/* ========================================================================= */
/* 5. FORCEPOINT & CROWDSTRIKE & GENERIC LOGOS                               */
/* ========================================================================= */
export const ForcepointLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Forcepoint source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    <path
      d="M12 3L19.5 7.2V16.8L12 21L4.5 16.8V7.2L12 3Z"
      fill="#00A887"
    />
    <path d="M9 8.5H15M9 12H13.5M9 15.5H11" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ForcepointSourceIcon = ForcepointLogo;

export const CrowdStrikeLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'CrowdStrike source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    <path
      d="M4 16C6.5 14.5 9.5 10.5 12 5C12 8.5 13.5 12 18 14.5C14.5 14.5 12.5 13 11.5 10.5C10.5 13.5 7.5 15.2 4 16Z"
      fill="#E01A22"
    />
    <path
      d="M7.5 17.5C9.5 16.8 11 15.2 12.5 13C11.8 15.2 10.2 16.8 7.5 17.5Z"
      fill="#FFA4A8"
    />
  </svg>
);

export const CrowdStrikeSourceIcon = CrowdStrikeLogo;

export const GenericSourceLogo: React.FC<SourceLogoProps> = ({
  size = 20,
  className = '',
  'aria-label': ariaLabel = 'Generic discovery source',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
    style={{ objectFit: 'contain' }}
    {...props}
  >
    <title>{ariaLabel}</title>
    <rect x="3" y="4" width="18" height="6" rx="1.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <circle cx="6" cy="7" r="1" fill="#38BDF8" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <circle cx="6" cy="17" r="1" fill="#34D399" />
  </svg>
);

export const GenericDiscoverySourceIcon = GenericSourceLogo;

/* ========================================================================= */
/* 6. SINGLE SOURCE-TO-LOGO RESOLVER COMPONENT (Section 23 & 24)             */
/* ========================================================================= */
export const SourceLogo: React.FC<SourceLogoProps> = ({
  sourceTool,
  size = 20,
  className = '',
  'aria-label': customAriaLabel,
  ...props
}) => {
  if (!sourceTool) {
    return <GenericSourceLogo size={size} className={className} aria-label={customAriaLabel || 'Unknown source'} {...props} />;
  }

  const normalized = sourceTool.trim().toUpperCase();

  if (normalized.includes('RAPID7') || normalized === 'R7') {
    return <Rapid7Logo size={size} className={className} aria-label={customAriaLabel || 'Rapid7 source'} {...props} />;
  }
  if (normalized.includes('TENABLE') || normalized === 'NESSUS') {
    return <TenableLogo size={size} className={className} aria-label={customAriaLabel || 'Tenable source'} {...props} />;
  }
  if (normalized.includes('QUALYS')) {
    return <QualysLogo size={size} className={className} aria-label={customAriaLabel || 'Qualys source'} {...props} />;
  }
  if (normalized.includes('WIZ')) {
    return <WizLogo size={size} className={className} aria-label={customAriaLabel || 'Wiz source'} {...props} />;
  }
  if (normalized.includes('FORCEPOINT') || normalized === 'FORCE') {
    return <ForcepointLogo size={size} className={className} aria-label={customAriaLabel || 'Forcepoint source'} {...props} />;
  }
  if (normalized.includes('CROWDSTRIKE') || normalized.includes('FALCON')) {
    return <CrowdStrikeLogo size={size} className={className} aria-label={customAriaLabel || 'CrowdStrike source'} {...props} />;
  }

  return <GenericSourceLogo size={size} className={className} aria-label={customAriaLabel || `${sourceTool} source`} {...props} />;
};

export function getSourceVendorIcon(
  sourceName?: string | null,
  size: number | string = 20,
  className = ''
): React.ReactElement {
  return <SourceLogo sourceTool={sourceName} size={size} className={className} />;
}

/* ========================================================================= */
/* 7. PRIMARY SOURCE CALCULATOR                                              */
/* ========================================================================= */
export function determinePrimarySource(
  sourceTools: string[] = [],
  observationSummaries?: SourceObservationSummary[]
): string | null {
  if (!sourceTools || sourceTools.length === 0) return null;
  if (sourceTools.length === 1) return sourceTools[0];

  if (observationSummaries && observationSummaries.length > 0) {
    const sorted = [...observationSummaries].sort((a, b) => {
      const timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.recordCount - a.recordCount;
    });
    if (sorted[0]?.sourceTool) {
      return sorted[0].sourceTool;
    }
  }

  return sourceTools[0];
}

/* ========================================================================= */
/* 8. ASSET DISCOVERY SOURCE BADGE (Multi-Source Support, Section 5)        */
/* ========================================================================= */
export interface AssetSourceDiscoveryBadgeProps {
  sourceTools?: string[];
  primarySource?: string | null;
  observationSummaries?: SourceObservationSummary[];
  size?: number;
  className?: string;
  showMultiCounter?: boolean;
}

export const AssetSourceDiscoveryBadge: React.FC<AssetSourceDiscoveryBadgeProps> = ({
  sourceTools = [],
  primarySource: explicitPrimary,
  observationSummaries,
  size = 20,
  className = '',
  showMultiCounter = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const primary = explicitPrimary || determinePrimarySource(sourceTools, observationSummaries);
  const additionalSourcesCount = Math.max(0, sourceTools.length - 1);

  if (!primary && sourceTools.length === 0) {
    return (
      <span className={`inline-flex items-center align-middle ${className}`} title="Unknown discovery source">
        <GenericSourceLogo size={size} aria-label="Unknown source" />
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 align-middle ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Vendor Source Logo */}
      <button
        type="button"
        onClick={() => {
          if (sourceTools.length > 0) {
            setIsOpen(prev => !prev);
          }
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-pointer focus:outline-none rounded p-0.5 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        aria-label={
          sourceTools.length > 1
            ? `${primary} source and ${additionalSourcesCount} other platform${additionalSourcesCount > 1 ? 's' : ''}`
            : `${primary} source`
        }
      >
        <SourceLogo sourceTool={primary} size={size} />
      </button>

      {/* Multi-Source Counter Badge (+N) */}
      {showMultiCounter && additionalSourcesCount > 0 && (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#151A21] hover:bg-[#1E293B] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430] hover:border-[#3B82F6]/50 transition cursor-pointer"
          title={`Discovered by ${sourceTools.length} security platforms: ${sourceTools.join(', ')}`}
          aria-label={`+${additionalSourcesCount} additional discovery sources`}
        >
          +{additionalSourcesCount}
        </button>
      )}

      {/* Multi-Source Popover (Section 5) */}
      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute z-50 left-0 bottom-full mb-2 w-64 p-3 bg-[#0B0F17] border border-[#1E293B] rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans text-[#F1F5F9] animate-fadeIn"
          style={{ minWidth: '220px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B95A5]">
              Discovery Sources
            </span>
            <span className="text-[10px] font-mono text-[#38BDF8] font-bold">
              {sourceTools.length} {sourceTools.length === 1 ? 'Platform' : 'Platforms'}
            </span>
          </div>

          {/* Sources List with Official Logos */}
          <div className="space-y-2">
            {sourceTools.map((source) => {
              const isPrimary = source === primary;
              const summary = observationSummaries?.find(s => s.sourceTool.toUpperCase() === source.toUpperCase());

              return (
                <div
                  key={source}
                  className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border ${
                    isPrimary
                      ? 'bg-[#151A21] border-[#3B82F6]/30'
                      : 'bg-[#10141A] border-[#1B2430]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SourceLogo sourceTool={source} size={20} />
                    <div>
                      <div className="font-semibold text-xs text-[#F1F5F9] flex items-center gap-1.5">
                        <span>{source}</span>
                        {isPrimary && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                            Primary
                          </span>
                        )}
                      </div>
                      {summary?.lastSeen && (
                        <div className="text-[10px] text-[#5F6875] font-mono">
                          Last seen: {new Date(summary.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute left-3 top-full w-2 h-2 bg-[#0B0F17] border-r border-b border-[#1E293B] transform rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
};
