/**
 * Server-only secret boundary.
 * No provider is configured. Operations fail closed and store nothing.
 * Do not import this module from src/.
 */

import { performSecretOperation, type SecretStore, type SecretStoreResult } from '../../src/tenancy/connectorSecurity';

export const unconfiguredSecretStore: SecretStore = {
  configured: false,
  putSecret(reference: string, _value: string): Promise<SecretStoreResult> {
    return Promise.resolve(performSecretOperation(this, 'put', reference));
  },
  getSecret(reference: string): Promise<SecretStoreResult> {
    return Promise.resolve(performSecretOperation(this, 'get', reference));
  },
  deleteSecret(reference: string): Promise<SecretStoreResult> {
    return Promise.resolve(performSecretOperation(this, 'delete', reference));
  },
  rotateSecret(reference: string, _value: string): Promise<SecretStoreResult> {
    return Promise.resolve(performSecretOperation(this, 'rotate', reference));
  },
};
