import React, { useState, useMemo } from 'react';
import { FindingCorrelationGroup, VulnerabilityFinding, FindingSeverity, SourceTool } from '../types/vulnfusion';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Server,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Terminal,
  FileText,
  Sliders,
  X,
} from 'lucide-react';
import {
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  RiskExposureIcon,
  AssetIntelligenceIcon,
  SourceIntelligenceIcon,
} from './icons/VulnFusionIcons';
import { SourceLogo } from './SourceLogo';
import { FindingRelationshipGraph } from './FindingRelationshipGraph';

interface FindingCorrelationTabProps {
  findingGroups: FindingCorrelationGroup[];
  sourceFindings: VulnerabilityFinding[];
  externalSearchQuery?: string;
}

export const FindingCorrelationTab: React.FC<FindingCorrelationTabProps> = ({
  findingGroups,
  sourceFindings,
  externalSearchQuery = '',
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CORRELATED' | 'REVIEW_REQUIRED'>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');

  // Master-Detail Selected Group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return findingGroups[0]?.remediationIssueId || '';
  });

  // Selected / Hovered Source Finding inside Graph
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [hoveredFindingId, setHoveredFindingId] = useState<string | null>(null);

  const activeQuery = (externalSearchQuery || searchQuery).toLowerCase().trim();

  // Filtered Remediation Groups
  const filteredGroups = useMemo(() => {
    return findingGroups.filter((group) => {
      // Status Filter
      if (selectedStatusFilter !== 'ALL' && group.correlationStatus !== selectedStatusFilter) {
        return false;
      }

      // Severity Filter (based on max severity of member findings)
      if (selectedSeverityFilter !== 'ALL') {
        const groupSeverities = group.representativeFindings.map((f) => f.severity.toUpperCase());
        if (!groupSeverities.includes(selectedSeverityFilter.toUpperCase())) {
          return false;
        }
      }

      // Source Tool Filter
      if (selectedSourceFilter !== 'ALL') {
        const groupSources = group.representativeFindings.map((f) => f.sourceTool.toUpperCase());
        if (!groupSources.includes(selectedSourceFilter.toUpperCase())) {
          return false;
        }
      }

      // Search Query
      if (activeQuery) {
        const matchesRemedyId = group.remediationIssueId.toLowerCase().includes(activeQuery);
        const matchesVulnId = group.vulnerabilityId.toLowerCase().includes(activeQuery);
        const matchesTitle = group.title.toLowerCase().includes(activeQuery);
        const matchesSoftware = group.affectedSoftware.toLowerCase().includes(activeQuery);
        const matchesAsset = group.underlyingAssetGroupId.toLowerCase().includes(activeQuery);
        const matchesFindingIds = group.memberFindingIds.some((id) => id.toLowerCase().includes(activeQuery));
        const matchesSourceFindingIds = group.representativeFindings.some((f) =>
          f.sourceFindingId.toLowerCase().includes(activeQuery)
        );

        return (
          matchesRemedyId ||
          matchesVulnId ||
          matchesTitle ||
          matchesSoftware ||
          matchesAsset ||
          matchesFindingIds ||
          matchesSourceFindingIds
        );
      }

      return true;
    });
  }, [findingGroups, selectedStatusFilter, selectedSeverityFilter, selectedSourceFilter, activeQuery]);

  // Active Selected Group
  const currentSelectedGroup = useMemo(() => {
    return (
      filteredGroups.find((g) => g.remediationIssueId === selectedGroupId) ||
      filteredGroups[0] ||
      findingGroups[0]
    );
  }, [filteredGroups, selectedGroupId, findingGroups]);

  // Selected Source Finding Details (if any selected in detail pane)
  const currentSelectedFinding = useMemo(() => {
    if (!currentSelectedGroup) return null;
    if (selectedFindingId) {
      const found = currentSelectedGroup.representativeFindings.find((f) => f.findingId === selectedFindingId);
      if (found) return found;
    }
    return currentSelectedGroup.representativeFindings[0] || null;
  }, [currentSelectedGroup, selectedFindingId]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSources = sourceFindings.length;
    const totalIssues = findingGroups.length;
    const uniqueAssets = new Set(sourceFindings.map((f) => f.underlyingAssetGroupId)).size;
    const reviewCount = findingGroups.filter((g) => g.correlationStatus === 'REVIEW_REQUIRED').length;
    const correlatedCount = findingGroups.filter((g) => g.correlationStatus === 'CORRELATED').length;

    const criticalCount = sourceFindings.filter((f) => f.severity === 'CRITICAL').length;
    const highCount = sourceFindings.filter((f) => f.severity === 'HIGH').length;
    const mediumCount = sourceFindings.filter((f) => f.severity === 'MEDIUM').length;
    const lowCount = sourceFindings.filter((f) => f.severity === 'LOW').length;

    return {
      totalSources,
      totalIssues,
      uniqueAssets,
      reviewCount,
      correlatedCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    };
  }, [sourceFindings, findingGroups]);

  // Helper: Format Hostname from Asset Cluster ID
  const getAssetHostname = (clusterId: string) => {
    const mapping: Record<string, string> = {
      'CLUSTER-001': 'WEB-SRV-01',
      'CLUSTER-002': 'DB-SQL-02',
      'CLUSTER-003': 'APP-GW-03',
      'CLUSTER-004': 'VPN-CLIENT-99',
      'CLUSTER-005': 'SHARED-HOST-05',
      'CLUSTER-006': 'PRINTER-HQ-01',
      'CLUSTER-007': 'KUBERNETES-NODE-09',
      'CLUSTER-008': 'CACHE-REDIS-01',
      'CLUSTER-009': 'API-SRV-01',
      'CLUSTER-010': 'FILE-SRV-01',
      'CLUSTER-011': 'AD-SRV-01',
      'CLUSTER-012': 'AUTH-SRV-01',
      'CLUSTER-013': 'MONITOR-SRV-01',
      'CLUSTER-014': 'LOG-SRV-01',
      'CLUSTER-015': 'CI-RUNNER-01',
      'CLUSTER-016': 'K8S-NODE-01',
      'CLUSTER-017': 'CLOUD-DB-01',
      'CLUSTER-018': 'CLOUD-WORKER-01',
      'CLUSTER-019': 'BASTION-HOST-01',
      'CLUSTER-020': 'PAYMENT-GATEWAY-01',
    };
    return mapping[clusterId] || clusterId;
  };

  // Helper: Severity Badge Colors
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
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

  // Dynamic Executive Summary Generator
  const generateExecutiveSummary = (group: FindingCorrelationGroup) => {
    const assetName = getAssetHostname(group.underlyingAssetGroupId);
    const count = group.representativeFindings.length;
    const tools = Array.from(new Set(group.representativeFindings.map((f) => f.sourceTool))).join(', ');

    if (group.correlationStatus === 'REVIEW_REQUIRED') {
      const conflictMsg = group.conflictingAttributes[0]?.description || 'conflicting version or software evidence';
      return `${count} source findings from ${tools} may represent the same vulnerability on ${assetName} (${group.underlyingAssetGroupId}), but ${conflictMsg.toLowerCase()} requires security analyst review.`;
    }

    if (count > 1) {
      return `${count} source findings from ${tools} are deterministically correlated to underlying asset ${assetName} (${group.underlyingAssetGroupId}) with matching ${group.affectedSoftware} vulnerability evidence.`;
    }

    return `Single authoritative finding from ${tools} mapped to underlying asset ${assetName} (${group.underlyingAssetGroupId}) for ${group.vulnerabilityId}.`;
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER BANNER & SYNTHETIC DISCLAIMER                         */}
      {/* ========================================================================= */}
      <div className="bg-[#0B121C] border border-[#162231] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-violet-500/5 via-blue-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
              <FindingsIntelligenceIcon size={16} glow />
              <span>VULNFUSION FINDING CORRELATION & REMEDIATION MATRIX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F1F5F9] tracking-tight">
              Deterministic Vulnerability Finding Correlation
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Consolidating multi-scanner vulnerability findings from <strong>Qualys</strong>, <strong>Tenable</strong>, <strong>Rapid7</strong>, and <strong>Wiz</strong> into unified remediation action plans through deterministic underlying asset matching and software compatibility verification.
            </p>
            <div className="text-[11px] text-[#64748B] font-mono pt-1">
              Synthetic Telemetry Notice: Qualys, Tenable, Rapid7, and Wiz are synthetic source labels. No production scanner or client telemetry is used.
            </div>
          </div>

          {/* Key Ratio Counter Box */}
          <div className="bg-[#0E1724] border border-[#1E2D40] p-4 rounded-xl flex items-center gap-4 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] text-[#718197] font-mono uppercase block">Telemetry Feeds</span>
              <span className="text-2xl font-extrabold text-slate-100 font-mono">{metrics.totalSources}</span>
            </div>
            <div className="w-px h-10 bg-[#1F3147]" />
            <div className="text-center px-2">
              <span className="text-[10px] text-[#718197] font-mono uppercase block">Unified Remedies</span>
              <span className="text-2xl font-extrabold text-violet-400 font-mono">{metrics.totalIssues}</span>
            </div>
            <div className="w-px h-10 bg-[#1F3147]" />
            <div className="text-center px-2">
              <span className="text-[10px] text-[#718197] font-mono uppercase block">Assets Covered</span>
              <span className="text-2xl font-extrabold text-sky-400 font-mono">{metrics.uniqueAssets}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC SUMMARY METRICS CARDS (5-Grid)                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Ingested Findings */}
        <div className="bg-[#0C1420] border border-[#182637] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#718197] font-mono uppercase">
            <span>Source Findings</span>
            <RiskExposureIcon size={16} />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {metrics.totalSources}
          </div>
          <span className="text-[10px] text-[#5FA8D3] font-mono block">
            Across 4 Security Tools
          </span>
        </div>

        {/* Potential Remediation Issues */}
        <div className="bg-[#0C1420] border border-[#182637] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#718197] font-mono uppercase">
            <span>Remediation Plans</span>
            <FindingsIntelligenceIcon size={16} />
          </div>
          <div className="text-2xl font-extrabold text-violet-400 font-mono">
            {metrics.totalIssues}
          </div>
          <span className="text-[10px] text-violet-300 font-mono block">
            {metrics.correlatedCount} Deterministic
          </span>
        </div>

        {/* Underlying Assets */}
        <div className="bg-[#0C1420] border border-[#182637] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#718197] font-mono uppercase">
            <span>Assets Affected</span>
            <AssetIntelligenceIcon size={16} />
          </div>
          <div className="text-2xl font-extrabold text-sky-400 font-mono">
            {metrics.uniqueAssets}
          </div>
          <span className="text-[10px] text-[#718197] font-mono block">
            Normalized Asset Groups
          </span>
        </div>

        {/* Review Required Flag */}
        <div className="bg-[#0C1420] border border-[#182637] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400/90 font-mono uppercase">
            <span>Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {metrics.reviewCount}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono block">
            Ambiguous Telemetry
          </span>
        </div>

        {/* Severity Distribution */}
        <div className="bg-[#0C1420] border border-[#182637] rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-[#718197] font-mono uppercase">
            <span>Severity Matrix</span>
            <Layers className="w-4 h-4 text-[#8B95A5]" />
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {metrics.criticalCount} Crit
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {metrics.highCount} High
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {metrics.mediumCount} Med
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {metrics.lowCount} Low
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SEARCH & FILTER CONTROLS                                   */}
      {/* ========================================================================= */}
      <div className="bg-[#0A1017] border border-[#162231] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search CVE, Software, Asset, Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E1622] border border-[#1E2E42] rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-[#00B8FF]/60 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#64748B] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills Group */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          
          {/* Status Filter */}
          <div className="flex items-center bg-[#0E1622] p-1 rounded-xl border border-[#1E2E42] shrink-0">
            {(['ALL', 'CORRELATED', 'REVIEW_REQUIRED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                  selectedStatusFilter === status
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-[#8B95A5] hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'ALL' : status === 'CORRELATED' ? 'CORRELATED' : 'REVIEW'}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-[#0E1622] p-1 rounded-xl border border-[#1E2E42] shrink-0">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverityFilter(sev)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  selectedSeverityFilter === sev
                    ? 'bg-[#2563A6] text-white shadow-xs'
                    : 'text-[#718197] hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Source Tool Filter */}
          <div className="flex items-center bg-[#0E1622] p-1 rounded-xl border border-[#1E2E42] shrink-0">
            {(['ALL', 'Qualys', 'Tenable', 'Rapid7', 'Wiz'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedSourceFilter(src)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  selectedSourceFilter === src
                    ? 'bg-[#1E2F45] text-sky-300 border border-sky-500/40'
                    : 'text-[#718197] hover:text-slate-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MASTER-DETAIL WORKSPACE LAYOUT                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: MASTER LIST OF POTENTIAL REMEDIATION ISSUES (5 cols)       */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="flex items-center justify-between px-1 text-xs text-[#718197] font-mono">
            <span>Potential Remediation Issues ({filteredGroups.length})</span>
            <span>Sorted by Severity / Ingest</span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="bg-[#0B121C] border border-[#162231] rounded-2xl p-8 text-center space-y-3">
              <Info className="w-8 h-8 text-[#64748B] mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No remediation issues match current filters</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('ALL');
                  setSelectedSeverityFilter('ALL');
                  setSelectedSourceFilter('ALL');
                }}
                className="px-3 py-1.5 bg-[#142030] hover:bg-[#1C2C42] text-xs text-sky-300 rounded-lg font-mono"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredGroups.map((group) => {
                const isSelected = currentSelectedGroup?.remediationIssueId === group.remediationIssueId;
                const isReview = group.correlationStatus === 'REVIEW_REQUIRED';
                const assetHostname = getAssetHostname(group.underlyingAssetGroupId);
                const uniqueTools = Array.from(new Set(group.representativeFindings.map((f) => f.sourceTool)));
                const highestSev = group.representativeFindings[0]?.severity || 'MEDIUM';

                return (
                  <div
                    key={group.remediationIssueId}
                    onClick={() => {
                      setSelectedGroupId(group.remediationIssueId);
                      setSelectedFindingId(null);
                    }}
                    className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#101F30] border-[#00B8FF] shadow-[0_0_16px_rgba(0,184,255,0.2)]'
                        : isReview
                        ? 'bg-[#0E141E] border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-[#0B121C] border-[#162231] hover:border-[#233549]'
                    }`}
                  >
                    {/* Top Row: Remedy ID, CVE, Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {group.remediationIssueId}
                        </span>
                        <span className="px-1.5 py-0.5 text-[11px] font-extrabold font-mono rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                          {group.vulnerabilityId}
                        </span>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold font-mono rounded border flex items-center gap-1 ${
                          isReview
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isReview ? 'REVIEW' : 'CORRELATED'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1 leading-tight mb-1.5">
                      {group.title}
                    </h4>

                    {/* Asset & Software details */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8B95A5] pt-1.5 border-t border-[#162231]/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-200 truncate">{assetHostname}</span>
                        <span className="text-[#64748B]">({group.underlyingAssetGroupId})</span>
                      </div>

                      {/* Source Icons & Count */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {uniqueTools.map((t) => (
                          <div key={t} className="w-4 h-4 rounded bg-[#070F18] border border-[#233549] flex items-center justify-center">
                            <SourceLogo sourceTool={t} size={10} />
                          </div>
                        ))}
                        <span className="text-[10px] text-violet-300 font-bold ml-1">
                          {group.representativeFindings.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: SELECTED REMEDIATION ISSUE RELATIONSHIP GRAPH (7 cols)    */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {currentSelectedGroup ? (
            <div className="space-y-5">
              
              {/* Executive Summary Card */}
              <div className="bg-[#0B131F] border border-[#1A283A] rounded-2xl p-5 space-y-3 shadow-md">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1A283A]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-lg border border-violet-500/30 font-mono">
                      {currentSelectedGroup.remediationIssueId}
                    </span>
                    <span className="text-xs font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                      {currentSelectedGroup.vulnerabilityId}
                    </span>
                    <span className="text-xs text-[#8B95A5] font-mono">
                      Target: <strong className="text-slate-200">{getAssetHostname(currentSelectedGroup.underlyingAssetGroupId)}</strong> ({currentSelectedGroup.underlyingAssetGroupId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center gap-1.5 ${
                      currentSelectedGroup.correlationStatus === 'CORRELATED'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {currentSelectedGroup.correlationStatus === 'CORRELATED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{currentSelectedGroup.correlationStatus}</span>
                    </span>
                  </div>
                </div>

                {/* Executive Statement */}
                <div className="flex items-start gap-3 bg-[#080E17] border border-[#162231] p-3.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-[#5FA8D3] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-200 block">
                      Deterministic Correlation Hypothesis
                    </span>
                    <p className="text-[#A8B7C9] leading-relaxed">
                      {generateExecutiveSummary(currentSelectedGroup)}
                    </p>
                  </div>
                </div>

                {/* Software and Version Match Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#09101A] p-3 rounded-xl border border-[#152232] font-mono">
                  <div>
                    <span className="text-[#64748B] text-[10px] block uppercase">Software</span>
                    <span className="text-slate-100 font-bold truncate block">{currentSelectedGroup.affectedSoftware}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] block uppercase">Version Match</span>
                    <span className="text-slate-200 font-medium truncate block">{currentSelectedGroup.affectedVersion || 'Compatible Range'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] block uppercase">Confidence</span>
                    <span className={`font-bold ${currentSelectedGroup.correlationStatus === 'REVIEW_REQUIRED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {currentSelectedGroup.confidence}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] block uppercase">Matched Feeds</span>
                    <span className="text-violet-300 font-bold">{currentSelectedGroup.memberFindingIds.length} Sources</span>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* PREMIUM SVG RELATIONSHIP GRAPH VISUALIZATION                         */}
              {/* =================================================================== */}
              <FindingRelationshipGraph
                group={currentSelectedGroup}
                selectedFindingId={selectedFindingId}
                onSelectFinding={(id) => setSelectedFindingId(id)}
                hoveredFindingId={hoveredFindingId}
                onHoverFinding={(id) => setHoveredFindingId(id)}
                assetHostname={getAssetHostname(currentSelectedGroup.underlyingAssetGroupId)}
              />

              {/* =================================================================== */}
              {/* SOURCE FINDING EVIDENCE & TELEMETRY INSPECTOR (When Node is Active)  */}
              {/* =================================================================== */}
              {currentSelectedFinding && (
                <div className="bg-[#0A111C] border border-[#1B2D42] rounded-2xl p-5 space-y-3.5 shadow-sm animate-fadeIn">
                  
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1A283A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#070F18] border border-[#233549] flex items-center justify-center">
                        <SourceLogo sourceTool={currentSelectedFinding.sourceTool} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 font-mono">
                            {currentSelectedFinding.sourceFindingId}
                          </span>
                          <span className="text-[10px] text-[#718197] font-mono">
                            ({currentSelectedFinding.findingId})
                          </span>
                        </div>
                        <span className="text-[11px] text-[#5FA8D3] font-mono block">
                          {currentSelectedFinding.sourceTool} Ingest Feed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getSeverityBadgeClass(currentSelectedFinding.severity)}`}>
                        {currentSelectedFinding.severity} (CVSS {currentSelectedFinding.cvss})
                      </span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#080E17] p-3 rounded-xl border border-[#162231] font-mono">
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase">Observation Method</span>
                      <span className="text-slate-200 capitalize font-medium">{currentSelectedFinding.observationMethod.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase">Asset Record ID</span>
                      <span className="text-sky-300 font-semibold">{currentSelectedFinding.assetRecordId}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase">First Observed</span>
                      <span className="text-slate-300">{currentSelectedFinding.firstObserved ? new Date(currentSelectedFinding.firstObserved).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] block uppercase">Last Observed</span>
                      <span className="text-slate-300">{currentSelectedFinding.lastObserved ? new Date(currentSelectedFinding.lastObserved).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Raw Evidence Snippet */}
                  {currentSelectedFinding.evidenceSnippet && (
                    <div className="bg-[#070D14] border border-[#15202D] p-3.5 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#718197] font-bold">
                        <Terminal className="w-3.5 h-3.5 text-[#5FA8D3]" />
                        <span>Scanner Raw Telemetry Snippet</span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 bg-[#04080D] p-2.5 rounded-lg border border-[#121B27] leading-relaxed">
                        {currentSelectedFinding.evidenceSnippet}
                      </p>
                    </div>
                  )}

                  {/* Correlation Signals Supporting this finding */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">
                      Deterministic Signals & Conflicts
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSelectedGroup.correlationEvidence.map((sig) => (
                        <span key={sig.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{sig.name}</span>
                        </span>
                      ))}
                      {currentSelectedGroup.conflictingAttributes.map((conf) => (
                        <span key={conf.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>{conf.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* =================================================================== */}
              {/* CROSS-SOURCE TELEMETRY COMPARISON TABLE MATRIX                      */}
              {/* =================================================================== */}
              <div className="bg-[#0A1017] border border-[#162231] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#162231]">
                  <span className="font-bold text-slate-200">
                    Cross-Scanner Telemetry Comparison Matrix ({currentSelectedGroup.representativeFindings.length} Feeds)
                  </span>
                  <span className="text-[11px] text-[#718197] font-mono">
                    Deterministic Resolution
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#162231] text-[#64748B] text-[10px] uppercase">
                        <th className="pb-2 font-bold">Source Tool</th>
                        <th className="pb-2 font-bold">Source ID</th>
                        <th className="pb-2 font-bold">Method</th>
                        <th className="pb-2 font-bold">Software / Version</th>
                        <th className="pb-2 font-bold">Severity</th>
                        <th className="pb-2 font-bold">Last Observed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#131E2B]">
                      {currentSelectedGroup.representativeFindings.map((finding) => (
                        <tr
                          key={finding.findingId}
                          onClick={() => setSelectedFindingId(finding.findingId)}
                          className={`hover:bg-[#0E1724] cursor-pointer transition ${
                            selectedFindingId === finding.findingId ? 'bg-[#101F30]' : ''
                          }`}
                        >
                          <td className="py-2.5 flex items-center gap-2">
                            <SourceLogo sourceTool={finding.sourceTool} size={14} />
                            <span className="text-slate-200 font-bold">{finding.sourceTool}</span>
                          </td>
                          <td className="py-2.5 text-sky-300 font-semibold">{finding.sourceFindingId}</td>
                          <td className="py-2.5 text-[#8B95A5] capitalize">{finding.observationMethod.replace('_', ' ')}</td>
                          <td className="py-2.5 text-slate-300">
                            {finding.affectedSoftware} {finding.affectedVersion || '—'}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getSeverityBadgeClass(finding.severity)}`}>
                              {finding.severity}
                            </span>
                          </td>
                          <td className="py-2.5 text-[#718197]">
                            {finding.lastObserved ? new Date(finding.lastObserved).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#0B121C] border border-[#162231] rounded-2xl p-12 text-center text-[#64748B]">
              Select a remediation issue from the left list to view relationship graph.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
