## 2024-07-24 — Create and Download Invoice: html2canvas oklch crash
**Learning:** `html2canvas` 1.4.1 crashes when trying to render Tailwind CSS v4 variables with `oklch` colors causing an uncaught exception during PDF generation. Replaced with `html2canvas-pro` which supports it.
**Root cause:** The `html2canvas` library throws an exception when parsing `oklch` color spaces, which are widely used in Tailwind v4. This caused `window.prompt` exceptions or silent crashing during the "Download PDF" step.
**Solution:** Migrated from `html2canvas` to `html2canvas-pro` which has better modern CSS feature support.
**Apply when:** Taking screenshots or generating PDFs with `html2canvas` in modern codebases utilizing Tailwind v4 or modern CSS color functions.
