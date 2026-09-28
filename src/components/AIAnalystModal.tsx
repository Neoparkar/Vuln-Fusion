import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertCircle, CheckCircle2, Loader2, ShieldCheck, FileText, ArrowRight, Download, Copy } from 'lucide-react';
import { UnderlyingAsset, AIAnalystInsight } from '../types/vulnfusion';
import { exportSingleAiInsightToPdf } from '../utils/executiveReportExport';

interface AIAnalystModalProps {
  asset: UnderlyingAsset | null;
  onClose: () => void;
  onViewEvidence?: (asset: UnderlyingAsset) => void;
  aiInsights?: AIAnalystInsight[];
  onAddInsight?: (insight: AIAnalystInsight) => void;
  onRemoveInsight?: (assetId: string, question: string) => void;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  asset,
  onClose,
  onViewEvidence,
  aiInsights = [],
  onAddInsight,
  onRemoveInsight,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const underlyingAssetId = asset?.underlyingAssetId;

  const handleFetchExplanation = async () => {
    if (!asset) return;
    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType: 'ASSET_CORRELATION_EXPLANATION',
          targetId: asset.underlyingAssetId || 'UNASSIGNED',
          dataPayload: {
            underlyingAssetId: asset.underlyingAssetId || 'UNASSIGNED',
            canonicalHostname: asset.canonicalHostname || 'Unknown Host',
            canonicalIpAddresses: asset.canonicalIpAddresses || [],
            correlationStatus: asset.correlationStatus || 'UNKNOWN',
            confidence: typeof asset.confidence === 'number' ? asset.confidence : 0,
            clusterSummary: asset.clusterSummary || '',
            correlationEvidence: Array.isArray(asset.correlationEvidence) ? asset.correlationEvidence : [],
            conflictingAttributes: Array.isArray(asset.conflictingAttributes) ? asset.conflictingAttributes : [],
            memberRecordIds: Array.isArray(asset.memberRecordIds) ? asset.memberRecordIds : [],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError('AI Analyst explanation unavailable.');
      } else if (!data || typeof data.explanation !== 'string' || !data.explanation.trim()) {
        setError('AI Analyst explanation unavailable.');
      } else {
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      setError('AI Analyst explanation unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (underlyingAssetId) {
      handleFetchExplanation();
    }
  }, [underlyingAssetId]);

  // Safely guard against missing or null asset
  if (!asset) return null;

  // Safe fallback values for asset properties
  const canonicalHostname = asset.canonicalHostname || 'Unknown Host';
  const correlationStatus = asset.correlationStatus || 'UNKNOWN';
  const confidence = typeof asset.confidence === 'number' ? asset.confidence : 0;
  const correlationEvidence = Array.isArray(asset.correlationEvidence) ? asset.correlationEvidence : [];
  const conflictingAttributes = Array.isArray(asset.conflictingAttributes) ? asset.conflictingAttributes : [];
  const memberRecordIds = Array.isArray(asset.memberRecordIds) ? asset.memberRecordIds : [];

  const matchedCount = correlationEvidence.length;
  const conflictCount = conflictingAttributes.length;
  const evaluatedCount = matchedCount + conflictCount;

  const questionText = `Explain why ${canonicalHostname} was correlated across multiple security sources. Use only the supplied deterministic evidence.`;
  const isAlreadyAdded = aiInsights.some(i => i.assetId === underlyingAssetId && i.question === questionText);

  const insightObj: AIAnalystInsight = {
    assetId: underlyingAssetId || 'UNKNOWN',
    assetName: canonicalHostname,
    correlationStatus,
    confidence,
    question: questionText,
    explanation: explanation || '',
    evidenceReferences: correlationEvidence.map(e => e.name),
    matchedSignalsCount: matchedCount,
    conflictsCount: conflictCount,
    memberRecordIds,
    provider: 'Google Gemini',
    model: 'gemini-3.8-flash',
    generatedAt: new Date().toISOString(),
  };

  const handleExportPdf = () => {
    if (!explanation) return;
    exportSingleAiInsightToPdf(insightObj);
  };

