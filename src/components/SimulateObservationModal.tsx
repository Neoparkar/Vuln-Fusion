import React, { useState } from 'react';
import { UnderlyingAsset, AssetRecord, SourceTool, ObservationMethod } from '../types/vulnfusion';
import { Sparkles, Activity, ShieldCheck, X, RefreshCw, Layers, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { SourceIntelligenceIcon, AssetLifecycleIcon, AssetIntelligenceIcon } from './icons/VulnFusionIcons';
import { SourceLogo } from './SourceLogo';

interface SimulateObservationModalProps {
  asset: UnderlyingAsset | null;
  records: AssetRecord[];
  onClose: () => void;
  onSimulateObservation: (newRecord: AssetRecord) => void;
}

export const SimulateObservationModal: React.FC<SimulateObservationModalProps> = ({
  asset,
  records,
  onClose,
  onSimulateObservation,
}) => {
  const [sourceTool, setSourceTool] = useState<SourceTool>('Qualys');
  const [observationMethod, setObservationMethod] = useState<ObservationMethod>('agent');
  const [observedDate, setObservedDate] = useState('2026-09-26T12:00:00Z');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!asset) return null;

  const memberRecords = records.filter(r => asset.memberRecordIds.includes(r.recordId));
  const primaryRecord = memberRecords[0] || records[0];

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a new fresh telemetry record matching the asset's exact deterministic identity
    const newRecordId = `${sourceTool.charAt(0).toUpperCase()}-SIM-${Date.now().toString().slice(-6)}`;
    const simulatedRecord: AssetRecord = {
      ...primaryRecord,
      recordId: newRecordId,
      sourceTool,
      observationMethod,
      hostname: asset.canonicalHostname,
      ipAddresses: asset.canonicalIpAddresses.length > 0 ? asset.canonicalIpAddresses : ['192.168.40.80'],
      macAddress: primaryRecord?.macAddress || '00:1A:2B:AA:BB:12',
      operatingSystem: asset.canonicalOs || primaryRecord?.operatingSystem || 'Linux',
      biosUuid: asset.canonicalBiosUuid || primaryRecord?.biosUuid,
      cloudResourceId: asset.canonicalCloudResourceId || primaryRecord?.cloudResourceId,
      firstObserved: primaryRecord?.firstObserved || '2026-01-10T08:00:00Z',
      lastObserved: observedDate,
      assetTags: [...(primaryRecord?.assetTags || []), 'simulated-fresh-scan'],
      sourceSpecificAttributes: {
        simulationTimestamp: new Date().toISOString(),
        simulatedScanner: `${sourceTool} Active Ingest`,
      },
    };

    onSimulateObservation(simulatedRecord);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#0B1017] border border-[#1B2838] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#F4F7FB] my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1B2838] bg-[#0E1520] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Live Ingestion Simulation
              </span>
              <span className="text-xs font-mono text-[#5F6875]">·</span>
              <span className="text-xs font-mono text-[#718197]">{asset.underlyingAssetId}</span>
            </div>
            <h3 className="text-xl font-bold text-[#F4F7FB]">
              Simulate New Scan Observation
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#718197] hover:text-[#F4F7FB] hover:bg-[#15202E] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRunSimulation} className="p-5 space-y-5 text-xs">
          
          {/* Target Asset Identity Preview */}
          <div className="p-3.5 bg-[#101924] rounded-xl border border-[#1B2838] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#718197] font-medium text-[11px]">Target Identity:</span>
              <span className="font-bold text-sm text-[#00B8FF] font-mono">{asset.canonicalHostname}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#1B2838]/60">
              <div>
                <span className="text-[#5F6875] block">BIOS UUID:</span>
                <span className="font-mono text-[#718197] truncate block">{asset.canonicalBiosUuid || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#5F6875] block">IP Address:</span>
                <span className="font-mono text-[#718197] block">{asset.canonicalIpAddresses.join(', ') || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-3.5 bg-[#152336] border border-[#00B8FF]/30 rounded-xl text-[11px] text-[#A8B7C9] space-y-1">
            <span className="font-bold text-[#00B8FF] flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Automatic Reappearance Flow:
            </span>
            <p>
              When a new telemetry observation arrives for an archived asset, the deterministic correlation engine matches the identity signals and <strong>automatically reactivates</strong> the asset in the Active Inventory without creating a duplicate.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-[#718197] uppercase block mb-1.5">
                Select Telemetry Source Platform
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Qualys', 'Tenable', 'Rapid7', 'Wiz'] as const).map(tool => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => setSourceTool(tool)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      sourceTool === tool
                        ? 'bg-[#152336] border-[#00B8FF] text-[#F4F7FB] shadow-sm ring-1 ring-[#00B8FF]/30'
                        : 'bg-[#101924] border-[#1B2838] text-[#718197] hover:text-[#F4F7FB] hover:border-[#26384C]'
                    }`}
                  >
                    <SourceLogo sourceTool={tool} size={18} />
                    <span>{tool}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#718197] uppercase block mb-1">
                  Observation Method
                </label>
                <select
                  value={observationMethod}
                  onChange={(e) => setObservationMethod(e.target.value as ObservationMethod)}
                  className="w-full bg-[#101924] border border-[#1B2838] text-[#F4F7FB] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00B8FF]"
                >
                  <option value="agent">Agent Observation</option>
                  <option value="authenticated_scan">Authenticated Scan</option>
                  <option value="discovery_scan">Discovery Scan</option>
                  <option value="cloud_inventory">Cloud Inventory</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#718197] uppercase block mb-1">
                  Fresh Observation Timestamp (ISO)
                </label>
                <input
                  type="text"
                  value={observedDate}
                  onChange={(e) => setObservedDate(e.target.value)}
                  className="w-full bg-[#101924] border border-[#1B2838] text-[#F4F7FB] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#00B8FF]"
                />
              </div>
            </div>
          </div>

          {/* Success indicator */}
          {isSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Observation successfully ingested! Asset correlation updated and reactivated.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B2838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#101924] hover:bg-[#15202E] text-[#718197] hover:text-[#F4F7FB] border border-[#1B2838] rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSuccess}
              className="px-5 py-2 bg-gradient-to-r from-[#00B8FF] to-blue-600 hover:from-[#0098DF] hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ingest & Trigger Correlation</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
