import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Palette,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  ShieldCheck,
  Check,
  Building,
  Clock,
  Eye,
  Bell,
  Cpu,
} from 'lucide-react';
import { NavTabId } from './Sidebar';

interface SettingsTabProps {
  onSaveNotification?: (msg: string) => void;
  onNavigateTab?: (tab: NavTabId) => void;
}

type SettingsSubTab = 'general' | 'appearance' | 'reports' | 'security' | 'ai';

interface PlatformSettings {
  platformName: string;
  environment: string;
  defaultLandingTab: string;
  timezone: string;
  dateFormat: string;
  theme: 'midnight' | 'cyber' | 'contrast';
  compactDensity: boolean;
  enableAnimations: boolean;
  defaultExportFormat: 'PDF' | 'HTML' | 'CSV' | 'JSON';
  confidentialWatermark: boolean;
  executiveTitle: string;
  includeAiByDefault: boolean;
  sessionTimeoutMinutes: number;
  mfaEnforced: boolean;
  aiModel: string;
  aiTemperature: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'VulnFusion Enterprise Intelligence',
  environment: 'Production (Demo Workspace)',
  defaultLandingTab: 'overview',
  timezone: 'UTC / GMT (Zulu Standard)',
  dateFormat: 'DD MMM YYYY (e.g. 28 SEP 2026)',
  theme: 'midnight',
  compactDensity: false,
  enableAnimations: true,
  defaultExportFormat: 'PDF',
  confidentialWatermark: true,
  executiveTitle: 'EXECUTIVE INTELLIGENCE BRIEF',
  includeAiByDefault: true,
  sessionTimeoutMinutes: 60,
  mfaEnforced: true,
  aiModel: 'gemini-2.5-flash (Advisory Mode)',
  aiTemperature: 0.1,
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onSaveNotification,
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>('general');
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    try {
      const stored = localStorage.getItem('vulnfusion_platform_settings');
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem('vulnfusion_platform_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
    setSaveSuccess(true);
    if (onSaveNotification) {
      onSaveNotification('Platform preferences saved successfully.');
    }
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('vulnfusion_platform_settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#1B3045] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Platform Configuration
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Client Preferences Sync
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F7FB] tracking-tight uppercase">
            SETTINGS
          </h1>
          <p className="text-xs text-[#8B95A5] font-mono mt-0.5">
            Configure system defaults, visual appearance, executive export parameters, and AI authority boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-[#0B1420] hover:bg-[#122236] text-slate-300 border border-[#1B3045] rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#122236] hover:bg-[#183250] text-[#00B8FF] border border-[#00B8FF]/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all min-h-[44px] cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-[#00B8FF]" />
            <span>{saveSuccess ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Platform preferences saved to local profile. Active on current workstation.</span>
        </div>
      )}

      {/* 2. Secondary Tab Navigation */}
      <div className="border-b border-[#1B3045] pb-px">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <div className="text-[10px] font-mono text-[#5F6875] uppercase px-2 font-bold shrink-0 hidden sm:block">
            PREFERENCES:
          </div>
          <button
            type="button"
            onClick={() => setSubTab('general')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'general'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('appearance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'appearance'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'reports'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Report Defaults</span>
          </button>

          <div className="h-4 w-px bg-[#1B3045] mx-1 shrink-0" />
          <div className="text-[10px] font-mono text-[#5F6875] uppercase px-2 font-bold shrink-0 hidden sm:block">
            SYSTEM CONTROLS:
          </div>

          <button
            type="button"
            onClick={() => setSubTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'security'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Guardrails</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('ai')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'ai'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Configuration</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Tab Content */}

      {/* GENERAL */}
      {subTab === 'general' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">General Platform Preferences</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Workspace naming, environment tags, and time standardization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Platform Display Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Deployment Environment</label>
              <input
                type="text"
                readOnly
                value={settings.environment}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono cursor-not-allowed min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Default Landing Workspace</label>
              <select
                value={settings.defaultLandingTab}
                onChange={(e) => setSettings({ ...settings, defaultLandingTab: e.target.value })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              >
                <option value="overview">Overview (Executive KPIs)</option>
                <option value="correlation">Asset Correlation (Triage Queue)</option>
                <option value="inventory">Asset Inventory (Catalog)</option>
                <option value="findings">Finding Correlation</option>
                <option value="reports">Reports Hub</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Timezone Standardization</label>
              <input
                type="text"
                readOnly
                value={settings.timezone}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* APPEARANCE */}
      {subTab === 'appearance' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">Appearance & Display Density</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Customize theme palettes, tabular data spacing, and motion.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-mono text-slate-400 block uppercase mb-3">Color Theme Palette</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'midnight' })}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                    settings.theme === 'midnight'
                      ? 'bg-[#122236] border-[#00B8FF] shadow-[0_0_20px_rgba(0,184,255,0.15)]'
                      : 'bg-[#0B1420] border-[#1B3045] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Midnight Slate</span>
                    {settings.theme === 'midnight' && <Check className="w-4 h-4 text-[#00B8FF]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Default deep navy cybersecurity palette with cyan telemetry accents.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'cyber' })}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                    settings.theme === 'cyber'
                      ? 'bg-[#122236] border-[#00B8FF] shadow-[0_0_20px_rgba(0,184,255,0.15)]'
                      : 'bg-[#0B1420] border-[#1B3045] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Cyber Obsidian</span>
                    {settings.theme === 'cyber' && <Check className="w-4 h-4 text-[#00B8FF]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Pure pitch black aesthetic optimized for OLED displays and SOC centers.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'contrast' })}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                    settings.theme === 'contrast'
                      ? 'bg-[#122236] border-[#00B8FF] shadow-[0_0_20px_rgba(0,184,255,0.15)]'
                      : 'bg-[#0B1420] border-[#1B3045] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">High Contrast</span>
                    {settings.theme === 'contrast' && <Check className="w-4 h-4 text-[#00B8FF]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Sharpened borders and high-visibility text meeting strict WCAG AAA guidelines.</p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1B3045] space-y-4">
              <label className="flex items-center justify-between p-3.5 bg-[#0B1420] border border-[#1B3045] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Compact Table Row Density</span>
                  <span className="text-[11px] text-slate-400">Reduce vertical table padding to display more records simultaneously.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compactDensity}
                  onChange={(e) => setSettings({ ...settings, compactDensity: e.target.checked })}
                  className="w-4 h-4 accent-[#00B8FF] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-[#0B1420] border border-[#1B3045] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Smooth Micro-Animations</span>
                  <span className="text-[11px] text-slate-400">Enable subtle transitions when expanding sidebars and switching workspaces.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => setSettings({ ...settings, enableAnimations: e.target.checked })}
                  className="w-4 h-4 accent-[#00B8FF] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PREFERENCES */}
      {subTab === 'reports' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">Executive Intelligence Brief Customization</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Parameters applied when exporting PDF and HTML artifacts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Default Export Format</label>
              <select
                value={settings.defaultExportFormat}
                onChange={(e) => setSettings({ ...settings, defaultExportFormat: e.target.value as any })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              >
                <option value="PDF">PDF (Board-Ready Vector Document)</option>
                <option value="HTML">Interactive Standalone HTML</option>
                <option value="CSV">CSV Spreadsheet (SIEM pipeline)</option>
                <option value="JSON">JSON Schema (CI/CD artifact)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Report Header Title</label>
              <input
                type="text"
                value={settings.executiveTitle}
                onChange={(e) => setSettings({ ...settings, executiveTitle: e.target.value })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1B3045] space-y-4">
            <label className="flex items-center justify-between p-3.5 bg-[#0B1420] border border-[#1B3045] rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Confidential Enterprise Header & Footer</span>
                <span className="text-[11px] text-slate-400">Embed deterministic verification guarantee and confidentiality markings on every page.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.confidentialWatermark}
                onChange={(e) => setSettings({ ...settings, confidentialWatermark: e.target.checked })}
                className="w-4 h-4 accent-[#00B8FF] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#0B1420] border border-[#1B3045] rounded-xl cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Include AI Analyst Insights by Default</span>
                <span className="text-[11px] text-slate-400">Append recorded deterministic AI explanations as section 5 in exported briefs.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.includeAiByDefault}
                onChange={(e) => setSettings({ ...settings, includeAiByDefault: e.target.checked })}
                className="w-4 h-4 accent-[#00B8FF] cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* SECURITY & RBAC */}
      {subTab === 'security' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">Security Governance & RLS Rules</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Session controls, tenant isolation, and administrative safeguards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0B1420] border border-emerald-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>PostgreSQL Row-Level Security</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Tenant isolation is enforced via database level policies. Cross-organization telemetry access is cryptographically blocked.
              </p>
            </div>

            <div className="p-4 bg-[#0B1420] border border-emerald-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Last Administrator Safeguard</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                System prevents accidental deletion or demotion of the final administrator account to avoid organizational lockout.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1B3045]">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Session Inactivity Timeout</label>
              <select
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              >
                <option value={15}>15 minutes (High Security / SOC)</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes (Standard Enterprise)</option>
                <option value={480}>8 hours (Full Shift)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Multi-Factor Authentication (MFA)</label>
              <input
                type="text"
                readOnly
                value="Enforced for all Administrator & Analyst accounts"
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono cursor-not-allowed min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI CONFIGURATION */}
      {subTab === 'ai' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">AI Model & Authority Guardrails</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Non-authoritative explanation sidecar configuration.</p>
          </div>

          {/* Prominent Authority Specification Box */}
          <div className="p-5 bg-[#0A121D] border border-cyan-500/40 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2E44]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-bold text-white font-mono uppercase">AI ANALYST SPECIFICATION</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                NON-AUTHORITATIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#071019] rounded-xl border border-[#132236]">
                <span className="text-[#718197] block text-[10px] uppercase">PURPOSE</span>
                <span className="text-white font-bold block">Evidence Explanation</span>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Analyst assistance and natural language breakdown</p>
              </div>
              <div className="p-3 bg-[#071019] rounded-xl border border-[#132236]">
                <span className="text-[#718197] block text-[10px] uppercase">AUTHORITY</span>
                <span className="text-amber-300 font-bold block">Non-Authoritative</span>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Zero permission to mutate correlation graph</p>
              </div>
              <div className="p-3 bg-[#071019] rounded-xl border border-[#132236]">
                <span className="text-[#718197] block text-[10px] uppercase">DETERMINISTIC ENGINE</span>
                <span className="text-cyan-400 font-bold block">PRIMARY (100% Control)</span>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Hardware keys and mathematical rules govern identity</p>
              </div>
            </div>

            <div className="p-3 bg-[#050C14] rounded-xl border border-[#132236] space-y-1.5">
              <span className="text-[11px] font-bold text-rose-300 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                AI Cannot Determine or Modify:
              </span>
              <ul className="text-[11px] text-slate-300 font-mono grid grid-cols-1 sm:grid-cols-2 gap-1 pl-5 list-disc">
                <li>Asset Identity & Grouping</li>
                <li>Correlation Status (CORRELATED / REVIEW_REQUIRED)</li>
                <li>Finding Identity & CVE Consolidation</li>
                <li>Exception Status & Override Approval</li>
                <li>Final Security & Remediation Decisions</li>
                <li>Raw Observation Ingestion Telemetry</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Advisory Model Selection</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF] min-h-[44px]"
              >
                <option value="gemini-2.5-flash (Advisory Mode)">gemini-2.5-flash (Low latency / High throughput)</option>
                <option value="gemini-2.5-pro (In-Depth Reasoning)">gemini-2.5-pro (Deep cross-scanner analysis)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block uppercase">Temperature Lock</label>
              <input
                type="text"
                readOnly
                value="0.10 (Locked for deterministic consistency)"
                className="w-full bg-[#0B1420] border border-[#1B3045] rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono cursor-not-allowed min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SettingsTab;
