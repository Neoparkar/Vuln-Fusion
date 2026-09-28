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
  Layers,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { NavTabId } from './Sidebar';
import { useAuth } from '../context/AuthContext';

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
  totalTests = 118,
  onOpenAIAnalyst,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      subtitle: 'Executive Telemetry & KPIs',
      icon: ExecutiveIntelligenceIcon,
    },
    {
      id: 'inventory' as const,
      label: 'Asset Inventory',
      subtitle: 'Multi-Source Asset Inventory',
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
      subtitle: 'Automated Integrity & Verification',
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
    <header className="bg-[#090B0F]/95 backdrop-blur-md border-b border-[#1A222D] sticky top-0 z-40 select-none">
      
      {/* 1. DESKTOP & TABLET TOP HEADER BAR (md:flex) */}
      <div className="hidden md:flex h-[64px] px-6 items-center justify-between gap-4">
        
        {/* Left: Current Active Section Title & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#151A21] border border-[#1E2631] flex items-center justify-center text-[#3B82F6] shrink-0">
            <CurrentIcon size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#F1F5F9] tracking-tight truncate">
                {currentItem.label}
              </h1>
              {activeTab === 'correlation' && reviewCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  {reviewCount} Review Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8B95A5] font-mono truncate hidden lg:block">
              {currentItem.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Global Live Search, AI Analyst Trigger, User Pill */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Global Live Search Field */}
          <div className="relative w-60 lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#5F6875]" />
            <input
              type="text"
              placeholder="Search assets, findings, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#151A21] border border-[#1E2631] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/60 focus:ring-1 focus:ring-[#3B82F6]/30 w-full font-sans transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#5F6875] hover:text-[#F1F5F9] transition-colors"
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
              className="px-3.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm min-h-[36px]"
              title="Open Gemini AI Sidecar Explanation"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Analyst</span>
            </button>
          )}

          {/* Analyst Profile & Workspace Pill with Sign Out */}
          <div className="hidden xl:flex items-center gap-2.5 bg-[#151A21] border border-[#1E2631] px-3 py-1.5 rounded-xl text-xs text-[#8B95A5]">
            <div className="w-6 h-6 rounded-lg bg-[#181E26] border border-[#1E2631] text-[#3B82F6] flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] text-[#F1F5F9] font-medium truncate max-w-[140px]" title={currentUser?.email || 'analyst@vulnfusion.internal'}>
                {currentUser?.email || 'analyst@vulnfusion.internal'}
              </span>
              <span className="text-[9px] text-[#3B82F6] font-mono tracking-wide uppercase">
                VulnFusion Demo
              </span>
            </div>
            <div className="h-4 w-px bg-[#1E2631] mx-0.5" />
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-[#8B95A5] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. DEDICATED MOBILE HEADER (md:hidden) — 56px Sleek Bar */}
      <div className="md:hidden">
        
        {/* Top Mobile Bar: Brand Logo + VulnFusion | AI Analyst Button | Menu Trigger */}
        <div className="h-[56px] px-3.5 flex items-center justify-between gap-2 border-b border-[#1A222D]">
          
          {/* Brand Anchor */}
          <button
            type="button"
            onClick={() => handleSelectTab('overview')}
            className="flex items-center gap-2 group focus:outline-none min-h-[44px] text-left"
            title="VulnFusion Asset Intelligence"
            aria-label="VulnFusion Asset Intelligence Overview"
          >
            <div className="w-8 h-8 rounded-lg bg-[#151A21] border border-[#2563A6]/50 flex items-center justify-center shadow-xs shrink-0">
              <VulnFusionBrandIcon size={22} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-[#F1F5F9] block leading-none">
                Vuln<span className="text-[#9CC3E6]">Fusion</span>
              </span>
              <span className="text-[9px] text-[#8B95A5] font-semibold tracking-wider uppercase font-mono block mt-0.5">
                Asset Intelligence
              </span>
            </div>
          </button>

          {/* Direct Mobile Quick Actions */}
          <div className="flex items-center gap-1.5">
            {onOpenAIAnalyst && (
              <button
                type="button"
                onClick={onOpenAIAnalyst}
                className="h-[38px] px-2.5 bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                aria-label="Open AI Analyst"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px]">AI</span>
              </button>
            )}

            {/* Mobile Workspace Selector / Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-[38px] w-[38px] rounded-xl bg-[#151A21] border border-[#1E2631] text-[#3B82F6] flex items-center justify-center active:bg-[#181E26] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Interactive Mobile Workspace Selector Pill */}
        <div className="px-3.5 py-1.5 bg-[#090B0F] flex items-center justify-between gap-2 border-b border-[#1A222D]">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-200 bg-[#151A21] border border-[#1E2631] px-3 py-1.5 rounded-lg active:bg-[#181E26] transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <CurrentIcon size={16} className="text-[#3B82F6] shrink-0" />
              <span className="truncate text-[#F1F5F9] font-semibold">{currentItem.label}</span>
              {currentItem.badge && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentItem.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#8B95A5] font-mono shrink-0">
              <span>Switch</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#3B82F6] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation Drawer / Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="bg-[#090B0F] border-b border-[#1A222D] px-4 py-3.5 space-y-3.5 shadow-2xl animate-fadeIn z-50">
            
            {/* Quick Live Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#5F6875]" />
              <input
                type="text"
                placeholder="Search assets, findings, IPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#151A21] border border-[#1E2631] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/60 w-full font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#5F6875] hover:text-[#F1F5F9]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* WORKSPACES List */}
            <div>
              <div className="text-[10px] text-[#5F6875] font-mono uppercase tracking-wider px-1 mb-1.5 font-bold">
                SELECT WORKSPACE
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] ${
                        isActive
                          ? 'bg-[#151A21] text-[#3B82F6] border border-[#3B82F6]/40 shadow-sm'
                          : 'text-[#8B95A5] bg-[#10141A] active:bg-[#151A21] border border-[#1A222D]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-[#3B82F6]' : 'text-[#8B95A5]'} />
                        <div className="text-left">
                          <span className="text-sm font-semibold block leading-tight text-[#F1F5F9]">{item.label}</span>
                          <span className="text-[10px] text-[#8B95A5] font-mono block">{item.subtitle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ${
                            item.id === 'correlation'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#151A21] text-slate-300 border border-[#1E2631]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <Check className="w-4 h-4 text-[#3B82F6]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Sidecar Direct Trigger */}
            {onOpenAIAnalyst && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleMobileAIAnalyst}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] bg-purple-950/30 active:bg-purple-900/50 text-purple-200 border border-purple-500/40"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <div className="text-left">
                      <span className="text-sm font-semibold block leading-tight">AI Analyst Sidecar</span>
                      <span className="text-[10px] text-purple-300/80 font-mono block">Deterministic Explanations</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            )}

            {/* Mobile User Account & Sign Out */}
            <div className="pt-3 border-t border-[#1A222D] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#151A21] border border-[#1E2631] text-[#3B82F6] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-white font-mono truncate block" title={currentUser?.email || 'analyst@vulnfusion.internal'}>
                    {currentUser?.email || 'analyst@vulnfusion.internal'}
                  </span>
                  <span className="text-[9px] text-[#3B82F6] font-mono block">VulnFusion Demo</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </header>
  );
};


