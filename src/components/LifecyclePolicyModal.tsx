import React, { useState } from 'react';
import { LifecyclePolicyConfig } from '../types/vulnfusion';
import { Settings, Clock, ShieldCheck, X, Check, Sliders, AlertTriangle } from 'lucide-react';
import { AssetLifecycleIcon } from './icons/VulnFusionIcons';

interface LifecyclePolicyModalProps {
  policy: LifecyclePolicyConfig;
  isOpen: boolean;
  onClose: () => void;
  onSavePolicy: (newPolicy: LifecyclePolicyConfig) => void;
}

export const LifecyclePolicyModal: React.FC<LifecyclePolicyModalProps> = ({
  policy,
  isOpen,
  onClose,
  onSavePolicy,
}) => {
  const [activeDays, setActiveDays] = useState(policy.activeThresholdDays);
  const [agingDays, setAgingDays] = useState(policy.agingThresholdDays);
  const [staleDays, setStaleDays] = useState(policy.staleThresholdDays);
  const [archiveEligibleDays, setArchiveEligibleDays] = useState(policy.archiveEligibleThresholdDays);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePolicy({
      activeThresholdDays: Number(activeDays),
      agingThresholdDays: Number(agingDays),
      staleThresholdDays: Number(staleDays),
      archiveEligibleThresholdDays: Number(archiveEligibleDays),
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setActiveDays(14);
    setAgingDays(30);
    setStaleDays(60);
    setArchiveEligibleDays(90);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#0B1017] border border-[#1B2838] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-[#F4F7FB] my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1B2838] bg-[#0E1520]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00B8FF]/15 text-[#00B8FF] border border-[#00B8FF]/30 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Policy Configuration
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#F4F7FB]">
              Configurable Lifecycle & Archive Thresholds
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs">
          
          <p className="text-[#A8B7C9] text-xs leading-relaxed">
            Customize the non-destructive age thresholds across the platform. Stale assets crossing the archive threshold will be flagged as <strong>Archive Eligible</strong> for human review without automated deletion.
          </p>

          <div className="space-y-4">
            
            {/* Active Threshold */}
            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-emerald-400 block">Active Status Window</span>
                  <span className="text-[11px] text-[#718197]">Observed within</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={activeDays}
                    onChange={(e) => setActiveDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-[#0B1017] border border-[#1B2838] rounded-lg px-2 py-1 text-center font-bold text-[#F4F7FB] focus:border-[#00B8FF] focus:outline-none"
                  />
                  <span className="text-[#718197]">days</span>
                </div>
              </div>
            </div>

            {/* Aging Threshold */}
            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-amber-400 block">Aging Status Window</span>
                  <span className="text-[11px] text-[#718197]">Observed within</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <input
                    type="number"
                    min={activeDays + 1}
                    max={120}
                    value={agingDays}
                    onChange={(e) => setAgingDays(Math.max(activeDays + 1, parseInt(e.target.value) || 30))}
                    className="w-16 bg-[#0B1017] border border-[#1B2838] rounded-lg px-2 py-1 text-center font-bold text-[#F4F7FB] focus:border-[#00B8FF] focus:outline-none"
                  />
                  <span className="text-[#718197]">days</span>
                </div>
              </div>
            </div>

            {/* Stale Threshold */}
            <div className="p-3 bg-[#101924] rounded-xl border border-[#1B2838] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-rose-400 block">Stale Threshold</span>
                  <span className="text-[11px] text-[#718197]">Inactive beyond</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <input
                    type="number"
                    min={agingDays + 1}
                    max={180}
                    value={staleDays}
                    onChange={(e) => setStaleDays(Math.max(agingDays + 1, parseInt(e.target.value) || 60))}
                    className="w-16 bg-[#0B1017] border border-[#1B2838] rounded-lg px-2 py-1 text-center font-bold text-[#F4F7FB] focus:border-[#00B8FF] focus:outline-none"
                  />
                  <span className="text-[#718197]">days</span>
                </div>
              </div>
            </div>

            {/* Archive Eligible Threshold */}
            <div className="p-3 bg-[#152336] rounded-xl border border-[#00B8FF]/40 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#00B8FF] block">Archive Eligibility Threshold</span>
                  <span className="text-[11px] text-[#A8B7C9]">Flags candidate assets for review</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <input
                    type="number"
                    min={staleDays}
                    max={365}
                    value={archiveEligibleDays}
                    onChange={(e) => setArchiveEligibleDays(Math.max(staleDays, parseInt(e.target.value) || 90))}
                    className="w-16 bg-[#0B1017] border border-[#00B8FF] rounded-lg px-2 py-1 text-center font-bold text-[#00B8FF] focus:outline-none"
                  />
                  <span className="text-[#A8B7C9]">days</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1B2838]">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[#718197] hover:text-[#00B8FF] text-xs font-medium underline transition"
            >
              Reset Defaults (90d)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-[#101924] hover:bg-[#15202E] text-[#718197] hover:text-[#F4F7FB] border border-[#1B2838] rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-[#00B8FF] hover:bg-[#0098DF] text-black font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Apply Policy
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
