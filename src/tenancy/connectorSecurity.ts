/**
 * Pure connector authorization. No network, no secret values, no React.
 * Server modules under server/ are the only runtime boundary.
 * Client code may import this file. It must not import server/.
 */

import { hasPermission, type Permission } from '../context/RBACContext';
import {
  auditMetadataIsSafe,
  DEMO_ORGANIZATION_ID,
  resolveAuthorizedOrganization,
  type TenancyMembership,
  type TenancyRole,
} from './organizationAuthority';

export const SERVER_ONLY_MODULE_PREFIXES = [
  'server/connectors',
  'server/security',
  'server/secrets',
  'server/sync',
] as const;

export const MAX_SYNC_PAGE_SIZE = 100;

export const CONNECTOR_FORBIDDEN_AUTHORITY = [
  'underlyingAssetGroupId',
  'correlationStatus',
  'reviewStatus',
  'findingIdentity',
  'exceptionStatus',
  'archiveState',
] as const;

export type ConnectorErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'ORGANIZATION_NOT_AUTHORIZED'
  | 'PERMISSION_DENIED'
  | 'CONNECTION_NOT_FOUND'
  | 'CONNECTION_DISABLED'
  | 'SECRET_STORE_NOT_CONFIGURED'
  | 'CONNECTOR_NOT_CONFIGURED'
  | 'SYNC_NOT_ALLOWED'
  | 'SYNC_ALREADY_RUNNING'
  | 'UPSTREAM_AUTH_FAILED'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INVALID_PROVIDER_CONFIGURATION'
  | 'DEMO_MODE_ISOLATED';

export type ConnectorOperation =
  | 'manage'
  | 'test'
  | 'sync'
  | 'view_health'
  | 'rotate_credential'
  | 'remove';

export type ConnectorAuditAction =
  | 'DATA_SOURCE_CREATED'
  | 'DATA_SOURCE_UPDATED'
  | 'DATA_SOURCE_REMOVED'
  | 'DATA_SOURCE_TESTED'
  | 'DATA_SOURCE_SYNC_STARTED'
  | 'DATA_SOURCE_SYNC_COMPLETED'
  | 'DATA_SOURCE_SYNC_FAILED'
  | 'DATA_SOURCE_CREDENTIAL_ROTATED';

export type SyncJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface DataSourceConnection {
  id: string;
  organizationId: string;
  provider: string;
  displayName: string;
  status: 'disabled' | 'ready' | 'error';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastTestedAt: string | null;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  credentialReference: string | null;
  configurationMetadata: Record<string, unknown>;
}

export interface SyncJobRecord {
  id: string;
  organizationId: string;
  connectionId: string;
  status: SyncJobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  cursor: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  idempotencyKey: string;
}

export interface SecretStore {
  readonly configured: boolean;
  putSecret(reference: string, _value: string): Promise<SecretStoreResult>;
  getSecret(reference: string): Promise<SecretStoreResult>;
  deleteSecret(reference: string): Promise<SecretStoreResult>;
  rotateSecret(reference: string, _value: string): Promise<SecretStoreResult>;
}

export interface SecretStoreResult {
  ok: boolean;
  code: 'SECRET_STORE_NOT_CONFIGURED' | 'OK';
  reference: string | null;
}

export interface ConnectorMetadata {
  provider: string;
  readOnly: true;
  version: string;
}

export interface ConnectorPage<T> {
  records: T[];
  nextCursor: string | null;
}

/**
 * Vendor adapters implement this on the server.
 * They do not assign correlation identity or status.
 */
export interface SecurityConnector<TAsset = { externalId: string }, TFinding = { externalId: string }> {
  metadata(): ConnectorMetadata;
  testConnection(): Promise<{ ok: boolean; code: ConnectorErrorCode | 'OK' }>;
  fetchAssetsPage(cursor: string | null): Promise<ConnectorPage<TAsset>>;
  fetchFindingsPage(cursor: string | null): Promise<ConnectorPage<TFinding>>;
  syncPage(cursor: string | null): Promise<ConnectorPage<TAsset | TFinding>>;
}

const OPERATION_PERMISSION: Record<ConnectorOperation, Permission> = {
  manage: 'MANAGE_DATA_SOURCES',
  test: 'TEST_DATA_SOURCE',
  sync: 'SYNC_DATA',
  view_health: 'VIEW_DATA_SOURCE_HEALTH',
  rotate_credential: 'ROTATE_DATA_SOURCE_CREDENTIAL',
  remove: 'REMOVE_DATA_SOURCE',
};

