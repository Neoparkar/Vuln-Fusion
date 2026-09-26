import React, { useState } from 'react';
import {
  EXECUTIVE_LOGO_OPTIONS,
  ExecutiveLogoId,
  ShieldVFusionLogo,
  DiamondSentinelLogo,
  ObsidianSovereignLogo,
  QuantumVFMonogramLogo,
  AegisHexPrismLogo,
  FusionKineticLogo,
} from './icons/ExecutiveLogoConcepts';
import { VulnFusionBrandIcon } from './icons/VulnFusionIcons';
import { Shield, Sparkles, Check, Eye, Palette, CheckCircle2, X } from 'lucide-react';

interface ExecutiveLogoShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoId: ExecutiveLogoId;
  onSelectLogo: (id: ExecutiveLogoId) => void;
}

export const ExecutiveLogoShowcaseModal: React.FC<ExecutiveLogoShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentLogoId,
  onSelectLogo,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<ExecutiveLogoId>(currentLogoId);
  const [contrastMode, setContrastMode] = useState<'dark' | 'slate' | 'navy'>('dark');

  if (!isOpen) return null;

  const getLogoComponent = (id: ExecutiveLogoId, size: number, glow = false) => {
    switch (id) {
      case 'shield-v-fusion':
        return <ShieldVFusionLogo size={size} glow={glow} />;
      case 'diamond-sentinel':
        return <DiamondSentinelLogo size={size} glow={glow} />;
      case 'obsidian-sovereign':
        return <ObsidianSovereignLogo size={size} glow={glow} />;
      case 'vf-monogram':
        return <QuantumVFMonogramLogo size={size} glow={glow} />;
      case 'aegis-hex':
        return <AegisHexPrismLogo size={size} glow={glow} />;
      case 'fusion-kinetic':
        return <FusionKineticLogo size={size} glow={glow} />;
      default:
        return <ShieldVFusionLogo size={size} glow={glow} />;
    }
  };

  const selectedMeta = EXECUTIVE_LOGO_OPTIONS.find((opt) => opt.id === selectedPreview) || EXECUTIVE_LOGO_OPTIONS[0];

  const getBgClass = () => {
    switch (contrastMode) {
      case 'slate':
        return 'bg-[#1E293B] border-[#334155]';
      case 'navy':
        return 'bg-[#0A192F] border-[#1E3A8A]';
      case 'dark':
      default:
        return 'bg-[#071019] border-[#1B3045]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0B1420] border border-[#1B3045] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B3045] bg-[#071019]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  VulnFusion Executive Brand Identity Studio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  C-Suite Concept Review
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review proposed executive brand marks. Click any concept to preview live across the platform.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Notice */}
          <div className="p-4 rounded-xl bg-[#081B2B] border border-cyan-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-cyan-200">
                  Official Primary Concept: Shield + V + Data Fusion
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Refined executive cybersecurity identity: deep navy, executive blue, silver-white integrated V chevron, and 4 subtle telemetry data nodes symbolizing multi-source intelligence correlation with zero neon excess.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-mono">Contrast:</span>
              <button
                onClick={() => setContrastMode('dark')}
                className={`px-2 py-1 text-xs rounded font-mono ${contrastMode === 'dark' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'}`}
              >
                Onyx
              </button>
              <button
                onClick={() => setContrastMode('navy')}
                className={`px-2 py-1 text-xs rounded font-mono ${contrastMode === 'navy' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'}`}
              >
                Navy
              </button>
              <button
                onClick={() => setContrastMode('slate')}
                className={`px-2 py-1 text-xs rounded font-mono ${contrastMode === 'slate' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'}`}
              >
                Slate
              </button>
            </div>
          </div>

          {/* Grid of Concept Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXECUTIVE_LOGO_OPTIONS.map((option, index) => {
              const isCurrent = currentLogoId === option.id;
              const isSelected = selectedPreview === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedPreview(option.id)}
                  className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#101F30] border-cyan-400 shadow-[0_0_20px_rgba(0,184,255,0.2)] ring-1 ring-cyan-400/50'
                      : 'bg-[#0B1522] border-[#1B3045] hover:border-slate-600 hover:bg-[#0E1A2B]'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#071019] text-cyan-400 border border-cyan-500/30">
                      CONCEPT #{index + 1}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Active in App
                      </span>
                    )}
                  </div>

                  {/* Visual Icon Display Box */}
                  <div
                    className={`w-full h-36 rounded-xl flex items-center justify-center transition-all ${getBgClass()} mb-4 relative overflow-hidden`}
                  >
                    <div className="transition-transform duration-200 group-hover:scale-110">
                      {getLogoComponent(option.id, 72, true)}
                    </div>
                  </div>

                  {/* Content & Details */}
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {option.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {option.tagline}
                    </p>

                    <div className="pt-2 border-t border-[#1B3045]/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-slate-500">Palette:</span>
                      <div className="flex items-center gap-1.5">
                        {option.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-black/50 shadow-xs"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-[#1B3045] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLogo(option.id);
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(0,184,255,0.3)]'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Active
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Apply & Confirm
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Spotlight Inspector for Selected Concept */}
          <div className="p-6 rounded-2xl bg-[#081320] border border-cyan-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1B3045] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  SPOTLIGHT INSPECTION
                </span>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  {selectedMeta.name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectLogo(selectedMeta.id)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,184,255,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Set As App Logo
                </button>
              </div>
            </div>

            {/* Scale Comparison Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Large Crest View */}
              <div className="p-4 rounded-xl bg-[#050C15] border border-[#1B3045] flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Executive Crest (100px)
                </span>
                <div className="py-2">
                  {getLogoComponent(selectedMeta.id, 96, true)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Splash Screen / Hero Header
                </span>
              </div>

              {/* Medium Header View */}
              <div className="p-4 rounded-xl bg-[#050C15] border border-[#1B3045] flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Header Card (44px)
                </span>
                <div className="py-7 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0B1522] border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,184,255,0.2)]">
                    {getLogoComponent(selectedMeta.id, 32, true)}
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm text-slate-100 block">VulnFusion</span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase">Asset Intelligence</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Top App Navigation Bar
                </span>
              </div>

              {/* Small Sidebar View */}
              <div className="p-4 rounded-xl bg-[#050C15] border border-[#1B3045] flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Sidebar Gutter (26px)
                </span>
                <div className="py-8 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-[#071019] border border-[#1B3045] flex items-center justify-center">
                    {getLogoComponent(selectedMeta.id, 24, true)}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Collapsed Sidebar Icon
                </span>
              </div>
            </div>

            {/* Description & Design Rationale */}
            <div className="p-4 rounded-xl bg-[#0B1522] border border-[#1B3045] text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-cyan-300">Design Rationale:</div>
              <p className="leading-relaxed text-slate-300">
                {selectedMeta.description}
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                <div>
                  <span className="font-mono text-slate-500">Style Category:</span>{' '}
                  <span className="text-slate-200">{selectedMeta.style}</span>
                </div>
                <div>
                  <span className="font-mono text-slate-500">Target Context:</span>{' '}
                  <span className="text-cyan-400">{selectedMeta.recommendedFor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1B3045] bg-[#071019] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Interactive Logo Design Lab active. You can switch or test any concept at any time.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onSelectLogo(selectedPreview);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,184,255,0.4)] transition-all cursor-pointer"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
