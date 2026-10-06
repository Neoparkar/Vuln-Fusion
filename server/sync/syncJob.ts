/**
 * Sync-job planning only. No queue, scheduler, or worker.
 */

import { planSyncJob, sanitizeSyncErrorMessage, type SyncJobRecord, type SyncJobStatus } from '../../src/tenancy/connectorSecurity';

export type { SyncJobRecord, SyncJobStatus };

export function planServerSyncJob(input: {
  organizationId: string;
  connectionId: string;
  cursor: string | null;
  existingStatuses: SyncJobStatus[];
  now: string;
}): ReturnType<typeof planSyncJob> {
  return planSyncJob(input);
}

export function safeSyncErrorMessage(message: string | null): string | null {
  return sanitizeSyncErrorMessage(message);
}