const PUBLIC_ERROR_MESSAGES: Record<ConnectorErrorCode, string> = {
  AUTHENTICATION_REQUIRED: 'Authentication is required.',
  ORGANIZATION_NOT_AUTHORIZED: 'Organization access is not authorized.',
  PERMISSION_DENIED: 'This action is not allowed for the current role.',
  CONNECTION_NOT_FOUND: 'The data source is not available in this organization.',
  CONNECTION_DISABLED: 'The data source is disabled.',
  SECRET_STORE_NOT_CONFIGURED: 'Server-side secret storage is not configured.',
  CONNECTOR_NOT_CONFIGURED: 'This provider is not configured.',
  SYNC_NOT_ALLOWED: 'Synchronization is not allowed.',
  SYNC_ALREADY_RUNNING: 'A synchronization is already running for this data source.',
  UPSTREAM_AUTH_FAILED: 'The upstream service rejected authentication.',
  UPSTREAM_TIMEOUT: 'The upstream service timed out.',
  UPSTREAM_RATE_LIMITED: 'The upstream service rate limit was reached.',
  UPSTREAM_UNAVAILABLE: 'The upstream service is unavailable.',
  INVALID_PROVIDER_CONFIGURATION: 'The provider configuration is not valid.',
  DEMO_MODE_ISOLATED: 'Presentation mode cannot use production data sources.',
};

const SENSITIVE_TEXT = /bearer\s+\S+|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]/i;

export function connectorPermissionFor(operation: ConnectorOperation): Permission {
  return OPERATION_PERMISSION[operation];
}

export function roleMayPerformConnectorOperation(role: TenancyRole, operation: ConnectorOperation): boolean {
  return hasPermission(role, connectorPermissionFor(operation));
}

export function clientImportBlocked(specifier: string): boolean {
  const normalized = specifier.replace(/\\/g, '/');
  return SERVER_ONLY_MODULE_PREFIXES.some(prefix =>
    normalized === prefix
    || normalized.startsWith(`${prefix}/`)
    || normalized.includes(`/${prefix}`)
  );
}

export function browserCanReadConnectorSecrets(): false {
  return false;
}

export function connectorMayDecide(field: string): boolean {
  return !CONNECTOR_FORBIDDEN_AUTHORITY.includes(field as typeof CONNECTOR_FORBIDDEN_AUTHORITY[number]);
}

export function geminiConnectorAuthority(): {
  explanationOnly: true;
  mayAuthenticateConnectors: false;
  mayAccessCredentials: false;
  mayDetermineAssetIdentity: false;
  mayDetermineCorrelationStatus: false;
  mayDetermineFindingIdentity: false;
  mayAuthorizeSync: false;
  mayOverrideDeterministicResults: false;
} {
  return {
    explanationOnly: true,
    mayAuthenticateConnectors: false,
    mayAccessCredentials: false,
    mayDetermineAssetIdentity: false,
    mayDetermineCorrelationStatus: false,
    mayDetermineFindingIdentity: false,
    mayAuthorizeSync: false,
    mayOverrideDeterministicResults: false,
  };
}

export function textContainsSecretMaterial(value: string): boolean {
  return SENSITIVE_TEXT.test(value);
}

export function toPublicConnectorError(code: ConnectorErrorCode, upstreamDetail?: string): {
  error: ConnectorErrorCode;
  message: string;
} {
  const message = PUBLIC_ERROR_MESSAGES[code];
  if (upstreamDetail && (textContainsSecretMaterial(upstreamDetail) || message.includes(upstreamDetail))) {
    return { error: code, message: 'Request could not be completed.' };
  }
  return { error: code, message };
}

export function performSecretOperation(
  store: { configured: boolean },
  _operation: 'put' | 'get' | 'delete' | 'rotate',
  reference: string | null
): SecretStoreResult {
  // No secure provider is implemented. Never echo or retain the secret value.
  void store;
  void reference;
  return { ok: false, code: 'SECRET_STORE_NOT_CONFIGURED', reference: null };
}

export function assertOpaqueCredentialReference(reference: string | null): boolean {
  if (reference == null) return true;
  if (reference.length < 1 || reference.length > 128) return false;
  if (/\s/.test(reference)) return false;
  if (textContainsSecretMaterial(reference)) return false;
  return /^vault:[A-Za-z0-9:._/-]+$/.test(reference);
}

export interface ConnectorAuthorization {
  ok: boolean;
  code: ConnectorErrorCode | 'OK';
  organizationId: string | null;
  role: TenancyRole | null;
  connectionId: string | null;
  reason: string;
}

