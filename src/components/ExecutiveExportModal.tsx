import React, { useState } from 'react';
import { UnderlyingAsset, AssetRecord, VulnerabilityFinding, FindingCorrelationGroup } from '../types/vulnfusion';
import {
  exportExecutiveToPdf,
  exportExecutiveToJson,
  exportExecutiveToCsv,
  exportExecutiveToHtml,
  exportExecutiveToMarkdown,
  calculateExecutiveStats,
} from '../utils/executiveReportExport';
import {
  ExportPdfIcon,
  ExportCsvIcon,
  ExportJsonIcon,
  ExportHtmlIcon,
  ExportMarkdownIcon,
  VulnFusionBrandIcon,
  DeterministicEvidenceIcon,
} from './icons/VulnFusionIcons';
import {
  X,
  Download,
  Check,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';

interface ExecutiveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AssetRecord[];
  clusters: UnderlyingAsset[];
  findings: VulnerabilityFinding[];
  findingGroups: FindingCorrelationGroup[];
}

type ExportFormat = 'PDF' | 'CSV' | 'JSON' | 'HTML' | 'MARKDOWN';

export const ExecutiveExportModal: React.FC<ExecutiveExportModalProps> = ({
  isOpen,
  onClose,
  records,
  clusters,
  findings,
  findingGroups,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastExportedFile, setLastExportedFile] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const stats = calculateExecutiveStats(records, clusters, findings, findingGroups);

  const formats: {
    format: ExportFormat;
    label: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      format: 'PDF',
      label: 'Executive PDF Briefing',
      description: 'Formal executive document with KPI metrics, uncertainty radar, and asset inventory.',
      badge: 'Recommended for Leadership',
      icon: <ExportPdfIcon size={28} />,
      color: 'border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5',
    },
    {
      format: 'CSV',
      label: 'Inventory & Metrics CSV',
      description: 'Structured spreadsheet of normalized assets, confidence scores, and noise reduction.',
      badge: 'Data & Reporting',
      icon: <ExportCsvIcon size={28} />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
    },
    {
      format: 'JSON',
      label: 'Machine-Readable JSON',
      description: 'Complete programmatic telemetry payload including source breakdown and attention signals.',
      badge: 'API & Ingestion',
      icon: <ExportJsonIcon size={28} />,
      color: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5',
    },
    {
      format: 'HTML',
      label: 'Standalone HTML Report',
      description: 'Interactive dark-mode executive dashboard self-contained for offline viewing.',
      badge: 'Browser Sharing',
      icon: <ExportHtmlIcon size={28} />,
      color: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5',
    },
    {
      format: 'MARKDOWN',
      label: 'Executive Markdown Brief',
      description: 'Formatted markdown table and bullet points ready for ticketing or Wiki documentation.',
      badge: 'Documentation',
      icon: <ExportMarkdownIcon size={28} />,
      color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5',
    },
  ];

  const handleExport = async () => {
    setStatus('GENERATING');
    setErrorMessage('');

    try {
      await new Promise(r => setTimeout(r, 450));
      let filename = '';

      switch (selectedFormat) {
        case 'PDF':
          filename = exportExecutiveToPdf(records, clusters, findings, findingGroups);
          break;
        case 'CSV':
          filename = exportExecutiveToCsv(records, clusters, findings, findingGroups);
          break;
        case 'JSON':
          filename = exportExecutiveToJson(records, clusters, findings, findingGroups);
          break;
        case 'HTML':
          filename = exportExecutiveToHtml(records, clusters, findings, findingGroups);
          break;
        case 'MARKDOWN':
          filename = exportExecutiveToMarkdown(records, clusters, findings, findingGroups);
          break;
      }

      setLastExportedFile(filename);
      setStatus('SUCCESS');
    } catch (err: any) {
      console.error('Executive export error:', err);
      setErrorMessage(err?.message || 'An error occurred generating the executive report.');
      setStatus('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D131D] border border-[#1E293B] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0A0F17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1522] border border-[#2563A6]/40 flex items-center justify-center shadow-sm shrink-0">
              <VulnFusionBrandIcon size={26} glow={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F1F5F9] tracking-tight">
                  Vuln<span className="text-[#9CC3E6]">Fusion</span> Executive Export
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#102A43] text-[#5FA8D3] border border-[#2563A6]/30">
                  Asset Intelligence
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Generate an authoritative, multi-format executive intelligence snapshot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-slate-200 hover:bg-[#151D2A] rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Executive Summary Metrics Strip */}
          <div className="p-4 bg-[#080C12] border border-[#1E293B] rounded-xl grid grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">Assets</span>
              <span className="text-lg font-extrabold text-blue-400">{stats.totalAssets}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">Records</span>
              <span className="text-lg font-extrabold text-slate-100">{stats.totalRecords}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">Noise Red.</span>
              <span className="text-lg font-extrabold text-emerald-400">{stats.noiseReductionPercent}%</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">Attention</span>
              <span className="text-lg font-extrabold text-amber-400">{stats.reviewCount}</span>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide block">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formats.map(f => {
                const isSelected = selectedFormat === f.format;
                return (
                  <button
                    key={f.format}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(f.format);
                      setStatus('IDLE');
                    }}
                    className={`text-left p-3.5 rounded-xl border transition flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500'
                        : 'border-[#1E293B] bg-[#0A0F17] hover:border-[#334155]'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{f.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-300' : 'text-slate-100'}`}>
                          {f.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#151D2A] text-[#94A3B8] font-mono shrink-0">
                          {f.format}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status feedback */}
          {status === 'SUCCESS' && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Executive brief exported successfully: <strong>{lastExportedFile}</strong></span>
              </div>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage || 'Failed to generate report.'}</span>
            </div>
          )}

          {/* Engine Disclaimer */}
          <div className="text-[11px] text-[#64748B] flex items-center gap-2 pt-2 border-t border-[#1E293B]">
            <DeterministicEvidenceIcon size={14} className="shrink-0" />
            <span>100% Deterministic Engine Output • Formula-injection guarded CSV/JSON/PDF exports.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1E293B] bg-[#0A0F17] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#1E293B] hover:bg-[#151D2A] text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={status === 'GENERATING'}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            {status === 'GENERATING' ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Generating Executive Brief...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {selectedFormat} Brief</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
