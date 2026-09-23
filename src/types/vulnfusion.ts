export type SourceTool = 'Qualys' | 'Tenable' | 'Rapid7';

export type ObservationMethod =
  | 'discovery_scan'
  | 'authenticated_scan'
  | 'unauthenticated_scan'
  | 'agent'
  | 'agentless'
  | 'passive_discovery'
  | 'credentialed_scan'
  | 'network_discovery';

export type CorrelationStatus = 'CORRELATED' | 'REVIEW_REQUIRED' | 'SEPARATE';

export type SignalCategory = 'STRONG' | 'MODERATE' | 'CONTEXTUAL' | 'CONFLICT';

export interface CorrelationSignal {
  id: string;
  category: SignalCategory;
  name: string;
  description: string;
  weight: number;
}

export interface AssetRecord {
  recordId: string;
  sourceTool: SourceTool;
  observationMethod: ObservationMethod;
  hostname: string | null;
  fqdn: string | null;
  ipAddresses: string[];
  macAddress: string | null;
  operatingSystem: string | null;
  agentId: string | null;
  cloudInstanceId: string | null;
  serialNumber: string | null;
  domain: string | null;
  assetTags: string[];
  firstObserved: string | null;
  lastObserved: string | null;
  rawAttributes?: Record<string, any>;
}

export interface NormalizedAssetRecord extends AssetRecord {
  normalizedHostname: string | null;
  normalizedFqdn: string | null;
  normalizedIps: string[];
  normalizedMac: string | null;
  normalizedOs: string | null;
  isMalformed?: boolean;
  malformedReason?: string;
}

export interface UnderlyingAsset {
  underlyingAssetId: string;
  memberRecordIds: string[];
  correlationStatus: CorrelationStatus;
  correlationEvidence: CorrelationSignal[];
  conflictingAttributes: CorrelationSignal[];
  confidence: number; // 0 to 100
  reviewRequired: boolean;
  canonicalHostname: string;
  canonicalIpAddresses: string[];
  canonicalOs: string;
  representativeRecords: AssetRecord[];
  clusterSummary: string;
}

// Analyst Review & Exceptions
export type AnalystDecision = 'ACCEPT_CORRELATION' | 'REJECT_CORRELATION' | 'CREATE_EXCEPTION';

export type ExceptionReason =
  | 'SHARED_IP_NAT'
  | 'SHARED_HOSTNAME'
  | 'DISCOVERY_ARTIFACT'
  | 'VIRTUALIZATION_EPHEMERAL'
  | 'INTENTIONAL_DUPLICATE'
  | 'OTHER';

export interface CorrelationException {
  exceptionId: string;
  assetGroupId: string;
  recordIds: string[];
  reason: ExceptionReason;
  analystNote: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'REVOKED';
}

export interface AuditLogEntry {
  entryId: string;
  timestamp: string;
  action: string;
  targetId: string;
  details: string;
  actor: string;
}

// Phase 2: Vulnerability Finding Correlation
export type VulnerabilityIdType = 'CVE' | 'QID' | 'PLUGIN' | 'R7_FINDING';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface VulnerabilityFinding {
  findingId: string;
  sourceTool: SourceTool;
  sourceFindingId: string;
  observationMethod: ObservationMethod;
  assetRecordId: string;
  underlyingAssetGroupId: string;
  vulnerabilityId: string;
  vulnerabilityIdType: VulnerabilityIdType;
  title: string;
  affectedSoftware: string;
  affectedVersion: string | null;
  severity: FindingSeverity;
  cvss: number;
  firstObserved: string | null;
  lastObserved: string | null;
  status: 'ACTIVE' | 'MITIGATED' | 'NEW';
  evidenceSnippet?: string;
}

export interface FindingCorrelationGroup {
  remediationIssueId: string;
  memberFindingIds: string[];
  underlyingAssetGroupId: string;
  vulnerabilityId: string;
  vulnerabilityIdType: VulnerabilityIdType;
  title: string;
  affectedSoftware: string;
  affectedVersion: string | null;
  correlationStatus: CorrelationStatus;
  correlationEvidence: CorrelationSignal[];
  conflictingAttributes: CorrelationSignal[];
  confidence: number;
  representativeFindings: VulnerabilityFinding[];
}

export interface TestCaseResult {
  caseId: string;
  caseName: string;
  description: string;
  expectedStatus: CorrelationStatus;
  actualStatus: CorrelationStatus;
  passed: boolean;
  notes: string;
}

export interface DataQualityTestResult {
  testName: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  description: string;
  details: string;
}
