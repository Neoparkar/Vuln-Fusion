import React, { useState, useRef, useEffect } from 'react';
import {
  VulnFusionBrandIcon,
  ExecutiveIntelligenceIcon,
  AssetIntelligenceIcon,
  AssetCorrelationIcon,
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  TestCommandCenterIcon,
} from './icons/VulnFusionIcons';
import { Sparkles } from 'lucide-react';

export type NavTabId = 'overview' | 'inventory' | 'correlation' | 'findings' | 'evidence' | 'tests';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  reviewCount: number;
  totalTests?: number;
  onOpenAIAnalyst?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  reviewCount,
  totalTests = 98,
  onOpenAIAnalyst,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    // 100ms collapse delay to prevent accidental flicker
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const workspaceItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: ExecutiveIntelligenceIcon,
    },
    {
      id: 'inventory' as const,
      label: 'Asset Inventory',
      icon: AssetIntelligenceIcon,
    },
    {
      id: 'correlation' as const,
      label: 'Asset Correlation',
      icon: AssetCorrelationIcon,
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
      badgeType: 'warning' as const,
    },
    {
      id: 'findings' as const,
      label: 'Finding Correlation',
      icon: FindingsIntelligenceIcon,
    },
    {
      id: 'evidence' as const,
      label: 'Evidence Explorer',
      icon: DeterministicEvidenceIcon,
    },
    {
      id: 'tests' as const,
      label: 'Test Suite',
      icon: TestCommandCenterIcon,
      badge: `${totalTests}`,
      badgeType: 'neutral' as const,
    },
  ];

  return (
    /* Outer layout gutter: stays permanently 68px wide so main content NEVER moves or reflows */
    <div className="hidden md:block w-[68px] shrink-0 relative z-40">
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="VulnFusion Navigation Sidebar"
        className={`fixed top-0 left-0 h-screen flex flex-col justify-between bg-[#071019] border-r border-[#1B3045] select-none z-40 transition-[width,box-shadow] ${
          isHovered
            ? 'w-[240px] shadow-[12px_0_36px_rgba(0,0,0,0.85)] duration-200 ease-out'
            : 'w-[68px] shadow-none duration-[240ms] ease-in-out delay-[80ms]'
        }`}
      >
        {/* Top Half: Brand + Navigation Items */}
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4">
          
          {/* Brand Wordmark & Shield Logo */}
          <div className="px-3 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex items-center w-full px-0.5 py-1 rounded-xl group focus:outline-none transition-all cursor-pointer"
              title="VulnFusion Asset Intelligence — Overview"
              aria-label="VulnFusion Asset Intelligence"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1522] border border-[#2563A6]/40 flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-hover:border-[#3B82C4] shrink-0">
                <VulnFusionBrandIcon size={26} />
              </div>

              <div
                className={`text-left min-w-0 ml-3 overflow-hidden whitespace-nowrap transition-all ${
                  isHovered
                    ? 'opacity-100 max-w-[160px] translate-x-0 duration-150 delay-[75ms] ease-out'
                    : 'opacity-0 max-w-0 -translate-x-1 duration-100 ease-in delay-0 pointer-events-none'
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

          {/* Section: WORKSPACE */}
          <div className="px-3 mb-5">
            <div className="h-5 flex items-center px-2 mb-2 relative overflow-hidden">
              <div
                className={`absolute inset-x-2 flex items-center transition-all ${
                  isHovered
                    ? 'opacity-100 translate-x-0 duration-150 delay-[75ms] ease-out'
                    : 'opacity-0 -translate-x-1 duration-100 ease-in delay-0 pointer-events-none'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6875] font-semibold whitespace-nowrap">
                  WORKSPACE
                </span>
              </div>
              <div
                className={`w-6 mx-auto border-t border-[#1B3045]/70 transition-opacity ${
                  isHovered ? 'opacity-0 duration-100 ease-in' : 'opacity-100 duration-150 delay-[80ms] ease-out'
                }`}
              />
            </div>

            <nav className="space-y-1.5">
              {workspaceItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold relative h-[46px] px-2.5 text-left cursor-pointer transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#101B29] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_0_15px_rgba(0,184,255,0.18)]'
                        : 'text-[#A8B7C9] hover:text-[#F4F7FB] hover:bg-[#101B29]/70 border border-transparent'
                    }`}
                    aria-label={item.label}
                  >
                    {/* Active indicator bar on left edge */}
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#00B8FF] rounded-r shadow-[0_0_8px_#00B8FF]" />
                    )}

                    {/* Stable Icon Container: 30x30px footprint with 26px vivid icon */}
                    <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0 relative">
                      <div
                        className={`flex items-center justify-center transition-all duration-150 group-hover:scale-105 ${
                          isActive
                            ? 'opacity-100 drop-shadow-[0_0_8px_rgba(0,184,255,0.35)]'
                            : 'opacity-90 group-hover:opacity-100'
                        }`}
                      >
                        <Icon size={26} glow={isActive} />
                      </div>
                      
                      {/* Collapsed Badge Dot */}
                      {item.badge && (
                        <span
                          className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#071019] transition-opacity ${
                            isHovered ? 'opacity-0 duration-100' : 'opacity-100 duration-150 delay-[80ms]'
                          } ${item.badgeType === 'warning' ? 'bg-amber-400' : 'bg-slate-300'}`}
                        />
                      )}
                    </div>

                    {/* Label and Badge Pill */}
                    <div
                      className={`flex items-center justify-between flex-1 min-w-0 overflow-hidden whitespace-nowrap ml-3 transition-all ${
                        isHovered
                          ? 'opacity-100 max-w-[160px] translate-x-0 duration-150 delay-[75ms] ease-out'
                          : 'opacity-0 max-w-0 -translate-x-1 duration-100 ease-in delay-0 pointer-events-none'
                      }`}
                    >
                      <span className="truncate flex-1 font-semibold text-xs tracking-tight">{item.label}</span>

                      {item.badge && (
                        <span
                          className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full font-mono shrink-0 shadow-xs ${
                            item.badgeType === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#1B3045] text-slate-200 border border-slate-600/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: INTELLIGENCE */}
          <div className="px-3">
            <div className="h-5 flex items-center px-2 mb-2 relative overflow-hidden">
              <div
                className={`absolute inset-x-2 flex items-center transition-all ${
                  isHovered
                    ? 'opacity-100 translate-x-0 duration-150 delay-[75ms] ease-out'
                    : 'opacity-0 -translate-x-1 duration-100 ease-in delay-0 pointer-events-none'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6875] font-semibold whitespace-nowrap">
                  INTELLIGENCE
                </span>
              </div>
              <div
                className={`w-6 mx-auto border-t border-[#1B3045]/70 transition-opacity ${
                  isHovered ? 'opacity-0 duration-100 ease-in' : 'opacity-100 duration-150 delay-[80ms] ease-out'
                }`}
              />
            </div>

            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={onOpenAIAnalyst}
                className="w-full flex items-center rounded-xl text-xs font-semibold relative h-[46px] px-2.5 text-left bg-purple-950/25 hover:bg-purple-900/45 text-purple-200 border border-purple-500/35 shadow-sm group cursor-pointer transition-all duration-150"
                aria-label="Open AI Analyst Sidecar"
              >
                <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-150 drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]" />
                </div>

                <div
                  className={`flex items-center justify-between flex-1 min-w-0 overflow-hidden whitespace-nowrap ml-3 transition-all ${
                    isHovered
                      ? 'opacity-100 max-w-[160px] translate-x-0 duration-150 delay-[75ms] ease-out'
                      : 'opacity-0 max-w-0 -translate-x-1 duration-100 ease-in delay-0 pointer-events-none'
                  }`}
                >
                  <span className="truncate font-semibold text-xs text-purple-200">AI Analyst</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    Sidecar
                  </span>
                </div>
              </button>
            </nav>
          </div>

        </div>

        {/* Bottom Half: Version Indicator Only (NO PIN BUTTON) */}
        <div className="p-3 border-t border-[#1B3045]/80 shrink-0">
          <div className="relative h-11 flex items-center">
            {/* Collapsed view: centered v2.4 badge */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all ${
                isHovered
                  ? 'opacity-0 scale-95 pointer-events-none duration-100 ease-in'
                  : 'opacity-100 scale-100 duration-150 delay-[80ms] ease-out'
              }`}
            >
              <div
                className="w-9 h-9 rounded-xl bg-[#0B1420] border border-[#1B3045]/70 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400 cursor-default relative"
                title="VulnFusion v2.4.0 Engine — Deterministic Core Active"
              >
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                v2.4
              </div>
            </div>

            {/* Expanded view: full version box */}
            <div
              className={`w-full px-3 py-1.5 rounded-xl bg-[#0B1420] border border-[#1B3045]/70 text-left transition-all ${
                isHovered
                  ? 'opacity-100 translate-x-0 duration-150 delay-[75ms] ease-out'
                  : 'opacity-0 -translate-x-1 pointer-events-none duration-100 ease-in'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>v2.4.0 Engine</span>
              </div>
              <div className="text-[10px] text-[#718197] font-mono truncate">
                Deterministic Core Active
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
