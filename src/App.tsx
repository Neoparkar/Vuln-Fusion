import React, { useState } from 'react';
import { SYNTHETIC_ASSET_RECORDS } from './data/syntheticDataset';
import { SYNTHETIC_FINDINGS } from './data/syntheticFindings';
import { runCorrelationEngine } from './engine/correlationEngine';
import { runFindingCorrelationEngine } from './engine/findingCorrelationEngine';
import { UnderlyingAsset, CorrelationException, AuditLogEntry, ExceptionReason } from './types/vulnfusion';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { AssetCorrelationTab } from './components/AssetCorrelationTab';
import { FindingCorrelationTab } from './components/FindingCorrelationTab';
import { EvidenceExplorerTab } from './components/EvidenceExplorerTab';
import { TestRunnerTab } from './components/TestRunnerTab';
import { EvidenceModal } from './components/EvidenceModal';
import { ExceptionModal } from './components/ExceptionModal';
import { AIAnalystModal } from './components/AIAnalystModal';
import { ShieldCheck, Sparkles, Search, Shield, User } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'correlation' | 'findings' | 'evidence' | 'tests'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Engines
  const [clusters] = useState<UnderlyingAsset[]>(() => runCorrelationEngine(SYNTHETIC_ASSET_RECORDS));
  const [findingGroups] = useState(() => runFindingCorrelationEngine(SYNTHETIC_FINDINGS));

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

  const reviewCount = clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  const demoAsset = clusters.find(c => c.canonicalHostname === 'WEB-SRV-01') || clusters[0];

  return (
    <div className="min-h-screen bg-[#071019] text-[#F4F7FB] font-sans flex flex-col antialiased selection:bg-[#00B8FF]/30 selection:text-white">
      
      {/* Unified Top Navigation Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecords={SYNTHETIC_ASSET_RECORDS.length}
        totalAssetGroups={clusters.length}
        reviewCount={reviewCount}
        totalFindings={SYNTHETIC_FINDINGS.length}
        onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Workspace Render */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            records={SYNTHETIC_ASSET_RECORDS}
            clusters={clusters}
            findings={SYNTHETIC_FINDINGS}
            findingGroups={findingGroups}
            onNavigateTab={setActiveTab}
            onOpenAIAnalyst={() => handleExplainAI(demoAsset)}
            externalSearchQuery={searchQuery}
          />
        )}

        {activeTab === 'correlation' && (
          <AssetCorrelationTab
            clusters={clusters}
            records={SYNTHETIC_ASSET_RECORDS}
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
            records={SYNTHETIC_ASSET_RECORDS}
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
        <footer className="border-t border-[#1A222D] px-6 py-4 text-xs font-mono text-[#5F6875] flex justify-between items-center bg-[#090B0F] mt-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>VulnFusion Deterministic Intelligence Engine — Authoritative VM Analysis</span>
          </div>
          <div>Strict Input Validation & Prompt-Injection Isolation Active</div>
        </footer>

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
