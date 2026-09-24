import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  UnderlyingAsset,
  AssetRecord,
  VulnerabilityFinding,
  FindingCorrelationGroup,
  CorrelationException,
  AuditLogEntry,
} from '../types/vulnfusion';

export interface CorrelationEvidenceExport {
  reportMetadata: {
    title: string;
    generatedAt: string;
    correlationId: string;
    selectedAssetId: string;
    canonicalHostname: string;
    syntheticNotice: string;
    disclaimer: string;
    deterministicAuthorityNotice: string;
  };
  correlationSummary: {
    candidateAssetGroup: string;
    correlationId: string;
    status: string;
    confidence: number;
    matchedCount: number;
    conflictCount: number;
    evaluatedCount: number;
  };
  sourceRecords: Array<{
    sourceTool: string;
    observationMethod: string;
    recordId: string;
    hostname: string;
    fqdn: string;
    ipAddresses: string[];
    macAddress: string;
    operatingSystem: string;
    agentId: string;
    cloudInstanceId: string;
    serialNumber: string;
    domain: string;
    assetTags: string[];
    firstObserved: string;
    lastObserved: string;
  }>;
  matchedSignals: Array<{
    signalName: string;
    attribute: string;
    result: string;
    weight: number;
    supportingRecordIds: string[];
    explanation: string;
  }>;
  conflictingSignals: Array<{
    signalName: string;
    attribute: string;
    result: string;
    weight: number;
    conflictingRecordIds: string[];
    explanation: string;
  }>;
  observationHistory: Array<{
    observedAt: string;
    sourceTool: string;
    observationMethod: string;
    recordId: string;
  }>;
  relatedFindings: Array<{
    findingId: string;
    sourceTool: string;
    sourceFindingId: string;
    vulnerabilityId: string;
    vulnerabilityIdType: string;
    title: string;
    affectedSoftware: string;
    affectedVersion: string;
    severity: string;
    cvss: number | string;
    firstObserved: string;
    lastObserved: string;
    status: string;
  }>;
  analystDecisions: Array<{
    decision: string;
    reason: string;
    analystNote: string;
    timestamp: string;
    affectedRecordIds: string[];
  }>;
  exceptions: Array<{
    exceptionId: string;
    assetGroupId: string;
    recordIds: string[];
    reason: string;
    analystNote: string;
    createdAt: string;
    status: string;
  }>;
  aiExplanation: {
    isAvailable: boolean;
    headerNotice: string;
    text: string | null;
  };
}

/**
 * Sanitizes string for safe filename usage, preventing path traversal and unsafe characters.
 */
