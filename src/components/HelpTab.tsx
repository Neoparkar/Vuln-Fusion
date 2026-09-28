import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Download,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { NavTabId } from './Sidebar';

interface HelpTabProps {
  onNavigateTab?: (tab: NavTabId) => void;
}

type HelpSubTab = 'architecture' | 'workflows' | 'shortcuts' | 'diagnostics';

export const HelpTab: React.FC<HelpTabProps> = ({ onNavigateTab }) => {
  const [subTab, setSubTab] = useState<HelpSubTab>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleExportDiagnostics = () => {
    const diag = {
      platform: 'VulnFusion Enterprise Intelligence',
      engineVersion: 'v2.4.0-ent',
      buildDate: '2026-09-28',
      userAgent: navigator.userAgent,
      timeUTC: new Date().toISOString(),
      syntheticSources: ['Qualys', 'Tenable', 'Rapid7', 'Wiz'],
      dataMode: 'SYNTHETIC_DATASET',
      authorityMode: 'DETERMINISTIC_STRICT',
      aiAuthority: 'NON_AUTHORITATIVE_ADVISORY',
      rlsStatus: 'ENFORCED',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(diag, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vulnfusion_diagnostics_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#1B3045] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Documentation & Knowledge Base
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enterprise Knowledge v2.4.0
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F7FB] tracking-tight uppercase">
            HELP & DOCUMENTATION
          </h1>
          <p className="text-xs text-[#8B95A5] font-mono mt-0.5">
            Operational guides, deterministic correlation theory, keyboard shortcuts, and diagnostic bundles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportDiagnostics}
          className="px-4 py-2 bg-[#0B1420] hover:bg-[#122236] text-slate-200 border border-[#1B3045] rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#00B8FF]" />
          <span>Export Diagnostics</span>
        </button>
      </div>

      {/* 2. Secondary Tab Navigation */}
      <div className="border-b border-[#1B3045] pb-px">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSubTab('architecture')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'architecture'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Architecture & Determinism</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('workflows')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'workflows'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Workflows & Triage</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('shortcuts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'shortcuts'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Keyboard Shortcuts</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('diagnostics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'diagnostics'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>System Diagnostics</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Tab Content */}

      {/* ARCHITECTURE */}
      {subTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Why VulnFusion Rejects Probabilistic AI Correlation</span>
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              In enterprise vulnerability management, false positives cause catastrophic blind spots: either critical vulnerabilities are assigned to the wrong server, or duplicate phantom assets mislead compliance auditors.
            </p>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Traditional platforms use probabilistic clustering or generic LLMs to guess if two records represent the same machine. VulnFusion strictly enforces <strong className="text-white">Deterministic Multi-Attribute Resolution</strong>: two assets only merge if they share cryptographically sound primary hardware keys (AWS ARN, BIOS UUID, or verified canonical FQDNs).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-4 bg-[#0B1420] rounded-xl border border-[#1B3045] space-y-1.5">
                <span className="text-xs font-bold text-white font-mono block">1. Ingest Raw Telemetry</span>
                <p className="text-[11px] text-slate-400 font-sans">Streams raw findings from Qualys, Tenable, Rapid7, and Wiz without schema loss.</p>
              </div>
              <div className="p-4 bg-[#0B1420] rounded-xl border border-[#1B3045] space-y-1.5">
                <span className="text-xs font-bold text-cyan-400 font-mono block">2. Deterministic Graph</span>
                <p className="text-[11px] text-slate-400 font-sans">Clusters records into underlying assets with 100% mathematical auditability.</p>
              </div>
              <div className="p-4 bg-[#0B1420] rounded-xl border border-[#1B3045] space-y-1.5">
                <span className="text-xs font-bold text-purple-400 font-mono block">3. Advisory AI Boundary</span>
                <p className="text-[11px] text-slate-400 font-sans">Gemini generates human-readable explanations, with zero graph modification rights.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0A121D] border border-cyan-500/30 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-white font-mono block">Audit Trail Compliance</span>
              <p className="text-slate-300 leading-relaxed font-sans">
                Every correlation merge, exception override, and telemetry observation is permanently recorded in the Session Audit Trail. Reports can be exported for SOC 2 and ISO 27001 auditor verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOWS */}
      {subTab === 'workflows' && (
        <div className="space-y-4">
          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Handling "Review Required" Discrepancies</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              When scanner sources supply contradictory primary attributes (e.g., identical IP address but divergent BIOS UUIDs), the engine marks the cluster as <strong className="text-amber-300">REVIEW REQUIRED</strong>.
            </p>
            <ol className="text-xs text-slate-300 font-mono space-y-2 pl-4 list-decimal">
              <li>Open <strong>Asset Correlation</strong> from the sidebar.</li>
              <li>Filter by "Review Required" to inspect candidate assets.</li>
              <li>Inspect multi-source evidence tabs (BIOS UUID, Cloud Resource ID, IPs).</li>
              <li>Choose <strong>Accept Correlation</strong> to confirm merge, or <strong>Create Exception</strong> to document intentional separation.</li>
            </ol>
          </div>

          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Non-Destructive Asset Archiving & Auto-Reactivation</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Decommissioned machines can be safely archived from <strong>Asset Inventory</strong>. Archiving preserves full historical evidence. If fresh telemetry is observed from any scanner, the engine automatically reactivates the asset with zero duplicate creation.
            </p>
          </div>
        </div>
      )}

      {/* SHORTCUTS */}
      {subTab === 'shortcuts' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">Platform Keyboard Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Global Search</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-cyan-400 font-bold">/</kbd>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Close Open Modal / Drawer</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-slate-200 font-bold">Esc</kbd>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Quick Switch: Overview</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-slate-200 font-bold">Alt + 1</kbd>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Quick Switch: Asset Correlation</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-slate-200 font-bold">Alt + 2</kbd>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Quick Switch: Administration</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-slate-200 font-bold">Alt + 8</kbd>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex items-center justify-between">
              <span className="text-slate-300">Trigger Full Screen / Focus</span>
              <kbd className="px-2 py-1 bg-[#122236] border border-[#1B3045] rounded text-slate-200 font-bold">F11</kbd>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSTICS */}
      {subTab === 'diagnostics' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">Platform Diagnostic Build Info</h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex justify-between">
              <span className="text-slate-400">ENGINE VERSION</span>
              <span className="text-cyan-400 font-bold">VulnFusion Core v2.4.0-ent</span>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex justify-between">
              <span className="text-slate-400">BUILD ID</span>
              <span className="text-white font-bold">vf-build-20260928-prod</span>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex justify-between">
              <span className="text-slate-400">DETERMINISTIC VERIFICATION</span>
              <span className="text-emerald-400 font-bold">118 / 118 Assertions PASSING</span>
            </div>
            <div className="p-3 bg-[#0B1420] rounded-xl border border-[#1B3045] flex justify-between">
              <span className="text-slate-400">AI GATEWAY STATUS</span>
              <span className="text-purple-400 font-bold">Online (Advisory Only)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default HelpTab;
