import React, { useState } from 'react';
import { UnifiedTestItem, TestExecutionSnapshot } from '../utils/testCenterUtils';
import {
  exportTestSuiteToJson,
  exportTestSuiteToCsv,
  exportTestSuiteToPdf,
  exportTestSuiteToHtml,
  exportTestSuiteToMarkdown,
} from '../utils/testReportExport';
import {
  ExportPdfIcon,
  ExportCsvIcon,
  ExportJsonIcon,
  ExportHtmlIcon,
  ExportMarkdownIcon,
  VulnFusionBrandIcon,
} from './icons/VulnFusionIcons';
import {
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Check,
  RotateCw,
  Clock,
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullTestSuite: UnifiedTestItem[];
  filteredViewTests: UnifiedTestItem[];
  snapshot: TestExecutionSnapshot;
}

type ExportFormat = 'PDF' | 'CSV' | 'JSON' | 'HTML' | 'MARKDOWN';
type ExportScope = 'FULL' | 'FILTERED';

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  fullTestSuite,
  filteredViewTests,
  snapshot,
}) => {
  const [scope, setScope] = useState<ExportScope>('FULL');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastExportedFile, setLastExportedFile] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const targetTests = scope === 'FULL' ? fullTestSuite : filteredViewTests;

  const formats: {
    format: ExportFormat;
    label: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      format: 'PDF',
      label: 'PDF Report',
      description: 'Structured multi-page document with Executive Health, Domain Breakdowns, and Assertions.',
      badge: 'Executive & Compliance',
      icon: <ExportPdfIcon size={28} />,
    },
    {
      format: 'CSV',
      label: 'CSV Spreadsheet',
      description: 'Tabular dataset formatted with formula injection protection for Excel and SIEM pipelines.',
      badge: 'Data Analysis',
      icon: <ExportCsvIcon size={28} />,
    },
    {
      format: 'JSON',
      label: 'JSON Payload',
      description: 'Standardized machine-readable schema for automated CI/CD and programmatic verification.',
      badge: 'Machine-Readable',
      icon: <ExportJsonIcon size={28} />,
    },
    {
      format: 'HTML',
      label: 'Interactive HTML',
      description: 'Self-contained responsive dashboard that opens in any browser with zero dependencies.',
      badge: 'Standalone Artifact',
      icon: <ExportHtmlIcon size={28} />,
    },
    {
      format: 'MARKDOWN',
      label: 'Markdown (.md)',
      description: 'Clean GitHub-flavored markdown report ready for repository audits, wikis, and PR logs.',
      badge: 'Engineering Docs',
      icon: <ExportMarkdownIcon size={28} />,
    },
  ];

  const handleExecuteExport = () => {
    setStatus('GENERATING');
    setErrorMessage('');

    setTimeout(() => {
      try {
        const scopeLabel = scope === 'FULL' ? 'Full Test Suite' : `Filtered View (${targetTests.length} Tests)`;
        let filename = '';

        switch (selectedFormat) {
          case 'PDF':
            filename = exportTestSuiteToPdf(targetTests, snapshot, scopeLabel);
            break;
          case 'CSV':
            filename = exportTestSuiteToCsv(targetTests, snapshot);
            break;
          case 'JSON':
            filename = exportTestSuiteToJson(targetTests, snapshot, scopeLabel);
            break;
          case 'HTML':
            filename = exportTestSuiteToHtml(targetTests, snapshot, scopeLabel);
            break;
          case 'MARKDOWN':
            filename = exportTestSuiteToMarkdown(targetTests, snapshot, scopeLabel);
            break;
        }

        setLastExportedFile(filename);
        setStatus('SUCCESS');
      } catch (err: any) {
        console.error('Export failed:', err);
        setErrorMessage(err?.message || 'Unable to generate the requested report.');
        setStatus('ERROR');
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl bg-[#0E1217] border border-[#1E2631] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1A222D] bg-[#12171F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Export Validation Report
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Generate certified deterministic test execution artifacts across multiple formats.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#18202C] hover:bg-[#222C3D] text-[#94A3B8] hover:text-white border border-[#242F3D] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* 1. Scope Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block">
              1. Select Report Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setScope('FULL');
                  setStatus('IDLE');
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  scope === 'FULL'
                    ? 'bg-[#17212F] border-blue-500 text-white'
                    : 'bg-[#141922] hover:bg-[#18202C] border-[#1E2631] text-[#94A3B8]'
                }`}
              >
                <div>
                  <strong className="block text-xs font-bold text-slate-200">Full Test Suite</strong>
                  <span className="text-[11px] text-[#64748B]">All {fullTestSuite.length} deterministic validation tests</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#10141A] text-blue-400 text-xs font-mono font-bold">
                  {fullTestSuite.length} Tests
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('FILTERED');
                  setStatus('IDLE');
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  scope === 'FILTERED'
                    ? 'bg-[#17212F] border-blue-500 text-white'
                    : 'bg-[#141922] hover:bg-[#18202C] border-[#1E2631] text-[#94A3B8]'
                }`}
              >
                <div>
                  <strong className="block text-xs font-bold text-slate-200">Current View</strong>
                  <span className="text-[11px] text-[#64748B]">Filtered subset matching search / category</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#10141A] text-cyan-400 text-xs font-mono font-bold">
                  {filteredViewTests.length} Tests
                </span>
              </button>
            </div>
          </div>

          {/* 2. Format Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block">
              2. Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map(fmt => (
                <button
                  key={fmt.format}
                  type="button"
                  onClick={() => {
                    setSelectedFormat(fmt.format);
                    setStatus('IDLE');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 group ${
                    selectedFormat === fmt.format
                      ? 'bg-[#17212F] border-blue-500'
                      : 'bg-[#141922] hover:bg-[#18202C] border-[#1E2631]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#10141A] border border-[#1E2631]">
                        {fmt.icon}
                      </div>
                      <strong className="text-xs font-bold text-slate-200 group-hover:text-white">
                        {fmt.label}
                      </strong>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10141A] text-[#94A3B8] border border-[#1C2430]">
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    {fmt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Status Feedback Banners */}
          {status === 'GENERATING' && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2.5 text-xs text-blue-300 font-mono animate-pulse">
              <RotateCw className="w-4 h-4 animate-spin text-blue-400" />
              Generating {selectedFormat} report for {targetTests.length} tests...
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Report generated and downloaded: <strong>{lastExportedFile}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Ready</span>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Export Failed: {errorMessage}</span>
              </div>
              <button
                onClick={handleExecuteExport}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#1A222D] bg-[#12171F] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#64748B] font-mono hidden sm:block">
            Scope: {targetTests.length} tests ({selectedFormat})
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#18202C] hover:bg-[#222C3D] text-slate-300 border border-[#242F3D] text-xs font-semibold transition"
            >
              Close
            </button>

            <button
              onClick={handleExecuteExport}
              disabled={status === 'GENERATING'}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {status === 'GENERATING' ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download {selectedFormat} Report
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