export function sanitizeFilename(str: string): string {
  if (!str) return 'UNASSIGNED';
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Escapes values to prevent CSV / Excel Formula Injection (=, +, -, @)
 */
export function escapeFormulaCell(value: any): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Builds a clean, normalized CorrelationEvidenceExport object from current UI application state.
 */
export function buildExportData(
  cluster: UnderlyingAsset,
  allRecords: AssetRecord[],
  allFindings: VulnerabilityFinding[] = [],
  findingGroups: FindingCorrelationGroup[] = [],
  exceptions: CorrelationException[] = [],
  auditLogs: AuditLogEntry[] = [],
  aiExplanationText: string | null = null
): CorrelationEvidenceExport {
  const generatedAt = new Date().toISOString();

  // Matched source records
  const memberRecords = (cluster.memberRecordIds || [])
    .map(id => allRecords.find(r => r.recordId === id))
    .filter((r): r is AssetRecord => Boolean(r));

  // Source records mapping
  const sourceRecords = memberRecords.map(r => ({
    sourceTool: r.sourceTool || 'N/A',
    observationMethod: r.observationMethod || 'N/A',
    recordId: r.recordId || 'N/A',
    hostname: r.hostname || 'N/A',
    fqdn: r.fqdn || 'N/A',
    ipAddresses: Array.isArray(r.ipAddresses) ? r.ipAddresses : [],
    macAddress: r.macAddress || 'N/A',
    operatingSystem: r.operatingSystem || 'N/A',
    agentId: r.agentId || 'N/A',
    cloudInstanceId: r.cloudInstanceId || 'N/A',
    serialNumber: r.serialNumber || 'N/A',
    domain: r.domain || 'N/A',
    assetTags: Array.isArray(r.assetTags) ? r.assetTags : [],
    firstObserved: r.firstObserved || 'N/A',
    lastObserved: r.lastObserved || 'N/A',
  }));

  // Matched Signals
  const matchedSignals = (cluster.correlationEvidence || []).map(ev => ({
    signalName: ev.name || 'Matched Signal',
    attribute: ev.category || 'N/A',
    result: 'MATCHED',
    weight: typeof ev.weight === 'number' ? ev.weight : 10,
    supportingRecordIds: cluster.memberRecordIds || [],
    explanation: ev.description || 'Matched attribute across source scanner records.',
  }));

  // Conflicting Signals
  const conflictingSignals = (cluster.conflictingAttributes || []).map(conf => ({
    signalName: conf.name || 'Conflicting Signal',
    attribute: conf.category || 'N/A',
    result: 'CONFLICT',
    weight: typeof conf.weight === 'number' ? conf.weight : -15,
    conflictingRecordIds: cluster.memberRecordIds || [],
    explanation: conf.description || 'Discrepancy detected across scanner records.',
  }));

  // Observation History
  const observationHistory = memberRecords.map(r => ({
    observedAt: r.lastObserved || r.firstObserved || 'N/A',
    sourceTool: r.sourceTool || 'N/A',
    observationMethod: r.observationMethod || 'N/A',
    recordId: r.recordId || 'N/A',
  }));

  // Related Findings
  const relatedFindingGroups = (findingGroups || []).filter(fg => fg.underlyingAssetGroupId === cluster.underlyingAssetId);
  const memberFindingIds = new Set(relatedFindingGroups.flatMap(fg => fg.memberFindingIds || []));

  const relevantFindings = (allFindings || []).filter(f =>
    f.underlyingAssetGroupId === cluster.underlyingAssetId || memberFindingIds.has(f.findingId)
  );

  const relatedFindings = relevantFindings.map(f => {
    const parentGroup = relatedFindingGroups.find(fg => fg.memberFindingIds?.includes(f.findingId));
    return {
      findingId: f.findingId || 'N/A',
      sourceTool: f.sourceTool || 'N/A',
      sourceFindingId: f.sourceFindingId || 'N/A',
      vulnerabilityId: f.vulnerabilityId || 'N/A',
      vulnerabilityIdType: f.vulnerabilityIdType || 'CVE',
      title: f.title || 'N/A',
      affectedSoftware: f.affectedSoftware || 'N/A',
      affectedVersion: f.affectedVersion || 'N/A',
      severity: f.severity || 'MEDIUM',
      cvss: f.cvss ?? 'N/A',
      firstObserved: f.firstObserved || 'N/A',
      lastObserved: f.lastObserved || 'N/A',
      status: parentGroup?.correlationStatus || f.status || 'UNASSIGNED',
    };
  });

  // Analyst Decisions
  const assetAuditLogs = (auditLogs || []).filter(log =>
    log.details.includes(cluster.underlyingAssetId) ||
    cluster.memberRecordIds.some(id => log.details.includes(id))
  );

  const analystDecisions = assetAuditLogs.map(log => ({
    decision: log.action || 'ANALYST_ACTION',
    reason: log.details || 'Session governance recorded action',
    analystNote: log.details || 'N/A',
    timestamp: log.timestamp || generatedAt,
    affectedRecordIds: cluster.memberRecordIds,
  }));

  // Exceptions
  const assetExceptions = (exceptions || []).filter(e => e.assetGroupId === cluster.underlyingAssetId);
  const formattedExceptions = assetExceptions.map(e => ({
    exceptionId: e.exceptionId || 'N/A',
    assetGroupId: e.assetGroupId || cluster.underlyingAssetId,
    recordIds: Array.isArray(e.recordIds) ? e.recordIds : [],
    reason: e.reason || 'N/A',
    analystNote: e.analystNote || 'N/A',
    createdAt: e.createdAt || generatedAt,
    status: e.status || 'ACTIVE',
  }));

  const matchedCount = matchedSignals.length;
  const conflictCount = conflictingSignals.length;

  return {
    reportMetadata: {
      title: 'VulnFusion Correlation Evidence Report',
      generatedAt,
      correlationId: cluster.underlyingAssetId,
      selectedAssetId: cluster.underlyingAssetId,
      canonicalHostname: cluster.canonicalHostname || 'Unknown Host',
      syntheticNotice: 'Qualys, Tenable, Rapid7, and Wiz are used strictly as synthetic source labels. No production scanner or client telemetry is used.',
      disclaimer: 'This report contains no production scanner data or client telemetry.',
      deterministicAuthorityNotice:
        'Deterministic correlation results are authoritative for this report. AI-generated explanations, when present, are non-authoritative and do not modify correlation status, confidence, evidence, findings, or analyst decisions.',
    },
    correlationSummary: {
      candidateAssetGroup: cluster.canonicalHostname || 'Unknown Host',
      correlationId: cluster.underlyingAssetId,
      status: cluster.correlationStatus || 'UNKNOWN',
      confidence: typeof cluster.confidence === 'number' ? cluster.confidence : 0,
      matchedCount,
      conflictCount,
      evaluatedCount: matchedCount + conflictCount,
    },
    sourceRecords,
    matchedSignals,
    conflictingSignals,
    observationHistory,
    relatedFindings,
    analystDecisions,
    exceptions: formattedExceptions,
    aiExplanation: {
      isAvailable: Boolean(aiExplanationText && aiExplanationText.trim()),
      headerNotice: 'AI-GENERATED EXPLANATION - NON-AUTHORITATIVE',
      text: aiExplanationText && aiExplanationText.trim()
        ? aiExplanationText.trim()
        : 'AI explanation unavailable or not generated. Deterministic correlation evidence is included independently.',
    },
  };
}

/**
 * Triggers a browser download for a Blob object safely.
 */
function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('Download trigger bypassed:', e);
  }
}

