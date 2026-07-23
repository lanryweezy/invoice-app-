## 2026-07-23 — [Lazy load jsPDF and html2canvas]
**Finding:** `html2canvas` (202 KB) and `jsPDF` (388 KB) were statically imported in the top level of `App.tsx` and `ReceiptPreview.tsx`, heavily increasing the initial web application bundle (from 364 KB gzipped to 540 KB gzipped) on the critical path.
**Why it matters:** The heavy static imports slowed down initial page load significantly for users on low bandwidth because these libraries were loaded regardless of whether the user generated PDFs or receipts.
**Action:** When working with exporting tools (like PDF generators or Canvas snapshot tools), always import them dynamically using `const { module } = await import('module')` directly inside the event handler that requires them (e.g., `handleDownloadPdf`).
