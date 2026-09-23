import React, { useState } from 'react';
import { FindingCorrelationGroup, VulnerabilityFinding } from '../types/vulnfusion';
import { Search, CheckCircle2, AlertTriangle, Bug, Layers, ShieldCheck } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CORRELATED' | 'REVIEW_REQUIRED'>('ALL');

  const activeQuery = (externalSearchQuery || searchQuery).toLowerCase().trim();

  const filteredGroups = findingGroups.filter(group => {
    const matchesStatus = selectedStatusFilter === 'ALL' || group.correlationStatus === selectedStatusFilter;
    const matchesSearch =
      !activeQuery ||
      group.remediationIssueId.toLowerCase().includes(activeQuery) ||
      group.vulnerabilityId.toLowerCase().includes(activeQuery) ||
      group.title.toLowerCase().includes(activeQuery) ||
      group.affectedSoftware.toLowerCase().includes(activeQuery) ||
      group.underlyingAssetGroupId.toLowerCase().includes(activeQuery);
    return matchesStatus && matchesSearch;
  });

  const correlatedCount = findingGroups.filter(g => g.correlationStatus === 'CORRELATED').length;
  const reviewCount = findingGroups.filter(g => g.correlationStatus === 'REVIEW_REQUIRED').length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-10">
      
      {/* Header & Stats Banner */}
      <div className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Bug className="w-4 h-4" /> Deterministic Finding Correlation Engine
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">
            Vulnerability Finding Correlation & Remediation Issues
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Correlating multi-scanner findings into unified remediation issues based on underlying asset identity, vulnerability ID, and affected software compatibility.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#151A21] border border-[#1E2631] px-4 py-2.5 rounded-xl text-sm font-medium">
          <div><strong className="text-slate-100 text-base">{sourceFindings.length}</strong> Findings</div>
          <div className="w-px h-4 bg-[#26303E]" />
          <div><strong className="text-violet-400 text-base">{findingGroups.length}</strong> Remediation Issues</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-88">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search CVEs, software, titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#10141A] border border-[#1A222D] rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-200 placeholder-[#64748B] focus:outline-none focus:border-violet-500/50 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#10141A] p-1.5 rounded-xl border border-[#1A222D]">
          {(['ALL', 'CORRELATED', 'REVIEW_REQUIRED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedStatusFilter === status
                  ? 'bg-violet-600 text-white'
                  : 'text-[#94A3B8] hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? `ALL (${findingGroups.length})` : status === 'CORRELATED' ? `CORR (${correlatedCount})` : `REV (${reviewCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Remediation Groups List */}
      <div className="space-y-5">
        {filteredGroups.map((group) => {
          const uniqueTools = Array.from(new Set(group.representativeFindings.map(f => f.sourceTool)));

          return (
            <div
              key={group.remediationIssueId}
              className="bg-[#10141A] border border-[#1A222D] rounded-2xl p-6 sm:p-7 space-y-5 transition hover:border-[#26303E] shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1A222D]">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 mt-1 sm:mt-0">
                    <Bug className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                        {group.remediationIssueId}
                      </span>
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                        {group.vulnerabilityId}
                      </span>
                      <span className="text-xs text-[#94A3B8] font-medium">Asset: {group.underlyingAssetGroupId}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-1.5">
                      {group.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    group.correlationStatus === 'CORRELATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {group.correlationStatus === 'CORRELATED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {group.correlationStatus}
                  </span>
                </div>
              </div>

              {/* Software Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-[#151A21] p-4 rounded-xl border border-[#1E2631]">
                <div>
                  <span className="text-[#64748B] block uppercase text-xs font-bold tracking-wide">Affected Software</span>
                  <span className="font-bold text-slate-100 text-sm mt-0.5 block">{group.affectedSoftware}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block uppercase text-xs font-bold tracking-wide">Version Match</span>
                  <span className="text-slate-200 text-sm font-medium mt-0.5 block">{group.affectedVersion || 'Compatible Range'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block uppercase text-xs font-bold tracking-wide">Scanner Coverage</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {uniqueTools.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-[#181E26] text-slate-200 rounded-md text-xs font-semibold border border-[#26303E]">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B] block uppercase text-xs font-bold tracking-wide">Matched Findings</span>
                  <span className="text-violet-300 font-bold text-sm mt-0.5 block">{group.memberFindingIds.length} source findings</span>
                </div>
              </div>

              {/* Clean Relationship Tree */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Finding Hierarchy Relationship Tree
                </div>

                <div className="bg-[#151A21] border border-[#1E2631] rounded-xl p-4 text-sm space-y-2">
                  <div className="text-slate-100 font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <span>{group.remediationIssueId} (Potential Remediation Issue)</span>
                  </div>

                  <div className="pl-5 space-y-1.5 border-l border-[#26303E] ml-2 pt-1">
                    {group.representativeFindings.map((finding, idx) => (
                      <div key={finding.findingId} className="flex items-center gap-2 text-xs sm:text-sm text-[#94A3B8]">
                        <span className="text-[#64748B] font-mono">{idx === group.representativeFindings.length - 1 ? '└──' : '├──'}</span>
                        <strong className="text-slate-200">{finding.sourceTool}</strong>
                        <span className="text-xs text-[#64748B]">({finding.findingId})</span>
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-semibold">{finding.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Justification note */}
              <div className="text-xs text-[#94A3B8] bg-[#151A21] px-4 py-3 rounded-xl border border-[#1E2631] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="font-medium">{group.title}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-4 h-4" /> Deterministic Correlation
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
