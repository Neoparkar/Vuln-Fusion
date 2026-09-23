import { AssetRecord, NormalizedAssetRecord, CorrelationSignal, UnderlyingAsset, CorrelationStatus } from '../types/vulnfusion';
import { normalizeAssetRecord } from './normalizationEngine';

export function evaluatePair(recA: NormalizedAssetRecord, recB: NormalizedAssetRecord): {
  signals: CorrelationSignal[];
  conflicts: CorrelationSignal[];
  status: 'CORRELATED' | 'REVIEW_REQUIRED' | 'SEPARATE';
  confidence: number;
} {
  const signals: CorrelationSignal[] = [];
  const conflicts: CorrelationSignal[] = [];

  // 1. Check Strong Signals
  // Agent ID match
  if (recA.agentId && recB.agentId) {
    if (recA.agentId === recB.agentId) {
      signals.push({
        id: 'sig-agent-id',
        category: 'STRONG',
        name: 'Exact Agent ID Match',
        description: `Both records report identical agent identifier: "${recA.agentId}"`,
        weight: 50,
      });
    } else {
      conflicts.push({
        id: 'conf-agent-id',
        category: 'CONFLICT',
        name: 'Conflicting Agent IDs',
        description: `Record A reports "${recA.agentId}" while Record B reports "${recB.agentId}"`,
        weight: -30,
      });
    }
  }

  // Cloud Instance ID match
  if (recA.cloudInstanceId && recB.cloudInstanceId) {
    if (recA.cloudInstanceId === recB.cloudInstanceId) {
      signals.push({
        id: 'sig-cloud-id',
        category: 'STRONG',
        name: 'Exact Cloud Instance ID Match',
        description: `Both records share cloud instance ID: "${recA.cloudInstanceId}"`,
        weight: 45,
      });
    } else {
      conflicts.push({
        id: 'conf-cloud-id',
        category: 'CONFLICT',
        name: 'Incompatible Cloud Instance IDs',
        description: `Different cloud instances: "${recA.cloudInstanceId}" vs "${recB.cloudInstanceId}"`,
        weight: -35,
      });
    }
  }

  // Serial Number match vs conflict
  if (recA.serialNumber && recB.serialNumber) {
    if (recA.serialNumber === recB.serialNumber) {
      signals.push({
        id: 'sig-serial',
        category: 'STRONG',
        name: 'Exact Serial Number Match',
        description: `Hardware serial number matches: "${recA.serialNumber}"`,
        weight: 40,
      });
    } else {
      conflicts.push({
        id: 'conf-serial',
        category: 'CONFLICT',
        name: 'Conflicting Serial Numbers',
        description: `Hardware serial mismatch: "${recA.serialNumber}" vs "${recB.serialNumber}"`,
        weight: -40,
      });
    }
  }

  // MAC Address match
  if (recA.normalizedMac && recB.normalizedMac) {
    if (recA.normalizedMac === recB.normalizedMac) {
      signals.push({
        id: 'sig-mac',
        category: 'STRONG',
        name: 'Exact MAC Address Match',
        description: `MAC address matches: "${recA.macAddress}"`,
        weight: 35,
      });
    }
  }

  // Exact or overlapping IP match
  const sharedIps = recA.normalizedIps.filter((ip: string) => recB.normalizedIps.includes(ip));
  if (sharedIps.length > 0) {
    signals.push({
      id: 'sig-ip',
      category: 'STRONG',
      name: 'Exact IP Address Match',
      description: `Shared IP address(es): ${sharedIps.join(', ')}`,
      weight: 30,
    });
  } else if (recA.normalizedIps.length > 0 && recB.normalizedIps.length > 0) {
    // Different IPs - could be dynamic IP or different assets
    conflicts.push({
      id: 'conf-ip',
      category: 'CONFLICT',
      name: 'Different IP Addresses',
      description: `Record A uses [${recA.normalizedIps.join(', ')}] while Record B uses [${recB.normalizedIps.join(', ')}]`,
      weight: -15,
    });
  }

  // 2. Moderate Signals
  // Hostname / FQDN match
  if (recA.normalizedHostname && recB.normalizedHostname) {
    if (recA.normalizedHostname === recB.normalizedHostname) {
      signals.push({
        id: 'sig-hostname',
        category: 'MODERATE',
        name: 'Normalized Hostname Match',
        description: `Hostnames match: "${recA.hostname}" and "${recB.hostname}"`,
        weight: 25,
      });
    } else {
      // Check if one is substring or base variation (e.g. websrv01 vs WEB-SRV-01)
      const cleanA = recA.normalizedHostname.replace(/[-_.]/g, '');
      const cleanB = recB.normalizedHostname.replace(/[-_.]/g, '');
      if (cleanA === cleanB) {
        signals.push({
          id: 'sig-hostname-variant',
          category: 'MODERATE',
          name: 'Hostname Variation Match',
          description: `Hostnames represent same identifier format: "${recA.hostname}" vs "${recB.hostname}"`,
          weight: 20,
        });
      } else {
        conflicts.push({
          id: 'conf-hostname',
          category: 'CONFLICT',
          name: 'Different Hostnames',
          description: `Hostnames differ: "${recA.hostname}" vs "${recB.hostname}"`,
          weight: -20,
        });
      }
    }
  }

  // Operating System compatibility
  if (recA.normalizedOs && recB.normalizedOs) {
    if (recA.normalizedOs === recB.normalizedOs) {
      signals.push({
        id: 'sig-os',
        category: 'MODERATE',
        name: 'Compatible Operating System',
        description: `Operating system family matches: "${recA.operatingSystem}" and "${recB.operatingSystem}"`,
        weight: 15,
      });
    } else {
      conflicts.push({
        id: 'conf-os',
        category: 'CONFLICT',
        name: 'Incompatible Operating Systems',
        description: `OS mismatch: "${recA.operatingSystem}" vs "${recB.operatingSystem}"`,
        weight: -35,
      });
    }
  }

  // Domain match
  if (recA.domain && recB.domain && recA.domain === recB.domain) {
    signals.push({
      id: 'sig-domain',
      category: 'MODERATE',
      name: 'Matching Domain',
      description: `Both records belong to domain: "${recA.domain}"`,
      weight: 10,
    });
  }

  // 3. Contextual Signals
  if (recA.sourceTool === recB.sourceTool) {
    signals.push({
      id: 'sig-same-tool',
      category: 'CONTEXTUAL',
      name: 'Same Source Tool',
      description: `Reported by same tool (${recA.sourceTool}), observation method: ${recA.observationMethod} vs ${recB.observationMethod}`,
      weight: 10,
    });
  } else {
    signals.push({
      id: 'sig-cross-tool',
      category: 'CONTEXTUAL',
      name: 'Cross-Tool Observation',
      description: `Observed across different security tools (${recA.sourceTool} and ${recB.sourceTool})`,
      weight: 15,
    });
  }

  // Calculate total score
  const signalScore = signals.reduce((acc, s) => acc + s.weight, 0);
  const conflictScore = conflicts.reduce((acc, c) => acc + c.weight, 0);
  const netScore = signalScore + conflictScore;

  // Determine status conservatively
  let status: CorrelationStatus = 'REVIEW_REQUIRED';
  let confidence = 50;

  // Fatal conflict checks
  const hasFatalConflict = conflicts.some(c => c.id === 'conf-serial' || c.id === 'conf-os' || c.id === 'conf-cloud-id');
  const hasStrongIdentifierMatch = signals.some(s => ['sig-agent-id', 'sig-cloud-id', 'sig-serial', 'sig-mac'].includes(s.id));
  const hasIpAndHostnameMatch = sharedIps.length > 0 && signals.some(s => s.id === 'sig-hostname' || s.id === 'sig-hostname-variant');

  if (hasFatalConflict && !hasStrongIdentifierMatch) {
    status = 'REVIEW_REQUIRED';
    confidence = 35;
  } else if (hasStrongIdentifierMatch || (hasIpAndHostnameMatch && conflicts.length === 0)) {
    status = 'CORRELATED';
    confidence = Math.min(95, Math.max(70, 60 + netScore));
  } else if (netScore >= 45 && conflicts.length === 0) {
    status = 'CORRELATED';
    confidence = Math.min(85, 50 + netScore);
  } else if (netScore >= 25) {
    status = 'REVIEW_REQUIRED';
    confidence = 50;
  } else {
    status = 'SEPARATE';
    confidence = 80;
  }

  return { signals, conflicts, status, confidence };
}

