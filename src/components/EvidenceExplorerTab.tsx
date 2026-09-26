import React, { useState } from 'react';
import { AssetRecord, UnderlyingAsset, SourceTool } from '../types/vulnfusion';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Calendar,
  Layers,
  FileCode
} from 'lucide-react';
import {
  DeterministicEvidenceIcon,
  SourceIntelligenceIcon,
  AssetIntelligenceIcon,
  SecurityIntelligenceIcon,
  CloudInfrastructureIcon,
} from './icons/VulnFusionIcons';
import { SourceLogo } from './SourceLogo';

interface EvidenceExplorerTabProps {
  records: AssetRecord[];
  clusters?: UnderlyingAsset[];
  onNavigateTab?: (tab: 'overview' | 'correlation' | 'findings' | 'evidence' | 'tests') => void;
  externalSearchQuery?: string;
}

export const EvidenceExplorerTab: React.FC<EvidenceExplorerTabProps> = ({
  records,
  clusters = [],
  onNavigateTab,
  externalSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<'ALL' | 'QUALYS' | 'TENABLE' | 'RAPID7' | 'WIZ'>('ALL');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.recordId || '');
  const [isRawExpanded, setIsRawExpanded] = useState(false);

  const activeQuery = (externalSearchQuery || searchQuery).toLowerCase().trim();

  // Derive unique tools present in dataset
  const uniqueTools = Array.from(new Set(records.map(r => r.sourceTool)));

  // Filter records by tool and search query
  const filteredRecords = records.filter(r => {
    const matchesTool =
      selectedTool === 'ALL' || r.sourceTool.toUpperCase() === selectedTool;
    
    const q = activeQuery;
    const matchesSearch =
      !q ||
      r.recordId.toLowerCase().includes(q) ||
      (r.hostname && r.hostname.toLowerCase().includes(q)) ||
      (r.fqdn && r.fqdn.toLowerCase().includes(q)) ||
      r.ipAddresses.some(ip => ip.includes(q)) ||
      (r.macAddress && r.macAddress.toLowerCase().includes(q)) ||
      (r.agentId && r.agentId.toLowerCase().includes(q)) ||
      (r.operatingSystem && r.operatingSystem.toLowerCase().includes(q));

    return matchesTool && matchesSearch;
  });

  // Selected record or fallback to first filtered record
  const selectedRecord =
    filteredRecords.find(r => r.recordId === selectedRecordId) ||
    filteredRecords[0] ||
    null;

  // Find associated underlying asset cluster if present
  const associatedCluster = selectedRecord
    ? clusters.find(c => c.memberRecordIds.includes(selectedRecord.recordId))
    : null;

  // Related member records in the same cluster
  const relatedRecords = associatedCluster
    ? records.filter(
        r =>
          associatedCluster.memberRecordIds.includes(r.recordId) &&
          r.recordId !== selectedRecord?.recordId
      )
    : [];

  // Helper for source tool visual accents
  const getToolIdentity = (tool: SourceTool) => {
    switch (tool) {
      case 'Qualys':
        return {
          badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dotColor: 'bg-blue-400',
          label: 'QUALYS',
        };
      case 'Tenable':
        return {
          badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          dotColor: 'bg-violet-400',
          label: 'TENABLE',
        };
      case 'Rapid7':
        return {
          badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          dotColor: 'bg-orange-400',
          label: 'RAPID7',
        };
      case 'Wiz':
        return {
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dotColor: 'bg-emerald-400',
          label: 'WIZ',
        };
      default:
        return {
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          dotColor: 'bg-slate-400',
          label: (tool as string).toUpperCase(),
        };
    }
  };

  // Helper for formatted dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
      
      {/* 1. Page Header & Summary Metrics */}
      <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#1A222D] pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <SourceIntelligenceIcon size={16} glow /> Deterministic Telemetry Workspace
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              RAW TELEMETRY INSPECTOR
            </h1>
            <p className="text-sm text-[#94A3B8]">
              Inspect source scanner records before and after deterministic correlation.
            </p>
          </div>

          {/* Compact Summary Metrics */}
          <div className="flex items-center gap-4 sm:gap-6 bg-[#151A21] border border-[#1E2631] px-5 py-3 rounded-xl shrink-0">
            <div className="flex items-center gap-3">
              <SourceIntelligenceIcon size={22} />
              <div>
                <div className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums">
                  {records.length}
                </div>
                <div className="text-xs text-[#94A3B8] font-medium">Source Records</div>
              </div>
            </div>
            <div className="w-px h-8 bg-[#26303E]" />
            <div className="flex items-center gap-3">
              <AssetIntelligenceIcon size={22} />
              <div>
                <div className="text-2xl font-extrabold text-blue-400 font-mono tabular-nums">
                  {clusters.length > 0 ? clusters.length : 8}
                </div>
                <div className="text-xs text-[#94A3B8] font-medium">Underlying Assets</div>
              </div>
            </div>
            <div className="w-px h-8 bg-[#26303E]" />
            <div className="flex items-center gap-3">
              <CloudInfrastructureIcon size={22} />
              <div>
                <div className="text-2xl font-extrabold text-slate-200 font-mono tabular-nums">
                  {uniqueTools.length}
                </div>
                <div className="text-xs text-[#94A3B8] font-medium">Source Tools</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tool Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-88">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151A21] border border-[#1E2631] rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-200 placeholder-[#64748B] focus:outline-none focus:border-blue-500/50 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#151A21] p-1.5 rounded-xl border border-[#1E2631] w-full sm:w-auto overflow-x-auto">
            {(['ALL', 'QUALYS', 'TENABLE', 'RAPID7', 'WIZ'] as const).map(tool => {
              const isSelected = selectedTool === tool;
              return (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-slate-200 hover:bg-[#181E26]'
                  }`}
                >
                  {tool !== 'ALL' && <SourceLogo sourceTool={tool} size={14} />}
                  <span>{tool}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout: Left Panel (~30-32%) | Right Panel (~68-70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Compact Record Browser */}
        <div className="lg:col-span-4 bg-[#10141A] border border-[#1A222D] rounded-2xl p-4 space-y-3 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] px-2 py-1 border-b border-[#1A222D] pb-2.5">
            <span>SOURCE RECORDS ({filteredRecords.length})</span>
            <span>STATUS</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[720px] pr-1">
            {filteredRecords.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-xs">
                No source records match filter
              </div>
            ) : (
              filteredRecords.map((record) => {
                const isSelected = selectedRecord?.recordId === record.recordId;
                const toolInfo = getToolIdentity(record.sourceTool);
                const recordCluster = clusters.find(c => c.memberRecordIds.includes(record.recordId));
                const status = recordCluster ? recordCluster.correlationStatus : 'SEPARATE';
                const groupId = recordCluster ? recordCluster.underlyingAssetId : null;

                return (
                  <button
                    key={record.recordId}
                    onClick={() => setSelectedRecordId(record.recordId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#151A21] border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                        : 'bg-[#151A21]/40 border-[#1E2631]/60 hover:bg-[#151A21] hover:border-[#26303E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <SourceLogo sourceTool={record.sourceTool} size={18} />
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          {record.recordId}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${toolInfo.badgeBg}`}>
                        {toolInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8] gap-2">
                      <span className="font-semibold text-slate-200 truncate">
                        {record.hostname || 'Unmapped Host'}
                      </span>
                      <span className="text-[11px] uppercase font-mono text-[#64748B] shrink-0">
                        {record.observationMethod.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#1E2631]/40">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          status === 'CORRELATED' ? 'bg-emerald-400' :
                          status === 'REVIEW_REQUIRED' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        <span className={`font-semibold ${
                          status === 'CORRELATED' ? 'text-emerald-400' :
                          status === 'REVIEW_REQUIRED' ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {status === 'CORRELATED' ? 'CORRELATED' : status === 'REVIEW_REQUIRED' ? 'REVIEW REQ' : 'SEPARATE'}
                        </span>
                      </div>
                      {groupId && (
                        <span className="font-mono text-[11px] text-[#94A3B8]">
                          {groupId}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Selected Record Investigation Panel */}
        <div className="lg:col-span-8 bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
          {selectedRecord ? (
            <>
              {/* Selected Record Header */}
              <div className="space-y-4 border-b border-[#1A222D] pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <SourceLogo sourceTool={selectedRecord.sourceTool} size={24} />
                      <span className="font-mono text-lg font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                        {selectedRecord.recordId}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getToolIdentity(selectedRecord.sourceTool).badgeBg}`}>
                        {selectedRecord.sourceTool.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#151A21] border border-[#1E2631] text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        {selectedRecord.observationMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-100 pt-1">
                      {selectedRecord.hostname || 'Unmapped Hostname'}
                    </h2>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    {associatedCluster ? (
                      associatedCluster.correlationStatus === 'CORRELATED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>CORRELATED</span>
                          <span className="font-mono text-emerald-300/80 pl-1">· {associatedCluster.underlyingAssetId}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>REVIEW REQUIRED</span>
                          <span className="font-mono text-amber-300/80 pl-1">· {associatedCluster.underlyingAssetId}</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span>SEPARATE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Concise Deterministic State Explanation */}
                <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 text-sm text-slate-200 leading-relaxed flex items-start gap-3">
                  <DeterministicEvidenceIcon size={20} className="shrink-0 mt-0.5" />
                  <div>
                    {associatedCluster ? (
                      associatedCluster.correlationStatus === 'CORRELATED' ? (
                        <span>
                          This source record is currently associated with underlying asset group{' '}
                          <strong className="text-slate-100 font-mono">{associatedCluster.underlyingAssetId}</strong>{' '}
                          ({associatedCluster.canonicalHostname}) by the deterministic correlation engine with{' '}
                          <strong className="text-emerald-400 font-semibold">{associatedCluster.confidence}% confidence</strong>.
                        </span>
                      ) : (
                        <span>
                          This source record is flagged for analyst review regarding asset group{' '}
                          <strong className="text-slate-100 font-mono">{associatedCluster.underlyingAssetId}</strong>{' '}
                          ({associatedCluster.canonicalHostname}) due to conflicting telemetry attributes or borderline match rules.
                        </span>
                      )
                    ) : (
                      <span>
                        This source record currently stands as an un-correlated separate hypothesis with no matching cluster.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 8. Identity Snapshot Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  IDENTITY SNAPSHOT
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#151A21] p-5 rounded-xl border border-[#1E2631]">
                  <div>
                    <span className="text-[#64748B] text-xs font-bold uppercase block tracking-wider">
                      HOSTNAME
                    </span>
                    <span className="text-slate-100 text-base font-bold block mt-1">
                      {selectedRecord.hostname || 'None'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] text-xs font-bold uppercase block tracking-wider">
                      IP ADDRESS
                    </span>
                    <span className="text-slate-100 text-sm font-mono tabular-nums block mt-1">
                      {selectedRecord.ipAddresses.join(', ') || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] text-xs font-bold uppercase block tracking-wider">
                      MAC ADDRESS
                    </span>
                    <span className="text-slate-100 text-sm font-mono tabular-nums block mt-1">
                      {selectedRecord.macAddress || 'Unmapped'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] text-xs font-bold uppercase block tracking-wider">
                      OPERATING SYSTEM
                    </span>
                    <span className="text-slate-100 text-sm font-semibold block mt-1">
                      {selectedRecord.operatingSystem || 'Unknown OS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 9. Correlation Evidence */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                    <DeterministicEvidenceIcon size={16} />
                    CORRELATION EVIDENCE
                  </h3>
                  <span className="text-xs text-[#64748B] font-medium">Deterministic Match Signals</span>
                </div>

                {associatedCluster && associatedCluster.correlationEvidence.length > 0 ? (
                  <div className="space-y-2.5">
                    {associatedCluster.correlationEvidence.map((signal) => (
                      <div
                        key={signal.id}
                        className="bg-[#151A21] border border-emerald-500/20 rounded-xl p-3.5 flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200 block text-sm">{signal.name}</span>
                            <span className="text-xs text-[#94A3B8] block mt-0.5">{signal.description}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{signal.weight} pts
                        </span>
                      </div>
                    ))}

                    {associatedCluster.conflictingAttributes.map((conflict) => (
                      <div
                        key={conflict.id}
                        className="bg-[#151A21] border border-amber-500/20 rounded-xl p-3.5 flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-amber-200 block text-sm">{conflict.name}</span>
                            <span className="text-xs text-[#94A3B8] block mt-0.5">{conflict.description}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {conflict.weight} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 text-xs text-[#94A3B8]">
                    No multi-record correlation signals formed for this standalone telemetry record.
                  </div>
                )}
              </div>

              {/* 10. Observation Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  OBSERVATION HISTORY
                </h3>

                <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26303E]">
                    {/* First Observed */}
                    <div className="relative flex items-center justify-between text-sm">
                      <span className="absolute -left-6 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#10141A]" />
                      <div>
                        <span className="text-xs font-bold uppercase text-[#64748B] block">First Observed</span>
                        <span className="font-mono text-slate-200 text-sm font-semibold">
                          {formatDate(selectedRecord.firstObserved)}
                        </span>
                      </div>
                      <span className="text-xs text-[#64748B] font-mono">Initial Telemetry Ingest</span>
                    </div>

                    {/* Last Observed */}
                    <div className="relative flex items-center justify-between text-sm">
                      <span className="absolute -left-6 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#10141A]" />
                      <div>
                        <span className="text-xs font-bold uppercase text-emerald-400 block">● Last Observed</span>
                        <span className="font-mono text-slate-100 text-sm font-bold">
                          {formatDate(selectedRecord.lastObserved)}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400/80 font-mono font-semibold">Latest Active Observation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 13. Record Relationship Strip & 14. View Asset Action */}
              {associatedCluster && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    RECORD RELATIONSHIP
                  </h3>

                  <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5 space-y-4 text-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">
                          {selectedRecord.recordId}
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#64748B]" />
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                          {associatedCluster.underlyingAssetId} ({associatedCluster.canonicalHostname})
                        </div>
                      </div>

                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('correlation')}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
                        >
                          <span>VIEW UNDERLYING ASSET</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {relatedRecords.length > 0 && (
                      <div className="pt-3 border-t border-[#1E2631] space-y-2">
                        <span className="text-xs font-semibold text-[#94A3B8] block">
                          OTHER MEMBER RECORDS IN GROUP ({relatedRecords.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {relatedRecords.map(rel => (
                            <button
                              key={rel.recordId}
                              onClick={() => setSelectedRecordId(rel.recordId)}
                              className="px-2.5 py-1 rounded-lg bg-[#181E26] hover:bg-[#26303E] border border-[#26303E] text-slate-200 text-xs font-mono font-semibold transition"
                            >
                              {rel.recordId} ({rel.sourceTool})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 11 & 12. Raw Telemetry Progressive Disclosure Accordion */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsRawExpanded(!isRawExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-[#151A21] hover:bg-[#181E26] border border-[#1E2631] rounded-xl text-sm font-bold text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span>RAW TELEMETRY</span>
                    <span className="text-xs text-[#64748B] font-normal font-sans">
                      ({isRawExpanded ? 'Click to collapse' : 'Click to expand all raw attributes'})
                    </span>
                  </div>
                  {isRawExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  )}
                </button>

                {isRawExpanded && (
                  <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-5 space-y-3 font-mono text-xs animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Record ID</span>
                        <span className="text-blue-400 font-bold">{selectedRecord.recordId}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Source Tool</span>
                        <span className="text-slate-100 font-bold">{selectedRecord.sourceTool}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Observation Method</span>
                        <span className="text-slate-100">{selectedRecord.observationMethod}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Hostname</span>
                        <span className="text-slate-100">{selectedRecord.hostname || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">FQDN</span>
                        <span className="text-slate-100">{selectedRecord.fqdn || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">IP Addresses</span>
                        <span className="text-slate-100">{selectedRecord.ipAddresses.join(', ') || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">MAC Address</span>
                        <span className="text-slate-100">{selectedRecord.macAddress || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Operating System</span>
                        <span className="text-slate-100">{selectedRecord.operatingSystem || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Agent ID</span>
                        <span className="text-slate-100">{selectedRecord.agentId || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Cloud Instance ID</span>
                        <span className="text-slate-100">{selectedRecord.cloudInstanceId || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Serial Number</span>
                        <span className="text-slate-100">{selectedRecord.serialNumber || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Domain</span>
                        <span className="text-slate-100">{selectedRecord.domain || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Asset Tags</span>
                        <span className="text-slate-100">{selectedRecord.assetTags.join(', ') || 'none'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631]">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">First Observed</span>
                        <span className="text-slate-100">{selectedRecord.firstObserved || 'null'}</span>
                      </div>
                      <div className="p-2.5 bg-[#10141A] rounded-lg border border-[#1E2631] sm:col-span-2">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Last Observed</span>
                        <span className="text-slate-100">{selectedRecord.lastObserved || 'null'}</span>
                      </div>
                    </div>

                    {selectedRecord.rawAttributes && (
                      <div className="p-3 bg-[#10141A] rounded-lg border border-[#1E2631] space-y-1">
                        <span className="text-[#64748B] block text-[11px] font-sans font-bold uppercase">Raw Payload Object</span>
                        <pre className="text-[11px] text-[#94A3B8] whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedRecord.rawAttributes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 18. Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-[#151A21] border border-[#1E2631] text-[#64748B]">
                <SourceIntelligenceIcon size={32} glow />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold text-slate-100">SELECT A SOURCE RECORD</h3>
                <p className="text-sm text-[#94A3B8]">
                  Choose a record from the left to inspect its identity, observation history, and correlation evidence.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
