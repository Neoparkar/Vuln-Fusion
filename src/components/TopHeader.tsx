import React, { useState } from 'react';
import {
  VulnFusionBrandIcon,
  ExecutiveIntelligenceIcon,
  AssetIntelligenceIcon,
  AssetCorrelationIcon,
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  TestCommandCenterIcon,
} from './icons/VulnFusionIcons';
import {
  Sparkles,
  User,
  Search,
  X,
  Menu,
  ChevronDown,
  Check,
} from 'lucide-react';
import { NavTabId } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  reviewCount: number;
  totalRecords: number;
  totalAssetGroups: number;
  totalFindings: number;
  totalTests?: number;
  onOpenAIAnalyst?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  reviewCount,
  totalTests = 98,
  onOpenAIAnalyst,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      subtitle: 'Overview & Telemetry Matrix',
      icon: ExecutiveIntelligenceIcon,
    },
    {
      id: 'inventory' as const,
      label: 'Asset Inventory',
      subtitle: 'Normalized Asset View Across Security Sources',
      icon: AssetIntelligenceIcon,
    },
    {
      id: 'correlation' as const,
      label: 'Asset Correlation',
      subtitle: 'Candidate Asset Resolution & Evidence',
      icon: AssetCorrelationIcon,
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
    },
    {
      id: 'findings' as const,
      label: 'Finding Correlation',
      subtitle: 'Deterministic Vulnerability Mapping',
      icon: FindingsIntelligenceIcon,
    },
    {
      id: 'evidence' as const,
      label: 'Evidence Explorer',
      subtitle: 'Multi-Source Raw Telemetry Inspector',
      icon: DeterministicEvidenceIcon,
    },
    {
      id: 'tests' as const,
      label: 'Test Suite',
      subtitle: 'Automated Integrity & Security Verifications',
      icon: TestCommandCenterIcon,
      badge: `${totalTests}`,
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  const handleSelectTab = (id: NavTabId) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handleMobileAIAnalyst = () => {
    setMobileMenuOpen(false);
    if (onOpenAIAnalyst) {
      onOpenAIAnalyst();
    }
  };

  return (
    <header className="bg-[#071019]/95 backdrop-blur-md border-b border-[#1B3045] sticky top-0 z-20 select-none">
      
      {/* 1. DESKTOP & TABLET TOP HEADER BAR (md:flex) */}
      <div className="hidden md:flex h-[64px] px-6 items-center justify-between gap-4">
        
        {/* Left: Current Active Section Title & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0B1420] border border-[#1B3045] flex items-center justify-center text-[#00B8FF] shrink-0">
            <CurrentIcon size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#F4F7FB] tracking-tight truncate">
                {currentItem.label}
              </h1>
              {activeTab === 'correlation' && reviewCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  {reviewCount} Review Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#718197] font-mono truncate hidden lg:block">
              {currentItem.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Global Live Search, AI Analyst Trigger, User Pill */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Global Live Search Field */}
          <div className="relative w-60 lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#718197]" />
            <input
              type="text"
              placeholder="Search assets, findings, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0B1420] border border-[#1B3045] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#F4F7FB] placeholder-[#718197] focus:outline-none focus:border-[#00B8FF]/60 focus:ring-1 focus:ring-[#00B8FF]/30 w-full font-sans transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#718197] hover:text-[#F4F7FB] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* AI Analyst Trigger */}
          {onOpenAIAnalyst && (
            <button
              type="button"
              onClick={onOpenAIAnalyst}
              className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm min-h-[36px]"
              title="Open Gemini AI Sidecar Explanation"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Analyst</span>
            </button>
          )}

          {/* Analyst Profile Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-[#0B1420] border border-[#1B3045] px-2.5 py-1.5 rounded-xl text-xs text-[#A8B7C9] font-medium">
            <div className="w-5 h-5 rounded-full bg-[#101B29] border border-[#1B3045] text-[#A8B7C9] flex items-center justify-center text-xs">
              <User className="w-3 h-3 text-[#00B8FF]" />
            </div>
            <span className="font-mono text-[11px] text-[#A8B7C9]">
              analyst@vulnfusion
            </span>
          </div>

        </div>
      </div>

      {/* 2. MOBILE TOP HEADER (md:hidden) */}
      <div className="md:hidden">
        
        {/* Mobile Header Row: [VulnFusion] on left, [☰] on right */}
        <div className="h-[60px] px-4 flex items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={() => handleSelectTab('overview')}
            className="flex items-center gap-2.5 group focus:outline-none min-h-[44px]"
            title="VulnFusion Asset Intelligence"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0B1522] border border-[#2563A6]/40 flex items-center justify-center shadow-sm transition-all">
              <VulnFusionBrandIcon size={24} />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-sm tracking-tight text-[#F1F5F9] block leading-tight">
                Vuln<span className="text-[#9CC3E6]">Fusion</span>
              </span>
              <span className="text-[10px] text-[#94A3B8] font-semibold tracking-wider uppercase font-mono">
                Asset Intelligence
              </span>
            </div>
          </button>

          {/* Mobile Hamburger Toggle [☰] / [✕] */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-[#0B1420] border border-[#1B3045] text-[#00B8FF] flex items-center justify-center hover:bg-[#101B29] transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Current Section Selector Sub-Header: [ Current Section ▼ ] */}
        <div className="bg-[#0B1420] border-t border-[#1B3045] px-4 py-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#718197] font-mono uppercase tracking-wider shrink-0">
            Section:
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex-1 bg-[#101B29] border border-[#00B8FF]/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-[#00B8FF] shadow-[0_0_10px_rgba(0,184,255,0.1)] active:bg-[#152232] transition min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <CurrentIcon size={18} className="shrink-0" />
              <span className="truncate">{currentItem.label}</span>
              {currentItem.badge && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentItem.badge}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-[#00B8FF] shrink-0 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Mobile Navigation Drawer / Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="bg-[#071019] border-b border-[#1B3045] px-4 py-3 space-y-3 shadow-2xl animate-fadeIn">
            
            {/* Mobile Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#718197]" />
              <input
                type="text"
                placeholder="Search assets, findings, IPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0B1420] border border-[#1B3045] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F4F7FB] placeholder-[#718197] focus:outline-none focus:border-[#00B8FF]/60 w-full font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#718197] hover:text-[#F4F7FB]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* WORKSPACE Section */}
            <div>
              <div className="text-[10px] text-[#718197] font-mono uppercase tracking-wider px-1 mb-1.5">
                WORKSPACE
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] ${
                        isActive
                          ? 'bg-[#101B29] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_0_12px_rgba(0,184,255,0.15)]'
                          : 'text-[#A8B7C9] bg-[#0B1420] hover:text-[#F4F7FB] hover:bg-[#101B29]/60 border border-[#1B3045]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ${
                            item.id === 'correlation'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#1B3045] text-slate-300 border border-slate-600/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <Check className="w-4 h-4 text-[#00B8FF]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTELLIGENCE Section */}
            <div>
              <div className="text-[10px] text-[#718197] font-mono uppercase tracking-wider px-1 mb-1.5">
                INTELLIGENCE
              </div>
              <button
                type="button"
                onClick={handleMobileAIAnalyst}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 border border-purple-500/40"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold">AI Analyst</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Sidecar
                </span>
              </button>
            </div>

          </div>
        )}

      </div>

    </header>
  );
};

