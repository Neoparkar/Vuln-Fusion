import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, Database, Code, FileCode, ChevronDown, Check, AlertCircle } from 'lucide-react';
import {
  UnderlyingAsset,
  AssetRecord,
  VulnerabilityFinding,
  FindingCorrelationGroup,
  CorrelationException,
  AuditLogEntry,
} from '../types/vulnfusion';
import {
  buildExportData,
  exportToPdf,
  exportToXlsx,
  exportToCsv,
  exportToJson,
  exportToMarkdown,
} from '../utils/exportEvidence';

interface ExportEvidenceMenuProps {
  cluster: UnderlyingAsset;
  records: AssetRecord[];
  findings?: VulnerabilityFinding[];
  findingGroups?: FindingCorrelationGroup[];
  exceptions?: CorrelationException[];
  auditLogs?: AuditLogEntry[];
  aiExplanation?: string | null;
  onToastNotice?: (message: string, isError?: boolean) => void;
}

export const ExportEvidenceMenu: React.FC<ExportEvidenceMenuProps> = ({
  cluster,
  records,
  findings = [],
  findingGroups = [],
  exceptions = [],
  auditLogs = [],
  aiExplanation = null,
  onToastNotice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExport = (format: 'pdf' | 'xlsx' | 'csv' | 'json' | 'md') => {
    setIsExporting(format);

    setTimeout(() => {
      try {
        // Build export model using current live selected state
        const exportData = buildExportData(
          cluster,
          records,
          findings,
          findingGroups,
          exceptions,
          auditLogs,
          aiExplanation
        );

        let formatLabel = 'PDF';
        if (format === 'pdf') {
          exportToPdf(exportData, true);
          formatLabel = 'PDF';
        } else if (format === 'xlsx') {
          exportToXlsx(exportData, true);
          formatLabel = 'Excel (.xlsx)';
        } else if (format === 'csv') {
          exportToCsv(exportData, true);
          formatLabel = 'CSV';
        } else if (format === 'json') {
          exportToJson(exportData, true);
          formatLabel = 'JSON';
        } else if (format === 'md') {
          exportToMarkdown(exportData, true);
          formatLabel = 'Markdown';
        }

        if (onToastNotice) {
          onToastNotice(`Correlation evidence exported as ${formatLabel}.`);
        }
      } catch (err: any) {
        console.error('Export failed:', err);
        if (onToastNotice) {
          onToastNotice(
            'Export unavailable. Unable to generate the selected report. The correlation workspace remains unchanged.',
            true
          );
        }
      } finally {
        setIsExporting(null);
        setIsOpen(false);
      }
    }, 150);
  };

  const exportOptions = [
    {
      id: 'pdf' as const,
      label: 'PDF',
      subtitle: 'Audit / external report',
      icon: FileText,
      color: 'text-[#00B8FF]',
    },
    {
      id: 'xlsx' as const,
      label: 'Excel (.xlsx)',
      subtitle: 'Evidence workbook',
      icon: Table,
      color: 'text-[#00D6A3]',
    },
    {
      id: 'csv' as const,
      label: 'CSV',
      subtitle: 'Tabular source records',
      icon: Database,
      color: 'text-[#38BDF8]',
    },
    {
      id: 'json' as const,
      label: 'JSON',
      subtitle: 'Machine-readable evidence',
      icon: Code,
      color: 'text-[#F5A623]',
    },
    {
      id: 'md' as const,
      label: 'Markdown (.md)',
      subtitle: 'Technical evidence report',
      icon: FileCode,
      color: 'text-[#A855F7]',
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 bg-[#00B8FF]/15 hover:bg-[#00B8FF]/25 text-[#00B8FF] border border-[#00B8FF]/40 hover:border-[#00B8FF]/70 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,184,255,0.15)] group shrink-0"
        title="Export current correlation evidence"
      >
        <Download className="w-3.5 h-3.5 text-[#00B8FF] group-hover:scale-110 transition-transform shrink-0" />
        <span>Export Evidence</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#00B8FF]/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* VulnFusion Styled Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0B1420] border border-[#1B3045] shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
          {/* Menu Header */}
          <div className="px-4 py-3 bg-[#101B29] border-b border-[#1B3045] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00B8FF] block">
                VULNFUSION EXPORT
              </span>
              <h4 className="text-xs font-bold text-[#F4F7FB]">
                EXPORT CORRELATION EVIDENCE
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#718197] bg-[#071019] px-1.5 py-0.5 rounded border border-[#1B3045]">
              {cluster.underlyingAssetId}
            </span>
          </div>

          {/* Export Items */}
          <div className="p-1.5 space-y-1">
            {exportOptions.map((opt) => {
              const Icon = opt.icon;
              const isLoading = isExporting === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleExport(opt.id)}
                  disabled={Boolean(isExporting)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#101B29] transition-colors flex items-center justify-between group focus:outline-none disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#101B29] group-hover:bg-[#1B3045] border border-[#1B3045] flex items-center justify-center shrink-0 transition-colors">
                      <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F4F7FB] group-hover:text-[#00B8FF] transition-colors">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-[#718197]">
                        {opt.subtitle}
                      </div>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-[#00B8FF] border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer / Cancel */}
          <div className="p-2 bg-[#071019] border-t border-[#1B3045] flex items-center justify-between">
            <span className="text-[10px] text-[#718197]">
              Current live state snapshot
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[#718197] hover:text-[#F4F7FB] px-2 py-1 rounded hover:bg-[#101B29] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
