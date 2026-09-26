import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UnifiedTestItem, TestExecutionSnapshot } from './testCenterUtils';

function formatDateForFilename(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Formula injection defense
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

// 1. EXPORT TO JSON
export function exportTestSuiteToJson(
  tests: UnifiedTestItem[],
  snapshot: TestExecutionSnapshot,
  scope: string = 'Full Test Suite'
): string {
  const payload = {
    reportMetadata: {
      title: 'VulnFusion Test Validation Report',
      scope,
      generatedAt: new Date().toISOString(),
      runId: snapshot.runId,
      environment: 'Production Build',
      engineAuthority: '100% Client-Side Deterministic (Zero AI Dependency for Assertions)',
      totalTests: tests.length,
      passedCount: tests.filter(t => t.passed).length,
      failedCount: tests.filter(t => t.status === 'FAILED').length,
      reviewCount: tests.filter(t => t.status === 'REVIEW').length,
      executionDurationMs: snapshot.durationMs,
    },
    categorySummaries: snapshot.categorySummaries,
    testResults: tests.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      categoryLabel: t.categoryLabel,
      description: t.description,
      status: t.status,
      passed: t.passed,
      expected: t.expected,
      actual: t.actual,
      difference: t.difference || null,
      details: t.details,
      evidenceSnippet: t.evidenceSnippet || null,
      durationMs: t.durationMs,
      runId: t.runId,
      timestamp: t.timestamp,
    })),
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `vulnfusion-test-validation-${formatDateForFilename()}.json`;
  downloadBlob(blob, filename);
  return filename;
}

// 2. EXPORT TO CSV
export function exportTestSuiteToCsv(
  tests: UnifiedTestItem[],
  snapshot: TestExecutionSnapshot
): string {
  const headers = [
    'Test ID',
    'Test Name',
    'Category',
    'Status',
    'Duration (ms)',
    'Expected Behavior',
    'Actual Result',
    'Difference / Conflict',
    'Details / Trace',
    'Telemetry Evidence',
    'Run ID',
    'Timestamp'
  ];

  const rows = tests.map(t => [
    escapeCsvCell(t.id),
    escapeCsvCell(t.name),
    escapeCsvCell(t.categoryLabel),
    escapeCsvCell(t.status),
    escapeCsvCell(t.durationMs),
    escapeCsvCell(t.expected),
    escapeCsvCell(t.actual),
    escapeCsvCell(t.difference || 'None'),
    escapeCsvCell(t.details),
    escapeCsvCell(t.evidenceSnippet || 'N/A'),
    escapeCsvCell(t.runId),
    escapeCsvCell(t.timestamp)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `vulnfusion-test-validation-${formatDateForFilename()}.csv`;
  downloadBlob(blob, filename);
  return filename;
}

// 3. EXPORT TO PDF
export function exportTestSuiteToPdf(
  tests: UnifiedTestItem[],
  snapshot: TestExecutionSnapshot,
  scope: string = 'Full Test Suite'
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(16, 20, 26);
  doc.rect(0, 0, pageWidth, 85, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('VULNFUSION TEST VALIDATION REPORT', 40, 42);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Deterministic Engine Verification • Control-Plane Validation • Audit Integrity', 40, 58);

  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246);
  doc.text(`RUN ID: ${snapshot.runId}  |  SCOPE: ${scope.toUpperCase()}  |  ENVIRONMENT: PRODUCTION BUILD`, 40, 72);

  // Execution Summary Table
  const passedCount = tests.filter(t => t.passed).length;
  const failedCount = tests.filter(t => t.status === 'FAILED').length;
  const reviewCount = tests.filter(t => t.status === 'REVIEW').length;
  const passRate = tests.length > 0 ? `${Math.round((passedCount / tests.length) * 100)}%` : '100%';

  autoTable(doc, {
    startY: 95,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    head: [['VALIDATION HEALTH', 'TOTAL TESTS', 'PASSED', 'REVIEW REQUIRED', 'FAILED', 'DURATION', 'GENERATED AT']],
    body: [[
      failedCount === 0 && reviewCount === 0 ? '100% HEALTHY' : 'REQUIRES ATTENTION',
      String(tests.length),
      `${passedCount} (${passRate})`,
      String(reviewCount),
      String(failedCount),
      `${snapshot.durationMs} ms`,
      new Date().toLocaleString()
    ]],
    headStyles: { fillColor: [24, 32, 44], textColor: [226, 232, 240], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
    styles: { cellPadding: 5, halign: 'center' }
  });

  // Category Breakdown Table
  const categoryRows = Object.values(snapshot.categorySummaries).map(cat => [
    cat.label,
    cat.category,
    `${cat.passedCount} / ${cat.totalCount}`,
    `${cat.passPercentage}%`,
    cat.status,
    `${cat.durationMs} ms`
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 12,
    margin: { left: 40, right: 40 },
    theme: 'striped',
    head: [['VALIDATION DOMAIN / CATEGORY', 'KEY', 'TESTS PASSED', 'PASS RATE', 'HEALTH STATUS', 'EXECUTION TIME']],
    body: categoryRows,
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' } }
  });

  // Detailed Tests Table
  const testRows = tests.map(t => [
    t.id,
    t.status,
    t.name,
    t.category,
    t.details.length > 80 ? `${t.details.substring(0, 80)}...` : t.details,
    `${t.durationMs}ms`
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    head: [['ID', 'STATUS', 'TEST NAME', 'CATEGORY', 'TRACE DETAILS / ASSERTION EVIDENCE', 'TIME']],
    body: testRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, cellPadding: 3.5 },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 40 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 45 },
      2: { halign: 'left', fontStyle: 'bold', cellWidth: 140 },
      3: { halign: 'center', cellWidth: 65 },
      4: { halign: 'left', cellWidth: 190 },
      5: { halign: 'right', cellWidth: 35 }
    },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const val = data.cell.raw;
        if (val === 'PASSED') data.cell.styles.textColor = [16, 185, 129];
        else if (val === 'REVIEW') data.cell.styles.textColor = [245, 158, 11];
        else data.cell.styles.textColor = [239, 68, 68];
      }
    }
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`VulnFusion Verification Suite  |  Page ${i} of ${totalPages}  |  100% Deterministic Engine (Non-AI Assertions)`, 40, pageHeight - 20);
    doc.text(`Cryptographic Execution ID: ${snapshot.runId}`, pageWidth - 200, pageHeight - 20);
  }

  const filename = `vulnfusion-test-validation-${formatDateForFilename()}.pdf`;
  doc.save(filename);
  return filename;
}

