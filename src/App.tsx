import React, { useState, useMemo } from 'react';
import { SYNTHETIC_ASSET_RECORDS } from './data/syntheticDataset';
import { SYNTHETIC_FINDINGS } from './data/syntheticFindings';
import { runCorrelationEngine } from './engine/correlationEngine';
import { runFindingCorrelationEngine } from './engine/findingCorrelationEngine';
import {
  UnderlyingAsset,
  AssetRecord,
  CorrelationException,
  AuditLogEntry,
  ExceptionReason,
  AssetArchiveRecord,
  ArchiveReason,
  LifecyclePolicyConfig,
  AIAnalystInsight,
} from './types/vulnfusion';
import { DEFAULT_LIFECYCLE_POLICY } from './utils/lifecycleUtils';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewTab } from './components/OverviewTab';
import { AssetInventoryTab } from './components/AssetInventoryTab';
import { AssetCorrelationTab } from './components/AssetCorrelationTab';
import { FindingCorrelationTab } from './components/FindingCorrelationTab';
import { EvidenceExplorerTab } from './components/EvidenceExplorerTab';
import { TestRunnerTab } from './components/TestRunnerTab';
import { AdminManagementTab } from './components/AdminManagementTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { HelpTab } from './components/HelpTab';
import { EvidenceModal } from './components/EvidenceModal';
import { ExceptionModal } from './components/ExceptionModal';
import { AIAnalystModal } from './components/AIAnalystModal';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RBACProvider } from './context/RBACContext';
import { ShieldCheck, Sparkles, CheckCircle2, Archive, X, Loader2 } from 'lucide-react';
import { NavTabId } from './components/Sidebar';

