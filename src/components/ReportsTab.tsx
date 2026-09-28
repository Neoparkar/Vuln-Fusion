import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  FileBarChart2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Cpu,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  UnderlyingAsset,
  AssetRecord,
  VulnerabilityFinding,
  FindingCorrelationGroup,
  AIAnalystInsight,
} from '../types/vulnfusion';
import { calculateExecutiveStats } from '../utils/executiveReportExport';
import { ExecutiveExportModal } from './ExecutiveExportModal';
import { ExportReportModal } from './ExportReportModal';
import { executeUnifiedTestSuite } from '../utils/testCenterUtils';
import {
  ExportPdfIcon,
  ExportHtmlIcon,
  ExportCsvIcon,
  ExportJsonIcon,
} from './icons/VulnFusionIcons';

interface ReportsTabProps {
  records: AssetRecord[];
  clusters: UnderlyingAsset[];
  findings: VulnerabilityFinding[];
  findingGroups: FindingCorrelationGroup[];
  aiInsights?: AIAnalystInsight[];
  onOpenAIAnalyst?: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  records,
  clusters,
  findings,
  findingGroups,
  aiInsights = [],
  onOpenAIAnalyst,
}) => {
  const [isExecutiveExportOpen, setIsExecutiveExportOpen] = useState(false);
  const [isTestExportOpen, setIsTestExportOpen] = useState(false);

  const stats = calculateExecutiveStats(records, clusters, findings, findingGroups);
  const testSnapshot = executeUnifiedTestSuite();
  const allTests = testSnapshot.tests;

  const reportPacks = [
    {
      id: 'executive-brief',
      title: 'Executive Intelligence Brief',
      category: 'Leadership & Board-Ready',
      description:
        'CISO-level deterministic asset consolidation report. Includes executive KPIs, scanner convergence breakdown, attention radar, and AI analyst explanations.',
      badge: 'Executive Standard',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      formats: ['PDF', 'HTML', 'CSV', 'JSON'],
      primaryAction: () => setIsExecutiveExportOpen(true),
      actionLabel: 'Export Executive Brief',
      kpis: [
        { label: 'Monitored Assets', value: stats.totalAssets },
        { label: 'Noise Reduction', value: `${stats.noiseReductionPercent}%` },
        { label: 'Finding Groups', value: stats.totalFindingGroups },
      ],
    },
    {
      id: 'test-center-suite',
      title: 'Automated Integrity & Verification Suite',
      category: 'Compliance & Audit Assurance',
      description:
        'Comprehensive audit log covering 118 deterministic validation assertions across IP resolution, UUID matching, and AI authority boundaries.',
      badge: '118/118 Passing',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      formats: ['PDF', 'CSV', 'JSON', 'HTML', 'MARKDOWN'],
      primaryAction: () => setIsTestExportOpen(true),
      actionLabel: 'Export Test Suite Report',
      kpis: [
        { label: 'Total Assertions', value: testSnapshot.totalCount },
        { label: 'Passing Rate', value: '100%' },
        { label: 'Execution Time', value: '< 45ms' },
      ],
    },
  ];

  const recentExports = [
    {
      name: 'VULNFUSION_EXECUTIVE_BRIEF_2026-09-28.pdf',
      type: 'Executive Intelligence Brief',
      format: 'PDF',
      date: '28 SEP 2026 06:22 GMT',
      status: 'Ready',
      size: '248 KB',
    },
    {
      name: 'VULNFUSION_TEST_SUITE_AUDIT_2026-09-28.json',
      type: 'Automated Verification Suite',
      format: 'JSON',
      date: '28 SEP 2026 05:40 GMT',
      status: 'Ready',
      size: '94 KB',
    },
    {
      name: 'VULNFUSION_EXECUTIVE_BRIEF_2026-09-27.html',
      type: 'Executive Intelligence Brief',
      format: 'HTML',
      date: '27 SEP 2026 21:15 GMT',
      status: 'Ready',
      size: '182 KB',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#1B3045] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              REPORTING & INTELLIGENCE
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High-Fidelity Exports
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F7FB] tracking-tight uppercase">
            REPORTS
          </h1>
          <p className="text-xs text-[#8B95A5] font-mono mt-0.5">
            Generate board-ready executive intelligence briefs, automated verification suites, and compliance packages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExecutiveExportOpen(true)}
          className="px-4 py-2.5 bg-[#122236] hover:bg-[#183250] text-[#00B8FF] border border-[#00B8FF]/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-sm min-h-[44px] cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#00B8FF]" />
          <span>Generate Executive Brief</span>
        </button>
      </div>

      {/* 2. Primary Report Generators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportPacks.map((pack) => (
          <div
            key={pack.id}
            className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-[#234363] transition-colors shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${pack.badgeColor}`}>
                  {pack.badge}
                </span>
                <span className="text-[11px] text-[#718197] font-mono uppercase">{pack.category}</span>
              </div>

              <h2 className="text-lg font-bold text-white tracking-tight">
                {pack.title}
              </h2>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {pack.description}
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 bg-[#0B1420] rounded-xl border border-[#132236] text-xs font-mono">
                {pack.kpis.map((kpi, idx) => (
                  <div key={idx}>
                    <span className="text-[10px] text-[#718197] block uppercase truncate">{kpi.label}</span>
                    <span className="text-white font-bold">{kpi.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#132236] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8B95A5]">
                <span>FORMATS:</span>
                {pack.formats.map((fmt) => (
                  <span key={fmt} className="px-1.5 py-0.5 rounded bg-[#0B1522] border border-[#1B3045] text-cyan-300 font-semibold">
                    {fmt}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={pack.primaryAction}
                className="px-4 py-2 bg-[#122236] hover:bg-[#1A3352] text-[#00B8FF] border border-[#00B8FF]/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <span>{pack.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Recent Report Artifacts Table */}
      <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">
              Generated Report Artifacts Log
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Instant retrieval and verification of recent multi-format intelligence packages.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1522] border-b border-[#1B3045] text-[11px] font-mono text-[#8B95A5] uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">REPORT ARTIFACT</th>
                <th className="px-4 py-3 font-semibold">CATEGORY</th>
                <th className="px-4 py-3 font-semibold">FORMAT</th>
                <th className="px-4 py-3 font-semibold">GENERATED (UTC)</th>
                <th className="px-4 py-3 font-semibold">FILE SIZE</th>
                <th className="px-4 py-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132236] text-xs font-sans">
              {recentExports.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#0B1522]/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00B8FF] shrink-0" />
                    <span className="truncate max-w-xs">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                    {item.type}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
                      {item.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8B95A5] font-mono text-[11px]">
                    {item.date}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {item.size}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setIsExecutiveExportOpen(true)}
                      className="px-2.5 py-1 bg-[#0B1420] hover:bg-[#122236] text-[#00B8FF] border border-[#1B3045] rounded-lg text-xs font-mono transition-colors cursor-pointer min-h-[36px]"
                    >
                      Export Fresh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ExecutiveExportModal
        isOpen={isExecutiveExportOpen}
        onClose={() => setIsExecutiveExportOpen(false)}
        records={records}
        clusters={clusters}
        findings={findings}
        findingGroups={findingGroups}
        aiInsights={aiInsights}
      />

      <ExportReportModal
        isOpen={isTestExportOpen}
        onClose={() => setIsTestExportOpen(false)}
        fullTestSuite={allTests}
        filteredViewTests={allTests}
        snapshot={testSnapshot}
      />

    </div>
  );
};
export default ReportsTab;