export function runCorrelationEngine(records: AssetRecord[]): UnderlyingAsset[] {
  const normalizedRecords = records.map(normalizeAssetRecord);
  const assignedRecordIds = new Set<string>();
  const underlyingAssets: UnderlyingAsset[] = [];
  let clusterCounter = 1;

  for (let i = 0; i < normalizedRecords.length; i++) {
    const recA = normalizedRecords[i];
    if (assignedRecordIds.has(recA.recordId)) continue;

    const clusterMemberRecords: NormalizedAssetRecord[] = [recA];
    assignedRecordIds.add(recA.recordId);

    let clusterStatus: CorrelationStatus = 'CORRELATED';
    let allSignals: CorrelationSignal[] = [];
    let allConflicts: CorrelationSignal[] = [];
    let totalConfidenceSum = 100;
    let matchCount = 1;

    // Compare with remaining unassigned records
    for (let j = i + 1; j < normalizedRecords.length; j++) {
      const recB = normalizedRecords[j];
      if (assignedRecordIds.has(recB.recordId)) continue;

      // Evaluate against the primary record or existing cluster members
      const evalResult = evaluatePair(recA, recB);

      // If correlated or review required with strong ties, group them into the same cluster
      if (evalResult.status === 'CORRELATED' || (evalResult.status === 'REVIEW_REQUIRED' && evalResult.signals.length >= 2)) {
        clusterMemberRecords.push(recB);
        assignedRecordIds.add(recB.recordId);
        allSignals.push(...evalResult.signals);
        allConflicts.push(...evalResult.conflicts);
        totalConfidenceSum += evalResult.confidence;
        matchCount++;

        if (evalResult.status === 'REVIEW_REQUIRED') {
          clusterStatus = 'REVIEW_REQUIRED';
        }
      }
    }

    // If cluster has multiple records or single record
    if (clusterMemberRecords.length === 1) {
      clusterStatus = 'SEPARATE';
    } else if (allConflicts.length > 0 && clusterStatus !== 'REVIEW_REQUIRED') {
      clusterStatus = 'REVIEW_REQUIRED';
    }

    // Deduplicate signals and conflicts
    const uniqueSignals = Array.from(new Map(allSignals.map(s => [s.id, s])).values());
    const uniqueConflicts = Array.from(new Map(allConflicts.map(c => [c.id, c])).values());

    const avgConfidence = Math.round(totalConfidenceSum / matchCount);
    const underlyingAssetId = `CLUSTER-${String(clusterCounter++).padStart(3, '0')}`;

    // Determine canonical attributes
    const hostnames = clusterMemberRecords.map(r => r.hostname).filter(Boolean) as string[];
    const canonicalHostname = hostnames.length > 0 ? hostnames[0] : 'UNKNOWN-HOST';

    const allIps = Array.from(new Set(clusterMemberRecords.flatMap(r => r.ipAddresses)));
    const osList = Array.from(new Set(clusterMemberRecords.map(r => r.operatingSystem).filter(Boolean))) as string[];
    const canonicalOs = osList.length > 0 ? osList.join(' / ') : 'Unknown OS';

    underlyingAssets.push({
      underlyingAssetId,
      memberRecordIds: clusterMemberRecords.map(r => r.recordId),
      correlationStatus: clusterStatus,
      correlationEvidence: uniqueSignals,
      conflictingAttributes: uniqueConflicts,
      confidence: clusterStatus === 'SEPARATE' ? 90 : avgConfidence,
      reviewRequired: clusterStatus === 'REVIEW_REQUIRED',
      canonicalHostname,
      canonicalIpAddresses: allIps,
      canonicalOs,
      representativeRecords: clusterMemberRecords,
      clusterSummary: `${clusterMemberRecords.length} record(s) from ${Array.from(new Set(clusterMemberRecords.map(r => r.sourceTool))).join(', ')}`,
    });
  }

  return underlyingAssets;
}
