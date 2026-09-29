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
import {
  Sparkles,
  Search,
  X,
  Menu,
  ChevronDown,
  Check,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCog,
  Eye,
  Building,
} from 'lucide-react';
import { NavTabId } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../context/RBACContext';

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

interface RoleDisplayConfig {
  displayName: string;
  roleLabel: string;
  badgeClass: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, signOut, isDemoMode } = useAuth();
  const { role: rbacRole } = useRBAC();

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  // Dynamic Role Resolution
  const resolveRoleConfig = (): RoleDisplayConfig => {
    const normalizedRole = (rbacRole || currentUser?.user_metadata?.role || '').toLowerCase();
    const lowerEmail = (currentUser?.email || '').toLowerCase();

    // Temporary Hackathon Presentation Demo Admin
    if (
      isDemoMode ||
      lowerEmail === 'demo@vulnfusion.local' ||
      currentUser?.user_metadata?.display_name === 'VulnFusion Demo Admin'
    ) {
      return {
        displayName: 'VulnFusion Demo Admin',
        roleLabel: 'ADMINISTRATOR',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-950/40 border-amber-500/30',
        iconColor: 'text-amber-400',
        Icon: ShieldCheck,
      };
    }

    // Administrator
    if (
      normalizedRole === 'admin' ||
      normalizedRole === 'administrator' ||
      lowerEmail.startsWith('admin') ||
      lowerEmail.includes('admin@') ||
      lowerEmail.includes('admin.')
    ) {
      return {
        displayName: 'Administrator',
        roleLabel: 'ADMINISTRATOR',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        iconBg: 'bg-blue-950/40 border-blue-500/30',
        iconColor: 'text-[#3B82F6]',
        Icon: ShieldCheck,
      };
    }

    // Analyst / Security Ops / Manager
    if (
      normalizedRole === 'manager' ||
      normalizedRole === 'analyst' ||
      normalizedRole === 'secops' ||
      lowerEmail.includes('analyst') ||
      lowerEmail.includes('secops')
    ) {
      return {
        displayName: 'Security Ops',
        roleLabel: 'ANALYST',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        iconBg: 'bg-purple-950/40 border-purple-500/30',
        iconColor: 'text-purple-400',
        Icon: UserCog,
      };
    }

    // Viewer / User
    if (
      normalizedRole === 'user' ||
      normalizedRole === 'viewer' ||
      lowerEmail.includes('viewer')
    ) {
      return {
        displayName: 'Viewer',
        roleLabel: 'VIEWER',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-950/40 border-emerald-500/30',
        iconColor: 'text-emerald-400',
        Icon: Eye,
      };
    }

    // Default fallback to Administrator
    return {
      displayName: 'Administrator',
      roleLabel: 'ADMINISTRATOR',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      iconBg: 'bg-blue-950/40 border-blue-500/30',
      iconColor: 'text-[#3B82F6]',
      Icon: ShieldCheck,
    };
  };

  const roleConfig = resolveRoleConfig();
  const RoleIcon = roleConfig.Icon;

  const handleSignOut = async () => {
    try {
      setUserDropdownOpen(false);
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
      section: 'MAIN',
    },
    {
      id: 'correlation' as const,
      label: 'Asset Correlation',
      subtitle: 'Candidate Asset Resolution & Evidence',
      icon: AssetCorrelationIcon,
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
      section: 'MAIN',
    },
    {
      id: 'inventory' as const,
      label: 'Asset Inventory',
      subtitle: 'Multi-Source Asset Catalog & Non-Destructive Archiving',
      icon: AssetIntelligenceIcon,
      section: 'MAIN',
    },
    {
      id: 'findings' as const,
      label: 'Finding Correlation',
      subtitle: 'Deterministic Vulnerability Mapping',
      icon: FindingsIntelligenceIcon,
      section: 'MAIN',
    },
    {
      id: 'evidence' as const,
      label: 'Evidence Explorer',
      subtitle: 'Multi-Source Raw Telemetry Inspector',
      icon: DeterministicEvidenceIcon,
      section: 'MAIN',
    },
    {
      id: 'reports' as const,
      label: 'Reports',
      subtitle: 'Board-Ready Executive Briefs & Compliance Exports',
      icon: ReportIntelligenceIcon,
      section: 'REPORTING',
    },
    {
      id: 'ai-analyst' as const,
      label: 'AI Analyst',
      subtitle: 'Deterministic Advisory Explanations',
      icon: AIAnalystSecurityIcon,
      section: 'REPORTING',
    },
    {
      id: 'admin' as const,
      label: 'Administration',
      subtitle: 'Manage Users, Data Sources, Exceptions & Audit',
      icon: SecurityGovernanceIcon,
      section: 'ADMINISTRATION',
    },
    {
      id: 'help' as const,
      label: 'Help',
      subtitle: 'Operational Guides & Architecture Docs',
      icon: KnowledgeCenterIcon,
      section: 'SYSTEM',
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      subtitle: 'System Defaults & Security Policies',
      icon: PlatformConfigurationIcon,
      section: 'SYSTEM',
    },
    {
      id: 'tests' as const,
      label: 'Test Suite',
      subtitle: 'Automated Integrity & Verification',
      icon: TestCommandCenterIcon,
      badge: `${totalTests}`,
      section: 'SYSTEM',
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  const handleSelectTab = (id: NavTabId) => {
    if (id === 'ai-analyst' && onOpenAIAnalyst) {
      onOpenAIAnalyst();
    }
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

        {/* Right: Global Live Search, AI Analyst Trigger, Role-Aware User Control */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Global Live Search Field */}
          <div className="relative w-60 lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#5F6875]" />
            <input
              type="text"
              placeholder="Search assets, findings, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#151A21] border border-[#1E2631] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/60 focus:ring-1 focus:ring-[#3B82F6]/30 w-full font-sans transition-all min-h-[36px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#5F6875] hover:text-[#F1F5F9] transition-colors cursor-pointer"
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
              className="px-3.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm min-h-[36px] cursor-pointer"
              title="Open Gemini AI Sidecar Explanation"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Analyst</span>
            </button>
          )}

          {/* Hackathon Presentation Demo Indicator */}
          {isDemoMode && (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] font-mono font-bold tracking-wide select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>DEMO / PRESENTATION MODE</span>
            </div>
          )}

          {/* Role-Aware User Identity Control with Interactive Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <div className="flex items-center bg-[#151A21] hover:bg-[#181F28] border border-[#1E2631] hover:border-[#2A3442] rounded-xl transition-all duration-150 shadow-xs">
              
              {/* User Identity Trigger Button */}
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/50 rounded-l-xl"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                title={`Logged in as ${roleConfig.displayName} (${roleConfig.roleLabel})`}
              >
                {/* Role Icon */}
                <div className={`w-7 h-7 rounded-lg ${roleConfig.iconBg} border ${roleConfig.iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
                  <RoleIcon size={15} />
                </div>
                
                {/* Role Display Name & Label */}
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-semibold text-[#F1F5F9] leading-tight truncate">
                    {roleConfig.displayName}
                  </span>
                  <span className="text-[9px] text-[#3B82F6] font-mono tracking-wider font-bold uppercase leading-tight mt-0.5">
                    {roleConfig.roleLabel}
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5F6875] hover:text-[#F1F5F9] transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-[#3B82F6]' : ''
                  }`}
                />
              </button>

              {/* Vertical Divider */}
              <div className="h-4 w-px bg-[#1E2631]" />

              {/* Quick Sign Out Action */}
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-2 text-[#8B95A5] hover:text-rose-400 hover:bg-rose-500/10 rounded-r-xl transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Menu Popup */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#10141B] border border-[#1E2631] rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                
                {/* Demo / Presentation Banner in Dropdown */}
                {isDemoMode && (
                  <div className="mb-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>DEMO / PRESENTATION MODE</span>
                    </div>
                    <span className="text-[9px] text-amber-400/80 block mt-0.5 font-mono">
                      Synthetic Demonstration Sandbox
                    </span>
                  </div>
                )}

                {/* Profile Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-[#1A222D]">
                  <div className={`w-10 h-10 rounded-xl ${roleConfig.iconBg} border ${roleConfig.iconColor} flex items-center justify-center shrink-0`}>
                    <RoleIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-[#F1F5F9] truncate block">
                        {roleConfig.displayName}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded-full border shrink-0 ${roleConfig.badgeClass}`}>
                        {roleConfig.roleLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8B95A5] font-mono block truncate mt-0.5" title={currentUser?.email || 'admin@vulnfusion.internal'}>
                      {currentUser?.email || 'admin@vulnfusion.internal'}
                    </span>
                  </div>
                </div>

                {/* Secondary Context Info */}
                <div className="py-2.5 px-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5F6875] font-mono">Workspace:</span>
                    <span className="text-[#8B95A5] font-medium flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-[#3B82F6]" />
                      VulnFusion Synthetic Org
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5F6875] font-mono">Authorization:</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      Deterministic RBAC Active
                    </span>
                  </div>
                </div>

                {/* Action Items */}
                <div className="pt-2 border-t border-[#1A222D]">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isDemoMode ? 'Exit Demo / Sign Out' : 'Sign Out'}</span>
                  </button>
                </div>

              </div>
            )}
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
                className="h-[38px] px-2.5 bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-200 bg-[#151A21] border border-[#1E2631] px-3 py-1.5 rounded-lg active:bg-[#181E26] transition-colors min-h-[44px] cursor-pointer"
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
          <div className="bg-[#090B0F] border-b border-[#1A222D] px-4 py-3.5 space-y-3.5 shadow-2xl animate-fadeIn z-50 max-h-[80vh] overflow-y-auto">
            
            {/* Quick Live Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#5F6875]" />
              <input
                type="text"
                placeholder="Search assets, findings, IPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#151A21] border border-[#1E2631] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/60 w-full font-sans min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#5F6875] hover:text-[#F1F5F9] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Structured Navigation Groups */}
            {['MAIN', 'REPORTING', 'ADMINISTRATION', 'SYSTEM'].map((sec) => {
              const secItems = navItems.filter((i) => i.section === sec);
              if (secItems.length === 0) return null;

              return (
                <div key={sec} className="space-y-1">
                  <div className="text-[10px] text-[#5F6875] font-mono uppercase tracking-wider px-1 font-bold">
                    {sec}
                  </div>
                  <div className="space-y-1">
                    {secItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] cursor-pointer ${
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
              );
            })}

            {/* AI Sidecar Direct Trigger */}
            {onOpenAIAnalyst && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleMobileAIAnalyst}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] bg-purple-950/30 active:bg-purple-900/50 text-purple-200 border border-purple-500/40 cursor-pointer"
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
                <div className={`w-8 h-8 rounded-lg ${roleConfig.iconBg} border ${roleConfig.iconColor} flex items-center justify-center shrink-0`}>
                  <RoleIcon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#F1F5F9] truncate block">
                      {roleConfig.displayName}
                    </span>
                    <span className={`px-1.5 py-0.2 text-[8px] font-bold font-mono rounded ${roleConfig.badgeClass}`}>
                      {roleConfig.roleLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5F6875] font-mono truncate block mt-0.5" title={currentUser?.email || 'admin@vulnfusion.internal'}>
                    {currentUser?.email || 'admin@vulnfusion.internal'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isDemoMode ? 'Exit Demo / Sign Out' : 'Sign Out'}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </header>
  );
};
export default TopHeader;
