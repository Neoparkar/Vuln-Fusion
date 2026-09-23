import React from 'react';
import { UnderlyingAsset } from '../types/vulnfusion';
import { X, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

interface EvidenceModalProps {
  asset: UnderlyingAsset | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ asset, onClose }) => {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn font-sans">
      <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A222D] bg-[#10141A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Correlation Evidence & Signals</div>
              <h2 className="text-lg font-bold text-slate-100">{asset.underlyingAssetId} — {asset.canonicalHostname}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#151A21] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto">
          
          {/* Summary Box */}
          <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5 space-y-2 text-sm">
            <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Hypothesis Summary</div>
            <p className="text-slate-100 leading-relaxed font-medium">{asset.clusterSummary}</p>
            <div className="flex items-center gap-4 pt-3 border-t border-[#1E2631] text-xs font-semibold text-[#94A3B8]">
              <div>Confidence: <strong className="text-cyan-400 text-sm">{asset.confidence}%</strong></div>
              <div>Status: <strong className="text-emerald-400 text-sm">{asset.correlationStatus}</strong></div>
              <div>Member Records: <strong className="text-slate-100 text-sm">{asset.memberRecordIds.length}</strong></div>
            </div>
          </div>

          {/* Supporting Signals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Supporting Signals ({asset.correlationEvidence.length})
            </h3>
            <div className="space-y-2.5">
              {asset.correlationEvidence.map((signal) => (
                <div key={signal.id} className="bg-[#151A21] border border-emerald-500/20 rounded-xl p-4 space-y-1 text-sm">
                  <div className="flex items-center justify-between font-bold text-emerald-300 text-sm">
                    <span>{signal.name}</span>
                    <span className="text-emerald-400 font-mono">+{signal.weight} pts</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{signal.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conflicting Attributes */}
          {asset.conflictingAttributes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Conflicting Attributes ({asset.conflictingAttributes.length})
              </h3>
              <div className="space-y-2.5">
                {asset.conflictingAttributes.map((conflict) => (
                  <div key={conflict.id} className="bg-[#151A21] border border-amber-500/20 rounded-xl p-4 space-y-1 text-sm">
                    <div className="flex items-center justify-between font-bold text-amber-300 text-sm">
                      <span>{conflict.name}</span>
                      <span className="text-amber-400 font-mono">{conflict.weight} pts</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{conflict.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1A222D] bg-[#10141A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
