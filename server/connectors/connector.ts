/**
 * Provider-neutral connector contract. No vendor implementation is registered.
 */

import {
  resolveConfiguredConnector,
  type ConnectorMetadata,
  type ConnectorPage,
  type SecurityConnector,
} from '../../src/tenancy/connectorSecurity';

export type { ConnectorMetadata, ConnectorPage, SecurityConnector };

const REGISTERED_PROVIDERS: readonly string[] = [];

export function listConfiguredConnectors(): readonly string[] {
  return REGISTERED_PROVIDERS;
}

export function resolveConnector(provider: string): ReturnType<typeof resolveConfiguredConnector> {
  return resolveConfiguredConnector(provider, REGISTERED_PROVIDERS);
}
