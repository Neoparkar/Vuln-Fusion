import React, { useState, useRef, useEffect } from 'react';
import {
  VulnFusionBrandIcon,
  ExecutiveIntelligenceIcon,
  AssetIntelligenceIcon,
  AssetCorrelationIcon,
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  ReportIntelligenceIcon,
  AIAnalystSecurityIcon,
  SecurityGovernanceIcon,
  KnowledgeCenterIcon,
  PlatformConfigurationIcon,
  TestCommandCenterIcon,
} from './icons/VulnFusionIcons';

export type NavTabId =
  | 'overview'
  | 'correlation'
  | 'inventory'
  | 'findings'
  | 'evidence'
  | 'reports'
  | 'ai-analyst'
  | 'admin'
  | 'help'
  | 'settings'
  | 'tests';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  reviewCount: number;
  verificationBadge?: string;
  onOpenAIAnalyst?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
    badgeType?: 'warning' | 'neutral' | 'success';
    onClick?: () => void;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  reviewCount,
  verificationBadge = '—',
  onOpenAIAnalyst,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived expansion state from hover or keyboard focus
  const isExpanded = isHovered || isFocused;

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    // Deliberate ~130ms debounce to prevent accidental flicker during cursor movement
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 130);
  };

  const handleFocus = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleTabClick = (id: NavTabId) => {
    if (id === 'ai-analyst' && onOpenAIAnalyst) {
      onOpenAIAnalyst();
    }
    setActiveTab(id);
  };

  // 4 Explicit Sidebar Sections
  const navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: ExecutiveIntelligenceIcon,
        },
        {
          id: 'correlation',
          label: 'Asset Correlation',
          icon: AssetCorrelationIcon,
          badge: reviewCount > 0 ? `${reviewCount}` : undefined,
          badgeType: 'warning',
        },
        {
          id: 'inventory',
          label: 'Asset Inventory',
          icon: AssetIntelligenceIcon,
        },
        {
          id: 'findings',
          label: 'Finding Correlation',
          icon: FindingsIntelligenceIcon,
        },
        {
          id: 'evidence',
          label: 'Evidence Explorer',
          icon: DeterministicEvidenceIcon,
        },
      ],
    },
    {
      title: 'REPORTING',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          icon: ReportIntelligenceIcon,
        },
        {
          id: 'ai-analyst',
          label: 'AI Analyst',
          icon: AIAnalystSecurityIcon,
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          id: 'admin',
          label: 'Administration',
          icon: SecurityGovernanceIcon,
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'tests',
          label: 'Test Suite',
          icon: TestCommandCenterIcon,
          badge: verificationBadge,
        },
        {
          id: 'help',
          label: 'Help',
          icon: KnowledgeCenterIcon,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: PlatformConfigurationIcon,
        },
      ],
    },
  ];

  // Precise timing curves: ~320ms on expansion with custom cubic bezier, ~280ms on collapse
  const containerWidthStyle: React.CSSProperties = {
    width: isExpanded ? '230px' : '68px',
    transition: isExpanded
      ? 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // Text label reveal timing: stays hidden for initial 120ms then fades in over ~170ms
  const labelStyle: React.CSSProperties = {
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-4px)',
    maxWidth: isExpanded ? '135px' : '0px',
    transition: isExpanded
      ? 'opacity 170ms ease 120ms, transform 180ms ease 120ms, max-width 320ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'opacity 110ms ease 0ms, transform 110ms ease 0ms, max-width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // Section title reveal timing
  const sectionTitleStyle: React.CSSProperties = {
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-4px)',
    transition: isExpanded
      ? 'opacity 160ms ease 110ms, transform 160ms ease 110ms'
      : 'opacity 90ms ease 0ms, transform 90ms ease 0ms',
  };

  // Brand wordmark reveal timing
  const logoWordmarkStyle: React.CSSProperties = {
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateX(0)' : 'translateX(-4px)',
    maxWidth: isExpanded ? '150px' : '0px',
    transition: isExpanded
      ? 'opacity 190ms ease 100ms, transform 190ms ease 100ms, max-width 320ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'opacity 110ms ease 0ms, transform 110ms ease 0ms, max-width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // Badge pill reveal timing
  const badgeStyle: React.CSSProperties = {
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'scale(1)' : 'scale(0.85)',
    transition: isExpanded
      ? 'opacity 170ms ease 130ms, transform 170ms ease 130ms'
      : 'opacity 90ms ease 0ms, transform 90ms ease 0ms',
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={containerWidthStyle}
      className="hidden md:block shrink-0 relative z-30"
    >
      <aside
        aria-label="VulnFusion Navigation Sidebar"
        style={containerWidthStyle}
        className="sticky top-0 h-screen flex flex-col justify-between bg-[#071019] border-r border-[#1B3045] select-none z-30 overflow-hidden"
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4">
          
          {/* Brand Logo & Title Header */}
          <div className="px-3 mb-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex items-center px-0.5 py-1 rounded-xl group focus:outline-none transition-all cursor-pointer min-w-0 min-h-[44px]"
                title="VulnFusion Asset Intelligence — Overview"
                aria-label="VulnFusion Asset Intelligence"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0B1522] border border-[#2563A6]/40 flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-hover:border-[#3B82F6] shrink-0">
                  <VulnFusionBrandIcon size={26} />
                </div>

                <div
                  style={logoWordmarkStyle}
                  className={`text-left min-w-0 ml-3 overflow-hidden whitespace-nowrap ${
                    !isExpanded ? 'pointer-events-none' : ''
                  }`}
                >
                  <span className="font-extrabold text-base tracking-tight text-[#F1F5F9] block leading-tight truncate">
                    Vuln<span className="text-[#9CC3E6]">Fusion</span>
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-semibold tracking-wider uppercase font-mono truncate block">
                    Asset Intelligence
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Sectioned Navigation Lists */}
          <div className="space-y-4 px-3">
            {navSections.map((section, sIndex) => (
              <div key={section.title} className="space-y-1">
                {/* Section Divider & Header Label */}
                {sIndex > 0 && (
                  <div className="pt-2 pb-1">
                    <div className="border-t border-[#132236] mx-1" />
                  </div>
                )}

                <div className="h-5 flex items-center px-2 mb-1 relative overflow-hidden">
                  <div
                    style={sectionTitleStyle}
                    className={`flex items-center ${
                      !isExpanded ? 'pointer-events-none' : ''
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider font-bold whitespace-nowrap">
                      {section.title}
                    </span>
                  </div>
                  {!isExpanded && (
                    <div className="w-full flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-[#1B3045] rounded-full" />
                    </div>
                  )}
                </div>

                {/* Section Items */}
                <nav className="space-y-1" aria-label={section.title}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <div key={item.id} className="relative group/tooltip">
                        <button
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full h-11 px-2.5 rounded-xl flex items-center gap-3 transition-all relative cursor-pointer min-h-[44px] ${
                            isActive
                              ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_2px_12px_rgba(0,184,255,0.15)] font-bold'
                              : 'text-[#8B95A5] hover:text-slate-100 hover:bg-[#0E1724] border border-transparent font-medium'
                          }`}
                          aria-label={item.label}
                        >
                          <div className="w-6 h-6 shrink-0 flex items-center justify-center relative">
                            <Icon
                              size={20}
                              className={
                                isActive
                                  ? 'text-[#00B8FF]'
                                  : 'text-[#8B95A5] group-hover/tooltip:text-slate-200'
                              }
                            />
                            {/* Review badge dot in collapsed view */}
                            {!isExpanded && item.badge && (
                              <span
                                className={`absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 text-[8px] leading-none flex items-center justify-center font-bold font-mono rounded-full transition-all ${
                                  item.id === 'correlation'
                                    ? 'bg-amber-500 text-[#071019] shadow-sm ring-1 ring-[#071019]'
                                    : 'bg-[#1B3045] text-slate-200'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <span
                            style={labelStyle}
                            className={`text-xs whitespace-nowrap overflow-hidden text-left tracking-wide ${
                              !isExpanded ? 'pointer-events-none' : ''
                            }`}
                          >
                            {item.label}
                          </span>

                          {item.badge && isExpanded && (
                            <span
                              style={badgeStyle}
                              className={`ml-auto px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-full shrink-0 ${
                                item.id === 'correlation'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-[#132236] text-slate-300 border border-[#1B3045]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Accessible hover tooltip only when collapsed */}
                        {!isExpanded && (
                          <div className="absolute left-[74px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#090F17] text-slate-200 text-xs font-semibold rounded-lg shadow-xl border border-[#1B3045] opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {item.label}
                            {item.badge && ` (${item.badge})`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

        </div>

        {/* Clean bottom padding without manual toggle buttons */}
        <div className="py-2" />
      </aside>
    </div>
  );
};

export default Sidebar;
