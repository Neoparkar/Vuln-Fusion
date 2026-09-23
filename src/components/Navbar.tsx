import React from 'react';
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
  X
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
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: Layers,
    },
    {
      id: 'correlation' as const,
      label: 'Assets',
      icon: Network,
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
    },
    {
      id: 'findings' as const,
      label: 'Findings',
      icon: Bug,
    },
    {
      id: 'evidence' as const,
      label: 'Evidence',
      icon: Database,
    },
    {
      id: 'tests' as const,
      label: 'Test Suite',
      icon: CheckSquare,
      badge: '19',
    },
  ];

  return (
    <header className="bg-[#071019]/95 backdrop-blur-md border-b border-[#1B3045] h-[72px] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      
      {/* 1. Zone 1 (Left): Brand Wordmark & Shield Logo */}
      <div className="flex items-center gap-6 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 group focus:outline-none"
          title="VulnFusion Asset Intelligence — Authoritative Engine"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B8FF]/20 to-blue-600/10 border border-[#00B8FF]/40 text-[#00B8FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,184,255,0.18)] transition-all group-hover:scale-105 group-hover:border-[#00B8FF]">
            <Shield className="w-5 h-5 text-[#00B8FF]" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-base tracking-tight text-[#F4F7FB] block leading-tight group-hover:text-[#00B8FF] transition-colors">
              VulnFusion
            </span>
            <span className="text-[11px] text-[#718197] font-medium tracking-wider uppercase font-mono">
              Asset Intelligence
            </span>
          </div>
        </button>
      </div>

      {/* 2. Zone 2 (Center): Unified Primary Top Navigation Bar */}
      <nav className="hidden md:flex items-center gap-1.5 bg-[#0B1420] p-1.5 rounded-xl border border-[#1B3045]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
                isActive
                  ? 'bg-[#101B29] text-[#00B8FF] border border-[#00B8FF]/40 shadow-[0_0_12px_rgba(0,184,255,0.15)]'
                  : 'text-[#A8B7C9] hover:text-[#F4F7FB] hover:bg-[#101B29]/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00B8FF]' : 'text-[#718197]'}`} />
              <span>{item.label}</span>

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

      {/* 3. Zone 3 (Right): Search, AI Sidecar Trigger, Analyst Session */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Global Live Search Field */}
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
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#718197] hover:text-[#F4F7FB] transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* AI Analyst Sidecar Trigger */}
        {onOpenAIAnalyst && (
          <button
            onClick={onOpenAIAnalyst}
            className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm group"
            title="Open Gemini AI Sidecar Explanation"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Analyst</span>
          </button>
        )}

        {/* Analyst Profile Pill */}
        <div className="flex items-center gap-2 bg-[#0B1420] border border-[#1B3045] px-2.5 py-1.5 rounded-xl text-xs text-[#A8B7C9] font-medium">
          <div className="w-5 h-5 rounded-full bg-[#101B29] border border-[#1B3045] text-[#A8B7C9] flex items-center justify-center text-xs">
            <User className="w-3 h-3 text-[#00B8FF]" />
          </div>
          <span className="hidden xl:inline font-mono text-[11px] text-[#A8B7C9]">
            analyst@vulnfusion
          </span>
        </div>

      </div>

    </header>
  );
};
