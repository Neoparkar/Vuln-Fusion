import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertCircle, CheckCircle2, Loader2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { UnderlyingAsset } from '../types/vulnfusion';

interface AIAnalystModalProps {
  asset: UnderlyingAsset | null;
  onClose: () => void;
  onViewEvidence?: (asset: UnderlyingAsset) => void;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({ asset, onClose, onViewEvidence }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError('Gemini could not provide an explanation for this request.');
      } else if (!data || typeof data.explanation !== 'string' || !data.explanation.trim()) {
        setError('AI response could not be safely rendered.');
      } else {
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      setError('Gemini could not provide an explanation for this request.');
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
                <div className="flex items-center justify-between text-xs text-[#64748B] font-medium border-b border-[#1E2631] pb-2">
                  <span>Model: Gemini 3.8 Flash (Server-Side Proxy)</span>
                  <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Grounded Sidecar Explanation
                  </span>
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
