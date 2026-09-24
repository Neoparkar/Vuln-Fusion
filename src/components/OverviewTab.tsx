import React, { useState } from 'react';
import { UnderlyingAsset, AssetRecord, VulnerabilityFinding, FindingCorrelationGroup } from '../types/vulnfusion';
import {
  Network,
  Database,
  Bug,
  Sparkles,
  ArrowRight,
  Shield,
  Server,
  Activity,
  Cpu,
  BarChart3,
  Layers3,
  ChevronRight,
} from 'lucide-react';

interface OverviewTabProps {
  records: AssetRecord[];
  clusters: UnderlyingAsset[];
  findings: VulnerabilityFinding[];
  findingGroups: FindingCorrelationGroup[];
  onNavigateTab: (tab: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests') => void;
  onOpenAIAnalyst?: () => void;
  externalSearchQuery?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  records,
  clusters,
  findings,
  findingGroups,
  onNavigateTab,
  onOpenAIAnalyst,
  externalSearchQuery = '',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CORRELATED' | 'REVIEW' | 'SEPARATE' | 'FINDINGS'>('ALL');

  // Dynamic Engine Counts
  const correlatedCount = clusters.filter(c => c.correlationStatus === 'CORRELATED').length;
  const reviewCount = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const separateCount = clusters.filter(c => c.correlationStatus === 'SEPARATE').length;
  const potentialDuplicates = records.length - clusters.length;

  // Source Tool Dynamic Counts
  const qualysRecords = records.filter(r => r.sourceTool === 'Qualys');
  const tenableRecords = records.filter(r => r.sourceTool === 'Tenable');
  const rapid7Records = records.filter(r => r.sourceTool === 'Rapid7');
  const wizRecords = records.filter(r => r.sourceTool === 'Wiz');

  const getMethods = (sourceRecords: AssetRecord[]) => {
    return Array.from(new Set(sourceRecords.map(r => r.observationMethod)));
  };

  // Demo asset WEB-SRV-01 lookup
  const demoCluster = clusters.find(c => c.canonicalHostname === 'WEB-SRV-01') || clusters[0];
  const demoFindingGroup = findingGroups.find(fg => fg.underlyingAssetGroupId === demoCluster?.underlyingAssetId) || findingGroups[0];

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
      
      {/* 1. Page Header & Subtitle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-blue-400" /> Asset Intelligence Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Asset Intelligence
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-200 leading-snug">
            Find the assets hiding behind the records.
          </p>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            VulnFusion deterministically correlates security records into evidence-supported underlying asset hypotheses, then connects related vulnerability findings.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('correlation')}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
          >
            <span>Explore Asset Groups</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Status Filter Bar (Segmented Control) */}
      <div className="bg-[#10141A] border border-[#1A222D] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2.5 ${
              selectedFilter === 'ALL'
                ? 'bg-orange-500 text-slate-950 shadow-md font-bold'
                : 'text-[#94A3B8] hover:text-slate-100 hover:bg-[#151A21]'
            }`}
          >
            <span>All Records</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${selectedFilter === 'ALL' ? 'bg-slate-950/20 text-slate-950' : 'bg-[#181E26] text-slate-300'}`}>
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('CORRELATED')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2.5 ${
              selectedFilter === 'CORRELATED'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-slate-100 hover:bg-[#151A21]'
            }`}
          >
            <span>Correlated</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${selectedFilter === 'CORRELATED' ? 'bg-blue-900/50 text-blue-100' : 'bg-[#181E26] text-slate-300'}`}>
              {correlatedCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('REVIEW')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2.5 ${
              selectedFilter === 'REVIEW'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[#94A3B8] hover:text-slate-100 hover:bg-[#151A21]'
            }`}
          >
            <span>Review Required</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${selectedFilter === 'REVIEW' ? 'bg-amber-950/20 text-slate-950' : 'bg-[#181E26] text-amber-400'}`}>
              {reviewCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('SEPARATE')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2.5 ${
              selectedFilter === 'SEPARATE'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-slate-100 hover:bg-[#151A21]'
            }`}
          >
            <span>Separate</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${selectedFilter === 'SEPARATE' ? 'bg-slate-900/50 text-slate-200' : 'bg-[#181E26] text-slate-300'}`}>
              {separateCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('FINDINGS')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2.5 ${
              selectedFilter === 'FINDINGS'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-slate-100 hover:bg-[#151A21]'
            }`}
          >
            <span>Findings</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${selectedFilter === 'FINDINGS' ? 'bg-violet-900/50 text-violet-100' : 'bg-[#181E26] text-violet-300'}`}>
              {findings.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-[#64748B] px-2 font-medium hidden md:block">
          * Dynamic Correlation Status (Not Security Severity Categories)
        </div>
      </div>

      {/* 3. Top Metric Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Source Records */}
        <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-[#26303E] transition shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-sm font-semibold tracking-wide">Source Records</span>
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-sans text-slate-100">{records.length}</div>
          <p className="text-sm text-[#94A3B8]">Synthetic source records ingested</p>
          <div className="pt-3 border-t border-[#1A222D] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>3 Scanning Tools</span>
            <span className="text-cyan-400 font-semibold">100% Ingested</span>
          </div>
        </div>

        {/* Card 2: Underlying Assets */}
        <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-[#26303E] transition shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-sm font-semibold tracking-wide">Underlying Assets</span>
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-sans text-blue-400">{clusters.length}</div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {correlatedCount} of {clusters.length} correlated
            </span>
          </div>
          <p className="text-sm text-[#94A3B8]">Correlated asset groups ({correlatedCount} of {clusters.length} correlated)</p>
          <div className="pt-3 border-t border-[#1A222D] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>Ratio: {(records.length / clusters.length).toFixed(1)}:1</span>
            <span className="text-emerald-400 font-semibold">{correlatedCount} of {clusters.length} correlated</span>
          </div>
        </div>

        {/* Card 3: Potential Remediation Issues */}
        <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-[#26303E] transition shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-sm font-semibold tracking-wide">Remediation Issues</span>
            <Bug className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-sans text-violet-400">{findingGroups.length}</div>
          <p className="text-sm text-[#94A3B8]">Finding correlation output</p>
          <div className="pt-3 border-t border-[#1A222D] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>From {findings.length} findings</span>
            <span className="text-violet-300 font-semibold">Unified</span>
          </div>
        </div>

        {/* Card 4: Recent Correlation Activity / Engine Activity */}
        <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-[#26303E] transition shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="text-sm font-semibold tracking-wide">Engine Activity</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-sans text-emerald-400">100%</div>
            <p className="text-sm text-[#94A3B8]">Deterministic confidence score</p>
          </div>
          <div className="pt-3 border-t border-[#1A222D] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span>Active Exceptions: 0</span>
            <span className="text-emerald-400 font-semibold">Engine Stable</span>
          </div>
        </div>

      </div>

      {/* 4. Main Section: Operational Impact + Featured Asset Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Operational Impact Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" /> Operational Impact Analysis
              </span>
              <span className="text-xs text-[#64748B] font-medium">Engine Consolidation</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">Reduction of Inventory Noise</h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Multiple security tools repeatedly report identical physical hosts through varying observation channels. VulnFusion condenses noise into canonical assets.
            </p>
          </div>

          {/* Consolidation Flow Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-1">
              <span className="text-xs text-[#64748B] font-medium block">Stage 1</span>
              <div className="text-2xl font-bold text-slate-100">{records.length}</div>
              <span className="text-sm text-[#94A3B8] font-medium block">Source Records</span>
            </div>

            <div className="bg-[#151A21] border border-blue-500/30 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400 font-semibold block">Stage 2</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {correlatedCount} of {clusters.length} correlated
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{clusters.length}</div>
              <span className="text-sm text-[#94A3B8] font-medium block">Underlying Assets</span>
            </div>

            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-1">
              <span className="text-xs text-[#64748B] font-medium block">Stage 3</span>
              <div className="text-2xl font-bold text-slate-100">{findings.length}</div>
              <span className="text-sm text-[#94A3B8] font-medium block">Findings</span>
            </div>

            <div className="bg-[#151A21] border border-violet-500/30 rounded-xl p-4 space-y-1">
              <span className="text-xs text-violet-400 font-semibold block">Stage 4</span>
              <div className="text-2xl font-bold text-violet-400">{findingGroups.length}</div>
              <span className="text-sm text-[#94A3B8] font-medium block">Remediation Issues</span>
            </div>
          </div>

          {/* Potential Duplicate Representations */}
          <div className="p-4 sm:p-5 bg-[#151A21] border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-amber-400 font-bold text-sm sm:text-base block">Potential Duplicate Representations</span>
              <span className="text-xs sm:text-sm text-[#94A3B8]">Raw scanner record overlaps safely unified into hypotheses</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 shrink-0 ml-4">+{potentialDuplicates}</div>
          </div>

          <div className="text-xs text-[#64748B] font-medium border-t border-[#1A222D] pt-3">
            Calculated from the synthetic demonstration dataset.
          </div>
        </div>

        {/* Featured Asset Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A222D] pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  Featured Asset
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                {demoCluster?.correlationStatus}
              </span>
            </div>

            {/* Asset Header Details */}
            <div className="p-4 bg-[#151A21] border border-[#1E2631] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-100 font-bold text-2xl block">{demoCluster?.canonicalHostname}</span>
                <span className="text-[#94A3B8] text-sm font-medium">{demoCluster?.underlyingAssetId} · Web Server</span>
              </div>
              <span className="text-sm text-emerald-400 font-bold">
                {Math.round((demoCluster?.confidence || 0) * 100)}% Confidence
              </span>
            </div>

            {/* 4 Source Records Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide block">
                4 Source Tool Records Represented:
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-sm">
                <div className="p-3 bg-[#151A21] border border-[#1E2631] rounded-xl">
                  <span className="text-blue-400 font-semibold text-sm block">Qualys Agent</span>
                  <span className="text-xs text-[#64748B]">Host Record #1</span>
                </div>
                <div className="p-3 bg-[#151A21] border border-[#1E2631] rounded-xl">
                  <span className="text-blue-400 font-semibold text-sm block">Qualys Discovery</span>
                  <span className="text-xs text-[#64748B]">Scan Record #2</span>
                </div>
                <div className="p-3 bg-[#151A21] border border-[#1E2631] rounded-xl">
                  <span className="text-emerald-400 font-semibold text-sm block">Tenable Credentialed</span>
                  <span className="text-xs text-[#64748B]">Scan Record #3</span>
                </div>
                <div className="p-3 bg-[#151A21] border border-[#1E2631] rounded-xl">
                  <span className="text-rose-400 font-semibold text-sm block">Rapid7 Agent</span>
                  <span className="text-xs text-[#64748B]">Agent Record #4</span>
                </div>
              </div>
            </div>

            {/* Asset Group & Remediation Issue Mapping */}
            <div className="p-4 bg-[#151A21] border border-violet-500/20 rounded-xl space-y-1.5 text-sm">
              <div className="flex justify-between items-center text-violet-300 font-bold">
                <span>Asset Group: {demoCluster?.underlyingAssetId}</span>
                <span className="text-xs bg-violet-500/10 px-2.5 py-1 rounded border border-violet-500/20 font-semibold">
                  {demoFindingGroup?.remediationIssueId}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Unified Remediation Issue: OpenSSL Vulnerability Cluster
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('correlation')}
            className="w-full py-3 bg-[#181E26] hover:bg-[#1E2631] text-slate-200 border border-[#26303E] rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm mt-2"
          >
            <span>View Asset in Correlation Workspace</span>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>
        </div>

      </div>

      {/* 5. Source Intelligence + Finding Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Source Intelligence (6 Cols) */}
        <div className="lg:col-span-6 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A222D] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Source Intelligence
              </h2>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-semibold">
              SYNTHETIC SOURCE LABELS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Qualys */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-base">QUALYS</span>
                <span className="text-2xl text-cyan-400 font-extrabold">{qualysRecords.length}</span>
              </div>
              <div className="text-xs text-[#94A3B8] space-y-1.5 border-t border-[#1A222D] pt-2.5">
                <div className="font-medium">Observation Methods:</div>
                {getMethods(qualysRecords).map(m => (
                  <span key={m} className="inline-block px-2 py-0.5 rounded bg-[#10141A] border border-[#1E2631] text-slate-200 font-medium mr-1 mb-1">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Tenable */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-base">TENABLE</span>
                <span className="text-2xl text-violet-400 font-extrabold">{tenableRecords.length}</span>
              </div>
              <div className="text-xs text-[#94A3B8] space-y-1.5 border-t border-[#1A222D] pt-2.5">
                <div className="font-medium">Observation Methods:</div>
                {getMethods(tenableRecords).map(m => (
                  <span key={m} className="inline-block px-2 py-0.5 rounded bg-[#10141A] border border-[#1E2631] text-slate-200 font-medium mr-1 mb-1">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Rapid7 */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-base">RAPID7</span>
                <span className="text-2xl text-orange-400 font-extrabold">{rapid7Records.length}</span>
              </div>
              <div className="text-xs text-[#94A3B8] space-y-1.5 border-t border-[#1A222D] pt-2.5">
                <div className="font-medium">Observation Methods:</div>
                {getMethods(rapid7Records).map(m => (
                  <span key={m} className="inline-block px-2 py-0.5 rounded bg-[#10141A] border border-[#1E2631] text-slate-200 font-medium mr-1 mb-1">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Wiz */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-base">WIZ</span>
                <span className="text-2xl text-emerald-400 font-extrabold">{wizRecords.length}</span>
              </div>
              <div className="text-xs text-[#94A3B8] space-y-1.5 border-t border-[#1A222D] pt-2.5">
                <div className="font-medium">Observation Methods:</div>
                {getMethods(wizRecords).map(m => (
                  <span key={m} className="inline-block px-2 py-0.5 rounded bg-[#10141A] border border-[#1E2631] text-slate-200 font-medium mr-1 mb-1">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-[#64748B] italic bg-[#151A21]/50 p-2.5 rounded-lg border border-[#1E2631]">
            Qualys, Tenable, Rapid7, and Wiz are used strictly as synthetic source labels. No production scanner or client telemetry is used.
          </div>
        </div>

        {/* Finding Correlation Analytics (6 Cols) */}
        <div className="lg:col-span-6 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A222D] pb-3">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Finding Correlation Analytics
              </h2>
            </div>
            <span className="text-xs text-violet-300 font-semibold">
              {findings.length} Findings → {findingGroups.length} Issues
            </span>
          </div>

          <div className="space-y-4 text-sm">
            {/* Visual Bar Progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8] font-medium">Source Vulnerability Findings</span>
                <span className="text-slate-100 font-bold text-lg">{findings.length}</span>
              </div>
              <div className="w-full bg-[#151A21] h-3.5 rounded-full overflow-hidden border border-[#1E2631]">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8] font-medium">Correlated Findings Across Tools</span>
                <span className="text-violet-400 font-bold text-lg">{findings.length} (100%)</span>
              </div>
              <div className="w-full bg-[#151A21] h-3.5 rounded-full overflow-hidden border border-[#1E2631]">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8] font-medium">Unified Remediation Issues</span>
                <span className="text-emerald-400 font-bold text-lg">{findingGroups.length} Issues</span>
              </div>
              <div className="w-full bg-[#151A21] h-3.5 rounded-full overflow-hidden border border-[#1E2631]">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(findingGroups.length / findings.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 6. Lower Dashboard Cards: Asset Correlation Overview + AI Analyst Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Asset Correlation Overview (8 Cols) */}
        <div className="lg:col-span-8 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A222D] pb-3">
            <div className="flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Asset Correlation Overview
              </h2>
            </div>
            <span className="text-xs text-[#64748B] font-medium">Source Tool Telemetry Distribution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            {/* Tool Distribution */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5 space-y-4">
              <span className="text-xs text-[#64748B] uppercase font-bold tracking-wide block">Records by Source Tool</span>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-slate-200">Qualys</span>
                    <span className="text-blue-400 font-bold">{qualysRecords.length} recs ({Math.round((qualysRecords.length/records.length)*100)}%)</span>
                  </div>
                  <div className="w-full bg-[#10141A] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(qualysRecords.length/records.length)*100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-slate-200">Tenable</span>
                    <span className="text-emerald-400 font-bold">{tenableRecords.length} recs ({Math.round((tenableRecords.length/records.length)*100)}%)</span>
                  </div>
                  <div className="w-full bg-[#10141A] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(tenableRecords.length/records.length)*100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-slate-200">Rapid7</span>
                    <span className="text-rose-400 font-bold">{rapid7Records.length} recs ({Math.round((rapid7Records.length/records.length)*100)}%)</span>
                  </div>
                  <div className="w-full bg-[#10141A] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(rapid7Records.length/records.length)*100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Observation Methods */}
            <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5 space-y-4">
              <span className="text-xs text-[#64748B] uppercase font-bold tracking-wide block">Observation Methods Represented</span>
              
              <div className="space-y-2.5 text-sm">
                <div className="p-3 bg-[#10141A] rounded-xl border border-[#1E2631] flex justify-between items-center">
                  <span className="text-slate-200 font-medium">Agent Telemetry</span>
                  <span className="text-blue-400 font-bold">Qualys, Rapid7</span>
                </div>
                <div className="p-3 bg-[#10141A] rounded-xl border border-[#1E2631] flex justify-between items-center">
                  <span className="text-slate-200 font-medium">Network Discovery</span>
                  <span className="text-emerald-400 font-bold">Qualys, Rapid7</span>
                </div>
                <div className="p-3 bg-[#10141A] rounded-xl border border-[#1E2631] flex justify-between items-center">
                  <span className="text-slate-200 font-medium">Credentialed Scan</span>
                  <span className="text-violet-400 font-bold">Tenable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analyst Sidecar Access Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A222D] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  AI Analyst
                </h2>
              </div>
              <span className="text-xs text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20 font-semibold">
                Gemini Sidecar
              </span>
            </div>

            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Explain deterministic evidence and asset hypotheses. Gemini sidecar operates strictly as a non-authoritative analyst.
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="p-3 bg-[#151A21] border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-xs text-emerald-400 uppercase font-bold tracking-wide block">AUTHORITATIVE RESULT</span>
                <span className="text-slate-100 text-sm font-bold block">Deterministic Correlation Engine</span>
              </div>

              <div className="p-3 bg-[#151A21] border border-purple-500/20 rounded-xl space-y-1">
                <span className="text-xs text-purple-400 uppercase font-bold tracking-wide block">EXPLANATION SIDECAR</span>
                <span className="text-purple-200 text-sm font-bold block">Gemini AI Analyst (Server Proxy)</span>
              </div>
            </div>
          </div>

          {onOpenAIAnalyst && (
            <button
              onClick={onOpenAIAnalyst}
              className="w-full py-3 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              <span>Ask AI Analyst →</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
