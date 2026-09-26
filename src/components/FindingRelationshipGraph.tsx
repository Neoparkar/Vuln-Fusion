import React, { useState } from 'react';
import { FindingCorrelationGroup, VulnerabilityFinding } from '../types/vulnfusion';
import { SourceLogo } from './SourceLogo';
import {
  AssetIntelligenceIcon,
  FindingsIntelligenceIcon,
  RiskExposureIcon,
  DeterministicEvidenceIcon,
} from './icons/VulnFusionIcons';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FindingRelationshipGraphProps {
  group: FindingCorrelationGroup;
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  hoveredFindingId: string | null;
  onHoverFinding: (findingId: string | null) => void;
  assetHostname?: string;
}

export const FindingRelationshipGraph: React.FC<FindingRelationshipGraphProps> = ({
  group,
  selectedFindingId,
  onSelectFinding,
  hoveredFindingId,
  onHoverFinding,
  assetHostname = 'WEB-SRV-01',
}) => {
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
  const activeHover = hoveredFindingId || internalHoveredId;

  const findings = group.representativeFindings;
  const isReviewRequired = group.correlationStatus === 'REVIEW_REQUIRED';

  // Layout parameters
  const nodeHeight = 84;
  const nodeGap = 16;
  const totalSources = Math.max(findings.length, 1);
  const containerHeight = Math.max(340, totalSources * (nodeHeight + nodeGap) + 40);

  // Center Y for Asset & Remedy nodes
  const assetCenterY = containerHeight / 2;
  const remedyCenterY = containerHeight / 2;

  // Source Tool Colors
  const getToolColor = (tool: string) => {
    switch (tool) {
      case 'Rapid7':
        return {
          stroke: '#EA580C',
          glow: 'rgba(234, 88, 12, 0.4)',
          bg: 'rgba(234, 88, 12, 0.1)',
          border: 'border-orange-500/40',
        };
      case 'Tenable':
        return {
          stroke: '#0284C7',
          glow: 'rgba(2, 132, 199, 0.4)',
          bg: 'rgba(2, 132, 199, 0.1)',
          border: 'border-sky-500/40',
        };
      case 'Qualys':
        return {
          stroke: '#ED1C24',
          glow: 'rgba(237, 28, 36, 0.4)',
          bg: 'rgba(237, 28, 36, 0.1)',
          border: 'border-red-500/40',
        };
      case 'Wiz':
        return {
          stroke: '#0075FF',
          glow: 'rgba(0, 117, 255, 0.4)',
          bg: 'rgba(0, 117, 255, 0.1)',
          border: 'border-blue-500/40',
        };
      default:
        return {
          stroke: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.4)',
          bg: 'rgba(139, 92, 246, 0.1)',
          border: 'border-violet-500/40',
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="bg-[#090F17] border border-[#162231] rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-inner select-none">
      
      {/* Visual Header / Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#162231]/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Layers className="w-4 h-4 text-[#5FA8D3]" />
          <span>Security Evidence Relationship Graph</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#718197] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#5FA8D3] rounded-full inline-block" />
            <span>Deterministic Link</span>
          </div>
          {isReviewRequired && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-0.5 border-t border-dashed border-amber-400 inline-block" />
              <span>Review Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden md:grid grid-cols-12 gap-4 text-[11px] font-mono uppercase tracking-wider text-[#64748B] px-2">
        <div className="col-span-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
          <span>Level 1: Source Findings ({findings.length})</span>
        </div>
        <div className="col-span-4 text-center flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400/80" />
          <span>Level 2: Underlying Asset</span>
        </div>
        <div className="col-span-4 text-right flex items-center justify-end gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400/80" />
          <span>Level 3: Remediation Issue</span>
        </div>
      </div>

      {/* Main Relationship Canvas Container */}
      <div
        className="relative w-full overflow-x-auto min-w-[700px] md:min-w-0"
        style={{ minHeight: `${containerHeight}px` }}
      >
        {/* SVG Bezier Curves Overlay Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ width: '100%', height: `${containerHeight}px` }}
          viewBox={`0 0 1000 ${containerHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="curve-gradient-asset-remedy" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563A6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
            </linearGradient>

            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Curves: Source Findings (Left: X=320) -> Asset Node (Center: X=450) */}
          {findings.map((f, idx) => {
            const sourceCenterY = 20 + idx * (nodeHeight + nodeGap) + nodeHeight / 2;
            const x1 = 320; // right of source card (relative % in 1000 coordinate space)
            const y1 = sourceCenterY;
            const x2 = 450; // left of asset card
            const y2 = assetCenterY;
            const dx = x2 - x1;

            const isHighlighted = activeHover === f.findingId || selectedFindingId === f.findingId;
            const isMuted = activeHover !== null && !isHighlighted;
            const toolColor = getToolColor(f.sourceTool);

            const pathD = `M ${x1} ${y1} C ${x1 + dx * 0.55} ${y1}, ${x2 - dx * 0.55} ${y2}, ${x2} ${y2}`;

            return (
              <g key={`curve-source-${f.findingId}`}>
                {/* Background Shadow / Glow Path when active */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isReviewRequired ? '#F59E0B' : toolColor.stroke}
                    strokeWidth={5}
                    strokeOpacity={0.4}
                    filter="url(#glow-filter)"
                  />
                )}

                {/* Primary Connection Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isReviewRequired ? '#F59E0B' : toolColor.stroke}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeOpacity={isHighlighted ? 1 : isMuted ? 0.15 : 0.65}
                  strokeDasharray={isReviewRequired ? '5 5' : 'none'}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />

                {/* Endpoint Anchor Dot on Source Node */}
                <circle
                  cx={x1}
                  cy={y1}
                  r={isHighlighted ? 4 : 3}
                  fill={isReviewRequired ? '#F59E0B' : toolColor.stroke}
                  fillOpacity={isHighlighted ? 1 : isMuted ? 0.3 : 0.8}
                />
              </g>
            );
          })}

          {/* 2. Curve: Asset Node (Center: X=580) -> Remediation Issue Node (Right: X=700) */}
          {(() => {
            const x1 = 570;
            const y1 = assetCenterY;
            const x2 = 690;
            const y2 = remedyCenterY;
            const dx = x2 - x1;

            const isAnyHighlighted = activeHover !== null || selectedFindingId !== null;
            const pathD = `M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;

            return (
              <g key="curve-asset-remedy">
                <path
                  d={pathD}
                  fill="none"
                  stroke={isReviewRequired ? '#F59E0B' : 'url(#curve-gradient-asset-remedy)'}
                  strokeWidth={isAnyHighlighted ? 3 : 2}
                  strokeOpacity={isReviewRequired ? 0.9 : 0.8}
                  strokeDasharray={isReviewRequired ? '5 5' : 'none'}
                  strokeLinecap="round"
                  filter={isAnyHighlighted ? 'url(#glow-filter)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Anchor Dots */}
                <circle
                  cx={x1}
                  cy={y1}
                  r={4}
                  fill={isReviewRequired ? '#F59E0B' : '#2563A6'}
                />
                <circle
                  cx={x2}
                  cy={y2}
                  r={5}
                  fill={isReviewRequired ? '#F59E0B' : '#8B5CF6'}
                />
              </g>
            );
          })()}
        </svg>

        {/* 3-Column HTML/React Interactive Nodes Grid */}
        <div className="grid grid-cols-12 gap-6 relative z-20 h-full items-center">
          
          {/* ========================================================================= */}
          {/* LEVEL 1: SOURCE FINDINGS COLUMN (Left 4 cols)                             */}
          {/* ========================================================================= */}
          <div className="col-span-4 space-y-4">
            {findings.map((finding) => {
              const isSelected = selectedFindingId === finding.findingId;
              const isHovered = activeHover === finding.findingId;
              const isMuted = activeHover !== null && !isHovered;
              const toolColor = getToolColor(finding.sourceTool);

              return (
                <div
                  key={finding.findingId}
                  onClick={() => onSelectFinding(finding.findingId)}
                  onMouseEnter={() => {
                    setInternalHoveredId(finding.findingId);
                    onHoverFinding(finding.findingId);
                  }}
                  onMouseLeave={() => {
                    setInternalHoveredId(null);
                    onHoverFinding(null);
                  }}
                  className={`relative p-3 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#101F30] border-[#00B8FF] shadow-[0_0_18px_rgba(0,184,255,0.25)] scale-[1.02]'
                      : isHovered
                      ? 'bg-[#0E1A29] border-slate-300 shadow-[0_0_14px_rgba(255,255,255,0.15)] scale-[1.01]'
                      : isMuted
                      ? 'bg-[#0A121C]/60 border-[#1B2838]/60 opacity-40'
                      : 'bg-[#0C1522] border-[#1B2D42] hover:border-slate-400'
                  }`}
                  style={{ minHeight: `${nodeHeight}px` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#070F18] border border-[#233549] flex items-center justify-center shrink-0">
                        <SourceLogo sourceTool={finding.sourceTool} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-100 font-mono truncate">
                            {finding.sourceFindingId}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#718197] font-mono block truncate">
                          {finding.sourceTool} • {finding.findingId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
                  </div>

                  {/* Method & Software row */}
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#8B95A5] pt-1.5 border-t border-[#162231]">
                    <span className="truncate">
                      {finding.affectedSoftware} {finding.affectedVersion || ''}
                    </span>
                    <span className="text-[#5FA8D3] shrink-0 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                      {finding.observationMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 2: UNDERLYING ASSET COLUMN (Center 4 cols)                          */}
          {/* ========================================================================= */}
          <div className="col-span-4 flex justify-center">
            <div
              className={`w-full max-w-[240px] p-4 rounded-2xl border text-center transition-all duration-200 relative ${
                activeHover !== null
                  ? 'bg-[#0E1A29] border-[#2563A6] shadow-[0_0_24px_rgba(37,99,166,0.3)]'
                  : 'bg-[#0B1522] border-[#1E334D] shadow-md'
              }`}
            >
              {/* Asset Badge Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#08111C] border border-[#2563A6]/40 flex items-center justify-center mx-auto text-[#00B8FF] shadow-sm mb-2.5">
                <AssetIntelligenceIcon size={22} glow={Boolean(activeHover)} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#718197] font-bold block">
                  Underlying Asset Target
                </span>
                <h4 className="text-sm font-extrabold text-slate-100 tracking-tight truncate">
                  {assetHostname}
                </h4>
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 rounded-md border border-sky-500/20">
                  {group.underlyingAssetGroupId}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1B2F45] flex items-center justify-between text-[11px] font-mono text-[#8B95A5]">
                <span>Sources Ingested:</span>
                <strong className="text-slate-200 font-bold">{findings.length} Source Feeds</strong>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 3: POTENTIAL REMEDIATION ISSUE (Right 4 cols)                       */}
          {/* ========================================================================= */}
          <div className="col-span-4 flex justify-end">
            <div
              className={`w-full max-w-[260px] p-4 rounded-2xl border transition-all duration-200 relative text-left ${
                isReviewRequired
                  ? 'bg-[#18140B] border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                  : 'bg-[#101426] border-violet-500/40 shadow-[0_0_24px_rgba(139,92,246,0.2)]'
              }`}
            >
              {/* Header with Remedy ID & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {group.remediationIssueId}
                </span>

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-md border flex items-center gap-1 ${
                    isReviewRequired
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isReviewRequired ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {isReviewRequired ? 'REVIEW' : 'CORRELATED'}
                </span>
              </div>

              {/* Title & Vulnerability ID */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                    {group.vulnerabilityId}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 mt-1">
                  {group.title}
                </h4>
              </div>

              {/* Resolution Metrics */}
              <div className="mt-3 pt-2.5 border-t border-[#23263E] space-y-1 text-[11px] font-mono text-[#A8B7C9]">
                <div className="flex items-center justify-between">
                  <span className="text-[#718197]">Confidence:</span>
                  <strong className={isReviewRequired ? 'text-amber-300' : 'text-emerald-400'}>
                    {group.confidence}% Deterministic
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#718197]">Unified Remedy:</span>
                  <strong className="text-slate-200">1 Action Plan</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
