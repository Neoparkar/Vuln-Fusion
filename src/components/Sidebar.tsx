import React, { useState, useEffect } from 'react';
import {
  VulnFusionBrandIcon,
  ExecutiveIntelligenceIcon,
  AssetIntelligenceIcon,
  AssetCorrelationIcon,
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  TestCommandCenterIcon,
} from './icons/VulnFusionIcons';
import { Sparkles, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRBAC } from '../context/RBACContext';

export type NavTabId = 'overview' | 'inventory' | 'correlation' | 'findings' | 'evidence' | 'tests' | 'admin';

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
  totalTests = 118,
  onOpenAIAnalyst,
}) => {
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vulnfusion_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const { isAdmin } = useRBAC();

  const togglePinned = () => {
    setIsPinned(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vulnfusion_sidebar_pinned', String(next));
      } catch {
        // LocalStorage fallback
      }
      return next;
    });
  };

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
    ...(isAdmin ? [{
      id: 'admin' as const,
      label: 'Administration',
      icon: Shield,
    }] : []),
  ];

  return (
    <div
      className={`hidden md:block shrink-0 relative z-30 transition-[width] duration-200 ease-in-out ${
        isPinned ? 'w-[230px]' : 'w-[68px]'
      }`}
    >
      <aside
        aria-label="VulnFusion Navigation Sidebar"
        className={`sticky top-0 h-screen flex flex-col justify-between bg-[#071019] border-r border-[#1B3045] select-none z-30 transition-[width] duration-200 ease-in-out ${
          isPinned ? 'w-[230px]' : 'w-[68px]'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4">
          
          {/* Brand Logo & Expand/Collapse Trigger */}
          <div className="px-3 mb-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex items-center px-0.5 py-1 rounded-xl group focus:outline-none transition-all cursor-pointer min-w-0"
                title="VulnFusion Asset Intelligence — Overview"
                aria-label="VulnFusion Asset Intelligence"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0B1522] border border-[#2563A6]/40 flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-hover:border-[#3B82F6] shrink-0">
                  <VulnFusionBrandIcon size={26} />
                </div>

                <div
                  className={`text-left min-w-0 ml-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                    isPinned
                      ? 'opacity-100 max-w-[130px] translate-x-0'
                      : 'opacity-0 max-w-0 -translate-x-1 pointer-events-none'
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

          <div className="px-3 mb-5">
            <div className="h-5 flex items-center px-2 mb-2 relative overflow-hidden">
              <div
                className={`flex items-center transition-all duration-200 ${
                  isPinned
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-1 pointer-events-none'
                }`}
              >
                <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider font-bold">
                  Workspace
                </span>
              </div>
              {!isPinned && (
                <div className="w-full flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-[#1B3045] rounded-full" />
                </div>
              )}
            </div>

            <nav className="space-y-1.5" aria-label="Workspaces">
              {workspaceItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <div key={item.id} className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full h-11 px-2.5 rounded-xl flex items-center gap-3 transition-all relative cursor-pointer ${
                        isActive
                          ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_2px_12px_rgba(0,184,255,0.15)] font-bold'
                          : 'text-[#8B95A5] hover:text-slate-100 hover:bg-[#0E1724] border border-transparent font-medium'
                      }`}
                      aria-label={item.label}
                    >
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                        <Icon size={20} className={isActive ? 'text-[#00B8FF]' : 'text-[#8B95A5] group-hover/tooltip:text-slate-200'} />
                      </div>

                      <span
                        className={`text-xs whitespace-nowrap overflow-hidden text-left transition-all duration-200 tracking-wide ${
                          isPinned
                            ? 'opacity-100 max-w-[130px] translate-x-0'
                            : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                        }`}
                      >
                        {item.label}
                      </span>

                      {item.badge && (
                        <span
                          className={`absolute right-2 px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-full transition-all ${
                            item.id === 'correlation'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#132236] text-slate-300 border border-[#1B3045]'
                          } ${
                            isPinned
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-90 pointer-events-none'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {!isPinned && (
                      <div className="absolute left-[74px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#090F17] text-slate-200 text-xs font-semibold rounded-lg shadow-xl border border-[#1B3045] opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Bottom Area: AI Analyst & Explicit Pin/Push Toggle */}
        <div className="p-3 border-t border-[#1B3045] space-y-2">
          {onOpenAIAnalyst && (
            <div className="relative group/tooltip">
              <button
                type="button"
                onClick={onOpenAIAnalyst}
                className="w-full h-11 px-2.5 rounded-xl flex items-center gap-3 text-purple-300 bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/30 transition-all font-semibold cursor-pointer"
                aria-label="Open AI Analyst Sidecar"
              >
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <span
                  className={`text-xs whitespace-nowrap overflow-hidden text-left transition-all duration-200 ${
                    isPinned
                      ? 'opacity-100 max-w-[130px] translate-x-0'
                      : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                  }`}
                >
                  AI Analyst
                </span>
              </button>
              {!isPinned && (
                <div className="absolute left-[74px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#090F17] text-slate-200 text-xs font-semibold rounded-lg shadow-xl border border-[#1B3045] opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                  AI Analyst Sidecar
                </div>
              )}
            </div>
          )}

          {/* Explicit Expand / Collapse Pin Control */}
          <div className="relative group/tooltip">
            <button
              type="button"
              onClick={togglePinned}
              className={`w-full h-9 px-2 rounded-xl flex items-center transition-all cursor-pointer ${
                isPinned
                  ? 'justify-between text-[#8B95A5] hover:text-[#F1F5F9] hover:bg-[#0E1724] border border-[#1B3045]/60 bg-[#0A121D]'
                  : 'justify-center text-[#8B95A5] hover:text-[#F1F5F9] hover:bg-[#0E1724] border border-transparent'
              }`}
              aria-label={isPinned ? 'Collapse navigation' : 'Expand navigation'}
              title={isPinned ? 'Collapse navigation' : 'Expand navigation'}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isPinned ? (
                  <ChevronLeft size={16} className="text-[#8B95A5] shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-[#8B95A5] shrink-0" />
                )}
                <span
                  className={`text-xs whitespace-nowrap overflow-hidden text-left transition-all duration-200 font-mono ${
                    isPinned
                      ? 'opacity-100 max-w-[110px] translate-x-0'
                      : 'opacity-0 max-w-0 pointer-events-none'
                  }`}
                >
                  Collapse
                </span>
              </div>
              {isPinned && (
                <span className="text-[10px] text-[#5F6875] font-mono shrink-0">
                  [Pinned]
                </span>
              )}
            </button>
            {!isPinned && (
              <div className="absolute left-[74px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#090F17] text-slate-200 text-xs font-semibold rounded-lg shadow-xl border border-[#1B3045] opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                Expand navigation
              </div>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
};
