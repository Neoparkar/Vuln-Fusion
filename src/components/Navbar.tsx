import React, { useState } from 'react';
import {
  Layers,
  Network,
  Database,
  CheckSquare,
  Bug,
  Sparkles,
  Shield,
  User,
  Search,
  X,
  Menu,
  ChevronDown,
  Check
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests';
  setActiveTab: (tab: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests') => void;
  totalRecords: number;
  totalAssetGroups: number;
  reviewCount: number;
  totalFindings: number;
  onOpenAIAnalyst?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reviewCount,
  onOpenAIAnalyst,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: Layers,
    },
    {
      id: 'correlation' as const,
      label: 'Asset Correlation',
      shortLabel: 'Assets',
      icon: Network,
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
    },
    {
      id: 'findings' as const,
      label: 'Finding Correlation',
      shortLabel: 'Findings',
      icon: Bug,
    },
    {
      id: 'evidence' as const,
      label: 'Evidence Explorer',
      shortLabel: 'Evidence',
      icon: Database,
    },
    {
      id: 'tests' as const,
      label: 'Test Suite',
      shortLabel: 'Test Suite',
      icon: CheckSquare,
      badge: '19',
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  const handleSelectTab = (id: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests') => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#071019]/95 backdrop-blur-md border-b border-[#1B3045] sticky top-0 z-30 select-none">
      {/* Primary Header Row */}
      <div className="h-[64px] sm:h-[72px] px-4 sm:px-6 flex items-center justify-between gap-3">
        
        {/* 1. Zone 1 (Left): Brand Wordmark & Shield Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectTab('overview')}
            className="flex items-center gap-2.5 group focus:outline-none min-h-[44px]"
            title="VulnFusion Asset Intelligence — Authoritative Engine"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00B8FF]/20 to-blue-600/10 border border-[#00B8FF]/40 text-[#00B8FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,184,255,0.18)] transition-all group-hover:scale-105 group-hover:border-[#00B8FF]">
              <Shield className="w-5 h-5 text-[#00B8FF]" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#F4F7FB] block leading-tight group-hover:text-[#00B8FF] transition-colors">
                VulnFusion
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#718197] font-medium tracking-wider uppercase font-mono">
                Asset Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* 2. Zone 2 (Center): Desktop Navigation Bar (md+) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#0B1420] p-1.5 rounded-xl border border-[#1B3045]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative min-h-[38px] ${
                  isActive
                    ? 'bg-[#101B29] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_0_12px_rgba(0,184,255,0.15)]'
                    : 'text-[#A8B7C9] hover:text-[#F4F7FB] hover:bg-[#101B29]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00B8FF]' : 'text-[#718197]'}`} />
                <span>{item.shortLabel || item.label}</span>

                {/* Badge Counter */}
                {item.badge && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono ${
                    item.id === 'correlation'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-[#1B3045] text-slate-300 border border-slate-600/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Zone 3 (Right): Search, AI Trigger, Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Global Live Search Field (Desktop lg+) */}
          <div className="relative hidden lg:block w-64 xl:w-72">
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
                className="absolute right-2.5 top-2.5 text-[#718197] hover:text-[#F4F7FB] transition-colors"
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
              className="px-2.5 sm:px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm min-h-[38px]"
              title="Open Gemini AI Sidecar Explanation"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI Analyst</span>
            </button>
          )}

          {/* Analyst Profile Pill (Desktop xl+) */}
          <div className="hidden xl:flex items-center gap-2 bg-[#0B1420] border border-[#1B3045] px-2.5 py-1.5 rounded-xl text-xs text-[#A8B7C9] font-medium">
            <div className="w-5 h-5 rounded-full bg-[#101B29] border border-[#1B3045] text-[#A8B7C9] flex items-center justify-center text-xs">
              <User className="w-3 h-3 text-[#00B8FF]" />
            </div>
            <span className="font-mono text-[11px] text-[#A8B7C9]">
              analyst@vulnfusion
            </span>
          </div>

          {/* Mobile Hamburger Toggle (md:hidden) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-[#0B1420] border border-[#1B3045] text-[#00B8FF] flex items-center justify-center hover:bg-[#101B29] transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Touch-Friendly Section Selector Sub-Header Bar (Mobile md:hidden) */}
      <div className="md:hidden bg-[#0B1420] border-t border-[#1B3045] px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#718197] font-mono uppercase tracking-wider shrink-0">Section:</span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex-1 bg-[#101B29] border border-[#00B8FF]/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-[#00B8FF] shadow-[0_0_10px_rgba(0,184,255,0.1)] active:bg-[#152232] transition min-h-[40px]"
        >
          <div className="flex items-center gap-2 truncate">
            <CurrentIcon className="w-4 h-4 text-[#00B8FF] shrink-0" />
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

      {/* Mobile Navigation Drawer / Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071019] border-b border-[#1B3045] px-4 py-3 space-y-2 shadow-2xl animate-fadeIn">
          
          {/* Mobile Search Input */}
          <div className="relative mb-3">
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
                className="absolute right-2.5 top-2.5 text-[#718197] hover:text-[#F4F7FB]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[10px] text-[#718197] font-mono uppercase tracking-wider px-1 mb-1">
            Navigate Workspace
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
                  className={`w-full px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[48px] ${
                    isActive
                      ? 'bg-[#101B29] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_0_12px_rgba(0,184,255,0.15)]'
                      : 'text-[#A8B7C9] bg-[#0B1420] hover:text-[#F4F7FB] hover:bg-[#101B29]/60 border border-[#1B3045]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00B8FF]' : 'text-[#718197]'}`} />
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
      )}

    </header>
  );
};
