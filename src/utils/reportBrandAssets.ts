import type jsPDF from 'jspdf';

/**
 * Canonical VulnFusion Brand Asset for Reports & Exports
 * 
 * Sourced directly from VulnFusionBrandIcon (Shield + V + Ingestion Nodes).
 * Embedded self-contained PNG data URI & SVG string.
 * No external network requests, zero CDN dependencies.
 */

// 1. High-resolution rasterized Base64 PNG data URL (128x128 350+ DPI at 9mm)
export const VULNFUSION_LOGO_BASE64_PNG = 'data:image/png;base64,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';

// 2. Canonical inline SVG mark for HTML standalone reports
export const VULNFUSION_LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VulnFusion Executive Brand Mark">
  <defs>
    <linearGradient id="vf-rep-shield-l" x1="12" y1="9" x2="24" y2="41" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1B3A5A" />
      <stop offset="50%" stop-color="#102A43" />
      <stop offset="100%" stop-color="#0B1F33" />
    </linearGradient>
    <linearGradient id="vf-rep-shield-r" x1="24" y1="9" x2="36" y2="41" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#102A43" />
      <stop offset="60%" stop-color="#0B1F33" />
      <stop offset="100%" stop-color="#06121E" />
    </linearGradient>
    <linearGradient id="vf-rep-v-left" x1="14" y1="14" x2="24" y2="33" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <linearGradient id="vf-rep-v-right" x1="24" y1="14" x2="34" y2="33" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5FA8D3" />
      <stop offset="50%" stop-color="#3B82C4" />
      <stop offset="100%" stop-color="#2563A6" />
    </linearGradient>
  </defs>
  <g>
    <line x1="8" y1="23.5" x2="13.5" y2="23.5" stroke="rgba(95,168,211,0.55)" stroke-width="1" stroke-dasharray="1.5 1.5" />
    <line x1="34.5" y1="23.5" x2="40" y2="23.5" stroke="rgba(95,168,211,0.55)" stroke-width="1" stroke-dasharray="1.5 1.5" />
    <line x1="15" y1="9.5" x2="18" y2="13" stroke="rgba(95,168,211,0.55)" stroke-width="0.9" />
    <line x1="33" y1="9.5" x2="30" y2="13" stroke="rgba(95,168,211,0.55)" stroke-width="0.9" />
    <rect x="7" y="22.5" width="2.2" height="2.2" rx="0.5" fill="#5FA8D3" />
    <rect x="38.8" y="22.5" width="2.2" height="2.2" rx="0.5" fill="#5FA8D3" />
    <rect x="14.2" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />
    <rect x="32" y="8.2" width="1.8" height="1.8" rx="0.4" fill="#3B82C4" />
    <path d="M24 7.5L12 12.8V24.5C12 32.2 17.2 38.6 24 40.8C30.8 38.6 36 32.2 36 24.5V12.8L24 7.5Z" fill="url(#vf-rep-shield-l)" stroke="#E8EEF5" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M24 8.5L34.8 13.3V24.5C34.8 31.4 30.2 37.2 24 39.4V8.5Z" fill="url(#vf-rep-shield-r)" />
    <path d="M24 10.2L13.8 14.8V24.5C13.8 31 18.2 36.6 24 38.6C29.8 36.6 34.2 31 34.2 24.5V14.8L24 10.2Z" fill="none" stroke="rgba(232, 238, 245, 0.22)" stroke-width="0.8" />
    <path d="M16 15.5H20.2L24 29.8L21.2 29.8L16 15.5Z" fill="url(#vf-rep-v-left)" />
    <path d="M32 15.5H27.8L24 29.8L26.8 29.8L32 15.5Z" fill="url(#vf-rep-v-right)" />
    <line x1="24" y1="9.5" x2="24" y2="39.5" stroke="rgba(232, 238, 245, 0.35)" stroke-width="0.8" />
    <polygon points="24,28.2 26,30.8 24,33.4 22,30.8" fill="#FFFFFF" stroke="#3B82C4" stroke-width="0.6" />
    <circle cx="24" cy="30.8" r="0.9" fill="#FFFFFF" />
  </g>
</svg>`;

// 3. Recommended logo dimensions
export const LOGO_SIZE_PAGE1_MM = 9; // 8-10mm recommended
export const LOGO_SIZE_PAGE2_MM = 6;
export const LOGO_SIZE_PAGE1_PT = 26; // approx 9mm in points
export const LOGO_SIZE_PAGE2_PT = 17; // approx 6mm in points

/**
 * Adds the canonical VulnFusion logo to the Page 1 dark navy executive header
 * Preserves 1:1 aspect ratio, safe error boundary.
 */
export function addReportHeaderLogoPage1(
  doc: jsPDF,
  x = 14,
  y = 10,
  sizeMm = LOGO_SIZE_PAGE1_MM
): void {
  try {
    doc.addImage(VULNFUSION_LOGO_BASE64_PNG, 'PNG', x, y, sizeMm, sizeMm, undefined, 'FAST');
  } catch (err) {
    console.warn('PDF logo raster skipped, using vector fallback:', err);
    drawVectorLogoFallback(doc, x, y, sizeMm);
  }
}

/**
 * Adds the canonical VulnFusion logo to running headers on Page 2+
 */
export function addReportHeaderLogoPage2(
  doc: jsPDF,
  x = 14,
  y = 4,
  sizeMm = LOGO_SIZE_PAGE2_MM
): void {
  try {
    doc.addImage(VULNFUSION_LOGO_BASE64_PNG, 'PNG', x, y, sizeMm, sizeMm, undefined, 'FAST');
  } catch (err) {
    console.warn('PDF running logo raster skipped, using vector fallback:', err);
    drawVectorLogoFallback(doc, x, y, sizeMm);
  }
}

/**
 * Clean vector fallback if raster fails in headless or restricted contexts
 */
export function drawVectorLogoFallback(
  doc: jsPDF,
  x: number,
  y: number,
  sizeMm: number
): void {
  try {
    const s = sizeMm / 48;
    // Outer shield rim
    doc.setFillColor(27, 58, 90);
    doc.rect(x + 12 * s, y + 8 * s, 24 * s, 32 * s, 'F');
    // Left facet
    doc.setFillColor(16, 42, 67);
    doc.triangle(x + 24 * s, y + 8 * s, x + 12 * s, y + 14 * s, x + 24 * s, y + 40 * s, 'F');
    // Right facet
    doc.setFillColor(11, 31, 51);
    doc.triangle(x + 24 * s, y + 8 * s, x + 36 * s, y + 14 * s, x + 24 * s, y + 40 * s, 'F');
    // V-mark white arm
    doc.setFillColor(248, 250, 252);
    doc.triangle(x + 16 * s, y + 16 * s, x + 24 * s, y + 30 * s, x + 20 * s, y + 30 * s, 'F');
    // V-mark cyan arm
    doc.setFillColor(59, 130, 196);
    doc.triangle(x + 32 * s, y + 16 * s, x + 24 * s, y + 30 * s, x + 28 * s, y + 30 * s, 'F');
    // Center diamond
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 22.5 * s, y + 29.5 * s, 3 * s, 3 * s, 'F');
  } catch (e) {
    // Ignore fallback errors
  }
}

/**
 * Adds the canonical VulnFusion logo to PT-based document headers (Page 1)
 */
export function addReportHeaderLogoPt(
  doc: jsPDF,
  x = 40,
  y = 25,
  sizePt = LOGO_SIZE_PAGE1_PT
): void {
  try {
    doc.addImage(VULNFUSION_LOGO_BASE64_PNG, 'PNG', x, y, sizePt, sizePt, 'VF_LOGO', 'FAST');
  } catch (err) {
    console.warn('PDF pt logo render skipped:', err);
  }
}

/**
 * Adds the canonical VulnFusion logo to PT-based running headers (Page 2+)
 */
export function addReportHeaderLogoPage2Pt(
  doc: jsPDF,
  x = 40,
  y = 7,
  sizePt = LOGO_SIZE_PAGE2_PT
): void {
  try {
    doc.addImage(VULNFUSION_LOGO_BASE64_PNG, 'PNG', x, y, sizePt, sizePt, 'VF_LOGO', 'FAST');
  } catch (err) {
    console.warn('PDF pt running logo render skipped:', err);
  }
}
