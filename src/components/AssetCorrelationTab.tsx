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
  ArrowUpDown,
  Cpu,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Info
} from 'lucide-react';
import {
  AssetCorrelationIcon,
  AssetIntelligenceIcon,
  SourceIntelligenceIcon,
  RiskExposureIcon,
  FindingsIntelligenceIcon,
  DeterministicEvidenceIcon,
  SecurityIntelligenceIcon,
} from './icons/VulnFusionIcons';
import {
  getSourceVendorIcon,
  AssetSourceDiscoveryBadge,
} from './icons/SourceVendorIcons';
import { ExportEvidenceMenu } from './ExportEvidenceMenu';
import { NavTabId } from './Sidebar';

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
  onNavigateTab?: (tab: NavTabId) => void;
  externalSearchQuery?: string;
  initialAssetGroupId?: string;
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
  initialAssetGroupId = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CORRELATED' | 'REVIEW_REQUIRED' | 'SEPARATE'>('ALL');
  const [sortOrder, setSortOrder] = useState<'name' | 'records'>('name');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetGroupId || clusters[0]?.underlyingAssetId || '');
  const [centerTab, setCenterTab] = useState<'records' | 'identity' | 'evidence' | 'findings'>('records');
  const [isVisExpanded, setIsVisExpanded] = useState(false);
  const [expandedRecordIds, setExpandedRecordIds] = useState<Set<string>>(new Set());
  const [toastNotice, setToastNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  React.useEffect(() => {
    if (initialAssetGroupId) {
      setSelectedAssetId(initialAssetGroupId);
    }
  }, [initialAssetGroupId]);

  const handleToastNotice = (message: string, isError = false) => {
    setToastNotice({ message, isError });
    setTimeout(() => {
      setToastNotice(null);
    }, 4000);
  };

  const toggleRecordExpanded = (recordId: string) => {
    setExpandedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  const effectiveSearch = (externalSearchQuery || searchQuery).toLowerCase().trim();

  // Dynamic filter logic (status + search)
  const filteredClusters = clusters
    .filter(cluster => {
      const matchesStatus = statusFilter === 'ALL' || cluster.correlationStatus === statusFilter;
      const q = effectiveSearch;
      const matchesSearch =
        !q ||
        cluster.underlyingAssetId.toLowerCase().includes(q) ||
        cluster.canonicalHostname.toLowerCase().includes(q) ||
        cluster.clusterSummary.toLowerCase().includes(q) ||
        cluster.memberRecordIds.some(id => id.toLowerCase().includes(q)) ||
        (cluster.canonicalIpAddresses && cluster.canonicalIpAddresses.some(ip => ip.includes(q)));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'records') {
        return b.memberRecordIds.length - a.memberRecordIds.length;
      }
      return a.canonicalHostname.localeCompare(b.canonicalHostname);
    });

  const selectedCluster =
    clusters.find(c => c.underlyingAssetId === selectedAssetId) ||
    filteredClusters[0] ||
    clusters[0];

  // Dynamic status counts directly from deterministic engine
  const countAll = clusters.length;
  const countCorrelated = clusters.filter(c => c.correlationStatus === 'CORRELATED').length;
  const countReview = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const countSeparate = clusters.filter(c => c.correlationStatus === 'SEPARATE').length;

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

  // Helper for source tool badges, accents, and emblems
  const getToolBadgeStyle = (tool: string) => {
    switch (tool.toUpperCase()) {
      case 'QUALYS':
        return {
          bg: 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/30',
          dot: 'bg-[#3B82F6]',
          iconBg: 'bg-[#3B82F6]/20',
          iconColor: 'text-[#60A5FA]',
          letter: 'Q',
          name: 'Qualys',
        };
      case 'TENABLE':
        return {
          bg: 'bg-[#8B5CF6]/10 text-[#C084FC] border-[#8B5CF6]/30',
          dot: 'bg-[#8B5CF6]',
          iconBg: 'bg-[#8B5CF6]/20',
          iconColor: 'text-[#C084FC]',
          letter: 'T',
          name: 'Tenable',
        };
      case 'RAPID7':
        return {
          bg: 'bg-[#F97316]/10 text-[#FB923C] border-[#F97316]/30',
          dot: 'bg-[#F97316]',
          iconBg: 'bg-[#F97316]/20',
          iconColor: 'text-[#FB923C]',
          letter: 'R',
          name: 'Rapid7',
        };
      case 'WIZ':
        return {
          bg: 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30',
          dot: 'bg-[#10B981]',
          iconBg: 'bg-[#10B981]/20',
          iconColor: 'text-[#34D399]',
          letter: 'W',
          name: 'Wiz',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          iconBg: 'bg-slate-700',
          iconColor: 'text-slate-300',
          letter: tool.charAt(0) || 'S',
          name: tool,
        };
    }
  };

  // Helper to determine asset type display string from hostname or summary
  const getAssetType = (hostname: string, summary: string) => {
    const h = hostname.toUpperCase();
    const s = summary.toLowerCase();
    if (h.includes('WEB') || s.includes('web')) return 'Web Server Asset';
    if (h.includes('DB') || s.includes('database') || s.includes('sql')) return 'Database Server';
    if (h.includes('APP') || s.includes('application')) return 'Server Asset';
    if (h.includes('VPN') || s.includes('vpn')) return 'VPN Gateway Client';
    if (h.includes('CACHE') || s.includes('redis') || s.includes('memcached')) return 'Cache Server Asset';
    if (h.includes('MAIL') || s.includes('gateway') || s.includes('mail')) return 'Mail Gateway Asset';
    if (h.includes('WORKER') || s.includes('worker') || s.includes('cloud')) return 'Cloud Worker Asset';
    if (h.includes('WORKSTATION') || s.includes('workstation')) return 'Workstation Asset';
    return 'Server Asset';
  };

  const matchedCount = selectedCluster ? selectedCluster.correlationEvidence.length : 0;
  const conflictCount = selectedCluster ? selectedCluster.conflictingAttributes.length : 0;
  const evaluatedCount = matchedCount + conflictCount;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10 relative">
      
      {/* Toast Notice Banner */}
      {toastNotice && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
          toastNotice.isError
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/20'
            : 'bg-[#10141A]/95 text-[#60A5FA] border-[#3B82F6]/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        }`}>
          {toastNotice.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          )}
          <span>{toastNotice.message}</span>
        </div>
      )}
      
      {/* 1. Page Header & Dynamic Top Metrics */}
      <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Header Title & Eyebrow */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA] text-[11px] font-bold uppercase tracking-wider">
              <AssetCorrelationIcon size={16} glow /> Authoritative Asset Intelligence
            </div>
            <h1 className="text-3xl lg:text-[32px] font-semibold text-[#F1F5F9] tracking-tight leading-tight">
              Deterministic Asset Correlation
            </h1>
            <p className="text-base text-[#8B95A5] leading-relaxed">
              Correlating disparate scanning tool records into evidence-supported asset hypotheses.
            </p>
          </div>

          {/* 4 Dynamic Metric Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 shrink-0">
            {/* Asset Groups Card */}
            <div className="bg-[#151A21] border border-[#1B2430] p-4 rounded-xl space-y-1 min-w-[125px]">
              <div className="flex items-center justify-between text-[#60A5FA]">
                <AssetIntelligenceIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase tracking-wider">GROUPS</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {countAll}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Asset Groups</div>
            </div>

            {/* Source Records Card */}
            <div className="bg-[#151A21] border border-[#1B2430] p-4 rounded-xl space-y-1 min-w-[125px]">
              <div className="flex items-center justify-between text-[#3B82F6]">
                <SourceIntelligenceIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase tracking-wider">INGESTED</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {records.length}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Source Records</div>
            </div>

            {/* Vulnerability Findings Card */}
            <div className="bg-[#151A21] border border-[#1B2430] p-4 rounded-xl space-y-1 min-w-[125px]">
              <div className="flex items-center justify-between text-[#A855F7]">
                <RiskExposureIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase tracking-wider">FINDINGS</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {findings.length}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Vulnerabilities</div>
            </div>

            {/* Potential Remediation Issues Card */}
            <div className="bg-[#151A21] border border-[#1B2430] p-4 rounded-xl space-y-1 min-w-[125px]">
              <div className="flex items-center justify-between text-[#10B981]">
                <FindingsIntelligenceIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase tracking-wider">ISSUES</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {findingGroups.length}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Correlation Issues</div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE SINGLE-COLUMN INVESTIGATION FLOW (<768px: block md:hidden) */}
      <div className="block md:hidden space-y-6">
        
        {/* 1. ASSET GROUP SELECTOR */}
        <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1B2430] pb-2.5">
            <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-[#3B82F6]" />
              1. Select Asset Group ({filteredClusters.length})
            </h2>
            <span className="text-[10px] font-mono text-[#5F6875] uppercase">Mobile View</span>
          </div>

          {/* Asset Dropdown Selector */}
          <div>
            <label className="text-[11px] font-mono text-[#8B95A5] uppercase tracking-wider block mb-1.5">
              Active Candidate Asset Group
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-[#151A21] border border-[#3B82F6]/40 text-[#F1F5F9] rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6] min-h-[48px]"
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
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-[#5F6875]" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/50 font-sans"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'ALL'
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40 font-semibold'
                  : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
              }`}
            >
              All {countAll}
            </button>
            <button
              onClick={() => setStatusFilter('CORRELATED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'CORRELATED'
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                  : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
              }`}
            >
              Correlated {countCorrelated}
            </button>
            <button
              onClick={() => setStatusFilter('REVIEW_REQUIRED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                statusFilter === 'REVIEW_REQUIRED'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-semibold'
                  : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
              }`}
            >
              Review {countReview}
            </button>
            {countSeparate > 0 && (
              <button
                onClick={() => setStatusFilter('SEPARATE')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition min-h-[36px] ${
                  statusFilter === 'SEPARATE'
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 font-semibold'
                    : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
                }`}
              >
                Separate {countSeparate}
              </button>
            )}
          </div>
        </div>

        {selectedCluster && (
          <>
            {/* 2. SELECTED ASSET SUMMARY (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1B2430] pb-2.5">
                <span className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-wider font-bold">
                  2. Selected Asset Summary
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  selectedCluster.correlationStatus === 'CORRELATED'
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : selectedCluster.correlationStatus === 'REVIEW_REQUIRED'
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {selectedCluster.correlationStatus === 'REVIEW_REQUIRED' ? 'Candidate Asset Group' : selectedCluster.correlationStatus}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#F1F5F9]">
                  {selectedCluster.canonicalHostname}
                </h3>
                <div className="text-xs text-[#8B95A5] font-mono flex items-center justify-between flex-wrap gap-2">
                  <span>ID: <strong className="text-[#60A5FA]">{selectedCluster.underlyingAssetId}</strong></span>
                  <span>Confidence: <strong className="text-[#F1F5F9]">{selectedCluster.confidence}%</strong></span>
                </div>
              </div>

              {/* Engine Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 bg-[#151A21] p-3 rounded-xl border border-[#1B2430] text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#5F6875] block uppercase font-sans font-semibold">Matched</span>
                  <span className="font-bold text-[#10B981] text-sm tabular-nums">{matchedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6875] block uppercase font-sans font-semibold">Conflicts</span>
                  <span className="font-bold text-[#F59E0B] text-sm tabular-nums">{conflictCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6875] block uppercase font-sans font-semibold">Evaluated</span>
                  <span className="font-bold text-[#3B82F6] text-sm tabular-nums">{evaluatedCount}</span>
                </div>
              </div>
            </div>

            {/* 3. SOURCE RECORDS (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider flex items-center justify-between border-b border-[#1B2430] pb-2.5">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#3B82F6]" />
                  3. Source Records ({selectedCluster.memberRecordIds.length})
                </span>
              </h2>

              <div className="space-y-2">
                {selectedCluster.memberRecordIds.map((recordId) => {
                  const rec = getRecordDetails(recordId);
                  const toolStyle = getToolBadgeStyle(rec?.sourceTool || 'QUALYS');

                  return (
                    <div key={recordId} className="bg-[#151A21] border border-[#1B2430] p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#F1F5F9]">{recordId}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${toolStyle.bg}`}>
                          {toolStyle.name}
                        </span>
                      </div>
                      <div className="text-[#8B95A5] flex items-center justify-between text-[11px]">
                        <span>Method: {rec?.observationMethod.replace(/_/g, ' ') || 'AGENT'}</span>
                        <span className="font-mono">{rec?.ipAddresses.join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. IDENTITY PROFILE (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2 border-b border-[#1B2430] pb-2.5">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                4. Identity Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#151A21] rounded-xl border border-[#1B2430]">
                  <span className="text-[#5F6875] text-[10px] font-mono block uppercase">Hostname</span>
                  <span className="font-semibold text-[#F1F5F9]">{selectedCluster.canonicalHostname}</span>
                </div>
                <div className="p-2.5 bg-[#151A21] rounded-xl border border-[#1B2430]">
                  <span className="text-[#5F6875] text-[10px] font-mono block uppercase">IP Addresses</span>
                  <span className="font-semibold text-[#F1F5F9] font-mono">{selectedCluster.canonicalIpAddresses.join(', ') || 'None'}</span>
                </div>
                <div className="p-2.5 bg-[#151A21] rounded-xl border border-[#1B2430]">
                  <span className="text-[#5F6875] text-[10px] font-mono block uppercase">BIOS UUID</span>
                  <span className="font-semibold text-emerald-400 font-mono text-[11px] truncate block">{selectedCluster.canonicalBiosUuid || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-[#151A21] rounded-xl border border-[#1B2430]">
                  <span className="text-[#5F6875] text-[10px] font-mono block uppercase">Cloud Resource ID</span>
                  <span className="font-semibold text-emerald-400 font-mono text-[11px] truncate block">{selectedCluster.canonicalCloudResourceId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 5. CORRELATION EVIDENCE (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider flex items-center justify-between border-b border-[#1B2430] pb-2.5">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  5. Correlation Evidence
                </span>
                <span className="font-mono text-xs text-[#10B981]">{matchedCount}/{evaluatedCount} matched</span>
              </h2>

              {/* Supporting Evidence */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#10B981] flex items-center justify-between">
                  <span>SUPPORTING EVIDENCE</span>
                  <span className="font-mono text-[11px]">+{selectedCluster.correlationEvidence.reduce((sum, e) => sum + e.weight, 0)} pts</span>
                </div>
                <div className="space-y-1.5">
                  {selectedCluster.correlationEvidence.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-[#151A21] border border-[#1B2430] rounded-lg text-xs flex items-center justify-between gap-2">
                      <div className="font-medium text-[#F1F5F9]">{ev.name}</div>
                      <div className="font-mono text-[#10B981] font-bold">+{ev.weight}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicting Evidence */}
              <div className="space-y-2 pt-2 border-t border-[#1B2430]">
                <div className="text-xs font-semibold text-[#F59E0B] flex items-center justify-between">
                  <span>CONFLICTING EVIDENCE</span>
                  <span className="font-mono text-[11px]">{selectedCluster.conflictingAttributes.reduce((sum, c) => sum + c.weight, 0)} penalty</span>
                </div>
                {selectedCluster.conflictingAttributes.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#151A21] border border-[#10B981]/20 text-xs text-[#10B981] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Zero conflicting attributes detected.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCluster.conflictingAttributes.map((conf) => (
                      <div key={conf.id} className="p-2.5 bg-[#151A21] border border-[#F59E0B]/30 rounded-lg text-xs flex items-center justify-between gap-2">
                        <div className="font-medium text-[#F59E0B]">{conf.name}</div>
                        <div className="font-mono text-[#F59E0B] font-bold">{conf.weight}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. RELATED FINDINGS (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2 border-b border-[#1B2430] pb-2.5">
                <Bug className="w-4 h-4 text-violet-400" />
                6. Related Findings ({relatedFindings.length})
              </h2>

              {relatedFindings.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#151A21] text-center text-xs text-[#5F6875]">
                  No vulnerability findings associated with this candidate group.
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedFindings.map((f) => (
                    <div key={f.findingId} className="bg-[#151A21] border border-[#1B2430] p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#60A5FA]">{f.vulnerabilityId}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {f.severity}
                        </span>
                      </div>
                      <div className="font-semibold text-[#F1F5F9]">{f.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. AI ANALYST (Mobile) */}
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
              <p className="text-xs text-[#8B95A5]">
                Gemini explains the evidence. It does not determine correlation.
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

            {/* 8. ANALYST ACTIONS (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider border-b border-[#1B2430] pb-2.5">
                8. Analyst Actions
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onViewEvidence(selectedCluster)}
                  className="py-2.5 px-3 bg-[#151A21] hover:bg-[#1B2430] text-[#F1F5F9] border border-[#1B2430] rounded-xl font-medium transition text-center flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Eye className="w-4 h-4 text-[#3B82F6]" /> View Evidence
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

            {/* 9. EXPORT EVIDENCE (Mobile) */}
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider border-b border-[#1B2430] pb-2.5">
                9. Export Evidence
              </h2>
              <div className="flex justify-start">
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
          </>
        )}
      </div>

      {/* MASTER-DETAIL INVESTIGATION WORKSPACE (Desktop & Tablet >= 768px: hidden md:flex) */}
      <div className="hidden md:flex flex-row gap-6 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: ASSET GROUP BROWSER (Width: 260px - 270px)      */}
        {/* ============================================================ */}
        <div className="w-[260px] lg:w-[270px] shrink-0 bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm flex flex-col min-h-[720px]">
          
          {/* Header & Sort Controls */}
          <div className="space-y-3 border-b border-[#1B2430] pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-[#3B82F6]" />
                <span>Asset Groups</span>
                <span className="font-mono text-[#8B95A5] font-normal">({filteredClusters.length})</span>
              </h2>
              
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'name' ? 'records' : 'name')}
                className="flex items-center gap-1 text-[11px] text-[#8B95A5] hover:text-[#F1F5F9] font-mono bg-[#151A21] px-2 py-0.5 rounded border border-[#1B2430] transition"
                title={`Current sort: ${sortOrder === 'name' ? 'Alphabetical' : 'Record count'}`}
              >
                <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                <span>{sortOrder === 'name' ? 'Name' : 'Count'}</span>
              </button>
            </div>

            {/* Search Assets Field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#5F6875]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151A21] border border-[#1B2430] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/50 font-sans"
              />
            </div>

            {/* Filter Chips with Engine-Derived Counts */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
                  statusFilter === 'ALL'
                    ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40 font-semibold'
                    : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
                }`}
              >
                All {countAll}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CORRELATED')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
                  statusFilter === 'CORRELATED'
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                    : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
                }`}
              >
                Correlated {countCorrelated}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REVIEW_REQUIRED')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
                  statusFilter === 'REVIEW_REQUIRED'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-semibold'
                    : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
                }`}
              >
                Review {countReview}
              </button>
              {countSeparate > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('SEPARATE')}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
                    statusFilter === 'SEPARATE'
                      ? 'bg-slate-700/50 text-slate-200 border border-slate-600 font-semibold'
                      : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
                  }`}
                >
                  Separate {countSeparate}
                </button>
              )}
            </div>
          </div>

          {/* Asset Group List - Generous 2-Line Text, No Aggressive Truncation */}
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[640px] pr-1">
            {filteredClusters.length === 0 ? (
              <div className="p-6 text-center text-[#5F6875] text-xs">
                No asset groups match filter criteria
              </div>
            ) : (
              filteredClusters.map((cluster) => {
                const isSelected = cluster.underlyingAssetId === selectedCluster?.underlyingAssetId;
                const assetType = getAssetType(cluster.canonicalHostname, cluster.clusterSummary);
                const clusterSources = Array.from(new Set(records.filter(r => cluster.memberRecordIds.includes(r.recordId)).map(r => r.sourceTool)));

                return (
                  <button
                    key={cluster.underlyingAssetId}
                    type="button"
                    onClick={() => setSelectedAssetId(cluster.underlyingAssetId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-[#151A21] border-[#3B82F6] text-[#F1F5F9] shadow-[0_0_15px_rgba(59,130,246,0.12)] ring-1 ring-[#3B82F6]/30'
                        : 'bg-[#10141A] border-[#1B2430] text-[#8B95A5] hover:bg-[#151A21] hover:border-[#1B2430] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {/* Top Row: Asset Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-sm text-[#F1F5F9] leading-tight break-words">
                        <AssetSourceDiscoveryBadge sourceTools={clusterSources} size={16} />
                        <span>{cluster.canonicalHostname}</span>
                      </div>

                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase shrink-0 border ${
                        cluster.correlationStatus === 'CORRELATED'
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : cluster.correlationStatus === 'REVIEW_REQUIRED'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {cluster.correlationStatus === 'CORRELATED' ? 'CORRELATED' : cluster.correlationStatus === 'REVIEW_REQUIRED' ? 'REVIEW' : 'SEPARATE'}
                      </span>
                    </div>

                    {/* Middle Row: Asset Type (Two-line readable) */}
                    <div className="text-xs text-[#8B95A5] font-medium leading-tight">
                      {assetType}
                    </div>

                    {/* Bottom Row: Dynamic Record Count & Confidence */}
                    <div className="flex items-center justify-between text-xs text-[#5F6875] pt-1 border-t border-[#1B2430]/60">
                      <span className="font-mono text-[11px] text-[#8B95A5]">
                        {cluster.memberRecordIds.length} {cluster.memberRecordIds.length === 1 ? 'record' : 'records'}
                      </span>
                      {typeof cluster.confidence === 'number' && (
                        <span className="font-mono text-[11px] text-[#8B95A5]">
                          {cluster.confidence}% conf
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ASSET INVESTIGATION WORKSPACE                  */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0 bg-[#10141A] border border-[#1B2430] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm min-h-[720px]">
          {selectedCluster ? (
            <>
              {/* 1. SELECTED ASSET HEADER (Prominent but Compact) */}
              <div className="bg-[#151A21] border border-[#1B2430] rounded-xl p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Hostname, Asset Type, Cluster ID */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <AssetSourceDiscoveryBadge
                        sourceTools={Array.from(new Set(records.filter(r => selectedCluster.memberRecordIds.includes(r.recordId)).map(r => r.sourceTool)))}
                        size={24}
                      />
                      <h2 className="text-2xl sm:text-3xl font-semibold text-[#F1F5F9] tracking-tight">
                        {selectedCluster.canonicalHostname}
                      </h2>
                      <span className="text-xs font-mono text-[#60A5FA] bg-[#10141A] px-2.5 py-0.5 rounded-md border border-[#1B2430]">
                        {selectedCluster.underlyingAssetId}
                      </span>
                    </div>
                    <div className="text-sm text-[#8B95A5] font-medium">
                      {getAssetType(selectedCluster.canonicalHostname, selectedCluster.clusterSummary)}
                    </div>
                  </div>

                  {/* Status & Confidence Badge */}
                  <div className="flex items-center sm:items-end flex-col gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                        selectedCluster.correlationStatus === 'CORRELATED'
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : selectedCluster.correlationStatus === 'REVIEW_REQUIRED'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedCluster.correlationStatus === 'CORRELATED' ? 'bg-[#10B981]' :
                          selectedCluster.correlationStatus === 'REVIEW_REQUIRED' ? 'bg-[#F59E0B]' : 'bg-slate-400'
                        }`} />
                        {selectedCluster.correlationStatus === 'REVIEW_REQUIRED' ? 'REVIEW REQUIRED' : selectedCluster.correlationStatus}
                      </span>
                      <span className="text-sm font-semibold font-mono text-[#F1F5F9] bg-[#10141A] px-2.5 py-1 rounded-lg border border-[#1B2430]">
                        {selectedCluster.confidence}% confidence
                      </span>
                    </div>
                  </div>

                </div>

                {/* Compact Engine-Derived Metadata Row */}
                <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-[#8B95A5] pt-3 border-t border-[#1B2430] flex-wrap">
                  <span className="font-medium text-[#F1F5F9]">
                    {selectedCluster.memberRecordIds.length} source records
                  </span>
                  <span aria-hidden="true" className="text-[#5F6875]">·</span>
                  <span className="font-medium text-[#F1F5F9]">
                    {relatedFindings.length} related {relatedFindings.length === 1 ? 'finding' : 'findings'}
                  </span>
                  <span aria-hidden="true" className="text-[#5F6875]">·</span>
                  <span className="font-medium text-[#10B981]">
                    {matchedCount}/{evaluatedCount} signals matched
                  </span>
                  <span aria-hidden="true" className="text-[#5F6875]">·</span>
                  <span className={`font-medium ${conflictCount > 0 ? 'text-[#F59E0B]' : 'text-[#8B95A5]'}`}>
                    {conflictCount} {conflictCount === 1 ? 'conflict' : 'conflicts'}
                  </span>
                </div>
              </div>

              {/* Active Analyst Exception Notice (If Active) */}
              {activeException && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="text-[#F59E0B] font-bold uppercase tracking-wide flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Analyst Exception Active
                  </div>
                  <div className="text-[#F1F5F9]">
                    Reason: <span className="text-[#F59E0B] font-semibold">{activeException.reason}</span>
                  </div>
                  <p className="text-[#8B95A5] leading-relaxed">{activeException.analystNote}</p>
                </div>
              )}

              {/* 2. ANALYST ACTIONS BAR (Unified, Clean, No Scattered Buttons) */}
              <div className="bg-[#151A21] border border-[#1B2430] rounded-xl p-3 flex items-center justify-between gap-2.5 flex-wrap">
                {/* Primary Actions (Prominent) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onAcceptCorrelation(selectedCluster.underlyingAssetId)}
                    className="px-3.5 py-1.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                    title="Accept deterministic correlation"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Correlation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRejectCorrelation(selectedCluster.underlyingAssetId)}
                    className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title="Reject correlation hypothesis"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Correlation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onExplainAI(selectedCluster)}
                    className="px-3.5 py-1.5 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#E9D5FF] border border-[#A855F7]/40 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title="Ask AI Analyst for explanation sidecar"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
                    <span>Ask AI Analyst</span>
                  </button>
                </div>

                {/* Secondary Actions (Subdued) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setCenterTab('evidence');
                      onViewEvidence(selectedCluster);
                    }}
                    className="px-3 py-1.5 bg-[#10141A] hover:bg-[#181E26] text-[#F1F5F9] border border-[#1B2430] rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    title="Inspect correlation evidence"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>View Evidence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCenterTab('findings');
                    }}
                    className="px-3 py-1.5 bg-[#10141A] hover:bg-[#181E26] text-[#F1F5F9] border border-[#1B2430] rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    title="Inspect vulnerability findings"
                  >
                    <Bug className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>View Findings ({relatedFindings.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateException(selectedCluster)}
                    className="px-3 py-1.5 bg-[#10141A] hover:bg-[#181E26] text-[#F59E0B] border border-[#1B2430] rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    title="Create correlation exception"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Create Exception</span>
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

              {/* 3. COMPACT RELATIONSHIP MAP (Collapsible / Expandable Topology) */}
              <div className="bg-[#151A21] border border-[#1B2430] rounded-xl p-3.5 transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Activity className="w-4 h-4 text-[#3B82F6] shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                        Relationship Map
                      </span>
                      <span className="text-xs text-[#8B95A5] hidden sm:inline">
                        — {selectedCluster.memberRecordIds.length} source records converged into {selectedCluster.canonicalHostname}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick record preview pills */}
                    <div className="hidden lg:flex items-center gap-1">
                      {selectedCluster.memberRecordIds.slice(0, 4).map((id) => {
                        const rec = getRecordDetails(id);
                        const badge = getToolBadgeStyle(rec?.sourceTool || 'QUALYS');
                        return (
                          <span key={id} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.bg}`}>
                            {id}
                          </span>
                        );
                      })}
                      {selectedCluster.memberRecordIds.length > 4 && (
                        <span className="text-[10px] font-mono text-[#5F6875]">+{selectedCluster.memberRecordIds.length - 4}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsVisExpanded(prev => !prev)}
                      className="px-2.5 py-1 bg-[#10141A] hover:bg-[#181E26] text-[#3B82F6] border border-[#1B2430] rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <span>{isVisExpanded ? 'Collapse Map' : 'Expand Map'}</span>
                      {isVisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Full-Width Diagram Inside Investigation Workspace */}
                {isVisExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#1B2430] space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] lg:grid-cols-[1.2fr_100px_1fr] items-center gap-4 py-2">
                      
                      {/* Left: Source Telemetry Records */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono text-[#5F6875] uppercase tracking-wider mb-1">
                          Source Telemetry Records ({selectedCluster.memberRecordIds.length})
                        </div>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {selectedCluster.memberRecordIds.map((recordId) => {
                            const rec = getRecordDetails(recordId);
                            const toolStyle = getToolBadgeStyle(rec?.sourceTool || 'QUALYS');
                            return (
                              <div
                                key={recordId}
                                className="bg-[#10141A] border border-[#1B2430] px-3 py-2 rounded-lg flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-semibold text-[#F1F5F9] text-xs truncate">{recordId}</span>
                                  <span className="text-[11px] text-[#8B95A5] truncate hidden sm:inline">{rec?.hostname}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${toolStyle.bg}`}>
                                    {toolStyle.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#5F6875] hidden sm:inline">
                                    {rec?.ipAddresses[0] || ''}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Center: Connecting SVG Bezier Beams */}
                      <div className="hidden md:flex flex-col items-center justify-center h-full min-h-[160px] relative">
                        <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 144" fill="none">
                          {selectedCluster.memberRecordIds.map((_, idx) => {
                            const count = selectedCluster.memberRecordIds.length;
                            const startY = 12 + (idx * (120 / Math.max(1, count - 1)));
                            return (
                              <path
                                key={idx}
                                d={`M 0 ${startY} C 50 ${startY}, 50 72, 100 72`}
                                stroke="#3B82F6"
                                strokeWidth="1.5"
                                strokeOpacity={0.4 + (idx % 3) * 0.2}
                              />
                            );
                          })}
                          <circle cx="100" cy="72" r="4.5" fill="#3B82F6" />
                        </svg>
                      </div>

                      {/* Right: Central Authoritative Node */}
                      <div className="bg-[#10141A] border-2 border-[#3B82F6] p-4 rounded-xl flex flex-col items-center text-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.12)]">
                        <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-[#F1F5F9] font-mono">{selectedCluster.canonicalHostname}</div>
                          <div className="text-xs text-[#8B95A5] mt-0.5">{selectedCluster.underlyingAssetId}</div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-[#1B2430] w-full justify-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            {selectedCluster.correlationStatus}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#F1F5F9]">
                            {selectedCluster.confidence}%
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* 4. PRIMARY INVESTIGATION TABS (Dominant Detailed View) */}
              <div className="flex items-center gap-1 border-b border-[#1B2430] pb-2 text-xs font-medium overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCenterTab('records')}
                  className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                    centerTab === 'records'
                      ? 'bg-[#151A21] text-[#3B82F6] border border-[#1B2430] font-semibold shadow-sm'
                      : 'text-[#8B95A5] hover:text-[#F1F5F9]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Source Records</span>
                  <span className="font-mono text-[11px] text-[#5F6875] ml-0.5">({selectedCluster.memberRecordIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCenterTab('identity')}
                  className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                    centerTab === 'identity'
                      ? 'bg-[#151A21] text-[#3B82F6] border border-[#1B2430] font-semibold shadow-sm'
                      : 'text-[#8B95A5] hover:text-[#F1F5F9]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Identity Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCenterTab('evidence')}
                  className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                    centerTab === 'evidence'
                      ? 'bg-[#151A21] text-[#3B82F6] border border-[#1B2430] font-semibold shadow-sm'
                      : 'text-[#8B95A5] hover:text-[#F1F5F9]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Correlation Evidence</span>
                  <span className="font-mono text-[11px] text-[#10B981] ml-0.5">({matchedCount}/{evaluatedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCenterTab('findings')}
                  className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                    centerTab === 'findings'
                      ? 'bg-[#151A21] text-[#3B82F6] border border-[#1B2430] font-semibold shadow-sm'
                      : 'text-[#8B95A5] hover:text-[#F1F5F9]'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Related Findings</span>
                  <span className="font-mono text-[11px] text-[#8B5CF6] ml-0.5">({relatedFindings.length})</span>
                </button>
              </div>

              {/* ============================================================ */}
              {/* TAB 1: SOURCE RECORDS (Compact Professional Record Rows)     */}
              {/* ============================================================ */}
              {centerTab === 'records' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8B95A5]">
                    <span>Displaying {selectedCluster.memberRecordIds.length} ingested source records for this asset group</span>
                    <span className="font-mono text-[11px]">Click 'View →' to inspect raw hardware telemetry</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedCluster.memberRecordIds.map((recordId) => {
                      const record = getRecordDetails(recordId);
                      if (!record) return null;
                      const toolStyle = getToolBadgeStyle(record.sourceTool);
                      const isExpanded = expandedRecordIds.has(recordId);

                      return (
                        <div
                          key={recordId}
                          className="bg-[#151A21] border border-[#1B2430] hover:border-[#3B82F6]/40 rounded-xl p-4 transition text-xs space-y-2.5"
                        >
                          {/* Row 1: Source icon + Record ID + Tool + Method + Observed Date */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {getSourceVendorIcon(record.sourceTool, 20)}
                              <span className="font-mono font-bold text-sm text-[#F1F5F9]">
                                {record.recordId}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#10141A] border border-[#1B2430] text-[#F1F5F9]">
                                {record.sourceTool}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#10141A] border border-[#1B2430] text-[#8B95A5] text-[10px] font-medium uppercase">
                                {record.observationMethod.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-[#5F6875]">
                              {record.lastObserved
                                ? new Date(record.lastObserved).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Active'}
                            </div>
                          </div>

                          {/* Row 2: Hostname · IP Address · Operating System */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-[#1B2430]/70">
                            <div>
                              <span className="text-[#5F6875] text-[10px] uppercase font-semibold block">Hostname</span>
                              <span className="text-[#F1F5F9] font-medium truncate block">{record.hostname || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#5F6875] text-[10px] uppercase font-semibold block">IP Address</span>
                              <span className="text-[#F1F5F9] font-mono text-xs truncate block">{record.ipAddresses.join(', ') || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#5F6875] text-[10px] uppercase font-semibold block">Operating System</span>
                              <span className="text-[#8B95A5] truncate block">{record.operatingSystem || 'Unknown'}</span>
                            </div>
                          </div>

                          {/* Row 3: MAC Address + View Affordance */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1B2430]/40 text-[#5F6875]">
                            <div className="font-mono text-[11px] text-[#8B95A5]">
                              MAC: <span className="text-[#F1F5F9]">{record.macAddress || 'N/A'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleRecordExpanded(recordId)}
                              className="text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium flex items-center gap-1 transition"
                            >
                              <span>{isExpanded ? 'Hide telemetry' : 'View →'}</span>
                            </button>
                          </div>

                          {/* Collapsible Raw Telemetry Drawer */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-[#1B2430] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#10141A] p-3 rounded-lg text-[11px] font-mono animate-fadeIn">
                              <div>
                                <span className="text-[#5F6875] uppercase block text-[9px] font-sans">BIOS UUID</span>
                                <span className="text-[#F1F5F9] truncate block">{record.biosUuid || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[#5F6875] uppercase block text-[9px] font-sans">Cloud Resource / Instance ID</span>
                                <span className="text-[#60A5FA] truncate block">{record.cloudResourceId || record.cloudInstanceId || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[#5F6875] uppercase block text-[9px] font-sans">Serial / Ports</span>
                                <span className="text-[#F1F5F9] truncate block">
                                  {record.serialNumber ? `SN: ${record.serialNumber}` : record.openPorts?.length ? `Ports: ${record.openPorts.join(', ')}` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: IDENTITY PROFILE (Consolidated Authoritative Profile) */}
              {/* ============================================================ */}
              {centerTab === 'identity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#8B95A5]">
                    <span>Consolidated canonical attributes determined by the deterministic correlation engine</span>
                    <span className="font-mono text-[11px]">Underlying ID: {selectedCluster.underlyingAssetId}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        Canonical Hostname
                      </span>
                      <span className="text-[#F1F5F9] text-base font-semibold block">
                        {selectedCluster.canonicalHostname}
                      </span>
                    </div>

                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        Canonical IP Addresses
                      </span>
                      <span className="text-[#F1F5F9] text-sm font-mono block">
                        {selectedCluster.canonicalIpAddresses.join(', ') || 'Unassigned'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        BIOS / Hardware UUID
                      </span>
                      <span className="text-[#10B981] text-xs font-mono truncate block">
                        {selectedCluster.canonicalBiosUuid || 'N/A (Non-virtualized or uncollected)'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        Cloud Resource ID / ARN
                      </span>
                      <span className="text-[#60A5FA] text-xs font-mono truncate block">
                        {selectedCluster.canonicalCloudResourceId || selectedCluster.representativeRecords[0]?.cloudInstanceId || 'N/A'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        Canonical MAC Address
                      </span>
                      <span className="text-[#F1F5F9] text-xs font-mono block">
                        {selectedCluster.representativeRecords[0]?.macAddress || 'N/A'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[#5F6875] text-[10px] font-bold uppercase tracking-wider block">
                        Operating System
                      </span>
                      <span className="text-[#F1F5F9] text-xs font-semibold block">
                        {selectedCluster.canonicalOs || 'Unknown OS'}
                      </span>
                    </div>
                  </div>

                  {/* Synthesis Explanation Card */}
                  <div className="p-4 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-2 text-xs">
                    <div className="font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#3B82F6]" />
                      <span>Deterministic Attribute Consolidation</span>
                    </div>
                    <p className="text-[#8B95A5] leading-relaxed">
                      {selectedCluster.clusterSummary || 'Cluster formed through matching hardware UUID, normalized hostnames, and compatible network telemetry across vulnerability scanning sources.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: CORRELATION EVIDENCE (Supporting vs Conflicting Rows) */}
              {/* ============================================================ */}
              {centerTab === 'evidence' && (
                <div className="space-y-5">
                  
                  {/* Top Evidence Summary Bar */}
                  <div className="p-3.5 rounded-xl bg-[#151A21] border border-[#1B2430] flex items-center justify-between text-xs text-[#8B95A5] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      <span className="font-bold text-[#F1F5F9] uppercase tracking-wider">CORRELATION EVIDENCE</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-[#10B981] font-bold">{matchedCount} / {evaluatedCount}</span> signals matched · <span className="text-[#F1F5F9] font-bold">{selectedCluster.confidence}%</span> confidence
                    </div>
                  </div>

                  {/* 1. SUPPORTING SIGNALS SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1B2430] pb-2 text-xs">
                      <span className="font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Supporting Signals</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#10B981] font-bold">
                        +{selectedCluster.correlationEvidence.reduce((sum, e) => sum + e.weight, 0)} pts total weight
                      </span>
                    </div>

                    {selectedCluster.correlationEvidence.length === 0 ? (
                      <p className="text-xs text-[#5F6875] italic py-2">No supporting signals evaluated.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedCluster.correlationEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="bg-[#151A21] border border-[#1B2430] hover:border-[#10B981]/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-[#F1F5F9] text-xs">
                                  {ev.name}
                                </div>
                                <div className="text-[11px] text-[#8B95A5] mt-0.5 leading-relaxed">
                                  {ev.description}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <span className="text-[10px] font-mono text-[#5F6875] bg-[#10141A] px-2 py-0.5 rounded border border-[#1B2430]">
                                {ev.id.replace('sig-', '').toUpperCase()}
                              </span>
                              <span className="font-mono font-bold text-[#10B981] text-xs">
                                +{ev.weight} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. CONFLICTING SIGNALS SECTION */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-[#1B2430] pb-2 text-xs">
                      <span className="font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Conflicting Signals</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#F59E0B] font-bold">
                        {selectedCluster.conflictingAttributes.reduce((sum, c) => sum + c.weight, 0)} pts penalty
                      </span>
                    </div>

                    {selectedCluster.conflictingAttributes.length === 0 ? (
                      <div className="p-3.5 rounded-xl bg-[#151A21] border border-[#10B981]/20 text-xs text-[#10B981] font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>Zero conflicting attributes detected. High deterministic correlation confidence.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedCluster.conflictingAttributes.map((conf) => (
                          <div
                            key={conf.id}
                            className="bg-[#151A21] border border-[#F59E0B]/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-[#F59E0B] text-xs">
                                  {conf.name}
                                </div>
                                <div className="text-[11px] text-[#8B95A5] mt-0.5 leading-relaxed">
                                  {conf.description}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <span className="text-[10px] font-mono text-[#F59E0B] bg-[#10141A] px-2 py-0.5 rounded border border-[#F59E0B]/30">
                                {conf.id.replace('conf-', '').toUpperCase()}
                              </span>
                              <span className="font-mono font-bold text-[#F59E0B] text-xs">
                                {conf.weight} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: RELATED FINDINGS (Compact Table / Rows)               */}
              {/* ============================================================ */}
              {centerTab === 'findings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8B95A5]">
                    <span>Vulnerability findings mapped to this asset group ({relatedFindings.length})</span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('findings')}
                        className="text-[#60A5FA] hover:text-[#93C5FD] font-medium flex items-center gap-1"
                      >
                        <span>Open Finding Correlation Workspace →</span>
                      </button>
                    )}
                  </div>

                  {relatedFindings.length === 0 ? (
                    <div className="bg-[#151A21] border border-[#1B2430] rounded-xl p-8 text-center text-xs text-[#5F6875] space-y-1">
                      <div className="font-medium text-[#8B95A5]">No vulnerability findings correlated to this asset</div>
                      <p>All ingested scans report clean vulnerability posture for this underlying asset group.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relatedFindings.map((f) => (
                        <div
                          key={f.findingId}
                          className="bg-[#151A21] border border-[#1B2430] rounded-xl p-4 text-xs space-y-2 transition hover:border-[#8B5CF6]/30"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {f.severity}
                              </span>
                              <span className="font-mono font-bold text-sm text-[#60A5FA]">
                                {f.vulnerabilityId}
                              </span>
                              <span className="text-[10px] font-mono text-[#5F6875]">
                                ({f.findingId})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B95A5]">
                              <span>Tool: <strong className="text-[#F1F5F9]">{f.sourceTool}</strong></span>
                              <span>·</span>
                              <span>CVSS: <strong className="text-[#F1F5F9]">{f.cvss}</strong></span>
                            </div>
                          </div>

                          <div className="font-semibold text-sm text-[#F1F5F9]">
                            {f.title}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#5F6875] pt-1 border-t border-[#1B2430]/60">
                            <span>Affected Asset: <strong className="text-[#8B95A5]">{selectedCluster.canonicalHostname}</strong></span>
                            <span>First: {f.firstObserved ? new Date(f.firstObserved).toLocaleDateString() : 'Active'} · Last: {f.lastObserved ? new Date(f.lastObserved).toLocaleDateString() : 'Active'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. AI ANALYST (Secondary Explanation Capability) */}
              <div className="bg-[#151A21] border border-[#A855F7]/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider">AI Analyst Explanation</span>
                      <span className="text-[10px] font-mono text-[#8B95A5] bg-[#10141A] px-1.5 py-0.5 rounded border border-[#1B2430]">Non-Authoritative</span>
                    </div>
                    <p className="text-xs text-[#8B95A5]">
                      Gemini explains the evidence. It does not determine correlation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onExplainAI(selectedCluster)}
                  className="px-3.5 py-2 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#E9D5FF] border border-[#A855F7]/40 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>Ask AI Analyst</span>
                </button>
              </div>

            </>
          ) : (
            <div className="p-12 text-center text-[#5F6875] text-sm">
              Select an asset group from the browser to investigate.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