function MainWorkspace() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetAssetGroupId, setTargetAssetGroupId] = useState<string>('');

  // Live Records & Correlated Clusters
  const [records, setRecords] = useState<AssetRecord[]>(() => SYNTHETIC_ASSET_RECORDS);
  const [findingGroups] = useState(() => runFindingCorrelationEngine(SYNTHETIC_FINDINGS));
  const clusters = useMemo(() => runCorrelationEngine(records), [records]);

  // Non-Destructive Archive State & Configurable Policy
  const [archives, setArchives] = useState<Record<string, AssetArchiveRecord>>({});
  const [lifecyclePolicy, setLifecyclePolicy] = useState<LifecyclePolicyConfig>(DEFAULT_LIFECYCLE_POLICY);

  // Notification Toast Banner State
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    type: 'archive' | 'reactivate' | 'restore' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Analyst state & audit logs
  const [exceptions, setExceptions] = useState<CorrelationException[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      entryId: 'AUDIT-INIT',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INIT',
      targetId: 'VULNFUSION-ENGINE',
      details: 'Ingested 20 synthetic asset records and 8 synthetic vulnerability findings successfully.',
      actor: 'system',
    },
  ]);

  // Modals
  const [evidenceAsset, setEvidenceAsset] = useState<UnderlyingAsset | null>(null);
  const [exceptionAsset, setExceptionAsset] = useState<UnderlyingAsset | null>(null);
  const [aiAsset, setAiAsset] = useState<UnderlyingAsset | null>(null);
  const [aiInsights, setAiInsights] = useState<AIAnalystInsight[]>([]);

  const handleAddAiInsight = (insight: AIAnalystInsight) => {
    setAiInsights(prev => {
      const exists = prev.some(i => i.assetId === insight.assetId && i.question === insight.question);
      if (exists) return prev;
      return [...prev, insight];
    });
    showToast('info', 'AI Insight Added', `Added AI explanation for ${insight.assetName} to Executive Report.`);
    addAuditLog('ADD_AI_INSIGHT', insight.assetId, `Added AI explanation to Executive Report for asset ${insight.assetName}. Model: ${insight.model}`);
  };

  const handleRemoveAiInsight = (assetId: string, question: string) => {
    setAiInsights(prev => prev.filter(i => !(i.assetId === assetId && i.question === question)));
    showToast('info', 'AI Insight Removed', 'Removed AI explanation from Executive Report.');
  };

  const addAuditLog = (action: string, targetId: string, details: string) => {
    const newEntry: AuditLogEntry = {
      entryId: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      targetId,
      details,
      actor: 'analyst@vulnfusion.internal',
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const showToast = (type: 'archive' | 'reactivate' | 'restore' | 'info', title: string, message: string) => {
    const id = `TOAST-${Date.now()}`;
    setToastNotification({ id, type, title, message });
    setTimeout(() => {
      setToastNotification(prev => (prev?.id === id ? null : prev));
    }, 6000);
  };

  // Archive an Asset (Non-destructive)
  const handleArchiveAsset = (
    assetGroupId: string,
    reason: ArchiveReason,
    reasonText: string,
    notes: string
  ) => {
    const targetCluster = clusters.find(c => c.underlyingAssetId === assetGroupId);
    const hostname = targetCluster?.canonicalHostname || assetGroupId;

    const archiveRecord: AssetArchiveRecord = {
      assetGroupId,
      canonicalHostname: hostname,
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: 'analyst@vulnfusion.internal',
      reason,
      reasonText,
      archiveNotes: notes,
      preservedFirstSeen: targetCluster?.representativeRecords[0]?.firstObserved || null,
      preservedLastSeen: targetCluster?.representativeRecords[0]?.lastObserved || null,
      preservedRecordCount: targetCluster?.memberRecordIds.length || 1,
      preservedFindingCount: SYNTHETIC_FINDINGS.filter(f => f.underlyingAssetGroupId === assetGroupId).length,
    };

    setArchives(prev => ({
      ...prev,
      [assetGroupId]: archiveRecord,
    }));

    addAuditLog(
      'ARCHIVE_ASSET',
      assetGroupId,
      `Archived asset ${hostname} (${assetGroupId}). Reason: ${reasonText}${notes ? ` | Notes: ${notes}` : ''}. Preserved in non-destructive archive.`
    );

    showToast(
      'archive',
      `Asset ${hostname} Archived`,
      `Removed from active inventory. Identity, findings, and evidence preserved. Will auto-reactivate if observed again.`
    );
  };

  // Unarchive / Restore an Asset
  const handleUnarchiveAsset = (assetGroupId: string) => {
    const targetCluster = clusters.find(c => c.underlyingAssetId === assetGroupId);
    const hostname = targetCluster?.canonicalHostname || assetGroupId;

    setArchives(prev => {
      const copy = { ...prev };
      delete copy[assetGroupId];
      return copy;
    });

    addAuditLog(
      'UNARCHIVE_ASSET',
      assetGroupId,
      `Analyst manually restored asset ${hostname} (${assetGroupId}) to active inventory.`
    );

    showToast(
      'restore',
      `Asset ${hostname} Restored`,
      `Returned to Active Inventory with full historical telemetry intact.`
    );
  };

  // Ingest Simulated Telemetry Observation -> Test Automatic Reappearance
  const handleSimulateObservation = (newRecord: AssetRecord) => {
    setRecords(prev => [newRecord, ...prev]);

    const matchingCluster = clusters.find(c => {
      if (newRecord.biosUuid && c.canonicalBiosUuid && newRecord.biosUuid === c.canonicalBiosUuid) return true;
      if (newRecord.cloudResourceId && c.canonicalCloudResourceId && newRecord.cloudResourceId === c.canonicalCloudResourceId) return true;
      if (newRecord.hostname && c.canonicalHostname && newRecord.hostname.toUpperCase() === c.canonicalHostname.toUpperCase()) return true;
      if (newRecord.ipAddresses.some(ip => c.canonicalIpAddresses.includes(ip))) return true;
      return false;
    });

    const targetGroupId = matchingCluster?.underlyingAssetId;
    const isMatchingArchived = targetGroupId ? Boolean(archives[targetGroupId]?.isArchived) : false;

    if (targetGroupId && isMatchingArchived) {
      const hostname = matchingCluster.canonicalHostname;
      setArchives(prev => ({
        ...prev,
        [targetGroupId]: {
          ...prev[targetGroupId],
          isArchived: false,
          wasAutoReactivated: true,
          reactivatedAt: newRecord.lastObserved || new Date().toISOString(),
          reactivatedBySource: newRecord.sourceTool,
          reactivationRecordId: newRecord.recordId,
          reactivationReason: `New observation from ${newRecord.sourceTool} (${newRecord.observationMethod}) matched deterministic identity.`,
        },
      }));

      addAuditLog(
        'AUTO_REACTIVATE_ASSET',
        targetGroupId,
        `AUTOMATIC REACTIVATION: Asset ${hostname} (${targetGroupId}) reactivated upon receiving new observation ${newRecord.recordId} from ${newRecord.sourceTool}. Consolidated with 0 duplicates created.`
      );

      showToast(
        'reactivate',
        `✨ Asset ${hostname} Automatically Reactivated!`,
        `Received fresh telemetry from ${newRecord.sourceTool}. Restored to Active Inventory without creating duplicate records.`
      );
    } else {
      addAuditLog(
        'INGEST_OBSERVATION',
        newRecord.recordId,
        `Ingested new observation ${newRecord.recordId} from ${newRecord.sourceTool} for ${newRecord.hostname}.`
      );

      showToast(
        'info',
        `Telemetry Observation Ingested`,
        `Ingested ${newRecord.recordId} (${newRecord.sourceTool}) for ${newRecord.hostname}. Engine re-correlated.`
      );
    }
  };

  // Update Configurable Lifecycle Policy
  const handleUpdateLifecyclePolicy = (newPolicy: LifecyclePolicyConfig) => {
    setLifecyclePolicy(newPolicy);
    addAuditLog(
      'POLICY_UPDATE',
      'LIFECYCLE-POLICY',
      `Updated lifecycle thresholds: Active=${newPolicy.activeThresholdDays}d, Aging=${newPolicy.agingThresholdDays}d, Stale=${newPolicy.staleThresholdDays}d, Archive Eligible=${newPolicy.archiveEligibleThresholdDays}d.`
    );
    showToast(
      'info',
      'Lifecycle Policy Updated',
      `Archive threshold set to ${newPolicy.archiveEligibleThresholdDays} days. Recalculated asset visibility.`
    );
  };

  const handleViewEvidence = (asset: UnderlyingAsset) => {
    setEvidenceAsset(asset);
    addAuditLog('VIEW_EVIDENCE', asset.underlyingAssetId, `Viewed evidence and confidence breakdown for ${asset.canonicalHostname}`);
  };

  const handleExplainAI = (asset: UnderlyingAsset) => {
    setAiAsset(asset);
    addAuditLog('AI_ANALYST_EXPLAIN', asset.underlyingAssetId, `Requested Gemini AI explanation for ${asset.canonicalHostname}`);
  };

  const handleOpenExceptionModal = (asset: UnderlyingAsset) => {
    setExceptionAsset(asset);
  };

  const handleCreateException = (assetGroupId: string, recordIds: string[], reason: ExceptionReason, analystNote: string) => {
    const newException: CorrelationException = {
      exceptionId: `EXC-${Date.now()}`,
      assetGroupId,
      recordIds,
      reason,
      analystNote,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    setExceptions(prev => [newException, ...prev]);
    addAuditLog('CREATE_EXCEPTION', assetGroupId, `Created exception (${reason}): "${analystNote}"`);
  };

  const handleResolveException = (exceptionId: string) => {
    setExceptions(prev =>
      prev.map(e => (e.exceptionId === exceptionId ? { ...e, status: 'REVOKED' } : e))
    );
    addAuditLog('RESOLVE_EXCEPTION', exceptionId, `Analyst revoked exception ${exceptionId}. Baseline deterministic correlation restored.`);
    showToast('info', 'Exception Revoked', `Exception ${exceptionId} marked revoked.`);
  };

  const handleTriggerSourceSync = (sourceName: string) => {
    addAuditLog('SYNC_DATA', sourceName, `Multi-source telemetry synchronization verified for ${sourceName}.`);
    showToast('info', 'Data Source Synced', `Telemetry refreshed from ${sourceName}. All records verified.`);
  };

  const handleAcceptCorrelation = (assetGroupId: string) => {
    addAuditLog('ACCEPT_CORRELATION', assetGroupId, `Analyst explicitly accepted deterministic correlation for ${assetGroupId}`);
    alert(`Correlation accepted for asset group ${assetGroupId}. Recorded in session audit log.`);
  };

  const handleRejectCorrelation = (assetGroupId: string) => {
    addAuditLog('REJECT_CORRELATION', assetGroupId, `Analyst explicitly rejected deterministic correlation for ${assetGroupId}`);
    alert(`Correlation rejected for asset group ${assetGroupId}. Recorded in session audit log.`);
  };

  const handleViewCorrelationForAsset = (assetGroupId: string) => {
    setTargetAssetGroupId(assetGroupId);
    setActiveTab('correlation');
  };

  const handleViewFindingsForAsset = (assetGroupId: string) => {
    setSearchQuery(assetGroupId);
    setActiveTab('findings');
  };

  const handleInvestigateReviewRequired = (assetGroupId?: string) => {
    const targetId = assetGroupId || clusters.find(c => c.correlationStatus === 'REVIEW_REQUIRED')?.underlyingAssetId;
    if (targetId) {
      setTargetAssetGroupId(targetId);
    }
    setActiveTab('correlation');
  };

  const reviewCount = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const demoAsset = clusters.find(c => c.canonicalHostname === 'WEB-SRV-01') || clusters[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B10] text-[#E8EEF5] flex flex-col justify-center items-center p-6 space-y-4 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-[#00B8FF]" />
        <p className="text-sm font-mono text-[#8A99AF]">Loading secure workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#090B0F] text-[#F1F5F9] font-sans flex flex-col md:flex-row antialiased selection:bg-[#3B82F6]/30 selection:text-white relative">
      
      {/* 1. Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviewCount={reviewCount}
        totalTests={118}
        onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
      />

      {/* 2. Main Content Viewport & Header Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewCount={reviewCount}
          totalRecords={records.length}
          totalAssetGroups={clusters.length}
          totalFindings={SYNTHETIC_FINDINGS.length}
          totalTests={118}
          onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Floating Interactive Toast Notification */}
        {toastNotification && (
          <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-bounceIn shadow-2xl">
            <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3 shadow-2xl ${
              toastNotification.type === 'reactivate'
                ? 'bg-[#00B8FF]/15 border-[#00B8FF] text-white shadow-[0_0_30px_rgba(0,184,255,0.3)]'
                : toastNotification.type === 'archive'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                : 'bg-[#101B29] border-[#1B3045] text-slate-100'
            }`}>
              {toastNotification.type === 'reactivate' ? (
                <Sparkles className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5 animate-pulse" />
              ) : toastNotification.type === 'archive' ? (
                <Archive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="font-bold text-xs block">{toastNotification.title}</span>
                <p className="text-[11px] text-[#A8B7C9] leading-relaxed">
                  {toastNotification.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-[#718197] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Render */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              records={records}
              clusters={clusters}
              findings={SYNTHETIC_FINDINGS}
              findingGroups={findingGroups}
              onNavigateTab={setActiveTab}
              onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
              onInvestigateReviewRequired={handleInvestigateReviewRequired}
              externalSearchQuery={searchQuery}
              aiInsights={aiInsights}
            />
          )}

          {activeTab === 'inventory' && (
            <AssetInventoryTab
              clusters={clusters}
              records={records}
              findings={SYNTHETIC_FINDINGS}
              findingGroups={findingGroups}
              archives={archives}
              lifecyclePolicy={lifecyclePolicy}
              onViewCorrelation={handleViewCorrelationForAsset}
              onViewFindings={handleViewFindingsForAsset}
              onArchiveAsset={handleArchiveAsset}
              onUnarchiveAsset={handleUnarchiveAsset}
              onSimulateObservation={handleSimulateObservation}
              onUpdateLifecyclePolicy={handleUpdateLifecyclePolicy}
              externalSearchQuery={searchQuery}
            />
          )}

          {activeTab === 'correlation' && (
            <AssetCorrelationTab
              clusters={clusters}
              records={records}
              exceptions={exceptions}
              findings={SYNTHETIC_FINDINGS}
              findingGroups={findingGroups}
              onViewEvidence={handleViewEvidence}
              onCreateException={handleOpenExceptionModal}
              onAcceptCorrelation={handleAcceptCorrelation}
              onRejectCorrelation={handleRejectCorrelation}
              onExplainAI={handleExplainAI}
              onNavigateTab={setActiveTab}
              externalSearchQuery={searchQuery}
              initialAssetGroupId={targetAssetGroupId}
            />
          )}

          {activeTab === 'findings' && (
            <FindingCorrelationTab
              findingGroups={findingGroups}
              sourceFindings={SYNTHETIC_FINDINGS}
              externalSearchQuery={searchQuery}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceExplorerTab
              records={records}
              clusters={clusters}
              onNavigateTab={setActiveTab}
              externalSearchQuery={searchQuery}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              records={records}
              clusters={clusters}
              findings={SYNTHETIC_FINDINGS}
              findingGroups={findingGroups}
              aiInsights={aiInsights}
              onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
            />
          )}

          {activeTab === 'ai-analyst' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="pb-4 border-b border-[#1B3045] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      REPORTING & REASONING
                    </span>
                    <span className="text-xs text-purple-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Deterministic Advisory Sidecar
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-[#F4F7FB] tracking-tight uppercase">
                    AI ANALYST
                  </h1>
                  <p className="text-xs text-[#8B95A5] font-mono mt-0.5">
                    Launch in-depth natural language explanations of correlation evidence and multi-scanner convergence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExplainAI(demoAsset)}
                  className="px-4 py-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all min-h-[44px] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Explain {demoAsset.canonicalHostname}</span>
                </button>
              </div>

              {/* Asset Cards to Explain */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clusters.map((cluster) => {
                  const isReview = cluster.correlationStatus === 'REVIEW_REQUIRED';
                  const hasInsight = aiInsights.some(i => i.assetId === cluster.underlyingAssetId);

                  return (
                    <div
                      key={cluster.underlyingAssetId}
                      className="p-5 rounded-2xl bg-[#071019] border border-[#1B3045] space-y-4 hover:border-[#234363] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-white block">
                            {cluster.canonicalHostname}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {cluster.underlyingAssetId}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          isReview
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {cluster.correlationStatus}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-sans line-clamp-2">
                        {cluster.clusterSummary || 'Correlated across multi-scanner telemetry feeds.'}
                      </p>

                      <div className="pt-3 border-t border-[#132236] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#718197]">
                          {cluster.memberRecordIds?.length || 1} records ({cluster.confidence}% conf)
                        </span>

                        <button
                          type="button"
                          onClick={() => handleExplainAI(cluster)}
                          className="px-3 py-1.5 bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>{hasInsight ? 'View Insight' : 'Explain'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <TestRunnerTab
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'admin' && (
            <AdminManagementTab
              auditLogs={auditLogs}
              exceptions={exceptions}
              records={records}
              clusters={clusters}
              findings={SYNTHETIC_FINDINGS}
              findingGroups={findingGroups}
              onResolveException={handleResolveException}
              onTriggerSync={handleTriggerSourceSync}
              onNavigateTab={setActiveTab}
              addAuditLog={addAuditLog}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              onSaveNotification={(msg) => showToast('info', 'Settings Updated', msg)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'help' && (
            <HelpTab
              onNavigateTab={setActiveTab}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1A222D] px-6 py-4 text-xs font-mono text-[#5F6875] flex flex-col sm:flex-row justify-between items-center gap-2 bg-[#090B0F] mt-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>VulnFusion Deterministic Intelligence Engine — Authoritative VM Analysis</span>
          </div>
          <div>Non-Destructive Asset Archiving & Automatic Reactivation Active</div>
        </footer>

      </div>

      {/* Modals */}
      <EvidenceModal
        asset={evidenceAsset}
        onClose={() => setEvidenceAsset(null)}
      />

      <ExceptionModal
        asset={exceptionAsset}
        onClose={() => setExceptionAsset(null)}
        onSubmitException={handleCreateException}
      />

      <AIAnalystModal
        asset={aiAsset}
        onClose={() => setAiAsset(null)}
        aiInsights={aiInsights}
        onAddInsight={handleAddAiInsight}
        onRemoveInsight={handleRemoveAiInsight}
        onViewEvidence={(asset) => {
          setAiAsset(null);
          handleViewEvidence(asset);
        }}
      />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <MainWorkspace />
      </RBACProvider>
    </AuthProvider>
  );
}

export default App;
