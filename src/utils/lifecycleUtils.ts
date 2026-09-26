import {
  AssetRecord,
  UnderlyingAsset,
  SourceTool,
  AssetLifecycleIntelligence,
  SourceObservationSummary,
  AssetLifecycleStatus,
  LifecyclePolicyConfig,
  AssetArchiveRecord,
} from '../types/vulnfusion';

export const DEFAULT_LIFECYCLE_POLICY: LifecyclePolicyConfig = {
  activeThresholdDays: 14,
  agingThresholdDays: 30,
  staleThresholdDays: 60,
  archiveEligibleThresholdDays: 90,
};

/**
 * Formats an ISO date string into executive human-readable format: "26 Sep 2026"
 * Returns "Unknown" if invalid or missing.
 */
export function formatObservationDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Formats relative age description: "3 days ago", "Today", "45 days ago", etc.
 */
export function formatAgeDescription(days: number | null): string {
  if (days === null || days === undefined) return 'Unknown';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/**
 * Derives lifecycle and observation intelligence for a normalized asset group
 * based strictly on member source records and configurable lifecycle policy.
 */
export function deriveAssetLifecycle(
  cluster: UnderlyingAsset,
  allRecords: AssetRecord[],
  referenceDate: Date = new Date('2026-09-26T00:00:00Z'),
  policy: LifecyclePolicyConfig = DEFAULT_LIFECYCLE_POLICY,
  archiveRecord?: AssetArchiveRecord
): AssetLifecycleIntelligence {
  const memberRecords = allRecords.filter(r => cluster.memberRecordIds.includes(r.recordId));
  const refTime = referenceDate.getTime();

  // 1. Gather all valid firstObserved and lastObserved timestamps
  const validFirstDates: { date: Date; iso: string; tool: SourceTool }[] = [];
  const validLastDates: { date: Date; iso: string; tool: SourceTool; recordId: string }[] = [];

  memberRecords.forEach(r => {
    if (r.firstObserved) {
      const d = new Date(r.firstObserved);
      if (!isNaN(d.getTime())) {
        validFirstDates.push({ date: d, iso: r.firstObserved, tool: r.sourceTool });
      }
    }
    if (r.lastObserved) {
      const d = new Date(r.lastObserved);
      if (!isNaN(d.getTime())) {
        validLastDates.push({ date: d, iso: r.lastObserved, tool: r.sourceTool, recordId: r.recordId });
      }
    }
  });

  // Sort timestamps
  validFirstDates.sort((a, b) => a.date.getTime() - b.date.getTime());
  validLastDates.sort((a, b) => b.date.getTime() - a.date.getTime()); // Latest first

  const earliestFirst = validFirstDates[0]?.iso || null;
  const latestLastEntry = validLastDates[0] || null;
  const latestLast = latestLastEntry?.iso || null;

  let ageSinceLastSeenDays: number | null = null;
  let totalLifespanDays: number | null = null;

  if (latestLast) {
    const lastDate = new Date(latestLast);
    ageSinceLastSeenDays = Math.max(0, Math.floor((refTime - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  if (earliestFirst && latestLast) {
    const firstDate = new Date(earliestFirst);
    const lastDate = new Date(latestLast);
    totalLifespanDays = Math.max(0, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 2. Per-Source Observation Breakdown
  const sourceTools = Array.from(new Set(memberRecords.map(r => r.sourceTool)));
  const sourceObservationSummary: SourceObservationSummary[] = sourceTools.map(tool => {
    const toolRecords = memberRecords.filter(r => r.sourceTool === tool);
    const toolFirstDates = toolRecords
      .map(r => r.firstObserved)
      .filter((d): d is string => !!d && !isNaN(new Date(d).getTime()))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const toolLastDates = toolRecords
      .map(r => r.lastObserved)
      .filter((d): d is string => !!d && !isNaN(new Date(d).getTime()))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const toolFirst = toolFirstDates[0] || null;
    const toolLast = toolLastDates[0] || null;

    let toolAge: number | null = null;
    let toolStatus: 'ACTIVE' | 'AGING' | 'STALE' | 'NOT_REPORTING' = 'NOT_REPORTING';

    if (toolLast) {
      const d = new Date(toolLast);
      toolAge = Math.max(0, Math.floor((refTime - d.getTime()) / (1000 * 60 * 60 * 24)));
      if (toolAge <= policy.activeThresholdDays) toolStatus = 'ACTIVE';
      else if (toolAge <= policy.agingThresholdDays) toolStatus = 'AGING';
      else toolStatus = 'STALE';
    }

    const observationMethods = Array.from(new Set(toolRecords.map(r => r.observationMethod)));

    return {
      sourceTool: tool,
      recordCount: toolRecords.length,
      firstSeen: toolFirst,
      lastSeen: toolLast,
      ageDays: toolAge,
      observationMethods,
      status: toolStatus,
    };
  });

  // 3. Detect Source Observation Disagreements
  let hasDisagreement = false;
  let disagreementReason: string | undefined = undefined;

  const activeTools = sourceObservationSummary.filter(s => s.status === 'ACTIVE');
  const laggingTools = sourceObservationSummary.filter(s => s.status === 'STALE' || s.status === 'AGING');

  if (activeTools.length > 0 && laggingTools.length > 0) {
    hasDisagreement = true;
    const activeNames = activeTools.map(s => s.sourceTool).join(', ');
    const laggingNames = laggingTools.map(s => `${s.sourceTool} (${s.ageDays}d ago)`).join(', ');
    disagreementReason = `Observation gap: Active in ${activeNames} but lagging in ${laggingNames}.`;
  }

  // 4. Archive and Automatic Reactivation Evaluation
  const effectiveArchive = archiveRecord || cluster.archiveMetadata;
  let isArchived = Boolean(effectiveArchive?.isArchived);
  let wasAutoReactivated = Boolean(effectiveArchive?.wasAutoReactivated);
  let reactivatedAt = effectiveArchive?.reactivatedAt;
  let reactivatedBySource = effectiveArchive?.reactivatedBySource;

  // Check if a new observation has arrived after the archive timestamp
  if (isArchived && effectiveArchive?.archivedAt && latestLastEntry) {
    const archiveTime = new Date(effectiveArchive.archivedAt).getTime();
    const latestTime = new Date(latestLastEntry.iso).getTime();
    if (latestTime > archiveTime) {
      // Automatic Reactivation triggered!
      isArchived = false;
      wasAutoReactivated = true;
      reactivatedAt = latestLastEntry.iso;
      reactivatedBySource = latestLastEntry.tool;
    }
  }

  // 5. Derive Overall Lifecycle Status
  let lifecycleStatus: AssetLifecycleStatus = 'UNKNOWN';

  if (isArchived) {
    lifecycleStatus = 'ARCHIVED';
  } else if (!latestLast) {
    lifecycleStatus = 'UNKNOWN';
  } else if (hasDisagreement) {
    lifecycleStatus = 'COVERAGE_DISAGREEMENT';
  } else if (ageSinceLastSeenDays !== null && ageSinceLastSeenDays <= policy.activeThresholdDays) {
    lifecycleStatus = 'ACTIVE';
  } else if (ageSinceLastSeenDays !== null && ageSinceLastSeenDays <= policy.agingThresholdDays) {
    lifecycleStatus = 'AGING';
  } else {
    lifecycleStatus = 'STALE';
  }

  // 6. Archive Eligibility
  const isArchiveEligible = !isArchived && ageSinceLastSeenDays !== null && ageSinceLastSeenDays >= policy.archiveEligibleThresholdDays;

  return {
    firstSeen: earliestFirst,
    lastSeen: latestLast,
    ageSinceLastSeenDays,
    lifecycleStatus,
    sourceObservationSummary,
    hasDisagreement,
    disagreementReason,
    totalLifespanDays,
    isArchiveEligible,
    archiveThresholdDays: policy.archiveEligibleThresholdDays,
    isArchived,
    archiveRecord: effectiveArchive,
    wasAutoReactivated,
    reactivatedAt,
    reactivatedBySource,
  };
}