// 4. EXPORT TO HTML (Standalone Self-Contained Interactive Audit Document)
export function exportTestSuiteToHtml(
  tests: UnifiedTestItem[],
  snapshot: TestExecutionSnapshot,
  scope: string = 'Full Test Suite'
): string {
  const passedCount = tests.filter(t => t.passed).length;
  const failedCount = tests.filter(t => t.status === 'FAILED').length;
  const reviewCount = tests.filter(t => t.status === 'REVIEW').length;
  const passPercentage = tests.length > 0 ? Math.round((passedCount / tests.length) * 100) : 100;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VulnFusion Test Validation Report - ${snapshot.runId}</title>
  <style>
    :root {
      --bg: #0b0f14;
      --card-bg: #10151d;
      --border: #1e2633;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #3b82f6;
      --pass: #10b981;
      --review: #f59e0b;
      --fail: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 32px 20px;
      line-height: 1.5;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: monospace;
    }
    .badge-pass { background: rgba(16, 185, 129, 0.15); color: var(--pass); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-review { background: rgba(245, 158, 11, 0.15); color: var(--review); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-fail { background: rgba(239, 68, 68, 0.15); color: var(--fail); border: 1px solid rgba(239, 68, 68, 0.3); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .metric-card h4 { font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }
    .metric-card .value { font-size: 20px; font-weight: 800; font-family: monospace; }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #151c27; color: var(--text-muted); padding: 12px 16px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
    tr:hover { background: #131923; }
    .mono { font-family: monospace; font-size: 12px; }
    .footer { text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge badge-pass" style="margin-bottom: 8px;">VulnFusion Validation Suite</span>
        <h1 style="font-size: 24px; font-weight: 800; margin-top: 4px;">Test Command Center Audit Report</h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Deterministic engine verification across normalization, correlation, security, and export pipelines.</p>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-pass" style="font-size: 14px; padding: 6px 14px;">${passedCount} / ${tests.length} PASS (${passPercentage}%)</span>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px; font-family: monospace;">Run ID: ${snapshot.runId}</div>
      </div>
    </div>

    <div class="grid">
      <div class="metric-card">
        <h4>Total Tests</h4>
        <div class="value">${tests.length}</div>
      </div>
      <div class="metric-card">
        <h4>Passed</h4>
        <div class="value" style="color: var(--pass);">${passedCount}</div>
      </div>
      <div class="metric-card">
        <h4>Review Required</h4>
        <div class="value" style="color: var(--review);">${reviewCount}</div>
      </div>
      <div class="metric-card">
        <h4>Failed</h4>
        <div class="value" style="color: var(--fail);">${failedCount}</div>
      </div>
      <div class="metric-card">
        <h4>Duration</h4>
        <div class="value">${snapshot.durationMs} ms</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Test ID</th>
            <th>Test Name</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Assertion Trace Details</th>
          </tr>
        </thead>
        <tbody>
          ${tests.map(t => `
          <tr>
            <td><span class="badge ${t.status === 'PASSED' ? 'badge-pass' : t.status === 'REVIEW' ? 'badge-review' : 'badge-fail'}">${t.status}</span></td>
            <td class="mono" style="color: var(--accent); font-weight: bold;">${t.id}</td>
            <td style="font-weight: 600;">${t.name}</td>
            <td style="color: var(--text-muted);">${t.categoryLabel}</td>
            <td class="mono">${t.durationMs}ms</td>
            <td class="mono" style="color: #cbd5e1; font-size: 11px;">${t.details}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated automatically by VulnFusion Security Validation Cockpit • ${new Date().toUTCString()} • Deterministic State Invariant Certified
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const filename = `vulnfusion-test-validation-${formatDateForFilename()}.html`;
  downloadBlob(blob, filename);
  return filename;
}

// 5. EXPORT TO MARKDOWN
export function exportTestSuiteToMarkdown(
  tests: UnifiedTestItem[],
  snapshot: TestExecutionSnapshot,
  scope: string = 'Full Test Suite'
): string {
  const passedCount = tests.filter(t => t.passed).length;
  const failedCount = tests.filter(t => t.status === 'FAILED').length;
  const reviewCount = tests.filter(t => t.status === 'REVIEW').length;
  const passRate = tests.length > 0 ? `${Math.round((passedCount / tests.length) * 100)}%` : '100%';

  const md = [
    `# VulnFusion Test Validation Report`,
    ``,
    `> **Deterministic Validation Pipeline Execution**  `,
    `> Generated: \`${new Date().toISOString()}\`  `,
    `> Run ID: \`${snapshot.runId}\`  `,
    `> Scope: \`${scope}\`  `,
    `> Authority: \`100% Client-Side Deterministic (Zero AI Dependency)\``,
    ``,
    `---`,
    ``,
    `## Executive Health Summary`,
    ``,
    `| Metric | Value |`,
    `|:---|---:|`,
    `| **Overall Health** | **${failedCount === 0 && reviewCount === 0 ? '✓ ALL VALIDATIONS HEALTHY' : '⚠ REQUIRES ATTENTION'}** |`,
    `| **Total Tests** | ${tests.length} |`,
    `| **Passed Tests** | ${passedCount} (${passRate}) |`,
    `| **Review Required** | ${reviewCount} |`,
    `| **Failed Tests** | ${failedCount} |`,
    `| **Execution Duration** | ${snapshot.durationMs} ms |`,
    ``,
    `---`,
    ``,
    `## Validation Domain Breakdown`,
    ``,
    `| Domain / Category | Tests Passed | Pass Rate | Status | Duration |`,
    `|:---|:---:|:---:|:---:|---:|`,
    ...Object.values(snapshot.categorySummaries).map(cat =>
      `| **${cat.label}** | ${cat.passedCount} / ${cat.totalCount} | ${cat.passPercentage}% | \`${cat.status}\` | ${cat.durationMs} ms |`
    ),
    ``,
    `---`,
    ``,
    `## Detailed Test Results`,
    ``,
    `| Status | ID | Test Name | Category | Duration | Details / Trace |`,
    `|:---:|:---|:---|:---|:---:|:---|`,
    ...tests.map(t =>
      `| ${t.passed ? '✓ PASS' : t.status === 'REVIEW' ? '⚠ REVIEW' : '✕ FAIL'} | \`${t.id}\` | **${t.name}** | ${t.category} | ${t.durationMs}ms | ${t.details.replace(/\|/g, '\\|')} |`
    ),
    ``,
    `---`,
    `*Report certified by VulnFusion Deterministic Security Validation Engine.*`
  ].join('\n');

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const filename = `vulnfusion-test-validation-${formatDateForFilename()}.md`;
  downloadBlob(blob, filename);
  return filename;
}

// 6. EXPORT INDIVIDUAL TEST
export function exportSingleTest(
  test: UnifiedTestItem,
  format: 'JSON' | 'CSV' | 'PDF' | 'MARKDOWN' | 'HTML'
): string {
  const dateStr = formatDateForFilename();

  if (format === 'JSON') {
    const payload = {
      testRecord: {
        id: test.id,
        name: test.name,
        category: test.categoryLabel,
        status: test.status,
        passed: test.passed,
        expected: test.expected,
        actual: test.actual,
        difference: test.difference || null,
        details: test.details,
        evidenceSnippet: test.evidenceSnippet || null,
        durationMs: test.durationMs,
        runId: test.runId,
        timestamp: test.timestamp,
        authority: '100% Deterministic Engine (Pure Assertion)',
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const filename = `vulnfusion-test-${test.id.toLowerCase()}-${dateStr}.json`;
    downloadBlob(blob, filename);
    return filename;
  }

  if (format === 'CSV') {
    const headers = ['Test ID', 'Name', 'Category', 'Status', 'Duration (ms)', 'Expected', 'Actual', 'Details', 'Run ID'];
    const row = [
      escapeCsvCell(test.id),
      escapeCsvCell(test.name),
      escapeCsvCell(test.categoryLabel),
      escapeCsvCell(test.status),
      escapeCsvCell(test.durationMs),
      escapeCsvCell(test.expected),
      escapeCsvCell(test.actual),
      escapeCsvCell(test.details),
      escapeCsvCell(test.runId),
    ];
    const csv = `${headers.join(',')}\r\n${row.join(',')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `vulnfusion-test-${test.id.toLowerCase()}-${dateStr}.csv`;
    downloadBlob(blob, filename);
    return filename;
  }

  if (format === 'PDF') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    doc.setFillColor(16, 20, 26);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 80, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`TEST VERIFICATION ARTIFACT: ${test.id}`, 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${test.name}  •  ${test.categoryLabel}`, 40, 58);

    autoTable(doc, {
      startY: 95,
      margin: { left: 40, right: 40 },
      theme: 'grid',
      head: [['FIELD', 'VALIDATION ASSERTION DETAIL']],
      body: [
        ['Test ID', test.id],
        ['Test Name', test.name],
        ['Category', test.categoryLabel],
        ['Status', test.status],
        ['Execution Duration', `${test.durationMs} ms`],
        ['Expected Behavior', test.expected],
        ['Actual Observed Result', test.actual],
        ['Assertion Trace', test.details],
        ['Evidence / Payload', test.evidenceSnippet || 'Pure Deterministic Execution'],
        ['Deterministic Run ID', test.runId],
        ['Execution Timestamp', test.timestamp],
      ],
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 130 } }
    });

    const filename = `vulnfusion-test-${test.id.toLowerCase()}-${dateStr}.pdf`;
    doc.save(filename);
    return filename;
  }

  if (format === 'MARKDOWN') {
    const md = [
      `# VulnFusion Test Assertion: ${test.id} — ${test.name}`,
      ``,
      `* **Category:** ${test.categoryLabel}`,
      `* **Status:** \`${test.status}\``,
      `* **Duration:** ${test.durationMs}ms`,
      `* **Run ID:** \`${test.runId}\``,
      `* **Timestamp:** \`${test.timestamp}\``,
      ``,
      `## Specification`,
      `* **Expected:** ${test.expected}`,
      `* **Actual:** ${test.actual}`,
      ``,
      `## Technical Trace`,
      `\`\`\``,
      test.details,
      `\`\`\``,
      test.evidenceSnippet ? `\n### Evidence Snippet\n\`\`\`\n${test.evidenceSnippet}\n\`\`\`` : '',
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const filename = `vulnfusion-test-${test.id.toLowerCase()}-${dateStr}.md`;
    downloadBlob(blob, filename);
    return filename;
  }

  // HTML fallback
  const html = `<!DOCTYPE html><html><head><title>${test.id} - ${test.name}</title></head><body style="background:#0b0f14;color:#f1f5f9;font-family:sans-serif;padding:30px;"><div style="max-width:800px;margin:0 auto;background:#10151d;border:1px solid #1e2633;border-radius:12px;padding:24px;"><h1>${test.id}: ${test.name}</h1><p style="color:#10b981;font-weight:bold;">Status: ${test.status}</p><p>Expected: ${test.expected}</p><p>Actual: ${test.actual}</p><pre style="background:#151c27;padding:12px;border-radius:6px;">${test.details}</pre></div></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const filename = `vulnfusion-test-${test.id.toLowerCase()}-${dateStr}.html`;
  downloadBlob(blob, filename);
  return filename;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
