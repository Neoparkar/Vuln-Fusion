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
import { EvidenceModal } from './components/EvidenceModal';
import { ExceptionModal } from './components/ExceptionModal';
import { AIAnalystModal } from './components/AIAnalystModal';
import { ShieldCheck, Sparkles, CheckCircle2, Archive, X } from 'lucide-react';
import { NavTabId } from './components/Sidebar';

export function App() {
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
    // 1. Add record to records
    setRecords(prev => [newRecord, ...prev]);

    // 2. Identify matching cluster by deterministic signals
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
      // 3. Trigger Automatic Reactivation!
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

  const reviewCount = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const demoAsset = clusters.find(c => c.canonicalHostname === 'WEB-SRV-01') || clusters[0];

  return (
    <div className="min-h-screen bg-[#071019] text-[#F4F7FB] font-sans flex flex-col md:flex-row antialiased selection:bg-[#00B8FF]/30 selection:text-white relative">
      
      {/* 1. Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviewCount={reviewCount}
        totalTests={98}
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
          totalTests={98}
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
              externalSearchQuery={searchQuery}
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

          {activeTab === 'tests' && (
            <TestRunnerTab
              auditLogs={auditLogs}
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
        onViewEvidence={(asset) => {
          setAiAsset(null);
          handleViewEvidence(asset);
        }}
      />

    </div>
  );
}
export default App;
