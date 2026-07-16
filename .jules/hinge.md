## 2026-07-12 - Extract strategy interface from exportBatch
**Learning:** Introduced a `BatchExportStrategy` interface and registry to abstract away the batch export formats, eliminating a hardcoded if-chain and adhering to the Open-Closed Principle for future formats.
**Action:** Wait for the second case (JSON + CSV existed) to introduce an interface. Always provide a fallback (like throwing an Error) when a runtime lookup fails. Ensure new extension point hooks document their contract clearly.
## 2026-07-16 - Extract strategy interface from exportAuditTrail
**Learning:** Extracted the hardcoded JSON and CSV export logic from `exportAuditTrail` into a `AuditExportStrategy` registry. This validates Hinge's philosophy of introducing extension machinery when a pattern hits two hard-coded cases, ensuring future export formats (like PDF or XML) can be added cleanly as new configurations.
**Action:** Wait for the second case (JSON + CSV existed) to introduce an interface. Always ensure the existing behavior is completely preserved without breaking underlying unit tests. Never mutate unrelated files or tests when adding extensibility.
