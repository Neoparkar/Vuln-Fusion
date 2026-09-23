import React, { useState } from 'react';
import { UnderlyingAsset, ExceptionReason } from '../types/vulnfusion';
import { X, ShieldAlert, FileText } from 'lucide-react';

interface ExceptionModalProps {
  asset: UnderlyingAsset | null;
  onClose: () => void;
  onSubmitException: (assetGroupId: string, recordIds: string[], reason: ExceptionReason, analystNote: string) => void;
}

export const ExceptionModal: React.FC<ExceptionModalProps> = ({ asset, onClose, onSubmitException }) => {
  const [reason, setReason] = useState<ExceptionReason>('SHARED_IP_NAT');
  const [analystNote, setAnalystNote] = useState('');

  if (!asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitException(asset.underlyingAssetId, asset.memberRecordIds, reason, analystNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn font-sans">
      <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A222D] bg-[#10141A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Analyst Exception Creation</div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">{asset.underlyingAssetId} — {asset.canonicalHostname}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#151A21] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
            Create an analyst exception for this asset group. This does not alter historical source telemetry or automated correlation logic; it attaches an auditable analyst decision to the group.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">Exception Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ExceptionReason)}
              className="w-full bg-[#151A21] border border-[#1E2631] rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition font-sans"
            >
              <option value="SHARED_IP_NAT">SHARED_IP_NAT (Shared IP via NAT / Gateway)</option>
              <option value="SHARED_HOSTNAME">SHARED_HOSTNAME (Ambiguous Hostname Collision)</option>
              <option value="DISCOVERY_ARTIFACT">DISCOVERY_ARTIFACT (Ephemeral Discovery Artifact)</option>
              <option value="VIRTUALIZATION_EPHEMERAL">VIRTUALIZATION_EPHEMERAL (Virtual Machine ID Reuse)</option>
              <option value="INTENTIONAL_DUPLICATE">INTENTIONAL_DUPLICATE (Known Multi-Scanner Overlap)</option>
              <option value="OTHER">OTHER (Analyst Discretionary Review)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">Analyst Note / Justification</label>
            <textarea
              required
              rows={3}
              placeholder="Enter analyst justification or context..."
              value={analystNote}
              onChange={(e) => setAnalystNote(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1E2631] rounded-xl p-3.5 text-sm text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-amber-500/50 transition font-sans"
            />
          </div>

          <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 text-xs text-[#94A3B8] space-y-1">
            <span className="font-bold text-slate-200 block">Affected Member Records ({asset.memberRecordIds.length}):</span>
            <div className="font-mono text-xs text-slate-300">{asset.memberRecordIds.join(', ')}</div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A222D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#181E26] hover:bg-[#1E2631] text-slate-200 text-sm font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Create Exception
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
