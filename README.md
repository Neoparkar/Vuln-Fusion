# VulnFusion — AI-Powered Vulnerability & Asset Intelligence Layer

## Problem Statement
Security and Vulnerability Management (VM) teams routinely receive thousands of raw asset records and vulnerability scan results from diverse tools (e.g., agent scans, network discovery, credentialed assessments). Multiple records frequently represent the **same physical or virtual underlying asset**, leading to duplicated work, inaccurate asset inventories, and fragmented remediation workflows.

## Solution
**VulnFusion** acts as an intelligence layer above scanning tools. It normalizes telemetry and **deterministically correlates** disparate records into evidence-supported underlying asset hypotheses, then connects related vulnerability findings into unified **potential remediation issues**.

## Core Architectural Principle
> **Asset Record ≠ Underlying Asset**

## The Role of Gemini AI
- **Gemini is strictly an EXPLANATION SIDECAR**: It synthesizes human-readable analyst explanations for deterministic correlation results.
- **Gemini DOES NOT**:
  - Determine asset identity or finding identity
  - Modify correlation status or confidence metrics
  - Create asset groups or remediation issues
  - Override analyst governance decisions or exceptions

---

## System Architecture Pipeline

```
Source Records (Qualys, Tenable, Rapid7)
       ↓
Normalization (Canonical IPs, FQDNs, MACs, OS strings)
       ↓
Deterministic Asset Correlation Engine (Rule-based & Evidence-weighted)
       ↓
Underlying Asset Hypotheses (CORRELATED, REVIEW_REQUIRED, SEPARATE)
       ↓
Deterministic Finding Correlation Engine (CVE + Asset + Affected Software)
       ↓
Potential Remediation Issues
       ↓
Gemini AI Analyst Explanation (Sidecar)
```

---

## Security & Defense Controls

1. **Server-Side API Key Isolation**: The `GEMINI_API_KEY` is hosted exclusively on the Node.js server (`process.env`). Zero keys or secrets are bundled into client JavaScript.
2. **Prompt Injection Defense**: Untrusted telemetry fields (hostnames, notes, vulnerability titles) are strictly isolated from system instructions as unverified data payloads.
3. **Response Schema Validation**: Server-side validation enforces a strict 5-part section structure (`SUMMARY:`, `EVIDENCE:`, `CONFLICTS:`, `INTERPRETATION:`, `LIMITATIONS:`). If validation fails, safe fallback explanations are returned.
4. **Prototype Pollution Protection**: Express middleware sanitizes incoming JSON payloads for dangerous keys (`__proto__`, `constructor`, `prototype`).
5. **Payload Bounding & Rate Limiting**: Express JSON parsing is capped at 1MB. An in-memory rate limiter caps AI requests at 30 per minute per IP.
6. **Safe XSS Rendering**: Client UI relies on React text node rendering rather than raw HTML parsing (`dangerouslySetInnerHTML`), rendering malicious scripts as benign text.
7. **AI Failure Resilience**: If Gemini is unreachable or unconfigured, the application gracefully degrades while deterministic correlation workflows remain 100% operational.

---

## Automated Test Suite Results

The built-in **Automated Test Suite** executes 19 verification checks:

| Category | Tests Executed | Status |
| :--- | :--- | :--- |
| **Data Quality & Normalization** | 5 Tests | **19 / 19 PASSED** |
| **Asset Correlation Scenarios** | 8 Cases | **PASSED** |
| **Security & Hardening Checks** | 6 Checks | **PASSED** |

*Note: Zero tests failed. Deterministic stability is byte-for-byte stable across consecutive execution cycles.*

---

## System Limitations

1. **Synthetic Data**: Uses synthetic demonstration records labeled Qualys, Tenable, and Rapid7.
2. **No Live Scanner APIs**: Integrations are simulated via realistic synthetic telemetry datasets for preview stability.
3. **In-Memory Rate Limiting**: Rate limiting uses a single-process in-memory store suitable for hackathon preview deployment.
4. **Evidence Dependency**: Asset correlation accuracy depends on available identifying signals (IPs, MACs, Agent IDs, Hostnames).

---

## Hackathon Data Statement
**All dataset records, hostnames, IP addresses, vulnerability findings, and source labels (Qualys, Tenable, Rapid7) in VulnFusion are 100% SYNTHETIC.** No client, internal, proprietary, or live production data was used or stored in this application.
