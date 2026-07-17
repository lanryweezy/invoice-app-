## 2026-07-12 - Extract strategy interface from exportBatch
**Learning:** Introduced a `BatchExportStrategy` interface and registry to abstract away the batch export formats, eliminating a hardcoded if-chain and adhering to the Open-Closed Principle for future formats.
**Action:** Wait for the second case (JSON + CSV existed) to introduce an interface. Always provide a fallback (like throwing an Error) when a runtime lookup fails. Ensure new extension point hooks document their contract clearly.
## 2024-05-24 - Compliance Suggestion Strategy
**Learning:** Refactoring a large, growing `switch` statement (e.g., in a compliance checking rule set) into a Strategy Pattern via a `Map` registry is a highly effective way to open a module for extension without requiring modifications to the core iterating or execution function. It keeps the core logic extremely small and delegates rule-specific suggestions entirely to registered implementations.
**Action:** Actively look for `switch` blocks in pure functions or configuration-heavy logic that are frequently updated, and extract them into registries or strategy interfaces to honor the Open/Closed Principle.
