import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addReportHeaderLogoPage1, addReportHeaderLogoPage2 } from './reportBrandAssets';
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
 * EXPORT 1: PDF Format (Enterprise Cybersecurity Intelligence Edition)
 */
export function exportToPdf(exportData: CorrelationEvidenceExport, triggerDownload = true): string {
  const safeId = sanitizeFilename(exportData.reportMetadata.correlationId);
  const dateStr = exportData.reportMetadata.generatedAt.split('T')[0];
  const filename = `vulnfusion-correlation-${safeId}-${dateStr}.pdf`;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const meta = exportData.reportMetadata;
  const summary = exportData.correlationSummary;

  // Format date helper
  const formatReportDate = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return isoStr;
    }
  };

  const formattedDate = formatReportDate(meta.generatedAt);

  // Helper: Draw source vendor badge
  const drawSourceVendorBadge = (tool: string, x: number, y: number, count?: number): number => {
    const name = tool || 'Unknown';
    let bg: [number, number, number] = [51, 65, 85];
    let iconChar = '•';

    if (name.toLowerCase().includes('qualys')) {
      bg = [237, 28, 36]; // Qualys Red #ED1C24
      iconChar = 'Q';
    } else if (name.toLowerCase().includes('tenable')) {
      bg = [0, 32, 91]; // Tenable Navy #00205B
      iconChar = 'T';
    } else if (name.toLowerCase().includes('rapid7')) {
      bg = [234, 88, 12]; // Rapid7 Orange #EA580C
      iconChar = '7';
    } else if (name.toLowerCase().includes('wiz')) {
      bg = [0, 117, 255]; // Wiz Blue #0075FF
      iconChar = '✦';
    }

    const label = count !== undefined ? `${name} (${count})` : name;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    const tw = doc.getTextWidth(label);
    const bw = tw + 8;
    const bh = 5;

    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(x, y, bw, bh, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.text(iconChar, x + 1.8, y + 3.6);

    doc.setFontSize(6.5);
    doc.text(label, x + 5.2, y + 3.6);

    return bw;
  };

  // 1. PAGE 1 HEADER (Compact Enterprise Header, max 35mm height)
  // Background
  doc.setFillColor(11, 20, 32); // #0B1420
  doc.rect(0, 0, 210, 35, 'F');
  doc.setDrawColor(30, 41, 59); // #1E293B
  doc.setLineWidth(0.4);
  doc.line(0, 35, 210, 35);

  // Page 1 VulnFusion Logo (11mm icon size, upper-left)
  addReportHeaderLogoPage1(doc, 14, 8, 11);

  // Wordmark & Subtitle
  doc.setTextColor(0, 184, 255); // #00B8FF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VulnFusion', 28, 15);

  doc.setTextColor(244, 247, 251); // #F4F7FB
  doc.setFontSize(9.5);
  doc.text('CORRELATION EVIDENCE REPORT', 28, 22.5);

  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Deterministic Multi-Scanner Telemetry & Identity Consolidation', 28, 28);

  // Right Header Context Grid (aligned at x = 196)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('GENERATED', 196, 10, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(248, 250, 252);
  doc.text(formattedDate, 196, 14, { align: 'right' });

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('CORRELATION ID', 196, 19, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(56, 189, 248); // cyan
  doc.text(summary.correlationId, 196, 23, { align: 'right' });

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('ASSET', 196, 28, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(248, 250, 252);
  doc.text(summary.candidateAssetGroup, 196, 32, { align: 'right' });

  // 2. VERTICAL LAYOUT CURSOR SYSTEM
  let cursorY = 40; // 5mm below header
  const pageBottomLimit = 270; // footer begins at 283mm

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight > pageBottomLimit) {
      doc.addPage();
      cursorY = 20; // below running header
    }
  };

  const advance = (height: number) => {
    cursorY += height;
  };

  // 3. SYNTHETIC DATA NOTICE (Dynamic height, safe wrapping, zero overflow)
  const noticeWidth = 182;
  const noticeX = 14;
  const disclaimerFullText = `${meta.syntheticNotice} ${meta.disclaimer}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const textLines = doc.splitTextToSize(disclaimerFullText, noticeWidth - 16);
  const lineHeight = 3.6;
  const noticeHeight = Math.max(16, 8 + textLines.length * lineHeight + 4);

  ensureSpace(noticeHeight);

  // Background Box
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.roundedRect(noticeX, cursorY, noticeWidth, noticeHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(30, 41, 59); // #1E293B
  doc.setLineWidth(0.3);
  doc.roundedRect(noticeX, cursorY, noticeWidth, noticeHeight, 1.5, 1.5, 'S');

  // Cyan Accent Indicator Bar on Left
  doc.setFillColor(2, 132, 199); // #0284C7
  doc.roundedRect(noticeX, cursorY, 2.5, noticeHeight, 1, 1, 'F');

  // Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(56, 189, 248); // #38BDF8
  doc.text('SYNTHETIC DATA NOTICE', noticeX + 7, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('•  DEMONSTRATION TELEMETRY', noticeX + 44, cursorY + 5.5);

  // Notice Body Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(textLines, noticeX + 7, cursorY + 9.8);

  advance(noticeHeight + 6);

  // 4. CORRELATION SUMMARY (Visual Summary Card & Metrics)
  const summaryCardHeight = 38;
  ensureSpace(summaryCardHeight + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199); // #0284C7
  doc.text('CORRELATION SUMMARY', 14, cursorY);
  advance(3.5);

  const cardY = cursorY;
  // Card Container
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.roundedRect(14, cardY, 182, summaryCardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.4);
  doc.roundedRect(14, cardY, 182, summaryCardHeight, 2, 2, 'S');

  // Top Section: Status Badge + Asset Name + Context
  let badgeBg: [number, number, number] = [254, 243, 199]; // amber-100
  let badgeBorder: [number, number, number] = [253, 230, 138];
  let badgeText: [number, number, number] = [146, 64, 14]; // amber-800
  const statusLabel = summary.status || 'UNKNOWN';

  if (statusLabel === 'CORRELATED') {
    badgeBg = [220, 252, 231]; // green-100
    badgeBorder = [134, 239, 172];
    badgeText = [22, 101, 52];
  } else if (statusLabel === 'SEPARATE') {
    badgeBg = [254, 226, 226]; // red-100
    badgeBorder = [252, 165, 165];
    badgeText = [153, 27, 27];
  }

  // Draw status badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const statusBadgeWidth = doc.getTextWidth(statusLabel) + 8;
  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(18, cardY + 4, statusBadgeWidth, 5.5, 1, 1, 'F');
  doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(18, cardY + 4, statusBadgeWidth, 5.5, 1, 1, 'S');
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(statusLabel, 18 + statusBadgeWidth / 2, cardY + 7.8, { align: 'center' });

  // Asset Canonical Hostname
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(summary.candidateAssetGroup, 18 + statusBadgeWidth + 5, cardY + 8);

  // Candidate Asset Group & ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Candidate Asset Group • ${summary.correlationId}`, 18, cardY + 14);

  // Evaluated Signals summary right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${summary.evaluatedCount} Signals Evaluated`, 192, cardY + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('100% Deterministic Engine Authority', 192, cardY + 13, { align: 'right' });

  // Divider Line inside Card
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(18, cardY + 17, 192, cardY + 17);

  // 4 Metric Tiles Row
  const tileWidth = 41;
  const tileStartX = 18;
  const tileY = cardY + 20;

  // Tile 1: Confidence
  const confColor: [number, number, number] =
    summary.confidence >= 80 ? [5, 150, 105] : summary.confidence >= 50 ? [217, 119, 6] : [220, 38, 38];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(confColor[0], confColor[1], confColor[2]);
  doc.text(`${summary.confidence}%`, tileStartX, tileY + 6);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('CONFIDENCE', tileStartX, tileY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Deterministic score', tileStartX, tileY + 14);

  // Tile 2: Records
  const tile2X = tileStartX + tileWidth + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${exportData.sourceRecords.length}`, tile2X, tileY + 6);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('SOURCE RECORDS', tile2X, tileY + 10.5);
  const uniqueScanners = Array.from(new Set(exportData.sourceRecords.map(r => r.sourceTool)));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${uniqueScanners.length} Scanner Tools`, tile2X, tileY + 14);

  // Tile 3: Signals
  const tile3X = tile2X + tileWidth + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(`${summary.matchedCount}`, tile3X, tileY + 6);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('MATCHED SIGNALS', tile3X, tileY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Corroborated identity', tile3X, tileY + 14);

  // Tile 4: Conflicts
  const tile4X = tile3X + tileWidth + 2;
  const conflictColor: [number, number, number] =
    summary.conflictCount > 0 ? [217, 119, 6] : [5, 150, 105];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(conflictColor[0], conflictColor[1], conflictColor[2]);
  doc.text(`${summary.conflictCount}`, tile4X, tileY + 6);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('CONFLICTS', tile4X, tileY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(summary.conflictCount > 0 ? 'Discrepancies noted' : 'Zero conflicts', tile4X, tileY + 14);

  advance(summaryCardHeight + 6);

  // 5. SOURCE INGESTION TOPOLOGY & OBSERVATION TIMELINE
  const activeSources = Array.from(new Set(exportData.sourceRecords.map(r => r.sourceTool)));
  const topologyCardHeight = Math.max(34, activeSources.length * 6.5 + 14);
  ensureSpace(topologyCardHeight + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text('SOURCE TOPOLOGY & EVIDENCE TIMELINE', 14, cursorY);
  advance(3.5);

  const topCardY = cursorY;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, topCardY, 182, topologyCardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, topCardY, 182, topologyCardHeight, 1.5, 1.5, 'S');

  // Left Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('INGESTED SCANNER SOURCES', 18, topCardY + 5);

  // Draw Source Badges and Relationship Lines
  const sourceCenterYPositions: number[] = [];

  activeSources.forEach((src, idx) => {
    const sY = topCardY + 8 + idx * 6.5;
    const count = exportData.sourceRecords.filter(r => r.sourceTool === src).length;
    const bWidth = drawSourceVendorBadge(src, 18, sY, count);
    const midSY = sY + 2.5;
    sourceCenterYPositions.push(midSY);

    // Horizontal line from badge right to collector bus at x = 54
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(18 + bWidth, midSY, 54, midSY);
  });

  // Vertical Collector Bus line & Target Asset Box
  if (sourceCenterYPositions.length > 0) {
    const firstSY = sourceCenterYPositions[0];
    const lastSY = sourceCenterYPositions[sourceCenterYPositions.length - 1];
    const spineMidY = (firstSY + lastSY) / 2;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(54, firstSY, 54, lastSY);

    // Connector from spine to target asset box
    doc.line(54, spineMidY, 68, spineMidY);
    // Arrow head
    doc.setFillColor(100, 116, 139);
    doc.triangle(68, spineMidY, 65, spineMidY - 1.2, 65, spineMidY + 1.2, 'FD');

    // Target Asset Box
    const targetBoxWidth = 42;
    const targetBoxHeight = 10;
    const targetBoxX = 70;
    const targetBoxY = spineMidY - targetBoxHeight / 2;

    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(targetBoxX, targetBoxY, targetBoxWidth, targetBoxHeight, 1.2, 1.2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(targetBoxX, targetBoxY, targetBoxWidth, targetBoxHeight, 1.2, 1.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(summary.candidateAssetGroup, targetBoxX + 4, targetBoxY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${summary.correlationId} • Normalized`, targetBoxX + 4, targetBoxY + 8);
  }

  // Right Side: Evidence Observation Timeline
  const timelineStartX = 124;
  const timelineEndX = 186;
  const timelineMidY = topCardY + topologyCardHeight / 2;

  // Timeline Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('EVIDENCE OBSERVATION TIMELINE', timelineStartX, topCardY + 5);

  // Extract dates
  const allObsDates = exportData.sourceRecords
    .flatMap(r => [r.firstObserved, r.lastObserved])
    .filter(d => d && d !== 'N/A' && d.includes('-'))
    .sort();

  const firstObs = allObsDates[0] ? allObsDates[0].split('T')[0] : 'N/A';
  const lastObs = allObsDates[allObsDates.length - 1]
    ? allObsDates[allObsDates.length - 1].split('T')[0]
    : 'N/A';

  // Connecting bar
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(timelineStartX, timelineMidY, timelineEndX, timelineMidY);

  // Start Node
  doc.setFillColor(2, 132, 199); // cyan
  doc.circle(timelineStartX, timelineMidY, 1.4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('FIRST OBSERVED', timelineStartX, timelineMidY - 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(firstObs, timelineStartX, timelineMidY + 4.8);

  // End Node
  doc.setFillColor(16, 185, 129); // emerald
  doc.circle(timelineEndX, timelineMidY, 1.4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('LAST OBSERVED', timelineEndX, timelineMidY - 3, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(lastObs, timelineEndX, timelineMidY + 4.8, { align: 'right' });

  // Sub-caption
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${exportData.sourceRecords.length} records ingested across ${activeSources.length} scanning engines`,
    (timelineStartX + timelineEndX) / 2,
    topCardY + topologyCardHeight - 3,
    { align: 'center' }
  );

  advance(topologyCardHeight + 6);

  // 6. SOURCE RECORDS TABLE
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`SOURCE SCANNER TELEMETRY RECORDS (${exportData.sourceRecords.length})`, 14, cursorY);
  advance(3.5);

  const recordRows = exportData.sourceRecords.map(r => [
    r.sourceTool,
    r.recordId,
    r.hostname + (r.fqdn && r.fqdn !== 'N/A' && r.fqdn !== r.hostname ? `\n${r.fqdn}` : ''),
    r.ipAddresses.join(', ') || 'N/A',
    `${r.operatingSystem || 'N/A'}${r.macAddress && r.macAddress !== 'N/A' ? `\nMAC: ${r.macAddress}` : ''}`,
    r.observationMethod || 'Direct Scan',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Scanner Tool', 'Record ID', 'Hostname / FQDN', 'IP Address(es)', 'Operating System', 'Method']],
    body: recordRows.length > 0 ? recordRows : [['No source records available', '-', '-', '-', '-', '-']],
    theme: 'grid',
    margin: { top: 20, bottom: 20, left: 14, right: 14 },
    headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 26, font: 'courier' },
      2: { cellWidth: 36 },
      3: { cellWidth: 32 },
      4: { cellWidth: 40 },
      5: { cellWidth: 24 },
    },
  });

  cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : cursorY + 25;

  // PAGE 2: Clean break for Identity Signals, Findings, Governance, and AI Explanation
  doc.addPage();
  cursorY = 20; // below running header

  // 7. MATCHED SIGNALS TABLE
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105); // emerald
  doc.text(`MATCHED IDENTITY SIGNALS (${exportData.matchedSignals.length})`, 14, cursorY);
  advance(3.5);

  const matchedRows = exportData.matchedSignals.map(s => [
    s.signalName,
    s.attribute,
    `+${s.weight}`,
    s.supportingRecordIds.join(', '),
    s.explanation,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Signal Name', 'Category', 'Weight', 'Supporting Records', 'Deterministic Evidence Explanation']],
    body: matchedRows.length > 0 ? matchedRows : [['No matched signals recorded', '-', '-', '-', '-']],
    theme: 'grid',
    margin: { top: 20, bottom: 20, left: 14, right: 14 },
    headStyles: { fillColor: [6, 78, 59], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
      3: { cellWidth: 32, font: 'courier' },
      4: { cellWidth: 78 },
    },
  });

  cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : cursorY + 25;

  // 8. CONFLICTING SIGNALS TABLE
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6); // amber
  doc.text(`CONFLICTING & UNCERTAIN SIGNALS (${exportData.conflictingSignals.length})`, 14, cursorY);
  advance(3.5);

  if (exportData.conflictingSignals.length > 0) {
    const conflictRows = exportData.conflictingSignals.map(c => [
      c.signalName,
      c.attribute,
      `${c.weight}`,
      c.conflictingRecordIds.join(', '),
      c.explanation,
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Conflicting Signal', 'Category', 'Penalty', 'Conflicting Records', 'Discrepancy Detail']],
      body: conflictRows,
      theme: 'grid',
      margin: { top: 20, bottom: 20, left: 14, right: 14 },
      headStyles: { fillColor: [120, 53, 15], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: 22 },
        2: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [217, 119, 6] },
        3: { cellWidth: 32, font: 'courier' },
        4: { cellWidth: 78 },
      },
    });

    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : cursorY + 25;
  } else {
    // Clean zero conflict card
    const zeroCardHeight = 12;
    doc.setFillColor(240, 253, 244); // green-50
    doc.roundedRect(14, cursorY, 182, zeroCardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(187, 247, 208); // green-200
    doc.setLineWidth(0.3);
    doc.roundedRect(14, cursorY, 182, zeroCardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('✓ ZERO CONFLICTING SIGNALS DETECTED', 18, cursorY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(22, 101, 52);
    doc.text('All ingested scanner records exhibit 100% attribute consistency for evaluated identity signals.', 18, cursorY + 8.8);

    advance(zeroCardHeight + 8);
  }

  // 9. ASSOCIATED VULNERABILITY FINDINGS
  if (exportData.relatedFindings.length > 0) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`ASSOCIATED VULNERABILITY FINDINGS (${exportData.relatedFindings.length})`, 14, cursorY);
    advance(3.5);

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
      startY: cursorY,
      head: [['Finding ID', 'Tool', 'CVE / Vuln ID', 'Title', 'Severity', 'CVSS', 'Status']],
      body: findingRows,
      theme: 'striped',
      margin: { top: 20, bottom: 20, left: 14, right: 14 },
      headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 24, font: 'courier' },
        1: { cellWidth: 20 },
        2: { cellWidth: 26, font: 'courier' },
        3: { cellWidth: 56 },
        4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 24, halign: 'center' },
      },
    });

    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : cursorY + 25;
  }

  // 10. GOVERNANCE & EXCEPTION AUDIT TRAIL (if present)
  const hasDecisions = exportData.analystDecisions.length > 0;
  const hasExceptions = exportData.exceptions.length > 0;

  if (hasDecisions || hasExceptions) {
    ensureSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ANALYST GOVERNANCE & EXCEPTION LOG', 14, cursorY);
    advance(3.5);

    const auditRows: string[][] = [];
    exportData.analystDecisions.forEach(d => {
      auditRows.push([
        d.timestamp.split('T')[0] || d.timestamp,
        `Decision: ${d.decision}`,
        d.reason || d.analystNote || 'Session action recorded',
        d.affectedRecordIds.join(', ') || 'Asset cluster',
      ]);
    });
    exportData.exceptions.forEach(e => {
      auditRows.push([
        e.createdAt.split('T')[0] || e.createdAt,
        `Exception (${e.status}): ${e.exceptionId}`,
        e.reason || e.analystNote || 'Audit exception granted',
        e.recordIds.join(', ') || e.assetGroupId,
      ]);
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['Timestamp', 'Governance Action', 'Justification / Notes', 'Scope / Records']],
      body: auditRows,
      theme: 'grid',
      margin: { top: 20, bottom: 20, left: 14, right: 14 },
      headStyles: { fillColor: [51, 65, 85], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.8, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 76 },
        3: { cellWidth: 40, font: 'courier' },
      },
    });

    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : cursorY + 25;
  }

  // 11. AI EXPLANATION SECTION (Non-authoritative boundary)
  const aiExplanationText = exportData.aiExplanation.text || 'No AI explanation generated.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const aiLines = doc.splitTextToSize(aiExplanationText, 170);
  const aiBoxHeight = Math.max(22, 12 + aiLines.length * 3.8 + 6);

  ensureSpace(aiBoxHeight + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(126, 34, 206); // purple-700
  doc.text(exportData.aiExplanation.headerNotice, 14, cursorY);
  advance(3.5);

  const aiBoxY = cursorY;
  doc.setFillColor(250, 245, 255); // purple-50
  doc.roundedRect(14, aiBoxY, 182, aiBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(233, 213, 255); // purple-200
  doc.setLineWidth(0.3);
  doc.roundedRect(14, aiBoxY, 182, aiBoxHeight, 1.5, 1.5, 'S');

  // Purple accent indicator bar
  doc.setFillColor(168, 85, 247); // purple-500
  doc.roundedRect(14, aiBoxY, 2.5, aiBoxHeight, 1, 1, 'F');

  // Sub-disclaimer inside AI box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(126, 34, 206);
  doc.text('EXPLANATORY CONTEXT ONLY • NON-AUTHORITATIVE', 20, aiBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(aiLines, 20, aiBoxY + 9.5);

  advance(aiBoxHeight + 8);

  // 11. RUNNING HEADERS & FOOTERS ACROSS ALL PAGES
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header on Pages 2+
    if (p >= 2) {
      doc.setFillColor(11, 20, 32); // #0B1420
      doc.rect(0, 0, 210, 14, 'F');
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.3);
      doc.line(0, 14, 210, 14);

      // Running logo (6mm)
      addReportHeaderLogoPage2(doc, 14, 3.8, 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(56, 189, 248);
      doc.text(`VulnFusion Correlation Evidence Report`, 23, 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`—  ${summary.candidateAssetGroup} (${summary.correlationId})`, 82, 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('ENTERPRISE SECURITY INTELLIGENCE', 196, 7.5, { align: 'right' });
    }

    // Running Footer on All Pages (1..N)
    doc.setFillColor(11, 20, 32); // #0B1420
    doc.rect(0, 283, 210, 14, 'F');
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.line(0, 283, 210, 283);

    // Left: Deterministic Authority Notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(
      meta.deterministicAuthorityNotice,
      14,
      288,
      { maxWidth: 148 }
    );

    // Right: Confidential & Page Count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(248, 250, 252);
    doc.text(`PAGE ${p} OF ${totalPages}`, 196, 288.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL • AUDIT GRADE', 196, 292.5, { align: 'right' });
  }

  // Browser download trigger
  if (triggerDownload && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      doc.save(filename);
    } catch (e) {
      console.warn('doc.save bypassed in headless context:', e);
    }
  }

  (exportToPdf as any).lastDoc = doc;

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
