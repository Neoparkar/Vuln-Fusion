import React, { useState } from 'react';
import { UnderlyingAsset, AssetRecord, VulnerabilityFinding, ArchiveReason } from '../types/vulnfusion';
import { formatObservationDate, formatAgeDescription } from '../utils/lifecycleUtils';
import { Archive, AlertTriangle, ShieldCheck, X, Info, CheckCircle2, History, Database, Bug, Calendar } from 'lucide-react';
import { AssetIntelligenceIcon, AssetLifecycleIcon } from './icons/VulnFusionIcons';
import { SourceLogo, AssetSourceDiscoveryBadge } from './SourceLogo';

interface ArchiveAssetModalProps {
  asset: UnderlyingAsset | null;
  records: AssetRecord[];
  findings?: VulnerabilityFinding[];
  archiveThresholdDays: number;
  onClose: () => void;
  onConfirmArchive: (
    assetGroupId: string,
    reason: ArchiveReason,
    reasonText: string,
    notes: string
  ) => void;
}

export const ArchiveAssetModal: React.FC<ArchiveAssetModalProps> = ({
  asset,
  records,
  findings = [],
  archiveThresholdDays,
  onClose,
  onConfirmArchive,
}) => {
  const [selectedReason, setSelectedReason] = useState<ArchiveReason>('ASSET_DECOMMISSIONED');
  const [customExplanation, setCustomExplanation] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!asset) return null;

  const memberRecords = records.filter(r => asset.memberRecordIds.includes(r.recordId));
  const relatedFindings = findings.filter(f => f.underlyingAssetGroupId === asset.underlyingAssetId);
  const sourceTools = Array.from(new Set(memberRecords.map(r => r.sourceTool)));

  // Calculate Last Seen and Age
  const lastDates = memberRecords
    .map(r => r.lastObserved)
    .filter((d): d is string => Boolean(d))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const lastSeen = lastDates[0] || null;
  const refTime = new Date('2026-09-26T00:00:00Z').getTime();
  const inactiveDays = lastSeen
    ? Math.max(0, Math.floor((refTime - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const reasonOptions: { id: ArchiveReason; label: string; description: string }[] = [
    {
      id: 'ASSET_DECOMMISSIONED',
      label: 'Asset decommissioned',
      description: 'Physical or virtual server permanently turned off or retired.',
    },
    {
      id: 'ASSET_REPLACED',
      label: 'Asset replaced',
      description: 'Hardware refreshed or migrated to a new compute instance.',
    },
    {
      id: 'CLOUD_RESOURCE_TERMINATED',
      label: 'Cloud resource terminated',
      description: 'Ephemeral instance, container, or cloud node terminated by orchestration.',
    },
    {
      id: 'DUPLICATE_RESOLVED',
      label: 'Duplicate resolved',
      description: 'Identity resolved and consolidated into an authoritative primary entity.',
    },
    {
      id: 'NO_LONGER_MANAGED',
      label: 'No longer managed',
      description: 'Removed from scope or handed off to external contractor/subsidiary.',
    },
    {
      id: 'OTHER',
      label: 'Other (requires explanation)',
      description: 'Specific administrative or architectural exception reason.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason === 'OTHER' && !customExplanation.trim()) {
      setError('Please provide an explanation when selecting "Other".');
      return;
    }

    const reasonText =
      selectedReason === 'OTHER'
        ? customExplanation.trim()
        : reasonOptions.find(r => r.id === selectedReason)?.label || selectedReason;

    onConfirmArchive(asset.underlyingAssetId, selectedReason, reasonText, analystNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#0B1017] border border-[#1B2838] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#F4F7FB] my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1B2838] bg-[#0E1520] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                Non-Destructive Lifecycle Action
              </span>
              <span className="text-xs font-mono text-[#5F6875]">·</span>
              <span className="text-xs font-mono text-[#718197]">{asset.underlyingAssetId}</span>
            </div>
            <h3 className="text-xl font-bold text-[#F4F7FB] flex items-center gap-2.5">
              <AssetSourceDiscoveryBadge sourceTools={sourceTools} size={20} />
              <span>Archive Asset — <span className="font-mono text-[#00B8FF]">{asset.canonicalHostname}</span></span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#718197] hover:text-[#F4F7FB] hover:bg-[#15202E] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#718197] block">Lifecycle Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                STALE
              </span>
            </div>

            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#718197] block">Last Seen</span>
              <span className="font-mono font-bold text-xs text-[#F4F7FB] block">
                {formatObservationDate(lastSeen)}
              </span>
            </div>

            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#718197] block">Inactive Period</span>
              <span className="font-mono font-bold text-xs text-amber-400 block">
                {formatAgeDescription(inactiveDays)}
              </span>
            </div>

            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#718197] block">Archive Threshold</span>
              <span className="font-mono font-bold text-xs text-[#00B8FF] block">
                {archiveThresholdDays} days
              </span>
            </div>
          </div>

          {/* Context Details */}
          <div className="p-3.5 bg-[#101924] rounded-xl border border-[#1B2838] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
              <span className="text-[#718197]">Source Coverage ({memberRecords.length} records):</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sourceTools.map(tool => (
                  <span key={tool} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#15202E] border border-[#1B2838] text-[#F4F7FB] font-semibold text-[10px]">
                    <SourceLogo sourceTool={tool} size={13} />
                    <span>{tool}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#718197]">Historical Security Findings:</span>
              <span className="font-mono font-bold text-[#C084FC]">{relatedFindings.length} findings preserved</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#718197]">Deterministic Identity Confidence:</span>
              <span className="font-mono font-bold text-emerald-400">{asset.confidence}% ({asset.correlationEvidence.length} signals)</span>
            </div>
          </div>

          {/* Non-Destructive Promise Banner */}
          <div className="p-3.5 bg-[#00B8FF]/10 border border-[#00B8FF]/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-xs text-[#00B8FF] block">
                Non-Destructive Archiving Guarantee
              </span>
              <p className="text-[11px] text-[#A8B7C9] leading-relaxed">
                Archiving removes this asset from the active inventory but preserves its identity, history, findings, and source evidence. If the asset is observed again, VulnFusion can <strong>automatically reactivate it</strong> without creating duplicate records.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#F4F7FB] block">
              Archive Reason <span className="text-rose-400">*</span>
            </label>

            <div className="space-y-2">
              {reasonOptions.map((option) => (
                <label
                  key={option.id}
                  onClick={() => {
                    setSelectedReason(option.id);
                    setError(null);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedReason === option.id
                      ? 'bg-[#152336] border-[#00B8FF] shadow-[0_0_12px_rgba(0,184,255,0.12)]'
                      : 'bg-[#101924] border-[#1B2838] hover:border-[#2A3F58]'
                  }`}
                >
                  <input
                    type="radio"
                    name="archiveReason"
                    value={option.id}
                    checked={selectedReason === option.id}
                    onChange={() => {
                      setSelectedReason(option.id);
                      setError(null);
                    }}
                    className="mt-0.5 text-[#00B8FF] focus:ring-0 bg-[#0B1017] border-[#2A3F58]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-[#F4F7FB] block">{option.label}</span>
                    <span className="text-[11px] text-[#718197] block">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional explanation for "OTHER" */}
          {selectedReason === 'OTHER' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-bold text-amber-400 block">
                Explanation for "Other" Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={customExplanation}
                onChange={(e) => {
                  setCustomExplanation(e.target.value);
                  setError(null);
                }}
                placeholder="Explain why this asset is being archived..."
                rows={2}
                className="w-full bg-[#101924] border border-[#1B2838] focus:border-[#00B8FF] rounded-xl p-2.5 text-xs text-[#F4F7FB] placeholder-[#5F6875] focus:outline-none"
              />
            </div>
          )}

          {/* Optional Analyst Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#718197] block">
              Additional Analyst Notes (Optional)
            </label>
            <input
              type="text"
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="e.g. Ticket REF-8891, approved by secops lead"
              className="w-full bg-[#101924] border border-[#1B2838] focus:border-[#00B8FF] rounded-xl px-3 py-2 text-xs text-[#F4F7FB] placeholder-[#5F6875] focus:outline-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B2838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#101924] hover:bg-[#15202E] text-[#718197] hover:text-[#F4F7FB] border border-[#1B2838] rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-900/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Asset</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
