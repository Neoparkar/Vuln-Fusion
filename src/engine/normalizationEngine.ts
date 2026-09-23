import { AssetRecord, NormalizedAssetRecord } from '../types/vulnfusion';

export function normalizeHostname(hostname: string | null): string | null {
  if (!hostname || typeof hostname !== 'string') return null;
  const cleaned = hostname.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') return null;
  return cleaned;
}

export function normalizeFqdn(fqdn: string | null): string | null {
  if (!fqdn || typeof fqdn !== 'string') return null;
  const cleaned = fqdn.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null') return null;
  return cleaned;
}

export function normalizeMac(mac: string | null): string | null {
  if (!mac || typeof mac !== 'string') return null;
  const cleaned = mac.trim().toLowerCase().replace(/[-–—]/g, ':');
  if (cleaned === '' || cleaned === 'null') return null;
  return cleaned;
}

export function normalizeOs(os: string | null): string | null {
  if (!os || typeof os !== 'string') return null;
  const cleaned = os.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null') return null;
  // Basic OS family normalization for comparison
  if (cleaned.includes('ubuntu') || cleaned.includes('debian') || cleaned.includes('linux') || cleaned.includes('rhel') || cleaned.includes('red hat') || cleaned.includes('freebsd')) {
    return 'linux_unix';
  }
  if (cleaned.includes('windows')) {
    return 'windows';
  }
  if (cleaned.includes('mac') || cleaned.includes('macos')) {
    return 'macos';
  }
  return cleaned;
}

export function normalizeAssetRecord(record: AssetRecord): NormalizedAssetRecord {
  // Strict sanitization / validation of untrusted record data
  const recordId = typeof record.recordId === 'string' && record.recordId.trim() !== '' ? record.recordId.trim() : 'UNKNOWN-ID';
  const sourceTool = ['Qualys', 'Tenable', 'Rapid7'].includes(record.sourceTool) ? record.sourceTool : 'Qualys';
  const observationMethod = [
    'discovery_scan',
    'authenticated_scan',
    'unauthenticated_scan',
    'agent',
    'agentless',
    'passive_discovery',
    'credentialed_scan',
    'network_discovery'
  ].includes(record.observationMethod) ? record.observationMethod : 'discovery_scan';

  const hostname = record.hostname ? String(record.hostname).trim() : null;
  const fqdn = record.fqdn ? String(record.fqdn).trim() : null;
  
  const ipAddresses = Array.isArray(record.ipAddresses)
    ? record.ipAddresses.map(ip => String(ip).trim()).filter(ip => ip.length > 0)
    : [];

  const macAddress = record.macAddress ? String(record.macAddress).trim() : null;
  const operatingSystem = record.operatingSystem ? String(record.operatingSystem).trim() : null;
  const agentId = record.agentId ? String(record.agentId).trim() : null;
  const cloudInstanceId = record.cloudInstanceId ? String(record.cloudInstanceId).trim() : null;
  const serialNumber = record.serialNumber ? String(record.serialNumber).trim() : null;
  const domain = record.domain ? String(record.domain).trim().toLowerCase() : null;
  const assetTags = Array.isArray(record.assetTags)
    ? record.assetTags.map(t => String(t).trim().toLowerCase()).filter(t => t.length > 0)
    : [];

  return {
    ...record,
    recordId,
    sourceTool,
    observationMethod,
    hostname,
    fqdn,
    ipAddresses,
    macAddress,
    operatingSystem,
    agentId,
    cloudInstanceId,
    serialNumber,
    domain,
    assetTags,
    normalizedHostname: normalizeHostname(hostname),
    normalizedFqdn: normalizeFqdn(fqdn),
    normalizedIps: ipAddresses,
    normalizedMac: normalizeMac(macAddress),
    normalizedOs: normalizeOs(operatingSystem),
  };
}
