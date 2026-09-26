import React, { useEffect, useState } from 'react';
import { UnifiedTestItem } from '../utils/testCenterUtils';
import { exportSingleTest } from '../utils/testReportExport';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Clock,
  Shield,
  Download,
  FileText,
  FileSpreadsheet,
  Code,
  FileCode,
  RotateCw,
  Terminal,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface TestDetailDrawerProps {
  test: UnifiedTestItem | null;
  onClose: () => void;
  onRerunTest?: (testId: string) => void;
}

export const TestDetailDrawer: React.FC<TestDetailDrawerProps> = ({ test, onClose, onRerunTest }) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!test) return null;

  const handleCopyResult = () => {
    const payload = JSON.stringify(
      {
        testId: test.id,
        testName: test.name,
        category: test.categoryLabel,
        status: test.status,
        passed: test.passed,
        expected: test.expected,
        actual: test.actual,
        difference: test.difference || null,
        details: test.details,
        evidenceSnippet: test.evidenceSnippet || null,
        durationMs: test.durationMs,
        runId: test.runId,
        timestamp: test.timestamp,
        engineAuthority: '100% Client-Side Deterministic',
      },
      null,
      2
    );

    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportIndividual = (format: 'JSON' | 'CSV' | 'PDF' | 'MARKDOWN') => {
    try {
      const filename = exportSingleTest(test, format);
      setExportFeedback(`✓ Exported ${format} (${filename})`);
      setShowExportMenu(false);
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err) {
      setExportFeedback('⚠ Export failed');
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  const handleTriggerRerun = () => {
    setIsRerunning(true);
    setTimeout(() => {
      setIsRerunning(false);
      if (onRerunTest) onRerunTest(test.id);
    }, 300);
  };

  const getStatusBadge = () => {
    if (test.status === 'PASSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
        </span>
      );
    }
    if (test.status === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider font-mono">
          <AlertTriangle className="w-3.5 h-3.5" /> REVIEW REQUIRED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider font-mono">
        <XCircle className="w-3.5 h-3.5" /> FAIL
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      {/* Backdrop clickable */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-2xl bg-[#0E1217] border-l border-[#1E2631] h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10 animate-slideLeft">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#1A222D] bg-[#12171F] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                {test.id}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#18202C] text-[#94A3B8] border border-[#242F3D] text-xs font-semibold">
                {test.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#64748B] font-mono">
                <Clock className="w-3 h-3" /> {test.durationMs}ms
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight leading-snug">
              {test.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#18202C] hover:bg-[#222C3D] text-[#94A3B8] hover:text-white border border-[#242F3D] transition shrink-0"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* Feedback banner if exported */}
          {exportFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> {exportFeedback}
            </div>
          )}

          {/* Section: Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <div className="w-6 h-6 rounded-lg bg-[#141922] border border-[#1E2631] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span>Test Specification & Objective</span>
            </div>
            <div className="p-4 bg-[#141922] border border-[#1E2631] rounded-xl text-slate-200 leading-relaxed text-xs">
              {test.description}
            </div>
          </div>

          {/* Section: Expected vs Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span>Expected Behavior</span>
              </div>
              <div className="p-4 bg-[#141922] border border-[#1E2631] rounded-xl text-slate-200 text-xs font-mono break-words leading-relaxed min-h-[90px]">
                {test.expected}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span>Observed Result</span>
              </div>
              <div className="p-4 bg-[#141922] border border-[#1E2631] rounded-xl text-slate-200 text-xs font-mono break-words leading-relaxed min-h-[90px]">
                {test.actual}
              </div>
            </div>
          </div>

          {/* Difference / Failure Callout if applicable */}
          {test.difference && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Discrepancy / Attention Detail
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-mono leading-relaxed">
                {test.difference}
              </div>
            </div>
          )}

          {/* Section: Technical Evidence & Artifacts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <div className="w-6 h-6 rounded-lg bg-[#141922] border border-[#1E2631] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span>Technical Trace & Telemetry Evidence</span>
            </div>
            <div className="p-4 bg-[#11161E] border border-[#1D2530] rounded-xl text-xs text-slate-300 font-mono space-y-2.5">
              <div>
                <span className="text-[#64748B]">Assertion Trace: </span>
                <span className="text-cyan-300 font-semibold">{test.details}</span>
              </div>
              {test.evidenceSnippet && (
                <div>
                  <span className="text-[#64748B]">Telemetry Evidence: </span>
                  <span className="text-indigo-300">{test.evidenceSnippet}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#1C232E] text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Execution Duration: {test.durationMs}ms</span>
                <span>Deterministic Assertion Certified</span>
              </div>
            </div>
          </div>

          {/* Section: Execution Signature */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <div className="w-6 h-6 rounded-lg bg-[#141922] border border-[#1E2631] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span>Execution Provenance</span>
            </div>
            <div className="p-4 bg-[#141922] border border-[#1E2631] rounded-xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Deterministic Run ID:</span>
                <span className="text-slate-300 font-bold">{test.runId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Execution Timestamp:</span>
                <span className="text-slate-300">{test.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Authority Boundary:</span>
                <span className="text-emerald-400 font-semibold">100% Client-Side Deterministic Engine</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="p-5 border-t border-[#1A222D] bg-[#12171F] flex items-center justify-between gap-3 shrink-0 relative">
          
          <div className="flex items-center gap-2">
            {/* Re-run single test button */}
            <button
              onClick={handleTriggerRerun}
              disabled={isRerunning}
              className="px-3.5 py-2 rounded-xl bg-[#18202C] hover:bg-[#222C3D] text-slate-200 border border-[#242F3D] text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isRerunning ? 'animate-spin' : ''}`} />
              Re-run Test
            </button>

            {/* Copy result button */}
            <button
              onClick={handleCopyResult}
              className="px-3.5 py-2 rounded-xl bg-[#18202C] hover:bg-[#222C3D] text-slate-200 border border-[#242F3D] text-xs font-bold transition flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Result
                </>
              )}
            </button>
          </div>

          {/* Export single test dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export Test <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#141922] border border-[#1E2631] rounded-xl shadow-2xl p-1 z-20 space-y-0.5 text-xs animate-fadeIn">
                <button
                  onClick={() => handleExportIndividual('PDF')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1E2631] text-slate-200 flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-rose-400" /> PDF Document
                </button>
                <button
                  onClick={() => handleExportIndividual('JSON')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1E2631] text-slate-200 flex items-center gap-2 transition"
                >
                  <Code className="w-4 h-4 text-cyan-400" /> JSON Payload
                </button>
                <button
                  onClick={() => handleExportIndividual('CSV')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1E2631] text-slate-200 flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> CSV Table
                </button>
                <button
                  onClick={() => handleExportIndividual('MARKDOWN')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1E2631] text-slate-200 flex items-center gap-2 transition"
                >
                  <FileCode className="w-4 h-4 text-purple-400" /> Markdown (.md)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