export function authorizeConnectorOperation(input: {
  configured: boolean;
  authenticatedUserId: string | null;
  memberships: TenancyMembership[] | null;
  queryFailed: boolean;
  candidateOrganizationId?: string | null;
  operation: ConnectorOperation;
  isPresentationSession: boolean;
  connection?: Pick<DataSourceConnection, 'id' | 'organizationId' | 'enabled'> | null;
  requiresConnection?: boolean;
  requiresEnabledConnection?: boolean;
  requiresSecret?: boolean;
  secretStoreConfigured?: boolean;
}): ConnectorAuthorization {
  if (input.isPresentationSession) {
    return {
      ok: false,
      code: 'DEMO_MODE_ISOLATED',
      organizationId: null,
      role: null,
      connectionId: null,
      reason: 'presentation_session',
    };
  }

  const resolution = resolveAuthorizedOrganization({
    configured: input.configured,
    authenticatedUserId: input.authenticatedUserId,
    memberships: input.memberships,
    queryFailed: input.queryFailed,
    candidateOrganizationId: input.candidateOrganizationId,
  });

  if (!input.authenticatedUserId || resolution.status === 'unauthenticated') {
    return {
      ok: false,
      code: 'AUTHENTICATION_REQUIRED',
      organizationId: null,
      role: null,
      connectionId: null,
      reason: resolution.status,
    };
  }

  if (resolution.status !== 'resolved' || !resolution.organizationId) {
    return {
      ok: false,
      code: 'ORGANIZATION_NOT_AUTHORIZED',
      organizationId: null,
      role: 'user',
      connectionId: null,
      reason: resolution.status,
    };
  }

  if (resolution.organizationId === DEMO_ORGANIZATION_ID) {
    return {
      ok: false,
      code: 'ORGANIZATION_NOT_AUTHORIZED',
      organizationId: null,
      role: resolution.role,
      connectionId: null,
      reason: 'demo_organization_not_a_connector_tenant',
    };
  }

  if (!roleMayPerformConnectorOperation(resolution.role, input.operation)) {
    return {
      ok: false,
      code: 'PERMISSION_DENIED',
      organizationId: resolution.organizationId,
      role: resolution.role,
      connectionId: null,
      reason: 'permission',
    };
  }

  if (input.requiresConnection) {
    if (!input.connection || input.connection.organizationId !== resolution.organizationId) {
      return {
        ok: false,
        code: 'CONNECTION_NOT_FOUND',
        organizationId: resolution.organizationId,
        role: resolution.role,
        connectionId: null,
        reason: input.connection ? 'cross_organization' : 'missing_connection',
      };
    }
    if (input.requiresEnabledConnection && !input.connection.enabled) {
      return {
        ok: false,
        code: 'CONNECTION_DISABLED',
        organizationId: resolution.organizationId,
        role: resolution.role,
        connectionId: input.connection.id,
        reason: 'disabled',
      };
    }
  }

  if (input.requiresSecret && input.secretStoreConfigured !== true) {
    return {
      ok: false,
      code: 'SECRET_STORE_NOT_CONFIGURED',
      organizationId: resolution.organizationId,
      role: resolution.role,
      connectionId: input.connection?.organizationId === resolution.organizationId ? input.connection.id : null,
      reason: 'secret_store',
    };
  }

  return {
    ok: true,
    code: 'OK',
    organizationId: resolution.organizationId,
    role: resolution.role,
    connectionId: input.connection?.organizationId === resolution.organizationId ? input.connection.id : null,
    reason: 'authorized',
  };
}

export function buildConnectorAuditMetadata(input: {
  action: ConnectorAuditAction;
  organizationId: string;
  actorUserId: string;
  connectionId: string;
  outcome: 'allowed' | 'denied' | 'succeeded' | 'failed';
  metadata?: Record<string, unknown>;
}): { allow: boolean; metadata: Record<string, unknown> } {
  const metadata: Record<string, unknown> = {
    action: input.action,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    connectionId: input.connectionId,
    outcome: input.outcome,
    ...(input.metadata ?? {}),
  };
  if (!auditMetadataIsSafe(metadata) || JSON.stringify(metadata).match(SENSITIVE_TEXT)) {
    return { allow: false, metadata: {} };
  }
  return { allow: true, metadata };
}

export function syncIdempotencyKey(organizationId: string, connectionId: string, cursor: string | null): string {
  return `${organizationId}:${connectionId}:${cursor ?? 'start'}`;
}

export function clampSyncPageSize(requested: number): number {
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.floor(requested), MAX_SYNC_PAGE_SIZE);
}

export function planSyncJob(input: {
  organizationId: string;
  connectionId: string;
  cursor: string | null;
  existingStatuses: SyncJobStatus[];
  now: string;
}): { ok: true; job: SyncJobRecord } | { ok: false; code: 'SYNC_ALREADY_RUNNING' } {
  if (input.existingStatuses.includes('RUNNING') || input.existingStatuses.includes('QUEUED')) {
    return { ok: false, code: 'SYNC_ALREADY_RUNNING' };
  }
  return {
    ok: true,
    job: {
      id: `job:${syncIdempotencyKey(input.organizationId, input.connectionId, input.cursor)}`,
      organizationId: input.organizationId,
      connectionId: input.connectionId,
      status: 'QUEUED',
      startedAt: null,
      finishedAt: null,
      cursor: input.cursor,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errorCode: null,
      errorMessage: null,
      createdAt: input.now,
      idempotencyKey: syncIdempotencyKey(input.organizationId, input.connectionId, input.cursor),
    },
  };
}

export function sanitizeSyncErrorMessage(message: string | null): string | null {
  if (!message) return null;
  if (textContainsSecretMaterial(message) || !auditMetadataIsSafe({ message })) return null;
  return message.slice(0, 200);
}

export function resolveConfiguredConnector(provider: string, registered: readonly string[]): {
  ok: boolean;
  code: 'OK' | 'CONNECTOR_NOT_CONFIGURED';
  provider: string | null;
} {
  if (!registered.includes(provider)) {
    return { ok: false, code: 'CONNECTOR_NOT_CONFIGURED', provider: null };
  }
  return { ok: true, code: 'OK', provider };
}