/**
 * EXPORT 1: PDF Format
 */
export function exportToPdf(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.pdf`;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const meta = exportData.reportMetadata;
  const summary = exportData.correlationSummary;

  // Title & Header
  doc.setFillColor(11, 20, 32); // #0B1420
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(0, 184, 255); // #00B8FF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VulnFusion', 14, 15);

  doc.setTextColor(244, 247, 251);
  doc.setFontSize(11);
  doc.text('CORRELATION EVIDENCE REPORT', 14, 23);

  doc.setFontSize(8);
  doc.setTextColor(168, 183, 201);
  doc.text(`Generated: ${meta.generatedAt}`, 140, 15);
  doc.text(`Correlation ID: ${summary.correlationId}`, 140, 21);
  doc.text(`Asset: ${summary.candidateAssetGroup}`, 140, 27);

  // Disclaimer banner
  doc.setFillColor(24, 34, 48);
  doc.rect(14, 40, 182, 14, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text(`${meta.syntheticNotice} ${meta.disclaimer}`, 17, 48);

  // Summary Grid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 184, 255);
  doc.text('CORRELATION SUMMARY', 14, 62);

  const summaryRows = [
    ['Candidate Asset Group', summary.candidateAssetGroup],
    ['Correlation ID', summary.correlationId],
    ['Correlation Status', summary.status],
    ['Confidence Score', `${summary.confidence}%`],
    ['Signals Evaluated', `${summary.matchedCount} matched / ${summary.conflictCount} conflicts (${summary.evaluatedCount} total)`],
  ];

  autoTable(doc, {
    startY: 65,
    head: [['Attribute', 'Deterministic Engine Value']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [27, 48, 69], textColor: [244, 247, 251], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 41, 59], fontSize: 8.5 },
  });

  // Source Records Table
  const lastY = (doc as any).lastAutoTable?.finalY || 110;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 184, 255);
  doc.text('SOURCE RECORDS', 14, lastY + 10);

  const recordRows = exportData.sourceRecords.map(r => [
    r.sourceTool,
    r.recordId,
    r.hostname,
    r.ipAddresses.join(', ') || 'N/A',
    r.operatingSystem,
    r.observationMethod,
  ]);

  autoTable(doc, {
    startY: lastY + 13,
    head: [['Scanner Tool', 'Record ID', 'Hostname', 'IP Address(es)', 'OS', 'Method']],
    body: recordRows.length > 0 ? recordRows : [['No source records available', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [27, 48, 69], textColor: [244, 247, 251] },
    bodyStyles: { fontSize: 8 },
  });

  // Matched Signals Table
  const lastY2 = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 214, 163); // #00D6A3
  doc.text('MATCHED SIGNALS', 14, lastY2 + 10);

  const matchedRows = exportData.matchedSignals.map(s => [
    s.signalName,
    s.attribute,
    `Weight: +${s.weight}`,
    s.supportingRecordIds.join(', '),
    s.explanation,
  ]);

  autoTable(doc, {
    startY: lastY2 + 13,
    head: [['Signal', 'Category', 'Weight', 'Records', 'Evidence']],
    body: matchedRows.length > 0 ? matchedRows : [['No matched signals recorded', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [0, 100, 80], textColor: [244, 247, 251] },
    bodyStyles: { fontSize: 8 },
  });

  // Conflicting Signals Table
  const lastY3 = (doc as any).lastAutoTable?.finalY || 210;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35); // Amber
  doc.text('CONFLICTING SIGNALS', 14, lastY3 + 10);

  const conflictRows = exportData.conflictingSignals.map(c => [
    c.signalName,
    c.attribute,
    `Penalty: ${c.weight}`,
    c.conflictingRecordIds.join(', '),
    c.explanation,
  ]);

  autoTable(doc, {
    startY: lastY3 + 13,
    head: [['Signal', 'Category', 'Penalty', 'Records', 'Conflict Detail']],
    body: conflictRows.length > 0 ? conflictRows : [['No conflicting signals detected', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [140, 80, 0], textColor: [244, 247, 251] },
    bodyStyles: { fontSize: 8 },
  });

  // Page 2: Findings, Decisions, AI Explanation
  doc.addPage();
  doc.setFillColor(11, 20, 32);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setFontSize(10);
  doc.setTextColor(0, 184, 255);
  doc.text(`VulnFusion Correlation Report — ${summary.correlationId} (Page 2)`, 14, 13);

  // Related Findings
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 184, 255);
  doc.text('ASSOCIATED VULNERABILITY FINDINGS', 14, 28);

  const findingRows = exportData.relatedFindings.map(f => [
    f.findingId,
    f.sourceTool,
    f.vulnerabilityId,
    f.title,
    f.severity,
    String(f.cvss),
    f.status,
  ]);

  autoTable(doc, {
    startY: 31,
    head: [['Finding ID', 'Tool', 'CVE / Vuln ID', 'Title', 'Severity', 'CVSS', 'Status']],
    body: findingRows.length > 0 ? findingRows : [['No associated findings recorded', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [27, 48, 69], textColor: [244, 247, 251] },
    bodyStyles: { fontSize: 7.5 },
  });

  // AI Explanation Section
  const lastY4 = (doc as any).lastAutoTable?.finalY || 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(168, 85, 247); // Purple
  doc.text(`${exportData.aiExplanation.headerNotice}`, 14, lastY4 + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const explanationLines = doc.splitTextToSize(
    exportData.aiExplanation.text || 'No AI explanation generated.',
    182
  );
  doc.text(explanationLines, 14, lastY4 + 16);

  // Deterministic Authority Footer Notice on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(11, 20, 32);
    doc.rect(0, 282, 210, 15, 'F');

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      meta.deterministicAuthorityNotice,
      14,
      287,
      { maxWidth: 182 }
    );
  }

  if (triggerDownload && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      doc.save(filename);
    } catch (e) {
      console.warn('doc.save bypassed in headless context:', e);
    }
  }
  return filename;
}

/**
 * EXPORT 2: Excel (.xlsx) Format
 */
export function exportToXlsx(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['VulnFusion Correlation Evidence Report'],
    ['Generated At', exportData.reportMetadata.generatedAt],
    ['Correlation ID', escapeFormulaCell(exportData.correlationSummary.correlationId)],
    ['Candidate Asset Group', escapeFormulaCell(exportData.correlationSummary.candidateAssetGroup)],
    ['Correlation Status', escapeFormulaCell(exportData.correlationSummary.status)],
    ['Confidence Score', `${exportData.correlationSummary.confidence}%`],
    ['Matched Signals Count', exportData.correlationSummary.matchedCount],
    ['Conflicting Signals Count', exportData.correlationSummary.conflictCount],
    ['Total Signals Evaluated', exportData.correlationSummary.evaluatedCount],
    [],
    ['Synthetic Data Notice', exportData.reportMetadata.syntheticNotice],
    ['Disclaimer', exportData.reportMetadata.disclaimer],
    ['Authority Notice', exportData.reportMetadata.deterministicAuthorityNotice],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // 2. Source Records Sheet
  const recordsHeaders = [
    'Source Tool',
    'Observation Method',
    'Record ID',
    'Hostname',
    'FQDN',
    'IP Addresses',
    'MAC Address',
    'Operating System',
    'Agent ID',
    'Cloud Instance ID',
    'Serial Number',
    'Domain',
    'Asset Tags',
    'First Observed',
    'Last Observed',
  ];
  const recordsRows = exportData.sourceRecords.map(r => [
    escapeFormulaCell(r.sourceTool),
    escapeFormulaCell(r.observationMethod),
    escapeFormulaCell(r.recordId),
    escapeFormulaCell(r.hostname),
    escapeFormulaCell(r.fqdn),
    escapeFormulaCell(r.ipAddresses.join('; ')),
    escapeFormulaCell(r.macAddress),
    escapeFormulaCell(r.operatingSystem),
    escapeFormulaCell(r.agentId),
    escapeFormulaCell(r.cloudInstanceId),
    escapeFormulaCell(r.serialNumber),
    escapeFormulaCell(r.domain),
    escapeFormulaCell(r.assetTags.join('; ')),
    escapeFormulaCell(r.firstObserved),
    escapeFormulaCell(r.lastObserved),
  ]);
  const recordsSheet = XLSX.utils.aoa_to_sheet([recordsHeaders, ...recordsRows]);
  XLSX.utils.book_append_sheet(wb, recordsSheet, 'Source Records');

  // 3. Matched Signals Sheet
  const matchedHeaders = ['Signal Name', 'Attribute', 'Result', 'Weight', 'Supporting Record IDs', 'Explanation'];
  const matchedRows = exportData.matchedSignals.map(s => [
    escapeFormulaCell(s.signalName),
    escapeFormulaCell(s.attribute),
    escapeFormulaCell(s.result),
    s.weight,
    escapeFormulaCell(s.supportingRecordIds.join('; ')),
    escapeFormulaCell(s.explanation),
  ]);
  const matchedSheet = XLSX.utils.aoa_to_sheet([matchedHeaders, ...matchedRows]);
  XLSX.utils.book_append_sheet(wb, matchedSheet, 'Matched Signals');

  // 4. Conflicts Sheet
  const conflictHeaders = ['Signal Name', 'Attribute', 'Result', 'Weight Penalty', 'Conflicting Record IDs', 'Explanation'];
  const conflictRows = exportData.conflictingSignals.map(c => [
    escapeFormulaCell(c.signalName),
    escapeFormulaCell(c.attribute),
    escapeFormulaCell(c.result),
    c.weight,
    escapeFormulaCell(c.conflictingRecordIds.join('; ')),
    escapeFormulaCell(c.explanation),
  ]);
  const conflictSheet = XLSX.utils.aoa_to_sheet([conflictHeaders, ...conflictRows]);
  XLSX.utils.book_append_sheet(wb, conflictSheet, 'Conflicts');

  // 5. Observation History Sheet
  const obsHeaders = ['Observed At', 'Source Tool', 'Observation Method', 'Record ID'];
  const obsRows = exportData.observationHistory.map(o => [
    escapeFormulaCell(o.observedAt),
    escapeFormulaCell(o.sourceTool),
    escapeFormulaCell(o.observationMethod),
    escapeFormulaCell(o.recordId),
  ]);
  const obsSheet = XLSX.utils.aoa_to_sheet([obsHeaders, ...obsRows]);
  XLSX.utils.book_append_sheet(wb, obsSheet, 'Observation History');

  // 6. Findings Sheet
  const findingsHeaders = [
    'Finding ID',
    'Source Tool',
    'Source Finding ID',
    'Vulnerability ID',
    'ID Type',
    'Title',
    'Affected Software',
    'Affected Version',
    'Severity',
    'CVSS',
    'First Observed',
    'Last Observed',
    'Status',
  ];
  const findingsRows = exportData.relatedFindings.map(f => [
    escapeFormulaCell(f.findingId),
    escapeFormulaCell(f.sourceTool),
    escapeFormulaCell(f.sourceFindingId),
    escapeFormulaCell(f.vulnerabilityId),
    escapeFormulaCell(f.vulnerabilityIdType),
    escapeFormulaCell(f.title),
    escapeFormulaCell(f.affectedSoftware),
    escapeFormulaCell(f.affectedVersion),
    escapeFormulaCell(f.severity),
    f.cvss,
    escapeFormulaCell(f.firstObserved),
    escapeFormulaCell(f.lastObserved),
    escapeFormulaCell(f.status),
  ]);
  const findingsSheet = XLSX.utils.aoa_to_sheet([findingsHeaders, ...findingsRows]);
  XLSX.utils.book_append_sheet(wb, findingsSheet, 'Findings');

  // 7. Analyst Decisions Sheet
  const decisionsHeaders = ['Decision / Action', 'Reason', 'Analyst Note', 'Timestamp', 'Affected Record IDs'];
  const decisionsRows = exportData.analystDecisions.map(d => [
    escapeFormulaCell(d.decision),
    escapeFormulaCell(d.reason),
    escapeFormulaCell(d.analystNote),
    escapeFormulaCell(d.timestamp),
    escapeFormulaCell(d.affectedRecordIds.join('; ')),
  ]);
  const decisionsSheet = XLSX.utils.aoa_to_sheet([decisionsHeaders, ...decisionsRows]);
  XLSX.utils.book_append_sheet(wb, decisionsSheet, 'Analyst Decisions');

  // 8. Exceptions Sheet
  const exceptionsHeaders = ['Exception ID', 'Asset Group ID', 'Record IDs', 'Reason', 'Analyst Note', 'Created At', 'Status'];
  const exceptionsRows = exportData.exceptions.map(e => [
    escapeFormulaCell(e.exceptionId),
    escapeFormulaCell(e.assetGroupId),
    escapeFormulaCell(e.recordIds.join('; ')),
    escapeFormulaCell(e.reason),
    escapeFormulaCell(e.analystNote),
    escapeFormulaCell(e.createdAt),
    escapeFormulaCell(e.status),
  ]);
  const exceptionsSheet = XLSX.utils.aoa_to_sheet([exceptionsHeaders, ...exceptionsRows]);
  XLSX.utils.book_append_sheet(wb, exceptionsSheet, 'Exceptions');

  // 9. AI Explanation Sheet
  const aiData = [
    ['AI Explanation Notice', exportData.aiExplanation.headerNotice],
    ['AI Available', exportData.aiExplanation.isAvailable ? 'YES' : 'NO'],
    ['Sidecar Explanation Text', escapeFormulaCell(exportData.aiExplanation.text)],
    [],
    ['Authority Statement', exportData.reportMetadata.deterministicAuthorityNotice],
  ];
  const aiSheet = XLSX.utils.aoa_to_sheet(aiData);
  XLSX.utils.book_append_sheet(wb, aiSheet, 'AI Explanation');

  if (triggerDownload && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      XLSX.writeFile(wb, filename);
    } catch (e) {
      console.warn('XLSX.writeFile bypassed in headless context:', e);
    }
  }
  return filename;
}

/**
 * EXPORT 3: CSV Format
 */
export function exportToCsv(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.csv`;

  const headers = [
    'Correlation ID',
    'Asset Name',
    'Source Tool',
    'Observation Method',
    'Record ID',
    'Hostname',
    'FQDN',
    'IP Address(es)',
    'MAC Address',
    'Operating System',
    'Agent ID',
    'Cloud Instance ID',
    'Serial Number',
    'First Observed',
    'Last Observed',
  ];

  const rows = exportData.sourceRecords.map(r => [
    escapeFormulaCell(exportData.correlationSummary.correlationId),
    escapeFormulaCell(exportData.correlationSummary.candidateAssetGroup),
    escapeFormulaCell(r.sourceTool),
    escapeFormulaCell(r.observationMethod),
    escapeFormulaCell(r.recordId),
    escapeFormulaCell(r.hostname),
    escapeFormulaCell(r.fqdn),
    escapeFormulaCell(r.ipAddresses.join('; ')),
    escapeFormulaCell(r.macAddress),
    escapeFormulaCell(r.operatingSystem),
    escapeFormulaCell(r.agentId),
    escapeFormulaCell(r.cloudInstanceId),
    escapeFormulaCell(r.serialNumber),
    escapeFormulaCell(r.firstObserved),
    escapeFormulaCell(r.lastObserved),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  if (triggerDownload) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  }
  return filename;
}

/**
 * EXPORT 4: JSON Format
 */
export function exportToJson(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.json`;

  const jsonString = JSON.stringify(exportData, null, 2);
  if (triggerDownload) {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename);
  }
  return filename;
}

/**
 * EXPORT 5: Markdown Format
 */
export function exportToMarkdown(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.md`;

  const meta = exportData.reportMetadata;
  const summary = exportData.correlationSummary;

  let md = `# ${meta.title}\n\n`;
  md += `> **Notice**: ${meta.syntheticNotice} ${meta.disclaimer}\n\n`;

  md += `## Report Metadata\n\n`;
  md += `- **Generated At**: \`${meta.generatedAt}\`\n`;
  md += `- **Correlation ID**: \`${meta.correlationId}\`\n`;
  md += `- **Candidate Asset Group**: \`${summary.candidateAssetGroup}\`\n\n`;

  md += `## Correlation Summary\n\n`;
  md += `| Attribute | Deterministic Engine Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Correlation ID** | \`${summary.correlationId}\` |\n`;
  md += `| **Status** | \`${summary.status}\` |\n`;
  md += `| **Confidence** | **${summary.confidence}%** |\n`;
  md += `| **Signals Evaluated** | ${summary.matchedCount} matched, ${summary.conflictCount} conflicts (${summary.evaluatedCount} total) |\n\n`;

  md += `## Source Records\n\n`;
  if (exportData.sourceRecords.length > 0) {
    md += `| Tool | Record ID | Hostname | IP Address(es) | OS | Method |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    exportData.sourceRecords.forEach(r => {
      md += `| ${r.sourceTool} | \`${r.recordId}\` | ${r.hostname} | \`${r.ipAddresses.join(', ') || 'N/A'}\` | ${r.operatingSystem} | ${r.observationMethod} |\n`;
    });
    md += `\n`;
  } else {
    md += `*No source records available.*\n\n`;
  }

  md += `## Matched Signals\n\n`;
  if (exportData.matchedSignals.length > 0) {
    exportData.matchedSignals.forEach(s => {
      md += `- **${s.signalName}** (\`${s.attribute}\`) — Weight: \`+${s.weight}\`\n`;
      md += `  - *Supporting Records*: \`${s.supportingRecordIds.join(', ')}\`\n`;
      md += `  - *Evidence*: ${s.explanation}\n`;
    });
    md += `\n`;
  } else {
    md += `*No matched signals recorded.*\n\n`;
  }

  md += `## Conflicting Signals\n\n`;
  if (exportData.conflictingSignals.length > 0) {
    exportData.conflictingSignals.forEach(c => {
      md += `- **${c.signalName}** (\`${c.attribute}\`) — Penalty: \`${c.weight}\`\n`;
      md += `  - *Conflicting Records*: \`${c.conflictingRecordIds.join(', ')}\`\n`;
      md += `  - *Conflict Detail*: ${c.explanation}\n`;
    });
    md += `\n`;
  } else {
    md += `*No conflicting signals detected.*\n\n`;
  }

  md += `## Observation History\n\n`;
  if (exportData.observationHistory.length > 0) {
    md += `| Observed At | Source Tool | Observation Method | Record ID |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    exportData.observationHistory.forEach(o => {
      md += `| ${o.observedAt} | ${o.sourceTool} | ${o.observationMethod} | \`${o.recordId}\` |\n`;
    });
    md += `\n`;
  } else {
    md += `*No observation history available.*\n\n`;
  }

  md += `## Related Findings\n\n`;
  if (exportData.relatedFindings.length > 0) {
    md += `| Finding ID | Tool | Vulnerability ID | Title | Severity | CVSS | Status |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    exportData.relatedFindings.forEach(f => {
      md += `| \`${f.findingId}\` | ${f.sourceTool} | \`${f.vulnerabilityId}\` | ${f.title} | ${f.severity} | ${f.cvss} | \`${f.status}\` |\n`;
    });
    md += `\n`;
  } else {
    md += `*No related findings recorded.*\n\n`;
  }

  md += `## Analyst Decisions\n\n`;
  if (exportData.analystDecisions.length > 0) {
    exportData.analystDecisions.forEach(d => {
      md += `- **Action**: \`${d.decision}\` at \`${d.timestamp}\`\n`;
      md += `  - *Details*: ${d.analystNote}\n`;
    });
    md += `\n`;
  } else {
    md += `*No analyst decisions recorded for this session.*\n\n`;
  }

  md += `## Exceptions\n\n`;
  if (exportData.exceptions.length > 0) {
    exportData.exceptions.forEach(e => {
      md += `- **Exception ID**: \`${e.exceptionId}\` (\`${e.reason}\`)\n`;
      md += `  - *Note*: ${e.analystNote}\n`;
      md += `  - *Created At*: \`${e.createdAt}\`\n`;
    });
    md += `\n`;
  } else {
    md += `*No active exceptions recorded.*\n\n`;
  }

  md += `## AI-Generated Explanation\n\n`;
  md += `> **${exportData.aiExplanation.headerNotice}**\n\n`;
  md += `${exportData.aiExplanation.text}\n\n`;

  md += `---\n\n`;
  md += `### Deterministic Authority Notice\n\n`;
  md += `${meta.deterministicAuthorityNotice}\n`;

  if (triggerDownload) {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    downloadBlob(blob, filename);
  }
  return filename;
}
