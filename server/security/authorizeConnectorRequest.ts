/**
 * Future connector routes call this after reading the Supabase session.
 * The browser does not choose the organization, the role, or the secret.
 */

import {
  authorizeConnectorOperation,
  type ConnectorAuthorization,
  type ConnectorOperation,
  type DataSourceConnection,
} from '../../src/tenancy/connectorSecurity';
import type { TenancyMembership } from '../../src/tenancy/organizationAuthority';
import { unconfiguredSecretStore } from '../secrets/secretStore';

export interface ServerConnectorRequest {
  configured: boolean;
  authenticatedUserId: string | null;
  memberships: TenancyMembership[] | null;
  queryFailed: boolean;
  candidateOrganizationId?: string | null;
  operation: ConnectorOperation;
  isPresentationSession: boolean;
  connection?: Pick<DataSourceConnection, 'id' | 'organizationId' | 'enabled'> | null;
}

const SECRET_OPERATIONS = new Set<ConnectorOperation>(['test', 'sync', 'rotate_credential']);
const CONNECTION_OPERATIONS = new Set<ConnectorOperation>(['test', 'sync', 'view_health', 'rotate_credential', 'remove']);

export function authorizeServerConnectorRequest(request: ServerConnectorRequest): ConnectorAuthorization {
  return authorizeConnectorOperation({
    configured: request.configured,
    authenticatedUserId: request.authenticatedUserId,
    memberships: request.memberships,
    queryFailed: request.queryFailed,
    candidateOrganizationId: request.candidateOrganizationId,
    operation: request.operation,
    isPresentationSession: request.isPresentationSession,
    connection: request.connection,
    requiresConnection: CONNECTION_OPERATIONS.has(request.operation),
    requiresEnabledConnection: request.operation === 'sync' || request.operation === 'test',
    requiresSecret: SECRET_OPERATIONS.has(request.operation),
    secretStoreConfigured: unconfiguredSecretStore.configured,
  });
}
