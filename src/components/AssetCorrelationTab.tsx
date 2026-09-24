import React, { useState } from 'react';
import {
  UnderlyingAsset,
  AssetRecord,
  CorrelationException,
  VulnerabilityFinding,
  FindingCorrelationGroup
} from '../types/vulnfusion';
import {
  Server,
  Database,
  Network,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Layers,
  Bug,
  Activity,
  FileSearch,
  Filter,
  ArrowUpDown,
  Cpu
} from 'lucide-react';
import { ExportEvidenceMenu } from './ExportEvidenceMenu';

interface AssetCorrelationTabProps {
  clusters: UnderlyingAsset[];
  records: AssetRecord[];
  exceptions: CorrelationException[];
  findings?: VulnerabilityFinding[];
  findingGroups?: FindingCorrelationGroup[];
  onViewEvidence: (asset: UnderlyingAsset) => void;
  onCreateException: (asset: UnderlyingAsset) => void;
  onAcceptCorrelation: (assetGroupId: string) => void;
  onRejectCorrelation: (assetGroupId: string) => void;
  onExplainAI: (asset: UnderlyingAsset) => void;
  onNavigateTab?: (tab: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests') => void;
  externalSearchQuery?: string;
}

export const AssetCorrelationTab: React.FC<AssetCorrelationTabProps> = ({
  clusters,
  records,
  exceptions,
  findings = [],
  findingGroups = [],
  onViewEvidence,
  onCreateException,
  onAcceptCorrelation,
  onRejectCorrelation,
  onExplainAI,
  onNavigateTab,
  externalSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CORRELATED' | 'REVIEW_REQUIRED' | 'SEPARATE'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'QUALYS' | 'TENABLE' | 'RAPID7' | 'WIZ'>('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(clusters[0]?.underlyingAssetId || '');
  const [centerTab, setCenterTab] = useState<'records' | 'identity' | 'evidence' | 'findings'>('records');
  const [toastNotice, setToastNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleToastNotice = (message: string, isError = false) => {
    setToastNotice({ message, isError });
    setTimeout(() => {
      setToastNotice(null);
    }, 4000);
  };

  const effectiveSearch = (externalSearchQuery || searchQuery).toLowerCase().trim();

  // Dynamic filter logic (status + source tool)
  const filteredClusters = clusters.filter(cluster => {
    const matchesStatus = statusFilter === 'ALL' || cluster.correlationStatus === statusFilter;
    
    // Check if cluster contains records matching source filter
    const matchesSource = sourceFilter === 'ALL' || cluster.representativeRecords.some(
      r => r.sourceTool.toUpperCase() === sourceFilter
    );

    const q = effectiveSearch;
    const matchesSearch =
      !q ||
      cluster.underlyingAssetId.toLowerCase().includes(q) ||
      cluster.canonicalHostname.toLowerCase().includes(q) ||
      cluster.clusterSummary.toLowerCase().includes(q) ||
      cluster.memberRecordIds.some(id => id.toLowerCase().includes(q)) ||
      (cluster.canonicalIpAddresses && cluster.canonicalIpAddresses.some(ip => ip.includes(q)));
    return matchesStatus && matchesSource && matchesSearch;
  });

  const selectedCluster =
    clusters.find(c => c.underlyingAssetId === selectedAssetId) ||
    filteredClusters[0] ||
    clusters[0];

  // Dynamic status counts
  const countAll = clusters.length;
  const countCorrelated = clusters.filter(c => c.correlationStatus === 'CORRELATED').length;
  const countReview = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const countSeparate = clusters.filter(c => c.correlationStatus === 'SEPARATE').length;

  // Dynamic source record counts
  const qualysCount = records.filter(r => r.sourceTool === 'Qualys').length;
  const tenableCount = records.filter(r => r.sourceTool === 'Tenable').length;
  const rapid7Count = records.filter(r => r.sourceTool === 'Rapid7').length;
  const wizCount = records.filter(r => r.sourceTool === 'Wiz').length;

  // Helper to fetch details for a source record
  const getRecordDetails = (recordId: string): AssetRecord | undefined => {
    return records.find(r => r.recordId === recordId);
  };

  // Helper for active analyst exception
  const activeException = selectedCluster
    ? exceptions.find(e => e.assetGroupId === selectedCluster.underlyingAssetId && e.status === 'ACTIVE')
    : undefined;

  // Associated findings for selected asset
  const relatedFindings = selectedCluster
    ? findings.filter(f => f.underlyingAssetGroupId === selectedCluster.underlyingAssetId)
    : [];

  // Helper for source tool badges & colors
  const getToolBadgeStyle = (tool: string) => {
    switch (tool.toUpperCase()) {
      case 'QUALYS':
        return {
          bg: 'bg-[#2587FF]/10 text-[#2587FF] border-[#2587FF]/25',
          dot: 'bg-[#2587FF]',
          name: 'Qualys',
        };
      case 'TENABLE':
        return {
          bg: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/25',
          dot: 'bg-[#8B5CF6]',
          name: 'Tenable',
        };
      case 'RAPID7':
        return {
          bg: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/25',
          dot: 'bg-[#F97316]',
          name: 'Rapid7',
        };
      case 'WIZ':
        return {
          bg: 'bg-[#00D6A3]/10 text-[#00D6A3] border-[#00D6A3]/25',
          dot: 'bg-[#00D6A3]',
          name: 'Wiz',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          name: tool,
        };
    }
  };

  // Helper to determine asset type display string from hostname or summary
  const getAssetType = (hostname: string, summary: string) => {
    if (hostname.includes('WEB') || summary.toLowerCase().includes('web')) return 'Web Server';
    if (hostname.includes('DB') || summary.toLowerCase().includes('database') || summary.toLowerCase().includes('sql')) return 'Database Server';
    if (hostname.includes('GW') || summary.toLowerCase().includes('gateway')) return 'Application Gateway';
    if (hostname.includes('VPN') || summary.toLowerCase().includes('vpn')) return 'VPN Client';
    if (hostname.includes('K8S') || summary.toLowerCase().includes('cluster')) return 'K8s Cluster Node';
    return 'Server Asset';
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10 relative">
      
      {/* Toast Notice Banner */}
      {toastNotice && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
          toastNotice.isError
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/20'
            : 'bg-[#101B29]/95 text-[#00B8FF] border-[#00B8FF]/40 shadow-[0_0_15px_rgba(0,184,255,0.2)]'
        }`}>
          {toastNotice.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#00D6A3] shrink-0" />
          )}
          <span>{toastNotice.message}</span>
        </div>
      )}
      
      {/* 1. Page Header & Dynamic Top Metrics */}
      <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Header Title & Eyebrow */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] text-[11px] font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> AUTHORITATIVE ASSET INTELLIGENCE
            </div>
            <h1 className="text-3xl lg:text-[32px] font-semibold text-[#F4F7FB] tracking-tight leading-tight">
              Deterministic Asset Correlation
            </h1>
            <p className="text-base text-[#A8B7C9] leading-relaxed">
              Correlating disparate scanning tool records into evidence-supported asset hypotheses.
            </p>
          </div>

          {/* 4 Dynamic Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
            {/* Asset Groups Card */}
            <div className="bg-[#101B29] border border-[#1B3045] p-4 lg:p-5 rounded-xl space-y-1.5 min-w-[130px] transition-all hover:border-[#00B8FF]/30">
              <div className="flex items-center justify-between text-[#00B8FF]">
                <Server className="w-4 h-4" />
                <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider">CLUSTER</span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold text-[#F4F7FB] font-mono tabular-nums pt-0.5">
                {countAll}
              </div>
              <div className="text-xs text-[#A8B7C9] font-medium">Asset Groups</div>
            </div>

            {/* Source Records Card */}
            <div className="bg-[#101B29] border border-[#1B3045] p-4 lg:p-5 rounded-xl space-y-1.5 min-w-[130px] transition-all hover:border-[#2587FF]/30">
              <div className="flex items-center justify-between text-[#2587FF]">
                <Database className="w-4 h-4" />
                <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider">INGESTED</span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold text-[#F4F7FB] font-mono tabular-nums pt-0.5">
                {records.length}
              </div>
              <div className="text-xs text-[#A8B7C9] font-medium">Source Records</div>
            </div>

            {/* Vulnerability Findings Card */}
            <div className="bg-[#101B29] border border-[#1B3045] p-4 lg:p-5 rounded-xl space-y-1.5 min-w-[130px] transition-all hover:border-[#8B5CF6]/30">
              <div className="flex items-center justify-between text-[#8B5CF6]">
                <Bug className="w-4 h-4" />
                <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider">VULNS</span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold text-[#F4F7FB] font-mono tabular-nums pt-0.5">
                {findings.length}
              </div>
              <div className="text-xs text-[#A8B7C9] font-medium">Vulnerability Findings</div>
            </div>

            {/* Potential Remediation Issues Card */}
            <div className="bg-[#101B29] border border-[#1B3045] p-4 lg:p-5 rounded-xl space-y-1.5 min-w-[130px] transition-all hover:border-[#00D6A3]/30">
              <div className="flex items-center justify-between text-[#00D6A3]">
                <Layers className="w-4 h-4" />
                <span className="text-[10px] font-mono text-[#718197] uppercase tracking-wider">ISSUES</span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold text-[#F4F7FB] font-mono tabular-nums pt-0.5">
                {findingGroups.length}
              </div>
              <div className="text-xs text-[#A8B7C9] font-medium">Potential Issues</div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE SINGLE-COLUMN INVESTIGATION FLOW (lg:hidden) */}
      <div className="block lg:hidden space-y-6">
        
        {/* 1. ASSET GROUP SELECTOR */}
        <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1B3045] pb-2.5">
            <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00B8FF]" />
              1. Select Asset Group ({filteredClusters.length})
            </h2>
            <span className="text-[10px] font-mono text-[#718197] uppercase">Mobile View</span>
          </div>

          {/* Asset Dropdown Selector */}
          <div>
            <label className="text-[11px] font-mono text-[#718197] uppercase tracking-wider block mb-1.5">
              Active Candidate Asset Group
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-[#101B29] border border-[#00B8FF]/40 text-[#F4F7FB] rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#00B8FF] min-h-[48px]"
            >
              {filteredClusters.map((c) => (
                <option key={c.underlyingAssetId} value={c.underlyingAssetId}>
                  {c.canonicalHostname} — {c.correlationStatus === 'REVIEW_REQUIRED' ? 'Candidate Group' : 'Underlying Asset'} ({c.confidence}%)
                </option>
              ))}
            </select>
          </div>

          {/* Search Assets Field */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-[#718197]" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#101B29] border border-[#1B3045] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F4F7FB] placeholder-[#718197] focus:outline-none focus:border-[#00B8FF]/50 font-sans"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'ALL'
                  ? 'bg-[#00B8FF]/15 text-[#00B8FF] border border-[#00B8FF]/30 font-semibold'
                  : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
              }`}
            >
              All {countAll}
            </button>
            <button
              onClick={() => setStatusFilter('CORRELATED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'CORRELATED'
                  ? 'bg-[#00D6A3]/15 text-[#00D6A3] border border-[#00D6A3]/30 font-semibold'
                  : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
              }`}
            >
              Correlated {countCorrelated}
            </button>
            <button
              onClick={() => setStatusFilter('REVIEW_REQUIRED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'REVIEW_REQUIRED'
                  ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 font-semibold'
                  : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
              }`}
            >
              Review {countReview}
            </button>
          </div>
        </div>

        {selectedCluster && (
          <>
            {/* 2. SELECTED ASSET SUMMARY */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1B3045] pb-2.5">
                <span className="text-[10px] font-mono text-[#00B8FF] uppercase tracking-wider font-bold">
                  2. Selected Asset Summary
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  selectedCluster.correlationStatus === 'CORRELATED'
                    ? 'bg-[#00D6A3]/15 text-[#00D6A3] border-[#00D6A3]/30'
                    : selectedCluster.correlationStatus === 'REVIEW_REQUIRED'
                    ? 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {selectedCluster.correlationStatus === 'REVIEW_REQUIRED' ? 'Candidate Asset Group' : selectedCluster.correlationStatus}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#F4F7FB]">
                  {selectedCluster.canonicalHostname}
                </h3>
                <div className="text-xs text-[#A8B7C9] font-mono flex items-center justify-between flex-wrap gap-2">
                  <span>ID: <strong className="text-[#00B8FF]">{selectedCluster.underlyingAssetId}</strong></span>
                  <span>Confidence: <strong className="text-[#F4F7FB]">{selectedCluster.confidence}%</strong></span>
                </div>
              </div>

              {/* Engine Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 bg-[#101B29] p-3 rounded-xl border border-[#1B3045] text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#718197] font-mono block uppercase">Matched</span>
                  <span className="font-bold text-[#00D6A3] text-sm">{selectedCluster.correlationEvidence.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#718197] font-mono block uppercase">Conflicts</span>
                  <span className="font-bold text-[#F5A623] text-sm">{selectedCluster.conflictingAttributes.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#718197] font-mono block uppercase">Evaluated</span>
                  <span className="font-bold text-[#00B8FF] text-sm">{selectedCluster.correlationEvidence.length + selectedCluster.conflictingAttributes.length}</span>
                </div>
              </div>
            </div>

            {/* 3. SOURCE RECORDS */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center justify-between border-b border-[#1B3045] pb-2.5">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#2587FF]" />
                  3. Source Records ({selectedCluster.memberRecordIds.length})
                </span>
              </h2>

              <div className="space-y-2">
                {selectedCluster.memberRecordIds.map((recordId) => {
                  const rec = getRecordDetails(recordId);
                  const toolStyle = getToolBadgeStyle(rec?.sourceTool || 'QUALYS');

                  return (
                    <div key={recordId} className="bg-[#101B29] border border-[#1B3045] p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#F4F7FB]">{recordId}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${toolStyle.bg}`}>
                          {toolStyle.name}
                        </span>
                      </div>
                      <div className="text-[#A8B7C9] flex items-center justify-between text-[11px]">
                        <span>Method: {rec?.observationMethod.replace(/_/g, ' ') || 'AGENT'}</span>
                        <span className="font-mono">{rec?.ipAddresses.join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. IDENTITY PROFILE */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2 border-b border-[#1B3045] pb-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00D6A3]" />
                4. Identity Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#101B29] rounded-xl border border-[#1B3045]">
                  <span className="text-[#718197] text-[10px] font-mono block uppercase">Hostname</span>
                  <span className="font-semibold text-[#F4F7FB]">{selectedCluster.canonicalHostname}</span>
                </div>
                <div className="p-2.5 bg-[#101B29] rounded-xl border border-[#1B3045]">
                  <span className="text-[#718197] text-[10px] font-mono block uppercase">IP Addresses</span>
                  <span className="font-semibold text-[#F4F7FB] font-mono">{selectedCluster.canonicalIpAddresses.join(', ') || 'None'}</span>
                </div>
                <div className="p-2.5 bg-[#101B29] rounded-xl border border-[#1B3045]">
                  <span className="text-[#718197] text-[10px] font-mono block uppercase">BIOS UUID</span>
                  <span className="font-semibold text-emerald-400 font-mono text-[11px] truncate block">{selectedCluster.canonicalBiosUuid || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-[#101B29] rounded-xl border border-[#1B3045]">
                  <span className="text-[#718197] text-[10px] font-mono block uppercase">Cloud Resource ID</span>
                  <span className="font-semibold text-emerald-400 font-mono text-[11px] truncate block">{selectedCluster.canonicalCloudResourceId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 5. CORRELATION EVIDENCE */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center justify-between border-b border-[#1B3045] pb-2.5">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00B8FF]" />
                  5. Correlation Evidence
                </span>
              </h2>

              {/* Supporting Evidence */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#00D6A3] flex items-center justify-between">
                  <span>SUPPORTING EVIDENCE</span>
                  <span className="font-mono text-[11px]">+{selectedCluster.correlationEvidence.reduce((sum, e) => sum + e.weight, 0)} pts</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#1B3045] text-[#718197] text-[10px] font-mono uppercase">
                        <th className="py-2 px-2">Signal</th>
                        <th className="py-2 px-2 text-right">Weight</th>
                        <th className="py-2 px-2">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3045]/60 text-[#A8B7C9]">
                      {selectedCluster.correlationEvidence.map((ev) => (
                        <tr key={ev.id}>
                          <td className="py-2 px-2 font-semibold text-[#00D6A3]">{ev.name}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-[#00D6A3]">+{ev.weight}</td>
                          <td className="py-2 px-2 text-[11px] text-slate-300">{ev.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conflicting Evidence */}
              <div className="space-y-2 pt-2 border-t border-[#1B3045]">
                <div className="text-xs font-semibold text-[#F5A623] flex items-center justify-between">
                  <span>CONFLICTING EVIDENCE</span>
                  <span className="font-mono text-[11px]">{selectedCluster.conflictingAttributes.reduce((sum, c) => sum + c.weight, 0)} penalty</span>
                </div>
                {selectedCluster.conflictingAttributes.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#101B29] border border-[#00D6A3]/20 text-xs text-[#00D6A3] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00D6A3] shrink-0" />
                    <span>Zero conflicting attributes detected.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans min-w-[500px]">
                      <thead>
                        <tr className="border-b border-[#1B3045] text-[#718197] text-[10px] font-mono uppercase">
                          <th className="py-2 px-2">Signal</th>
                          <th className="py-2 px-2 text-right">Penalty</th>
                          <th className="py-2 px-2">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1B3045]/60 text-[#A8B7C9]">
                        {selectedCluster.conflictingAttributes.map((conf) => (
                          <tr key={conf.id}>
                            <td className="py-2 px-2 font-semibold text-[#F5A623]">{conf.name}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-[#F5A623]">{conf.weight}</td>
                            <td className="py-2 px-2 text-[11px] text-slate-300">{conf.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 6. RELATED FINDINGS */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2 border-b border-[#1B3045] pb-2.5">
                <Bug className="w-4 h-4 text-violet-400" />
                6. Related Findings ({relatedFindings.length})
              </h2>

              {relatedFindings.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#101B29] text-center text-xs text-[#718197]">
                  No vulnerability findings associated with this candidate group.
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedFindings.map((f) => (
                    <div key={f.findingId} className="bg-[#101B29] border border-[#1B3045] p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#00B8FF]">{f.vulnerabilityId}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {f.severity}
                        </span>
                      </div>
                      <div className="font-semibold text-[#F4F7FB]">{f.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. AI ANALYST */}
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <h2 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  7. AI Analyst
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NON-AUTHORITATIVE
                </span>
              </div>
              <p className="text-xs text-[#A8B7C9]">
                Request a Gemini AI explanation sidecar for {selectedCluster.canonicalHostname}.
              </p>
              <button
                type="button"
                onClick={() => onExplainAI(selectedCluster)}
                className="w-full py-3 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Ask AI Analyst</span>
              </button>
            </div>

            {/* 8. ANALYST ACTIONS */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider border-b border-[#1B3045] pb-2.5">
                8. Analyst Actions
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onViewEvidence(selectedCluster)}
                  className="py-2.5 px-3 bg-[#101B29] hover:bg-[#1B3045]/60 text-[#F4F7FB] border border-[#1B3045] rounded-xl font-medium transition text-center flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Eye className="w-4 h-4 text-[#00B8FF]" /> View Evidence
                </button>
                <button
                  type="button"
                  onClick={() => onAcceptCorrelation(selectedCluster.underlyingAssetId)}
                  className="py-2.5 px-3 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Check className="w-4 h-4 text-emerald-400" /> Accept
                </button>
              </div>
            </div>

            {/* 9. EXPORT EVIDENCE */}
            <div className="bg-[#0B1420] border border-[#1B3045] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider border-b border-[#1B3045] pb-2.5">
                9. Export Evidence
              </h2>
              <div className="flex justify-start">
                <ExportEvidenceMenu
                  cluster={selectedCluster}
                  records={records}
                  findings={findings}
                  findingGroups={findingGroups}
                  exceptions={exceptions}
                  onToastNotice={setToastNotice ? (msg, err) => setToastNotice({ message: msg, isError: !!err }) : undefined}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Main Three-Column Workspace (Desktop lg:grid) */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start min-h-[700px]">
        
        {/* LEFT COLUMN: ASSET GROUPS BROWSER (~25% / 3 cols) */}
        <div className="lg:col-span-3 bg-[#0B1420] border border-[#1B3045] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col h-full min-h-[660px]">
          
          {/* Header & Controls */}
          <div className="space-y-3 border-b border-[#1B3045] pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00B8FF]" />
                Asset Groups ({filteredClusters.length})
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-[#A8B7C9] font-mono bg-[#101B29] px-2 py-0.5 rounded border border-[#1B3045]">
                <ArrowUpDown className="w-3 h-3 text-[#718197]" /> Sort: Name
              </div>
            </div>

            {/* Search Assets Field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#718197]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101B29] border border-[#1B3045] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F4F7FB] placeholder-[#718197] focus:outline-none focus:border-[#00B8FF]/50 font-sans"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'ALL'
                    ? 'bg-[#00B8FF]/15 text-[#00B8FF] border border-[#00B8FF]/30 font-semibold'
                    : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
                }`}
              >
                All {countAll}
              </button>
              <button
                onClick={() => setStatusFilter('CORRELATED')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'CORRELATED'
                    ? 'bg-[#00D6A3]/15 text-[#00D6A3] border border-[#00D6A3]/30 font-semibold'
                    : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
                }`}
              >
                Correlated {countCorrelated}
              </button>
              <button
                onClick={() => setStatusFilter('REVIEW_REQUIRED')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'REVIEW_REQUIRED'
                    ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 font-semibold'
                    : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
                }`}
              >
                Review {countReview}
              </button>
              {countSeparate > 0 && (
                <button
                  onClick={() => setStatusFilter('SEPARATE')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    statusFilter === 'SEPARATE'
                      ? 'bg-slate-700/50 text-slate-200 border border-slate-600 font-semibold'
                      : 'bg-[#101B29] text-[#A8B7C9] hover:text-[#F4F7FB] border border-[#1B3045]'
                  }`}
                >
                  Separate {countSeparate}
                </button>
              )}
            </div>
          </div>

          {/* Asset List Items (Height 70-90px) */}
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[620px] pr-1">
            {filteredClusters.length === 0 ? (
              <div className="p-6 text-center text-[#718197] text-xs">
                No asset groups match filter criteria
              </div>
            ) : (
              filteredClusters.map((cluster) => {
                const isSelected = cluster.underlyingAssetId === selectedCluster?.underlyingAssetId;
                const assetType = getAssetType(cluster.canonicalHostname, cluster.clusterSummary);

                return (
                  <button
                    key={cluster.underlyingAssetId}
                    onClick={() => setSelectedAssetId(cluster.underlyingAssetId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all h-[82px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#101B29] border-[#00B8FF] text-[#F4F7FB] shadow-[0_0_20px_rgba(0,184,255,0.08)] ring-1 ring-[#00B8FF]/30'
                        : 'bg-[#0B1420] border-[#1B3045] text-[#A8B7C9] hover:bg-[#101B29] hover:border-[#1B3045] hover:text-[#F4F7FB]'
                    }`}
                  >
                    {/* Top Row: Hostname & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Server className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#00B8FF]' : 'text-[#718197]'}`} />
                        <span className="font-semibold text-sm text-[#F4F7FB] truncate">
                          {cluster.canonicalHostname}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase shrink-0 border ${
                        cluster.correlationStatus === 'CORRELATED'
                          ? 'bg-[#00D6A3]/10 text-[#00D6A3] border-[#00D6A3]/20'
                          : cluster.correlationStatus === 'REVIEW_REQUIRED'
                          ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {cluster.correlationStatus === 'CORRELATED' ? 'CORRELATED' : cluster.correlationStatus === 'REVIEW_REQUIRED' ? 'REVIEW' : 'SEPARATE'}
                      </span>
                    </div>

                    {/* Subtitle & Record Count */}
                    <div className="flex items-center justify-between text-xs text-[#718197] pt-1 border-t border-[#1B3045]/40">
                      <span className="text-[#A8B7C9] font-medium text-[11px] truncate">
                        {assetType}
                      </span>
                      <span className="font-mono text-[11px] text-[#A8B7C9]">
                        {cluster.memberRecordIds.length} records
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* CENTER COLUMN: SELECTED ASSET INVESTIGATION (~45% / 5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1420] border border-[#1B3045] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm min-h-[640px]">
          {selectedCluster ? (
            <>
              {/* Selected Asset Header Box */}
              <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B3045] pb-4">
                  
                  {/* Hostname & Type */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 text-[#00B8FF] shrink-0 mt-0.5">
                      <Server className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-semibold text-[#F4F7FB] tracking-tight">
                          {selectedCluster.canonicalHostname}
                        </h2>
                      </div>
                      <div className="text-xs text-[#A8B7C9] font-medium flex items-center gap-2">
                        <span>{getAssetType(selectedCluster.canonicalHostname, selectedCluster.clusterSummary)}</span>
                        <span>·</span>
                        <span className="font-mono text-[#00B8FF]">{selectedCluster.underlyingAssetId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Confidence Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                      selectedCluster.correlationStatus === 'CORRELATED'
                        ? 'bg-[#00D6A3]/15 text-[#00D6A3] border-[#00D6A3]/30'
                        : selectedCluster.correlationStatus === 'REVIEW_REQUIRED'
                        ? 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedCluster.correlationStatus === 'CORRELATED' ? 'bg-[#00D6A3]' :
                        selectedCluster.correlationStatus === 'REVIEW_REQUIRED' ? 'bg-[#F5A623]' : 'bg-slate-400'
                      }`} />
                      {selectedCluster.correlationStatus}
                    </span>

                    <div className="text-xs text-[#A8B7C9] font-mono">
                      Confidence: <strong className="text-[#F4F7FB]">{selectedCluster.confidence}%</strong>
                    </div>
                  </div>

                </div>

                {/* Explanation sentence & Action buttons */}
                <div className="bg-[#0B1420]/80 p-3 rounded-xl border border-[#1B3045] text-xs text-[#A8B7C9] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="flex-1">
                    <strong className="text-[#F4F7FB] font-semibold">{selectedCluster.memberRecordIds.length} source record(s)</strong> from {Array.from(new Set(selectedCluster.representativeRecords.map(r => r.sourceTool))).join(', ')} deterministically correlate to this underlying asset.
                  </p>
                  
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('findings')}
                        className="px-3 py-1.5 bg-[#00B8FF]/10 hover:bg-[#00B8FF]/20 text-[#00B8FF] border border-[#00B8FF]/20 text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                        title="View findings for this asset group"
                      >
                        <span>VIEW FINDINGS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onExplainAI(selectedCluster)}
                      className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                      title="Ask AI Analyst for explanation"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>ASK AI ANALYST</span>
                    </button>

                    <ExportEvidenceMenu
                      cluster={selectedCluster}
                      records={records}
                      findings={findings}
                      findingGroups={findingGroups}
                      exceptions={exceptions}
                      onToastNotice={handleToastNotice}
                    />
                  </div>
                </div>
              </div>

              {/* Active Analyst Exception Notice */}
              {activeException && (
                <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="text-[#F5A623] font-bold uppercase tracking-wide flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Analyst Exception Active
                  </div>
                  <div className="text-[#F4F7FB]">
                    Reason: <span className="text-[#F5A623] font-semibold">{activeException.reason}</span>
                  </div>
                  <p className="text-[#A8B7C9] leading-relaxed">{activeException.analystNote}</p>
                </div>
              )}

              {/* Center Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-[#1B3045] pb-2 text-xs font-medium">
                <button
                  onClick={() => setCenterTab('records')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    centerTab === 'records'
                      ? 'bg-[#101B29] text-[#00B8FF] border border-[#1B3045] font-semibold shadow-sm'
                      : 'text-[#A8B7C9] hover:text-[#F4F7FB]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Source Records ({selectedCluster.memberRecordIds.length})</span>
                </button>

                <button
                  onClick={() => setCenterTab('identity')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    centerTab === 'identity'
                      ? 'bg-[#101B29] text-[#00B8FF] border border-[#1B3045] font-semibold shadow-sm'
                      : 'text-[#A8B7C9] hover:text-[#F4F7FB]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Identity Profile</span>
                </button>

                <button
                  onClick={() => setCenterTab('evidence')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    centerTab === 'evidence'
                      ? 'bg-[#101B29] text-[#00B8FF] border border-[#1B3045] font-semibold shadow-sm'
                      : 'text-[#A8B7C9] hover:text-[#F4F7FB]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Evidence</span>
                </button>

                <button
                  onClick={() => setCenterTab('findings')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    centerTab === 'findings'
                      ? 'bg-[#101B29] text-[#00B8FF] border border-[#1B3045] font-semibold shadow-sm'
                      : 'text-[#A8B7C9] hover:text-[#F4F7FB]'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Related Findings ({relatedFindings.length})</span>
                </button>
              </div>

              {/* Tab 1: Source Records View */}
              {centerTab === 'records' && (
                <div className="space-y-3.5">
                  <div className="space-y-3">
                    {selectedCluster.memberRecordIds.map((recordId) => {
                      const record = getRecordDetails(recordId);
                      if (!record) return null;
                      const toolStyle = getToolBadgeStyle(record.sourceTool);

                      return (
                        <div
                          key={recordId}
                          className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-3 text-xs transition hover:border-[#00B8FF]/30"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#F4F7FB]">
                                {record.recordId}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${toolStyle.bg}`}>
                                {toolStyle.name.toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#0B1420] border border-[#1B3045] text-[#A8B7C9] text-[10px] font-sans font-semibold uppercase">
                                {record.observationMethod.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-[#718197] text-[11px]">
                              {record.lastObserved ? new Date(record.lastObserved).toLocaleDateString() : 'Active'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-[#1B3045]/60 text-[#A8B7C9]">
                            <div>
                              <span className="text-[#718197] block text-[10px] uppercase font-bold">Hostname</span>
                              <span className="text-[#F4F7FB] font-semibold text-xs">{record.hostname || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#718197] block text-[10px] uppercase font-bold">IP Address</span>
                              <span className="text-[#F4F7FB] font-mono text-xs">{record.ipAddresses.join(', ') || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#718197] block text-[10px] uppercase font-bold">MAC Address</span>
                              <span className="text-[#F4F7FB] font-mono text-xs">{record.macAddress || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#718197] block text-[10px] uppercase font-bold">Operating System</span>
                              <span className="text-[#F4F7FB] text-xs truncate block">{record.operatingSystem || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Identity Snapshot Grid */}
              {(centerTab === 'identity' || centerTab === 'records') && (
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#718197]">
                    Asset Identity Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-[#101B29] p-5 rounded-xl border border-[#1B3045]">
                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        Hostname
                      </span>
                      <span className="text-[#F4F7FB] text-sm font-semibold block mt-0.5">
                        {selectedCluster.canonicalHostname}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        IP Address
                      </span>
                      <span className="text-[#F4F7FB] text-xs font-mono block mt-0.5">
                        {selectedCluster.canonicalIpAddresses.join(', ') || 'Unassigned'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        BIOS UUID
                      </span>
                      <span className="text-[#F4F7FB] text-xs font-mono truncate block mt-0.5">
                        {selectedCluster.canonicalBiosUuid || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        Cloud Resource ID / ARN
                      </span>
                      <span className="text-[#00B8FF] text-xs font-mono truncate block mt-0.5">
                        {selectedCluster.canonicalCloudResourceId || selectedCluster.representativeRecords[0]?.cloudInstanceId || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        MAC Address
                      </span>
                      <span className="text-[#F4F7FB] text-xs font-mono block mt-0.5">
                        {selectedCluster.representativeRecords[0]?.macAddress || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#718197] text-[10px] font-bold uppercase block tracking-wider">
                        Operating System
                      </span>
                      <span className="text-[#F4F7FB] text-xs font-semibold block mt-0.5">
                        {selectedCluster.canonicalOs || 'Unknown OS'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Correlation Evidence */}
              {centerTab === 'evidence' && (
                <div className="space-y-5">
                  
                  {/* Layer Notice Header */}
                  <div className="p-3.5 rounded-xl bg-[#0B1420] border border-[#1B3045] flex items-center justify-between text-xs text-[#A8B7C9]">
                    <span className="font-semibold text-[#00B8FF] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00B8FF]" />
                      DETERMINISTIC CORRELATION RESULT
                    </span>
                    <span className="font-mono text-[11px]">
                      Confidence: <strong className="text-[#F4F7FB]">{selectedCluster.confidence}%</strong> ({selectedCluster.correlationEvidence.length} supporting / {selectedCluster.conflictingAttributes.length} conflicting)
                    </span>
                  </div>

                  {/* SECTION 1: SUPPORTING EVIDENCE */}
                  <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#1B3045] pb-2.5">
                      <h3 className="text-xs font-bold text-[#00D6A3] uppercase tracking-wider flex items-center gap-2">
                        <span>SUPPORTING EVIDENCE</span>
                        <span className="px-2 py-0.5 rounded bg-[#00D6A3]/10 border border-[#00D6A3]/20 font-mono text-[10px]">
                          +{selectedCluster.correlationEvidence.reduce((sum, e) => sum + e.weight, 0)} total weight
                        </span>
                      </h3>
                      <span className="text-[11px] text-[#A8B7C9] font-mono">{selectedCluster.correlationEvidence.length} signal(s) matched</span>
                    </div>

                    {selectedCluster.correlationEvidence.length === 0 ? (
                      <p className="text-xs text-[#718197] italic py-2">No positive supporting signals recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="border-b border-[#1B3045] text-[#718197] text-[10px] font-mono uppercase tracking-wider">
                              <th className="py-2 px-3">Signal</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-center">Result</th>
                              <th className="py-2 px-3 text-right">Weight</th>
                              <th className="py-2 px-3">Supporting Records</th>
                              <th className="py-2 px-3">Evidence Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1B3045]/60 text-[#A8B7C9]">
                            {selectedCluster.correlationEvidence.map((ev) => (
                              <tr key={ev.id} className="hover:bg-[#152232] transition">
                                <td className="py-2.5 px-3 font-semibold text-[#F4F7FB]">{ev.name}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-[#00B8FF]">{ev.id.replace('sig-', '').toUpperCase()}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D6A3]/10 text-[#00D6A3] border border-[#00D6A3]/20">
                                    MATCHED
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00D6A3]">+{ev.weight}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                                  {selectedCluster.memberRecordIds.slice(0, 3).join(', ')}
                                  {selectedCluster.memberRecordIds.length > 3 ? ` +${selectedCluster.memberRecordIds.length - 3}` : ''}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-slate-300">{ev.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: CONFLICTING EVIDENCE */}
                  <div className="bg-[#101B29] border border-[#F5A623]/20 rounded-xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#1B3045] pb-2.5">
                      <h3 className="text-xs font-bold text-[#F5A623] uppercase tracking-wider flex items-center gap-2">
                        <span>CONFLICTING EVIDENCE</span>
                        <span className="px-2 py-0.5 rounded bg-[#F5A623]/10 border border-[#F5A623]/20 font-mono text-[10px]">
                          {selectedCluster.conflictingAttributes.reduce((sum, c) => sum + c.weight, 0)} total penalty
                        </span>
                      </h3>
                      <span className="text-[11px] text-[#A8B7C9] font-mono">{selectedCluster.conflictingAttributes.length} conflict(s) detected</span>
                    </div>

                    {selectedCluster.conflictingAttributes.length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#0B1420] border border-[#00D6A3]/20 text-xs text-[#00D6A3] font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00D6A3] shrink-0" />
                        <span>Zero conflicting attributes detected. High deterministic correlation confidence.</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="border-b border-[#1B3045] text-[#718197] text-[10px] font-mono uppercase tracking-wider">
                              <th className="py-2 px-3">Signal</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-center">Result</th>
                              <th className="py-2 px-3 text-right">Penalty</th>
                              <th className="py-2 px-3">Conflicting Records</th>
                              <th className="py-2 px-3">Conflict Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1B3045]/60 text-[#A8B7C9]">
                            {selectedCluster.conflictingAttributes.map((conf) => (
                              <tr key={conf.id} className="hover:bg-[#152232] transition">
                                <td className="py-2.5 px-3 font-semibold text-[#F5A623]">{conf.name}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-[#F5A623]">{conf.id.replace('conf-', '').toUpperCase()}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20">
                                    CONFLICT
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F5A623]">{conf.weight}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                                  {selectedCluster.memberRecordIds.slice(0, 3).join(', ')}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-slate-300">{conf.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab 4: Related Findings */}
              {centerTab === 'findings' && (
                <div className="space-y-3">
                  {relatedFindings.length === 0 ? (
                    <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-6 text-center text-xs text-[#718197]">
                      No vulnerability findings associated with this asset group.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relatedFindings.map((f) => (
                        <div key={f.findingId} className="bg-[#101B29] border border-[#1B3045] rounded-xl p-3.5 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#00B8FF]">{f.vulnerabilityId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {f.severity}
                            </span>
                          </div>
                          <div className="font-semibold text-[#F4F7FB]">{f.title}</div>
                          <div className="text-[#A8B7C9] text-[11px] flex items-center justify-between">
                            <span>Tool: {f.sourceTool}</span>
                            <span>CVSS: {f.cvss}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </>
          ) : (
            <div className="p-12 text-center text-[#718197] text-sm">Select an asset group from the left list</div>
          )}
        </div>

        {/* RIGHT COLUMN: CORRELATION VISUALIZATION & SIGNALS (~30% / 4 cols) */}
        <div className="lg:col-span-4 bg-[#0B1420] border border-[#1B3045] rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm min-h-[660px]">
          {selectedCluster ? (
            <>
              {/* 1. Correlation Visualization Panel */}
              <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1B3045] pb-3">
                  <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00B8FF]" />
                    Correlation Visualization
                  </h2>
                  <span className="text-[10px] font-mono text-[#718197] uppercase">
                    Deterministic Engine
                  </span>
                </div>

                {/* SVG Relationship Tree */}
                <div className="relative py-3">
                  <div className="flex items-center justify-between gap-4">
                    
                    {/* Left Member Source Records Column */}
                    <div className="space-y-2 flex-1">
                      {selectedCluster.memberRecordIds.map((recordId) => {
                        const rec = getRecordDetails(recordId);
                        const toolStyle = getToolBadgeStyle(rec?.sourceTool || 'QUALYS');
                        return (
                          <div
                            key={recordId}
                            className="bg-[#0B1420] border border-[#1B3045] px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono shadow-sm"
                          >
                            <span className="text-[#F4F7FB] font-semibold text-[11px] truncate">{recordId}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${toolStyle.bg}`}>
                              {toolStyle.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Connecting SVG Path graphic */}
                    <div className="w-12 shrink-0 relative flex items-center justify-center min-h-[112px]">
                      <svg className="w-full h-full overflow-visible" viewBox={`0 0 48 ${Math.max(112, selectedCluster.memberRecordIds.length * 28)}`} fill="none">
                        {selectedCluster.memberRecordIds.map((_, idx) => {
                          const svgH = Math.max(112, selectedCluster.memberRecordIds.length * 28);
                          const startY = (idx + 0.5) * (svgH / selectedCluster.memberRecordIds.length);
                          const endY = svgH / 2;
                          return (
                            <path
                              key={idx}
                              d={`M 0 ${startY} C 24 ${startY}, 24 ${endY}, 48 ${endY}`}
                              stroke="#00B8FF"
                              strokeWidth="1.5"
                              strokeOpacity={idx % 2 === 0 ? "0.6" : "0.4"}
                              strokeDasharray={idx % 3 === 0 ? "3 3" : undefined}
                            />
                          );
                        })}
                        <circle cx="48" cy={Math.max(112, selectedCluster.memberRecordIds.length * 28) / 2} r="4" fill="#00B8FF" />
                      </svg>
                    </div>

                    {/* Right Central Asset Node */}
                    <div className="shrink-0 bg-[#0B1420] border border-[#00B8FF] px-3 py-3 rounded-xl flex flex-col items-center gap-1 text-center shadow-[0_0_15px_rgba(0,184,255,0.15)]">
                      <Server className="w-5 h-5 text-[#00B8FF]" />
                      <span className="font-semibold text-xs text-[#F4F7FB] font-mono">{selectedCluster.canonicalHostname}</span>
                      <span className="text-[10px] text-[#00D6A3] font-mono font-bold uppercase">{selectedCluster.correlationStatus}</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* 2. Correlation Signals Panel */}
              <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1B3045] pb-3">
                  <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00D6A3]" />
                    Correlation Signals
                  </h2>
                  <span className="text-xs font-mono font-semibold text-[#00D6A3]">
                    {selectedCluster.correlationEvidence.length}/{selectedCluster.correlationEvidence.length + selectedCluster.conflictingAttributes.length} signals matched
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {selectedCluster.correlationEvidence.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2.5 text-[#A8B7C9]">
                      <CheckCircle2 className="w-4 h-4 text-[#00D6A3] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F4F7FB] block">{ev.name}</span>
                        <span className="text-[11px] text-[#718197]">{ev.description}</span>
                      </div>
                    </div>
                  ))}

                  {selectedCluster.conflictingAttributes.map((conf) => (
                    <div key={conf.id} className="flex items-start gap-2.5 text-[#A8B7C9]">
                      <AlertTriangle className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F5A623] block">{conf.name}</span>
                        <span className="text-[11px] text-[#718197]">{conf.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. AI Analyst Panel */}
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-5 space-y-3.5 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" /> AI Analyst
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    NON-AUTHORITATIVE
                  </span>
                </div>

                <p className="text-xs text-[#A8B7C9] leading-relaxed">
                  Need an explanation of why these records were correlated?
                </p>

                <button
                  onClick={() => onExplainAI(selectedCluster)}
                  className="w-full py-2.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <span>Explain with AI Analyst</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4. Quick Actions Panel */}
              <div className="bg-[#101B29] border border-[#1B3045] rounded-xl p-5 space-y-3.5">
                <h2 className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wider">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onViewEvidence(selectedCluster)}
                    className="py-2 px-3 bg-[#0B1420] hover:bg-[#1B3045]/60 text-[#F4F7FB] border border-[#1B3045] rounded-lg font-medium transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#00B8FF]" /> View Evidence
                  </button>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('findings')}
                      className="py-2 px-3 bg-[#0B1420] hover:bg-[#1B3045]/60 text-[#F4F7FB] border border-[#1B3045] rounded-lg font-medium transition text-center flex items-center justify-center gap-1.5"
                    >
                      <Bug className="w-3.5 h-3.5 text-violet-400" /> View Findings
                    </button>
                  )}

                  <button
                    onClick={() => onAcceptCorrelation(selectedCluster.underlyingAssetId)}
                    className="py-1.5 px-2 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>

                  <button
                    onClick={() => onCreateException(selectedCluster)}
                    className="py-1.5 px-2 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" /> Exception
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

      </div>

    </div>
  );
};