  const handleExportMarkdown = () => {
    if (!explanation) return;
    const md = `# AI Analyst Insight\n\n### Asset\n${canonicalHostname} (${underlyingAssetId})\n\n### Deterministic Result\n${correlationStatus}\n\n### Confidence\n${confidence}%\n\n### Question\n${questionText}\n\n### AI-Generated Explanation\n${explanation}\n\n### Evidence Referenced\n${correlationEvidence.map(e => e.name).join(', ') || 'None'}\n\n### Provenance\n- Provider: Google Gemini\n- Model: gemini-3.8-flash\n- Generated At: ${new Date().toISOString()}\n\n### Authority\nThe deterministic VulnFusion engine remains authoritative. AI output is explanatory only.\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vulnfusion-ai-insight-${underlyingAssetId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportJson = () => {
    if (!explanation) return;
    const payload = {
      type: 'vulnfusion_ai_insight',
      asset: { assetId: underlyingAssetId, canonicalHostname, correlationStatus, confidence },
      question: questionText,
      explanation,
      evidenceReferences: correlationEvidence.map(e => e.name),
      provider: 'Google Gemini',
      model: 'gemini-3.8-flash',
      generatedAt: new Date().toISOString(),
      authority: 'deterministic_engine_authoritative_ai_explanatory_only'
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vulnfusion-ai-insight-${underlyingAssetId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportClipboard = async () => {
    if (!explanation) return;
    const text = `VULNFUSION AI ANALYST INSIGHT\nAsset: ${canonicalHostname} (${underlyingAssetId})\nStatus: ${correlationStatus} (${confidence}% confidence)\nQuestion: ${questionText}\n\nExplanation:\n${explanation}\n\nAuthority: Deterministic VulnFusion engine is authoritative; AI output is explanatory only.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A222D] bg-[#10141A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-purple-400 tracking-wider flex items-center gap-2">
                <span>AI ANALYST</span>
                <span className="text-slate-600">•</span>
                <span>Explanation Sidecar</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                {canonicalHostname} <span className="text-slate-400 font-mono text-sm">({underlyingAssetId})</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#151A21] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* SECTION A: AUTHORITATIVE RESULT (Always visible regardless of Gemini status) */}
          <div className="bg-[#151A21] border border-[#1E2631] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2631] pb-3">
              <div className="space-y-1">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> AUTHORITATIVE RESULT
                </span>
                <div className="text-base font-bold text-slate-100">
                  Deterministic Correlation Engine
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                  correlationStatus === 'CORRELATED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : correlationStatus === 'REVIEW_REQUIRED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                }`}>
                  {correlationStatus === 'REVIEW_REQUIRED' ? 'REVIEW REQUIRED' : correlationStatus}
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold font-mono">
                  {confidence}% confidence
                </span>
              </div>
            </div>

            {/* Evidence Counts Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="bg-[#10141A] border border-[#1E2631] p-2.5 rounded-xl space-y-0.5">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">Matched Signals</span>
                <span className="text-emerald-400 text-sm font-bold">{matchedCount} matched</span>
              </div>
              <div className="bg-[#10141A] border border-[#1E2631] p-2.5 rounded-xl space-y-0.5">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">Conflicts Identified</span>
                <span className="text-amber-400 text-sm font-bold">{conflictCount} conflicts</span>
              </div>
              <div className="bg-[#10141A] border border-[#1E2631] p-2.5 rounded-xl space-y-0.5">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">Evaluated Total</span>
                <span className="text-blue-400 text-sm font-bold">{evaluatedCount} evaluated</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1A222D]" />

          {/* SECTION B: EXPLANATION SIDECAR (Gemini AI Analyst) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs uppercase font-bold text-purple-300 tracking-wider">
                  EXPLANATION SIDECAR
                </span>
                <span className="text-[#64748B] text-xs">— Gemini AI Analyst</span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                NON-AUTHORITATIVE
              </span>
            </div>

            {/* Clear Authority Boundary Note */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs text-purple-200/90 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Gemini explains the evidence. It does not determine correlation.</span>
            </div>

            {/* 1. Loading State */}
            {loading && (
              <div className="bg-[#151A21] border border-[#1E2631] rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-100 block">Analyzing deterministic evidence...</span>
                  <p className="text-xs text-[#94A3B8]">
                    Synthesizing record attributes and correlation signals with Gemini sidecar.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Error / Unavailable State */}
            {!loading && error && (
              <div className="bg-[#151A21] border border-amber-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                      AI Analyst unavailable
                    </h4>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E2631] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Deterministic correlation remains available.
                  </span>
                  
                  {onViewEvidence && (
                    <button
                      onClick={() => onViewEvidence(asset)}
                      className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>VIEW EVIDENCE</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. Success State */}
            {!loading && !error && explanation && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B] font-medium border-b border-[#1E2631] pb-2">
                  <div className="flex items-center gap-2">
                    <span>Model: Server-Side Gemini</span>
                    <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Grounded Sidecar Explanation
                    </span>
                  </div>

                  {/* Executive Report & Export Actions */}
                  <div className="flex items-center gap-2 relative">
                    <button
                      onClick={() => {
                        if (isAlreadyAdded) {
                          onRemoveInsight?.(underlyingAssetId || '', questionText);
                        } else {
                          onAddInsight?.(insightObj);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 border text-xs ${
                        isAlreadyAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-purple-600/30 text-purple-200 border-purple-500/40 hover:bg-purple-600/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAlreadyAdded ? 'Added to Executive Report ✓' : 'Add to Executive Report'}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="px-3 py-1.5 bg-[#181E26] hover:bg-[#1E2631] text-slate-200 border border-[#26303E] font-semibold rounded-xl transition flex items-center gap-1"
                      >
                        <span>Export ▾</span>
                      </button>

                      {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#151A21] border border-[#26303E] rounded-xl shadow-2xl py-1 z-50 text-xs">
                          <button
                            onClick={() => { handleExportPdf(); setShowExportMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-[#1E2631] text-slate-200 flex items-center gap-2"
                          >
                            <span>PDF (.pdf)</span>
                          </button>
                          <button
                            onClick={() => { handleExportMarkdown(); setShowExportMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-[#1E2631] text-slate-200 flex items-center gap-2"
                          >
                            <span>Markdown (.md)</span>
                          </button>
                          <button
                            onClick={() => { handleExportJson(); setShowExportMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-[#1E2631] text-slate-200 flex items-center gap-2"
                          >
                            <span>JSON (.json)</span>
                          </button>
                          <button
                            onClick={() => { handleExportClipboard(); setShowExportMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-[#1E2631] text-slate-200 flex items-center gap-2"
                          >
                            <span>{copied ? 'Copied to Clipboard ✓' : 'Copy to Clipboard'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#151A21] border border-[#1E2631] rounded-2xl p-5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {explanation}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-[#1A222D] bg-[#10141A] shrink-0 text-xs">
          <span className="text-[#64748B] font-mono truncate">
            Grounding: Member Records ({memberRecordIds.join(', ') || 'None'})
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleFetchExplanation}
              disabled={loading}
              className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900/50 disabled:opacity-50 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Re-Analyze</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#181E26] hover:bg-[#1E2631] text-slate-200 border border-[#26303E] text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
