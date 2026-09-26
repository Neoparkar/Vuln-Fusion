import { AssetRecord, NormalizedAssetRecord, SourceTool, ObservationMethod } from '../types/vulnfusion';

export function normalizeHostname(hostname: string | null | undefined): string | null {
  if (!hostname || typeof hostname !== 'string') return null;
  const cleaned = hostname.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') return null;
  return cleaned;
}

export function normalizeFqdn(fqdn: string | null | undefined): string | null {
  if (!fqdn || typeof fqdn !== 'string') return null;
  const cleaned = fqdn.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null') return null;
  return cleaned;
}

export function normalizeMac(mac: string | null | undefined): string | null {
  if (!mac || typeof mac !== 'string') return null;
  const cleaned = mac.trim().toLowerCase().replace(/[-–—]/g, ':');
  if (cleaned === '' || cleaned === 'null') return null;
  return cleaned;
}

export function normalizeOs(os: string | null | undefined): string | null {
  if (!os || typeof os !== 'string') return null;
  const cleaned = os.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null') return null;
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

export function normalizeUuid(uuid: string | null | undefined): string | null {
  if (!uuid || typeof uuid !== 'string') return null;
  const cleaned = uuid.trim().toLowerCase().replace(/[{}]/g, '');
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') return null;
  return cleaned;
}

export function normalizeCloudResourceId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string') return null;
  const cleaned = id.trim().toLowerCase();
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') return null;
  return cleaned;
}

export function normalizeAssetRecord(record: AssetRecord): NormalizedAssetRecord {
  // Strict sanitization / validation of untrusted record data
  const recordId = typeof record.recordId === 'string' && record.recordId.trim() !== '' ? record.recordId.trim() : 'UNKNOWN-ID';
  
  const validTools: SourceTool[] = ['Qualys', 'Tenable', 'Rapid7', 'Wiz'];
  const sourceTool: SourceTool = validTools.includes(record.sourceTool) ? record.sourceTool : 'Qualys';

  const validMethods: ObservationMethod[] = [
    'discovery_scan',
    'authenticated_scan',
    'unauthenticated_scan',
    'agent',
    'agentless',
    'passive_discovery',
    'credentialed_scan',
    'network_discovery',
    'cloud_inventory',
    'cloud_posture',
    'cloud_vulnerability'
  ];
  const observationMethod: ObservationMethod = validMethods.includes(record.observationMethod) ? record.observationMethod : 'discovery_scan';

  const hostname = record.hostname ? String(record.hostname).trim() : null;
  const fqdn = record.fqdn ? String(record.fqdn).trim() : null;
  const netbiosName = record.netbiosName ? String(record.netbiosName).trim() : null;
  
  const ipAddresses = Array.isArray(record.ipAddresses)
    ? record.ipAddresses.map(ip => String(ip).trim())
    : [];

  const ipv6Addresses = Array.isArray(record.ipv6Addresses)
    ? record.ipv6Addresses.map(ip => String(ip).trim().toLowerCase()).filter(ip => ip.length > 0)
    : [];

  const macAddress = record.macAddress ? String(record.macAddress).trim() : null;
  const macAddresses = Array.isArray(record.macAddresses)
    ? record.macAddresses.map(m => String(m).trim().toLowerCase()).filter(m => m.length > 0)
    : macAddress ? [macAddress] : [];

  const operatingSystem = record.operatingSystem ? String(record.operatingSystem).trim() : null;
  const agentId = record.agentId ? String(record.agentId).trim() : null;
  const cloudInstanceId = record.cloudInstanceId ? String(record.cloudInstanceId).trim() : null;
  const cloudResourceId = record.cloudResourceId ? String(record.cloudResourceId).trim() : null;
  const serialNumber = record.serialNumber ? String(record.serialNumber).trim() : null;
  const biosUuid = record.biosUuid ? String(record.biosUuid).trim() : null;
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
    netbiosName,
    ipAddresses,
    ipv6Addresses,
    macAddress,
    macAddresses,
    operatingSystem,
    agentId,
    cloudInstanceId,
    cloudResourceId,
    serialNumber,
    biosUuid,
    domain,
    assetTags,
    normalizedHostname: normalizeHostname(hostname),
    normalizedFqdn: normalizeFqdn(fqdn),
    normalizedNetbios: normalizeHostname(netbiosName),
    normalizedIps: ipAddresses,
    normalizedIpv6: ipv6Addresses,
    normalizedMac: normalizeMac(macAddress),
    normalizedMacs: macAddresses.map(m => normalizeMac(m)).filter(Boolean) as string[],
    normalizedOs: normalizeOs(operatingSystem),
    normalizedBiosUuid: normalizeUuid(biosUuid),
    normalizedSerialNumber: serialNumber ? serialNumber.toLowerCase().trim() : null,
    normalizedAgentId: agentId ? agentId.toLowerCase().trim() : null,
    normalizedCloudInstanceId: cloudInstanceId ? cloudInstanceId.toLowerCase().trim() : null,
    normalizedCloudResourceId: normalizeCloudResourceId(cloudResourceId),
    normalizedDomain: domain,
  };
}
