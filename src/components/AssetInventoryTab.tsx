import React, { useState, useMemo } from 'react';
import {
  UnderlyingAsset,
  AssetRecord,
  VulnerabilityFinding,
  FindingCorrelationGroup,
  AssetLifecycleStatus,
  LifecyclePolicyConfig,
  AssetArchiveRecord,
  ArchiveReason,
} from '../types/vulnfusion';
import {
  deriveAssetLifecycle,
  formatObservationDate,
  formatAgeDescription,
  DEFAULT_LIFECYCLE_POLICY,
} from '../utils/lifecycleUtils';
import {
  Server,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  Bug,
  Database,
  Layers,
  ArrowRight,
  Eye,
  Cpu,
  Globe,
  Info,
  Activity,
  Tag,
  X,
  HardDrive,
  Network,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Archive,
  RotateCcw,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import {
  AssetIntelligenceIcon,
  SourceIntelligenceIcon,
  AssetLifecycleIcon,
  RiskExposureIcon,
  UncertaintyRadarIcon,
  CloudInfrastructureIcon,
  DeterministicEvidenceIcon,
} from './icons/VulnFusionIcons';
import {
  getSourceVendorIcon,
  SourceLogo,
  AssetSourceDiscoveryBadge,
} from './icons/SourceVendorIcons';
import { ArchiveAssetModal } from './ArchiveAssetModal';
import { SimulateObservationModal } from './SimulateObservationModal';
import { LifecyclePolicyModal } from './LifecyclePolicyModal';

export type InventoryViewMode = 'ACTIVE' | 'ALL' | 'AGING' | 'STALE' | 'ARCHIVE_ELIGIBLE' | 'REVIEW_REQUIRED' | 'ARCHIVED';

interface AssetInventoryTabProps {
  clusters: UnderlyingAsset[];
  records: AssetRecord[];
  findings?: VulnerabilityFinding[];
  findingGroups?: FindingCorrelationGroup[];
  archives?: Record<string, AssetArchiveRecord>;
  lifecyclePolicy?: LifecyclePolicyConfig;
  onViewCorrelation: (assetGroupId: string) => void;
  onViewFindings: (assetGroupId: string) => void;
  onArchiveAsset?: (assetGroupId: string, reason: ArchiveReason, reasonText: string, notes: string) => void;
  onUnarchiveAsset?: (assetGroupId: string) => void;
  onSimulateObservation?: (newRecord: AssetRecord) => void;
  onUpdateLifecyclePolicy?: (newPolicy: LifecyclePolicyConfig) => void;
  externalSearchQuery?: string;
}

export const AssetInventoryTab: React.FC<AssetInventoryTabProps> = ({
  clusters,
  records,
  findings = [],
  findingGroups = [],
  archives = {},
  lifecyclePolicy = DEFAULT_LIFECYCLE_POLICY,
  onViewCorrelation,
  onViewFindings,
  onArchiveAsset,
  onUnarchiveAsset,
  onSimulateObservation,
  onUpdateLifecyclePolicy,
  externalSearchQuery = '',
}) => {
  // View and filter states
  const [inventoryView, setInventoryView] = useState<InventoryViewMode>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [osFilter, setOsFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'hostname' | 'records' | 'findings' | 'status' | 'lastSeen' | 'lifecycle'>('hostname');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modals state
  const [selectedAssetForProfile, setSelectedAssetForProfile] = useState<UnderlyingAsset | null>(null);
  const [assetToArchive, setAssetToArchive] = useState<UnderlyingAsset | null>(null);
  const [assetToSimulate, setAssetToSimulate] = useState<UnderlyingAsset | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [assetToRestore, setAssetToRestore] = useState<UnderlyingAsset | null>(null);

  // Helper to determine asset type
  const getAssetType = (hostname: string, summary: string): string => {
    const h = hostname.toUpperCase();
    const s = summary.toLowerCase();
    if (h.includes('WEB') || s.includes('web')) return 'Web Server';
    if (h.includes('API') || s.includes('api')) return 'API Gateway / Server';
    if (h.includes('FILE') || s.includes('file')) return 'File Server';
    if (h.includes('AD-') || h.includes('DIR') || s.includes('directory')) return 'Directory Server';
    if (h.includes('BACKUP') || s.includes('backup')) return 'Backup Server';
    if (h.includes('DEV') || s.includes('dev')) return 'Development Server';
    if (h.includes('MONITOR') || s.includes('monitor')) return 'Monitoring Server';
    if (h.includes('CI-') || h.includes('RUNNER') || s.includes('runner')) return 'Compute Runner';
    if (h.includes('K8S') || h.includes('KUBERNETES') || s.includes('k8s')) return 'Cloud Compute Node';
    if (h.includes('CLOUD-DB') || (h.includes('CLOUD') && h.includes('DB'))) return 'Cloud Database';
    if (h.includes('DB') || s.includes('database') || s.includes('sql')) return 'Database Server';
    if (h.includes('LAPTOP') || h.includes('WORKSTATION') || s.includes('workstation') || s.includes('endpoint')) return 'Endpoint Workstation';
    if (h.includes('PRINTER') || s.includes('printer')) return 'Network Device';
    if (h.includes('VPN') || s.includes('vpn')) return 'VPN Gateway Client';
    if (h.includes('CACHE') || s.includes('redis') || s.includes('memcached')) return 'Cache Server';
    if (h.includes('MAIL') || s.includes('gateway') || s.includes('mail')) return 'Mail Gateway';
    if (h.includes('WORKER') || s.includes('worker') || s.includes('cloud')) return 'Cloud Worker';
    if (h.includes('APP') || s.includes('application')) return 'Server';
    return 'Server';
  };

  // Helper to calculate asset contextual properties from its member records and findings
  const getAssetContext = (cluster: UnderlyingAsset) => {
    const memberRecords = records.filter(r => cluster.memberRecordIds.includes(r.recordId));
    const assetFindings = findings.filter(f => f.underlyingAssetGroupId === cluster.underlyingAssetId);
    const archiveRecord = archives[cluster.underlyingAssetId] || cluster.archiveMetadata;

    // Derived Lifecycle Intelligence with Configurable Policy & Archive State
    const lifecycle = deriveAssetLifecycle(
      cluster,
      records,
      new Date('2026-09-26T00:00:00Z'),
      lifecyclePolicy,
      archiveRecord
    );

    // Environment
    const envCandidate = memberRecords.find(r => r.environment)?.environment;
    const environment = envCandidate || (cluster.canonicalHostname.includes('WORKSTATION') ? 'Lab / Testing' : 'Production');

    // Criticality
    const critCandidate = memberRecords.find(r => r.criticality)?.criticality;
    let criticality = critCandidate;
    if (!criticality) {
      if (assetFindings.some(f => f.severity === 'CRITICAL')) criticality = 'CRITICAL';
      else if (assetFindings.some(f => f.severity === 'HIGH')) criticality = 'HIGH';
      else if (cluster.canonicalHostname.includes('DB') || cluster.canonicalHostname.includes('APP') || cluster.canonicalHostname.includes('WEB')) criticality = 'HIGH';
      else if (cluster.canonicalHostname.includes('MAIL') || cluster.canonicalHostname.includes('CACHE')) criticality = 'MEDIUM';
      else criticality = 'LOW';
    }

    // Operating System family
    const rawOs = cluster.canonicalOs || memberRecords.find(r => r.operatingSystem)?.operatingSystem || 'Linux';
    let osFamily = 'Linux';
    if (rawOs.toLowerCase().includes('windows')) osFamily = 'Windows';
    else if (rawOs.toLowerCase().includes('darwin') || rawOs.toLowerCase().includes('mac')) osFamily = 'macOS';

    // Source Tools
    const sourceTools = Array.from(new Set(memberRecords.map(r => r.sourceTool)));

    // Observation Methods
    const observationMethods = Array.from(new Set(memberRecords.map(r => r.observationMethod)));

    // Cloud attributes
    const cloudProvider = memberRecords.find(r => r.cloudProvider)?.cloudProvider || (cluster.canonicalCloudResourceId ? 'AWS' : null);
    const cloudRegion = memberRecords.find(r => r.cloudRegion)?.cloudRegion || (cloudProvider ? 'us-east-1' : null);
    const cloudAccountId = memberRecords.find(r => r.cloudAccountId)?.cloudAccountId || (cloudProvider ? '112233445566' : null);
    const cloudInstanceId = memberRecords.find(r => r.cloudInstanceId)?.cloudInstanceId || null;
    const cloudResourceId = cluster.canonicalCloudResourceId || memberRecords.find(r => r.cloudResourceId)?.cloudResourceId || null;

    // Platform attributes
    const osVersion = memberRecords.find(r => r.osVersion)?.osVersion || null;
    const osArchitecture = memberRecords.find(r => r.osArchitecture)?.osArchitecture || 'x86_64';
    const agentId = memberRecords.find(r => r.agentId)?.agentId || null;

    // Hardware attributes & Provenance
    const biosUuid = cluster.canonicalBiosUuid || memberRecords.find(r => r.biosUuid)?.biosUuid || null;
    const biosUuidSources = biosUuid ? Array.from(new Set(memberRecords.filter(r => r.biosUuid && r.biosUuid === biosUuid).map(r => r.sourceTool))) : [];
    const cloudResourceSources = cloudResourceId ? Array.from(new Set(memberRecords.filter(r => r.cloudResourceId || r.cloudInstanceId).map(r => r.sourceTool))) : [];

    // FQDN and MAC
    const fqdn = memberRecords.find(r => r.fqdn)?.fqdn || `${cluster.canonicalHostname.toLowerCase()}.internal.corp`;
    const macAddress = memberRecords.find(r => r.macAddress)?.macAddress || null;

    // Security Context
    const riskScore = memberRecords.find(r => typeof r.riskScore === 'number')?.riskScore || (assetFindings.length > 0 ? 78 : 35);
    const tags = Array.from(new Set(memberRecords.flatMap(r => r.tags || r.assetTags || [])));
    if (tags.length === 0) {
      tags.push(`env:${environment.toLowerCase()}`, `tier:${getAssetType(cluster.canonicalHostname, cluster.clusterSummary).toLowerCase().split(' ')[0]}`);
    }
    const businessUnit = memberRecords.find(r => r.businessUnit)?.businessUnit || (cluster.canonicalHostname.includes('DB') ? 'Core Data Engineering' : 'Enterprise Platform Services');

    return {
      assetType: getAssetType(cluster.canonicalHostname, cluster.clusterSummary),
      environment,
      criticality,
      osFamily,
      rawOs,
      sourceTools,
      observationMethods,
      lifecycle,
      firstObserved: lifecycle.firstSeen,
      lastObserved: lifecycle.lastSeen,
      memberRecords,
      assetFindings,
      findingsCount: assetFindings.length,
      recordsCount: memberRecords.length,
      cloudProvider,
      cloudRegion,
      cloudAccountId,
      cloudInstanceId,
      cloudResourceId,
      osVersion,
      osArchitecture,
      agentId,
      biosUuid,
      biosUuidSources,
      cloudResourceSources,
      fqdn,
      macAddress,
      riskScore,
      tags,
      businessUnit,
      archiveRecord,
    };
  };

  // Executive Top Metrics (Computed dynamically)
  const normalizedAssetsCount = clusters.length;
  const sourceRecordsCount = records.length;
  const securityFindingsCount = findings.length;
  const reviewRequiredCount = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const distinctSourceTools = Array.from(new Set(records.map(r => r.sourceTool)));

  // View Counts for Tabs
  const viewCounts = useMemo(() => {
    let active = 0;
    let all = clusters.length;
    let aging = 0;
    let stale = 0;
    let archiveEligible = 0;
    let reviewRequired = 0;
    let archived = 0;

    clusters.forEach(c => {
      const ctx = getAssetContext(c);
      if (ctx.lifecycle.isArchived) {
        archived++;
      } else {
        active++;
        if (ctx.lifecycle.lifecycleStatus === 'AGING') aging++;
        if (ctx.lifecycle.lifecycleStatus === 'STALE') stale++;
        if (ctx.lifecycle.isArchiveEligible) archiveEligible++;
        if (c.correlationStatus === 'REVIEW_REQUIRED') reviewRequired++;
      }
    });

    return { active, all, aging, stale, archiveEligible, reviewRequired, archived };
  }, [clusters, records, archives, lifecyclePolicy]);

  // Representation Density Data
  const representationDensity = useMemo(() => {
    const maxRecords = Math.max(...clusters.map(c => c.memberRecordIds.length), 1);
    return clusters.map(c => {
      const ctx = getAssetContext(c);
      return {
        hostname: c.canonicalHostname,
        id: c.underlyingAssetId,
        count: c.memberRecordIds.length,
        percentage: Math.round((c.memberRecordIds.length / maxRecords) * 100),
        status: c.correlationStatus,
        lifecycleStatus: ctx.lifecycle.lifecycleStatus,
        isArchived: ctx.lifecycle.isArchived,
        isArchiveEligible: ctx.lifecycle.isArchiveEligible,
        lastSeenFormatted: formatObservationDate(ctx.lifecycle.lastSeen),
        ageText: formatAgeDescription(ctx.lifecycle.ageSinceLastSeenDays),
        type: getAssetType(c.canonicalHostname, c.clusterSummary),
      };
    });
  }, [clusters, records, archives, lifecyclePolicy]);

  // Filter Options dynamically derived
  const filterOptions = useMemo(() => {
    const assetTypes = new Set<string>();
    const osFamilies = new Set<string>();
    const environments = new Set<string>();
    const criticalities = new Set<string>();

    clusters.forEach(c => {
      const ctx = getAssetContext(c);
      assetTypes.add(ctx.assetType);
      osFamilies.add(ctx.osFamily);
      environments.add(ctx.environment);
      criticalities.add(ctx.criticality);
    });

    return {
      assetTypes: Array.from(assetTypes),
      osFamilies: Array.from(osFamilies),
      environments: Array.from(environments),
      criticalities: Array.from(criticalities),
    };
  }, [clusters, records, findings, archives, lifecyclePolicy]);

  // Filter and Sort Table Rows
  const effectiveQuery = (externalSearchQuery || searchQuery).toLowerCase().trim();

  const filteredClusters = useMemo(() => {
    return clusters.filter(cluster => {
      const ctx = getAssetContext(cluster);

      // Primary View Mode Filter
      if (inventoryView === 'ACTIVE' && ctx.lifecycle.isArchived) return false;
      if (inventoryView === 'ARCHIVED' && !ctx.lifecycle.isArchived) return false;
      if (inventoryView === 'AGING' && (ctx.lifecycle.isArchived || ctx.lifecycle.lifecycleStatus !== 'AGING')) return false;
      if (inventoryView === 'STALE' && (ctx.lifecycle.isArchived || ctx.lifecycle.lifecycleStatus !== 'STALE')) return false;
      if (inventoryView === 'ARCHIVE_ELIGIBLE' && (!ctx.lifecycle.isArchiveEligible || ctx.lifecycle.isArchived)) return false;
      if (inventoryView === 'REVIEW_REQUIRED' && (ctx.lifecycle.isArchived || cluster.correlationStatus !== 'REVIEW_REQUIRED')) return false;

      // Search matching
      const matchesSearch = !effectiveQuery ||
        cluster.canonicalHostname.toLowerCase().includes(effectiveQuery) ||
        cluster.underlyingAssetId.toLowerCase().includes(effectiveQuery) ||
        ctx.assetType.toLowerCase().includes(effectiveQuery) ||
        ctx.rawOs.toLowerCase().includes(effectiveQuery) ||
        cluster.canonicalIpAddresses.some(ip => ip.includes(effectiveQuery)) ||
        cluster.memberRecordIds.some(id => id.toLowerCase().includes(effectiveQuery));

      if (!matchesSearch) return false;

      // Source tool filter
      if (sourceFilter !== 'ALL') {
        const hasSource = ctx.sourceTools.some(t => t.toUpperCase() === sourceFilter.toUpperCase());
        if (!hasSource) return false;
      }

      // Asset type filter
      if (typeFilter !== 'ALL' && ctx.assetType !== typeFilter) return false;

      // OS filter
      if (osFilter !== 'ALL' && ctx.osFamily !== osFilter) return false;

      // Environment filter
      if (envFilter !== 'ALL' && ctx.environment !== envFilter) return false;

      // Criticality filter
      if (criticalityFilter !== 'ALL' && ctx.criticality !== criticalityFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && cluster.correlationStatus !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      const ctxA = getAssetContext(a);
      const ctxB = getAssetContext(b);

      let comparison = 0;
      if (sortField === 'hostname') {
        comparison = a.canonicalHostname.localeCompare(b.canonicalHostname);
      } else if (sortField === 'records') {
        comparison = a.memberRecordIds.length - b.memberRecordIds.length;
      } else if (sortField === 'findings') {
        comparison = ctxA.findingsCount - ctxB.findingsCount;
      } else if (sortField === 'status') {
        comparison = a.correlationStatus.localeCompare(b.correlationStatus);
      } else if (sortField === 'lastSeen') {
        const dateA = ctxA.lifecycle.lastSeen ? new Date(ctxA.lifecycle.lastSeen).getTime() : 0;
        const dateB = ctxB.lifecycle.lastSeen ? new Date(ctxB.lifecycle.lastSeen).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortField === 'lifecycle') {
        comparison = ctxA.lifecycle.lifecycleStatus.localeCompare(ctxB.lifecycle.lifecycleStatus);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    clusters,
    records,
    findings,
    archives,
    lifecyclePolicy,
    inventoryView,
    effectiveQuery,
    sourceFilter,
    typeFilter,
    osFilter,
    envFilter,
    criticalityFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: 'hostname' | 'records' | 'findings' | 'status' | 'lastSeen' | 'lifecycle') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getToolBadge = (tool: string) => {
    return (
      <span
        key={tool}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#151A21] text-[#F1F5F9] border border-[#1B2430] shadow-xs"
        title={`${tool} discovery source`}
      >
        {getSourceVendorIcon(tool, 14)}
        <span>{tool}</span>
      </span>
    );
  };

  const getCriticalityBadge = (crit: string) => {
    switch (crit.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">Critical</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/25">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700/30 text-slate-400 border border-slate-700">Low</span>;
    }
  };

  const getLifecycleBadge = (lifecycle: any) => {
    if (lifecycle.isArchived) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 shadow-sm"
          title={`Archived: ${lifecycle.archiveRecord?.reasonText || 'Archived'}`}
        >
          <Archive className="w-3 h-3 text-slate-400" />
          Archived
        </span>
      );
    }

    if (lifecycle.wasAutoReactivated) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse"
          title={`Automatically reactivated by ${lifecycle.reactivatedBySource || 'new observation'}`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Reactivated
        </span>
      );
    }

    switch (lifecycle.lifecycleStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'AGING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Aging
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Stale
          </span>
        );
      case 'COVERAGE_DISAGREEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30" title="Sources disagree on observation timeline">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            Discrepancy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA] text-[11px] font-bold uppercase tracking-wider">
              <AssetIntelligenceIcon size={16} glow /> Non-Destructive Asset Inventory & Archive
            </div>
            <h1 className="text-3xl lg:text-[32px] font-semibold text-[#F1F5F9] tracking-tight leading-tight">
              Asset Inventory
            </h1>
            <p className="text-base text-[#8B95A5] leading-relaxed">
              Unified cross-scanner visibility with non-destructive asset archiving and automatic reactivation upon re-observation.
            </p>
          </div>

          {/* 2. Executive Metrics (Compact Dynamic Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-[#60A5FA]">
                <AssetIntelligenceIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">ACTIVE</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {viewCounts.active}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Active Assets</div>
            </div>

            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-[#3B82F6]">
                <SourceIntelligenceIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">INGESTED</span>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9] font-mono tabular-nums">
                {sourceRecordsCount}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Source Records</div>
            </div>

            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-amber-400">
                <AlertTriangle size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">ELIGIBLE</span>
              </div>
              <div className="text-2xl font-semibold text-amber-400 font-mono tabular-nums">
                {viewCounts.archiveEligible}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Archive Eligible</div>
            </div>

            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-slate-400">
                <Archive size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">ARCHIVED</span>
              </div>
              <div className="text-2xl font-semibold text-slate-300 font-mono tabular-nums">
                {viewCounts.archived}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Archived Assets</div>
            </div>

            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-[#F59E0B]">
                <UncertaintyRadarIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">REVIEW</span>
              </div>
              <div className="text-2xl font-semibold text-[#F59E0B] font-mono tabular-nums">
                {reviewRequiredCount}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Review Required</div>
            </div>

            <div className="bg-[#151A21] border border-[#1B2430] p-3.5 rounded-xl space-y-1 min-w-[105px]">
              <div className="flex items-center justify-between text-[#10B981]">
                <CloudInfrastructureIcon size={18} />
                <span className="text-[10px] font-mono text-[#5F6875] uppercase">SOURCES</span>
              </div>
              <div className="text-2xl font-semibold text-[#10B981] font-mono tabular-nums">
                {distinctSourceTools.length}
              </div>
              <div className="text-xs text-[#8B95A5] font-medium">Source Tools</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Inventory View Mode Selector & Policy Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#10141A] border border-[#1B2430] rounded-2xl p-3 sm:px-4 shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
          <button
            type="button"
            onClick={() => setInventoryView('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'ACTIVE'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] hover:bg-[#181E26]'
            }`}
          >
            <span>ACTIVE</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-[#10141A] text-[#8B95A5]'
            }`}>
              {viewCounts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryView('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'ALL'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] hover:bg-[#181E26]'
            }`}
          >
            <span>ALL</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#10141A] text-[#8B95A5]'
            }`}>
              {viewCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryView('AGING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'AGING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-amber-400 hover:bg-[#181E26]'
            }`}
          >
            <span>AGING</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'AGING' ? 'bg-white/20 text-white' : 'bg-[#10141A] text-[#8B95A5]'
            }`}>
              {viewCounts.aging}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryView('STALE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'STALE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-rose-400 hover:bg-[#181E26]'
            }`}
          >
            <span>STALE</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'STALE' ? 'bg-white/20 text-white' : 'bg-[#10141A] text-[#8B95A5]'
            }`}>
              {viewCounts.stale}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryView('ARCHIVE_ELIGIBLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'ARCHIVE_ELIGIBLE'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-[#151A21] text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ARCHIVE ELIGIBLE</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'ARCHIVE_ELIGIBLE' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {viewCounts.archiveEligible}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryView('ARCHIVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inventoryView === 'ARCHIVED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-slate-200 hover:bg-[#181E26]'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span>ARCHIVED</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              inventoryView === 'ARCHIVED' ? 'bg-white/20 text-white' : 'bg-[#10141A] text-[#8B95A5]'
            }`}>
              {viewCounts.archived}
            </span>
          </button>
        </div>

        {/* Right Policy Threshold Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPolicyModalOpen(true)}
            className="px-3 py-1.5 bg-[#151A21] hover:bg-[#181E26] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430] rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Archive Threshold: <strong className="text-[#F1F5F9] font-mono">{lifecyclePolicy.archiveEligibleThresholdDays}d</strong></span>
          </button>
        </div>

      </div>

      {/* 4. Search & Multi-Filter Controls */}
      <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#5F6875]" />
            <input
              type="text"
              placeholder="Search assets by hostname, IP, ID, or operating system..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F1F5F9] placeholder-[#5F6875] focus:outline-none focus:border-[#3B82F6]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[#5F6875] hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8B95A5] self-end md:self-auto">
            <span>Showing <strong className="text-[#F1F5F9] font-mono">{filteredClusters.length}</strong> of {clusters.length} assets</span>
            {(sourceFilter !== 'ALL' || typeFilter !== 'ALL' || osFilter !== 'ALL' || envFilter !== 'ALL' || criticalityFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery || inventoryView !== 'ACTIVE') && (
              <button
                onClick={() => {
                  setInventoryView('ACTIVE');
                  setSourceFilter('ALL');
                  setTypeFilter('ALL');
                  setOsFilter('ALL');
                  setEnvFilter('ALL');
                  setCriticalityFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[#60A5FA] hover:underline font-medium text-xs ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
          
          {/* Source Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">Source Tool</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All Sources</option>
              <option value="Qualys">Qualys</option>
              <option value="Tenable">Tenable</option>
              <option value="Rapid7">Rapid7</option>
              <option value="Wiz">Wiz</option>
            </select>
          </div>

          {/* Asset Type Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">Asset Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All Asset Types</option>
              {filterOptions.assetTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Operating System Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">OS Family</label>
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All OS</option>
              {filterOptions.osFamilies.map(os => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>

          {/* Environment Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">Environment</label>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All Environments</option>
              {filterOptions.environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          {/* Criticality Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">Criticality</label>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All Criticalities</option>
              {filterOptions.criticalities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#5F6875] uppercase block mb-1">Correlation Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1B2430] text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3B82F6]/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="CORRELATED">CORRELATED</option>
              <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
              <option value="SEPARATE">SEPARATE</option>
            </select>
          </div>

        </div>

        {/* Quick Vendor Source Filters (Section 12) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#1B2430]/60 text-xs">
          <span className="text-[10px] font-mono text-[#5F6875] uppercase mr-1">Filter by Source:</span>
          <button
            type="button"
            onClick={() => setSourceFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              sourceFilter === 'ALL'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter(sourceFilter === 'Qualys' ? 'ALL' : 'Qualys')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === 'Qualys'
                ? 'bg-rose-950/60 border border-rose-500 text-rose-200'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
            }`}
          >
            <SourceLogo sourceTool="Qualys" size={14} />
            <span>Qualys</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter(sourceFilter === 'Tenable' ? 'ALL' : 'Tenable')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === 'Tenable'
                ? 'bg-blue-950/60 border border-blue-500 text-blue-200'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
            }`}
          >
            <SourceLogo sourceTool="Tenable" size={14} />
            <span>Tenable</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter(sourceFilter === 'Rapid7' ? 'ALL' : 'Rapid7')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === 'Rapid7'
                ? 'bg-orange-950/60 border border-orange-500 text-orange-200'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
            }`}
          >
            <SourceLogo sourceTool="Rapid7" size={14} />
            <span>Rapid7</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter(sourceFilter === 'Wiz' ? 'ALL' : 'Wiz')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === 'Wiz'
                ? 'bg-sky-950/60 border border-sky-500 text-sky-200'
                : 'bg-[#151A21] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430]'
            }`}
          >
            <SourceLogo sourceTool="Wiz" size={14} />
            <span>Wiz</span>
          </button>
        </div>
      </div>

      {/* 5. Inventory Table (Desktop & Tablet >= 768px) */}
      <div className="hidden md:block bg-[#10141A] border border-[#1B2430] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1B2430] text-[#5F6875] text-[10px] font-mono uppercase tracking-wider bg-[#151A21]/60 select-none">
                <th
                  onClick={() => handleSort('hostname')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#F1F5F9] transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Asset</span>
                    <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                  </div>
                </th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Operating System</th>
                <th className="py-3.5 px-3">IP Address</th>
                <th className="py-3.5 px-3">Sources</th>
                <th
                  onClick={() => handleSort('records')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-[#F1F5F9] transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Records</span>
                    <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('findings')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-[#F1F5F9] transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Findings</span>
                    <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lastSeen')}
                  className="py-3.5 px-3 cursor-pointer hover:text-[#F1F5F9] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Last Observed</span>
                    <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lifecycle')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-[#F1F5F9] transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Visibility</span>
                    <ArrowUpDown className="w-3 h-3 text-[#5F6875]" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">Eligibility / Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2430]/60 text-[#8B95A5]">
              {filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-[#5F6875] text-xs">
                    No assets match your search and filter criteria in the current view ({inventoryView}).
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster) => {
                  const ctx = getAssetContext(cluster);

                  return (
                    <tr
                      key={cluster.underlyingAssetId}
                      onClick={() => setSelectedAssetForProfile(cluster)}
                      className="hover:bg-[#151A21] cursor-pointer transition group"
                    >
                      {/* Asset Name + ID with Official Vendor Discovery Source Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AssetSourceDiscoveryBadge
                            sourceTools={ctx.sourceTools}
                            observationSummaries={ctx.lifecycle.sourceObservationSummary}
                            size={20}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-[#F1F5F9] group-hover:text-[#60A5FA] transition flex items-center gap-2">
                              <span className="truncate">{cluster.canonicalHostname}</span>
                              {ctx.lifecycle.isArchiveEligible && !ctx.lifecycle.isArchived && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase shrink-0">
                                  Eligible
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-[#5F6875]">
                              {cluster.underlyingAssetId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-3">
                        <span className="text-[#F1F5F9] font-medium text-xs">
                          {ctx.assetType}
                        </span>
                      </td>

                      {/* Operating System */}
                      <td className="py-3.5 px-3">
                        <span className="text-[#8B95A5] text-xs truncate max-w-[130px] block">
                          {cluster.canonicalOs || 'Linux'}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-3 font-mono text-xs text-[#F1F5F9]">
                        {cluster.canonicalIpAddresses[0] || 'Unassigned'}
                        {cluster.canonicalIpAddresses.length > 1 && (
                          <span className="text-[10px] text-[#5F6875] ml-1">
                            +{cluster.canonicalIpAddresses.length - 1}
                          </span>
                        )}
                      </td>

                      {/* Sources */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          {ctx.sourceTools.map(tool => getToolBadge(tool))}
                        </div>
                      </td>

                      {/* Records Count */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-[#F1F5F9]">
                        {cluster.memberRecordIds.length}
                      </td>

                      {/* Findings Count */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-sm">
                        <span className={ctx.findingsCount > 0 ? 'text-[#C084FC]' : 'text-[#5F6875]'}>
                          {ctx.findingsCount}
                        </span>
                      </td>

                      {/* Last Observed Date + Age */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-xs text-[#F1F5F9]">
                          {formatObservationDate(ctx.lifecycle.lastSeen)}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-sans">
                          {formatAgeDescription(ctx.lifecycle.ageSinceLastSeenDays)}
                        </div>
                      </td>

                      {/* Visibility / Lifecycle Status */}
                      <td className="py-3.5 px-3 text-center">
                        {getLifecycleBadge(ctx.lifecycle)}
                      </td>

                      {/* Eligibility / Correlation Status */}
                      <td className="py-3.5 px-3 text-center">
                        {ctx.lifecycle.isArchiveEligible && !ctx.lifecycle.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Archive Eligible
                          </span>
                        ) : ctx.lifecycle.isArchived ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            Preserved
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            cluster.correlationStatus === 'CORRELATED'
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                              : cluster.correlationStatus === 'REVIEW_REQUIRED'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {cluster.correlationStatus === 'REVIEW_REQUIRED' ? 'REVIEW' : cluster.correlationStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Profile Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAssetForProfile(cluster)}
                            className="px-2 py-1 bg-[#10141A] hover:bg-[#181E26] text-[#3B82F6] border border-[#1B2430] rounded-lg text-xs font-medium transition"
                            title="View Asset Profile"
                          >
                            Profile
                          </button>

                          {/* If Archived: Show Restore & Ingest Re-observation */}
                          {ctx.lifecycle.isArchived ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUnarchiveAsset && onUnarchiveAsset(cluster.underlyingAssetId)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-medium transition flex items-center gap-1"
                                title="Restore to Active Inventory"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setAssetToSimulate(cluster)}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
                                title="Simulate Telemetry Re-Observation to Test Automatic Reactivation"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Simulate Ingest</span>
                              </button>
                            </>
                          ) : (
                            /* If Active / Archive Eligible: Show Archive Button */
                            <button
                              type="button"
                              onClick={() => setAssetToArchive(cluster)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                                ctx.lifecycle.isArchiveEligible
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                                  : 'bg-[#10141A] hover:bg-rose-500/10 text-[#8B95A5] hover:text-rose-400 border border-[#1B2430]'
                              }`}
                              title={ctx.lifecycle.isArchiveEligible ? 'Asset is Archive Eligible' : 'Archive asset'}
                            >
                              <Archive className="w-3 h-3" />
                              <span>Archive</span>
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Mobile Stacked Asset Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        <div className="text-xs text-[#8B95A5] px-1">
          Showing {filteredClusters.length} assets ({inventoryView})
        </div>

        {filteredClusters.length === 0 ? (
          <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl p-6 text-center text-[#5F6875] text-xs">
            No assets match your search and filter criteria.
          </div>
        ) : (
          filteredClusters.map(cluster => {
            const ctx = getAssetContext(cluster);

            return (
              <div
                key={cluster.underlyingAssetId}
                onClick={() => setSelectedAssetForProfile(cluster)}
                className="bg-[#10141A] border border-[#1B2430] hover:border-[#3B82F6]/50 rounded-2xl p-4 space-y-3 shadow-sm text-xs cursor-pointer transition"
              >
                {/* Top: Asset Hostname + Source Vendor Icon + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AssetSourceDiscoveryBadge
                      sourceTools={ctx.sourceTools}
                      observationSummaries={ctx.lifecycle.sourceObservationSummary}
                      size={20}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#F1F5F9] truncate">{cluster.canonicalHostname}</div>
                      <div className="text-[10px] font-mono text-[#5F6875]">{cluster.underlyingAssetId}</div>
                    </div>
                  </div>

                  {getLifecycleBadge(ctx.lifecycle)}
                </div>

                {/* Subtitle: Type & OS */}
                <div className="flex items-center justify-between text-[#8B95A5] text-[11px]">
                  <span>{ctx.assetType}</span>
                  <span>{cluster.canonicalOs || 'Linux'}</span>
                </div>

                {/* Observation & Visibility Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1B2430] text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#5F6875]" />
                    <span>Last Seen: <strong className="text-[#F1F5F9] font-mono">{formatObservationDate(ctx.lifecycle.lastSeen)}</strong></span>
                  </div>
                  <span className="font-mono text-emerald-400">({formatAgeDescription(ctx.lifecycle.ageSinceLastSeenDays)})</span>
                </div>

                {/* Archive Eligibility Banner on Mobile */}
                {ctx.lifecycle.isArchiveEligible && !ctx.lifecycle.isArchived && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-amber-300 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Archive Eligible ({ctx.lifecycle.ageSinceLastSeenDays}d / {lifecyclePolicy.archiveEligibleThresholdDays}d threshold)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssetToArchive(cluster);
                      }}
                      className="px-2 py-0.5 bg-amber-500 text-black font-bold rounded text-[10px]"
                    >
                      Archive
                    </button>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1B2430] text-[11px]">
                  <div className="flex items-center gap-3 font-mono">
                    <span><strong className="text-[#F1F5F9]">{cluster.memberRecordIds.length}</strong> recs</span>
                    <span><strong className={ctx.findingsCount > 0 ? 'text-[#C084FC]' : 'text-[#8B95A5]'}>{ctx.findingsCount}</strong> vulns</span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {ctx.lifecycle.isArchived ? (
                      <button
                        type="button"
                        onClick={() => onUnarchiveAsset && onUnarchiveAsset(cluster.underlyingAssetId)}
                        className="text-slate-300 font-medium underline"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAssetForProfile(cluster)}
                        className="text-[#60A5FA] font-medium"
                      >
                        Profile →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7. ASSET PROFILE SLIDE-OVER DRAWER / MODAL */}
      {selectedAssetForProfile && (() => {
        const ctx = getAssetContext(selectedAssetForProfile);
        const matched = selectedAssetForProfile.correlationEvidence.length;
        const conflicts = selectedAssetForProfile.conflictingAttributes.length;
        const evaluated = matched + conflicts;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
            <div className="bg-[#10141A] border border-[#1B2430] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#F1F5F9] my-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#1B2430] bg-[#151A21] shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-[#60A5FA] tracking-wider flex items-center gap-1.5">
                      <AssetSourceDiscoveryBadge
                        sourceTools={ctx.sourceTools}
                        observationSummaries={ctx.lifecycle.sourceObservationSummary}
                        size={16}
                      />
                      <span>ASSET PROFILE</span>
                    </span>
                    <span className="text-[#5F6875]">·</span>
                    <span className="text-xs font-mono text-[#8B95A5]">{selectedAssetForProfile.underlyingAssetId}</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <AssetSourceDiscoveryBadge
                        sourceTools={ctx.sourceTools}
                        observationSummaries={ctx.lifecycle.sourceObservationSummary}
                        size={24}
                      />
                      <h3 className="text-2xl font-bold text-[#F1F5F9]">
                        {selectedAssetForProfile.canonicalHostname}
                      </h3>
                    </div>
                    {getLifecycleBadge(ctx.lifecycle)}
                    <span className="text-xs font-mono font-semibold text-[#F1F5F9] bg-[#10141A] px-2 py-0.5 rounded border border-[#1B2430]">
                      {selectedAssetForProfile.confidence}% confidence
                    </span>
                  </div>

                  <div className="text-xs text-[#8B95A5] font-medium pt-0.5">
                    {ctx.assetType}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-2.5 text-xs text-[#8B95A5] pt-1.5 flex-wrap">
                    <span className="font-medium text-[#F1F5F9]">{selectedAssetForProfile.memberRecordIds.length} source records</span>
                    <span aria-hidden="true" className="text-[#5F6875]">·</span>
                    <span className="font-medium text-[#F1F5F9]">{ctx.findingsCount} related findings</span>
                    <span aria-hidden="true" className="text-[#5F6875]">·</span>
                    <span className="font-medium text-[#10B981]">{matched}/{evaluated} signals matched</span>
                    <span aria-hidden="true" className="text-[#5F6875]">·</span>
                    <span className={`font-medium ${conflicts > 0 ? 'text-[#F59E0B]' : 'text-[#8B95A5]'}`}>
                      {conflicts} conflicts
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAssetForProfile(null)}
                  className="p-2 rounded-xl text-[#8B95A5] hover:text-[#F1F5F9] hover:bg-[#10141A] transition"
                  aria-label="Close Asset Profile"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                
                {/* 1. IDENTITY SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B2430] pb-2">
                    <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                      1. Identity Profile (Authoritative Signals)
                    </h4>
                    <span className="text-[10px] font-mono text-[#5F6875]">Correlation Anchor</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Canonical Hostname</span>
                      <span className="font-semibold text-[#F1F5F9] text-sm block">{selectedAssetForProfile.canonicalHostname}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Fully Qualified Domain Name (FQDN)</span>
                      <span className="font-mono text-[#F1F5F9] text-xs block">{ctx.fqdn}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">IP Addresses</span>
                      <span className="font-mono text-[#F1F5F9] text-xs block">{selectedAssetForProfile.canonicalIpAddresses.join(', ') || 'Unassigned'}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">MAC Address</span>
                      <span className="font-mono text-[#F1F5F9] text-xs block">{ctx.macAddress || 'N/A'}</span>
                    </div>

                    {ctx.biosUuid && (
                      <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1 sm:col-span-2">
                        <span className="text-[10px] font-mono uppercase text-[#5F6875] block">BIOS / Hardware UUID</span>
                        <span className="font-mono text-[#10B981] text-xs truncate block">{ctx.biosUuid}</span>
                      </div>
                    )}

                    {ctx.cloudResourceId && (
                      <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1 sm:col-span-2">
                        <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Cloud Resource ID / ARN</span>
                        <span className="font-mono text-[#60A5FA] text-xs truncate block">{ctx.cloudResourceId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. OBSERVATION & LIFECYCLE INTELLIGENCE WITH ARCHIVE CONTROLS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B2430] pb-2">
                    <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      2. Observation History & Visibility Intelligence
                    </h4>
                    <span className="text-[10px] font-mono text-[#5F6875]">Lifecycle & Recency</span>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">First Seen</span>
                      <span className="font-mono font-bold text-sm text-[#F1F5F9] block">
                        {formatObservationDate(ctx.lifecycle.firstSeen)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Last Seen</span>
                      <span className="font-mono font-bold text-sm text-[#F1F5F9] block">
                        {formatObservationDate(ctx.lifecycle.lastSeen)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Age Since Last Seen</span>
                      <span className="font-mono font-bold text-sm text-emerald-400 block">
                        {formatAgeDescription(ctx.lifecycle.ageSinceLastSeenDays)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Archive Threshold</span>
                      <span className="font-mono font-bold text-sm text-[#3B82F6] block">
                        {lifecyclePolicy.archiveEligibleThresholdDays} days
                      </span>
                    </div>
                  </div>

                  {/* If Archived: Show Full Preserved Details Banner */}
                  {ctx.lifecycle.isArchived && (
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                          <Archive className="w-4 h-4 text-slate-400" />
                          Archived Asset Record (Preserved)
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Archived: {formatObservationDate(ctx.archiveRecord?.archivedAt)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div>
                          <strong className="text-slate-400">Reason:</strong> {ctx.archiveRecord?.reasonText || 'Asset decommissioned'}
                        </div>
                        <div>
                          <strong className="text-slate-400">Archived By:</strong> {ctx.archiveRecord?.archivedBy || 'analyst@vulnfusion.internal'}
                        </div>
                      </div>
                      {ctx.archiveRecord?.archiveNotes && (
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                          <strong>Notes:</strong> {ctx.archiveRecord.archiveNotes}
                        </div>
                      )}
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onUnarchiveAsset) onUnarchiveAsset(selectedAssetForProfile.underlyingAssetId);
                            setSelectedAssetForProfile(null);
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Asset to Active Inventory</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAssetToSimulate(selectedAssetForProfile)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Simulate Fresh Telemetry Scan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If Archive Eligible (and not archived): Display Prompt */}
                  {ctx.lifecycle.isArchiveEligible && !ctx.lifecycle.isArchived && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-amber-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Archive Eligible Candidate
                        </span>
                        <span className="text-[10px] font-mono">
                          {ctx.lifecycle.ageSinceLastSeenDays}d inactive &gt;= {lifecyclePolicy.archiveEligibleThresholdDays}d threshold
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300/90 leading-relaxed">
                        This asset has been inactive for {ctx.lifecycle.ageSinceLastSeenDays} days. It is eligible for non-destructive archiving to clean active dashboards while preserving identity, history, and findings.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAssetToArchive(selectedAssetForProfile)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive Asset Now</span>
                      </button>
                    </div>
                  )}

                  {/* Multi-Scanner Observation Breakdown Table */}
                  <div className="bg-[#151A21] rounded-xl border border-[#1B2430] overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-[#10141A] border-b border-[#1B2430] flex items-center justify-between text-[11px] font-semibold text-[#F1F5F9]">
                      <span className="flex items-center gap-1.5">
                        <SourceIntelligenceIcon size={14} glow={false} />
                        <span>Source Scanner Observation Matrix</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#5F6875]">Deterministic Recency</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#1B2430] text-[#5F6875] text-[10px] font-mono uppercase bg-[#151A21]/50">
                            <th className="py-2.5 px-3.5">Source Tool</th>
                            <th className="py-2.5 px-3 text-right">Records</th>
                            <th className="py-2.5 px-3">Telemetry Mode</th>
                            <th className="py-2.5 px-3">First Seen</th>
                            <th className="py-2.5 px-3">Last Seen</th>
                            <th className="py-2.5 px-3.5 text-right">Recency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B2430]/60 text-[#8B95A5]">
                          {ctx.lifecycle.sourceObservationSummary.map(src => (
                            <tr key={src.sourceTool} className="hover:bg-[#10141A]/50">
                              <td className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2">
                                  {getSourceVendorIcon(src.sourceTool, 18)}
                                  <span className="font-bold text-[#F1F5F9] text-xs">{src.sourceTool}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F1F5F9]">
                                {src.recordCount}
                              </td>
                              <td className="py-2.5 px-3 capitalize">
                                {src.observationMethods.map(m => m.replace(/_/g, ' ')).join(', ')}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {formatObservationDate(src.firstSeen)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#F1F5F9]">
                                {formatObservationDate(src.lastSeen)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono">
                                {src.status === 'ACTIVE' && (
                                  <span className="text-emerald-400 font-semibold">{formatAgeDescription(src.ageDays)}</span>
                                )}
                                {src.status === 'AGING' && (
                                  <span className="text-amber-400 font-semibold">{formatAgeDescription(src.ageDays)}</span>
                                )}
                                {src.status === 'STALE' && (
                                  <span className="text-rose-400 font-semibold">{formatAgeDescription(src.ageDays)}</span>
                                )}
                                {src.status === 'NOT_REPORTING' && (
                                  <span className="text-[#5F6875]">Inactive</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Complete Discovery Sources History Cards (Section 13) */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-mono uppercase text-[#5F6875] tracking-wider font-bold">
                      Discovery Sources History & Provenance
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {ctx.lifecycle.sourceObservationSummary.map(src => (
                        <div
                          key={src.sourceTool}
                          className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSourceVendorIcon(src.sourceTool, 22)}
                              <span className="font-bold text-[#F1F5F9]">{src.sourceTool}</span>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              src.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              src.status === 'AGING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              src.status === 'STALE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {src.status}
                            </span>
                          </div>

                          <div className="space-y-1 font-mono text-[11px] text-[#8B95A5]">
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6875]">First Seen:</span>
                              <span className="text-[#F1F5F9]">{formatObservationDate(src.firstSeen)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6875]">Last Seen:</span>
                              <span className="text-[#F1F5F9]">{formatObservationDate(src.lastSeen)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6875]">Telemetry Records:</span>
                              <span className="text-[#38BDF8] font-bold">{src.recordCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. PLATFORM SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B2430] pb-2">
                    <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#A855F7]" />
                      3. Platform & System Profile
                    </h4>
                    <span className="text-[10px] font-mono text-[#5F6875]">Operating System</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Operating System</span>
                      <span className="font-semibold text-[#F1F5F9] block">{selectedAssetForProfile.canonicalOs || 'Linux'}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Architecture</span>
                      <span className="font-mono text-[#F1F5F9] block">{ctx.osArchitecture}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Agent Status</span>
                      <span className="font-mono text-[#10B981] block">
                        {ctx.agentId ? 'Active Agent Present' : 'Agentless Ingestion'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. INFRASTRUCTURE SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B2430] pb-2">
                    <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#3B82F6]" />
                      4. Infrastructure & Deployment
                    </h4>
                    <span className="text-[10px] font-mono text-[#5F6875]">Hosting Fabric</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Environment</span>
                      <span className="font-semibold text-[#F1F5F9] block">{ctx.environment}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Provider</span>
                      <span className="font-medium text-[#F1F5F9] block">{ctx.cloudProvider || 'Enterprise On-Premises'}</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Region / DC</span>
                      <span className="font-mono text-[#F1F5F9] block">{ctx.cloudRegion || 'datacenter-east'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. SECURITY CONTEXT SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B2430] pb-2">
                    <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#F59E0B]" />
                      5. Security & Business Context
                    </h4>
                    <span className="text-[10px] font-mono text-[#5F6875]">Non-Identity Attributes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Criticality Tier</span>
                      <div>{getCriticalityBadge(ctx.criticality)}</div>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Risk Score</span>
                      <span className="font-mono font-bold text-sm text-[#F1F5F9] block">{ctx.riskScore} / 100</span>
                    </div>

                    <div className="p-3 bg-[#151A21] rounded-xl border border-[#1B2430] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#5F6875] block">Business Unit</span>
                      <span className="font-medium text-[#F1F5F9] truncate block">{ctx.businessUnit}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#1B2430] bg-[#151A21] shrink-0">
                <span className="text-xs text-[#5F6875] font-mono">
                  Normalized Asset: {selectedAssetForProfile.canonicalHostname}
                </span>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const assetId = selectedAssetForProfile.underlyingAssetId;
                      setSelectedAssetForProfile(null);
                      onViewCorrelation(assetId);
                    }}
                    className="px-3.5 py-2 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#60A5FA] border border-[#3B82F6]/40 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View Correlation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const assetId = selectedAssetForProfile.underlyingAssetId;
                      setSelectedAssetForProfile(null);
                      onViewFindings(assetId);
                    }}
                    className="px-3.5 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C084FC] border border-[#8B5CF6]/40 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>View Findings ({ctx.findingsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAssetForProfile(null)}
                    className="px-3.5 py-2 bg-[#10141A] hover:bg-[#181E26] text-[#8B95A5] hover:text-[#F1F5F9] border border-[#1B2430] rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 8. ARCHIVE ASSET MODAL */}
      <ArchiveAssetModal
        asset={assetToArchive}
        records={records}
        findings={findings}
        archiveThresholdDays={lifecyclePolicy.archiveEligibleThresholdDays}
        onClose={() => setAssetToArchive(null)}
        onConfirmArchive={(assetGroupId, reason, reasonText, notes) => {
          if (onArchiveAsset) {
            onArchiveAsset(assetGroupId, reason, reasonText, notes);
          }
          if (selectedAssetForProfile?.underlyingAssetId === assetGroupId) {
            setSelectedAssetForProfile(null);
          }
        }}
      />

      {/* 9. SIMULATE TELEMETRY OBSERVATION MODAL */}
      <SimulateObservationModal
        asset={assetToSimulate}
        records={records}
        onClose={() => setAssetToSimulate(null)}
        onSimulateObservation={(newRecord) => {
          if (onSimulateObservation) {
            onSimulateObservation(newRecord);
          }
        }}
      />

      {/* 10. LIFECYCLE POLICY MODAL */}
      <LifecyclePolicyModal
        policy={lifecyclePolicy}
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onSavePolicy={(newPolicy) => {
          if (onUpdateLifecyclePolicy) {
            onUpdateLifecyclePolicy(newPolicy);
          }
        }}
      />

    </div>
  );
};
