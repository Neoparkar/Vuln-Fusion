import { VulnerabilityFinding, FindingCorrelationGroup, CorrelationSignal, CorrelationStatus } from '../types/vulnfusion';
import { SYNTHETIC_FINDINGS } from '../data/syntheticFindings';

export function runFindingCorrelationEngine(findings: VulnerabilityFinding[]): FindingCorrelationGroup[] {
  const assignedFindingIds = new Set<string>();
  const remediationGroups: FindingCorrelationGroup[] = [];
  let groupCounter = 1;

  for (let i = 0; i < findings.length; i++) {
    const findingA = findings[i];
    if (assignedFindingIds.has(findingA.findingId)) continue;

    const clusterFindings: VulnerabilityFinding[] = [findingA];
    assignedFindingIds.add(findingA.findingId);

    const signals: CorrelationSignal[] = [];
    const conflicts: CorrelationSignal[] = [];

    // Add baseline supporting signals for finding A
    signals.push({
      id: 'sig-finding-base',
      category: 'STRONG',
      name: 'Finding Identity Recorded',
      description: `Baseline vulnerability ID: ${findingA.vulnerabilityId} (${findingA.title})`,
      weight: 30,
    });

    let status: CorrelationStatus = 'CORRELATED';
    let totalConfidence = 85;

    for (let j = i + 1; j < findings.length; j++) {
      const findingB = findings[j];
      if (assignedFindingIds.has(findingB.findingId)) continue;

      // Check if same underlying asset group
      const sameAsset = findingA.underlyingAssetGroupId === findingB.underlyingAssetGroupId;
      const sameVulnId = findingA.vulnerabilityId.toLowerCase() === findingB.vulnerabilityId.toLowerCase();

      if (sameAsset && sameVulnId) {
        // Compare software and version
        const softA = findingA.affectedSoftware.trim().toLowerCase();
        const softB = findingB.affectedSoftware.trim().toLowerCase();

        if (softA === softB) {
          signals.push({
            id: 'sig-same-software',
            category: 'MODERATE',
            name: 'Matching Affected Software',
            description: `Both findings report software: "${findingA.affectedSoftware}"`,
            weight: 25,
          });

          // Check version
          if (findingA.affectedVersion && findingB.affectedVersion) {
            const verA = findingA.affectedVersion.trim().toLowerCase();
            const verB = findingB.affectedVersion.trim().toLowerCase();
            const baseA = verA.split(/[-+~]/)[0];
            const baseB = verB.split(/[-+~]/)[0];
            if (verA === verB || (baseA && baseB && baseA === baseB) || verA.startsWith(verB) || verB.startsWith(verA)) {
              signals.push({
                id: 'sig-same-version',
                category: 'STRONG',
                name: 'Exact Affected Version Match',
                description: `Version matches: "${findingA.affectedVersion}"`,
                weight: 30,
              });
              clusterFindings.push(findingB);
              assignedFindingIds.add(findingB.findingId);
            } else {
              // Version mismatch -> Review required
              conflicts.push({
                id: 'conf-version',
                category: 'CONFLICT',
                name: 'Conflicting Affected Versions',
                description: `Version mismatch: "${findingA.affectedVersion}" vs "${findingB.affectedVersion}"`,
                weight: -30,
              });
              status = 'REVIEW_REQUIRED';
              clusterFindings.push(findingB);
              assignedFindingIds.add(findingB.findingId);
            }
          } else {
            // Missing version in one or both
            conflicts.push({
              id: 'conf-missing-version',
              category: 'CONFLICT',
              name: 'Missing Version Information',
              description: `One or more findings lack specific version details for ${findingA.vulnerabilityId}`,
              weight: -20,
            });
            status = 'REVIEW_REQUIRED';
            clusterFindings.push(findingB);
            assignedFindingIds.add(findingB.findingId);
          }
        } else {
          // Conflicting software for same vulnerability ID on same asset -> CONFLICT / REVIEW_REQUIRED
          conflicts.push({
            id: 'conf-software',
            category: 'CONFLICT',
            name: 'Conflicting Affected Software',
            description: `Software mismatch for ${findingA.vulnerabilityId}: "${findingA.affectedSoftware}" vs "${findingB.affectedSoftware}"`,
            weight: -40,
          });
          status = 'REVIEW_REQUIRED';
          clusterFindings.push(findingB);
          assignedFindingIds.add(findingB.findingId);
        }
      } else if (sameVulnId && !sameAsset) {
        // Same CVE, different assets -> SEPARATE remediation issues (do not group)
      }
    }

    if (clusterFindings.length === 1) {
      status = 'CORRELATED'; // Single finding is its own remediation issue
    }

    const uniqueSignals = Array.from(new Map(signals.map(s => [s.id, s])).values());
    const uniqueConflicts = Array.from(new Map(conflicts.map(c => [c.id, c])).values());

    if (uniqueConflicts.length > 0 && status !== 'REVIEW_REQUIRED') {
      status = 'REVIEW_REQUIRED';
      totalConfidence = 55;
    }

    remediationGroups.push({
      remediationIssueId: `REMEDY-${String(groupCounter++).padStart(3, '0')}`,
      memberFindingIds: clusterFindings.map(f => f.findingId),
      underlyingAssetGroupId: findingA.underlyingAssetGroupId,
      vulnerabilityId: findingA.vulnerabilityId,
      vulnerabilityIdType: findingA.vulnerabilityIdType,
      title: findingA.title,
      affectedSoftware: findingA.affectedSoftware,
      affectedVersion: findingA.affectedVersion,
      correlationStatus: status,
      correlationEvidence: uniqueSignals,
      conflictingAttributes: uniqueConflicts,
      confidence: status === 'REVIEW_REQUIRED' ? 55 : totalConfidence,
      representativeFindings: clusterFindings,
    });
  }

  return remediationGroups;
}

export function runFindingTestCases() {
  const findings = SYNTHETIC_FINDINGS;
  const groups = runFindingCorrelationEngine(findings);
  
  return {
    totalFindings: findings.length,
    totalRemediationGroups: groups.length,
    correlatedGroups: groups.filter(g => g.correlationStatus === 'CORRELATED').length,
    reviewRequiredGroups: groups.filter(g => g.correlationStatus === 'REVIEW_REQUIRED').length,
  };
}
