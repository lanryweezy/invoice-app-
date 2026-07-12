## 2026-07-12 - Extract strategy interface from exportBatch
**Learning:** Introduced a `BatchExportStrategy` interface and registry to abstract away the batch export formats, eliminating a hardcoded if-chain and adhering to the Open-Closed Principle for future formats.
**Action:** Wait for the second case (JSON + CSV existed) to introduce an interface. Always provide a fallback (like throwing an Error) when a runtime lookup fails. Ensure new extension point hooks document their contract clearly.
