## 2024-08-14 - Use shared `handleCliError` to catch fatal errors in CLI\n**Learning:** The CLI command handlers frequently duplicated `catch (error) { console.error(...); process.exit(1); }`. The codebase already has a centralized `handleCliError` utility in `apps/cli/src/utils/spinner.ts`.\n**Action:** Use the existing `handleCliError` utility for consistent formatting and reduced duplication.
## 2024-08-17 - Centralize error message extraction
**Learning:** I found multiple places duplicating `e instanceof Error ? e.message : String(e)` directly inline. The codebase provides a centralized `getErrorMessage` utility in `apps/web/utils/error.ts` to standardize parsing unknown errors.
**Action:** Always import and use `getErrorMessage` rather than writing inline `instanceof Error` checks to ensure consistent logging across the app.
## $(date +%Y-%m-%d) - Extracted duplicated computeInvoiceHash
**Learning:** Found an almost identical `computeInvoiceHash` function duplicated in both `digitalSignature.ts` and `eInvoicing.ts`. The only difference was that `eInvoicing.ts` added the `dueDate` to the payload.
**Action:** Consolidated them into a shared utility function in `apps/web/utils/crypto.ts` utilizing an optional `includeDueDate` flag to preserve behavior. This pattern of extracting slightly diverging logic into parameterized shared utilities prevents drift.
## 2026-08-24 - Consolidated unsafe type-casting in error handlers
**Learning:** Found multiple instances of `catch (err) { setError((err as Error).message); }` which is unsafe if the error is not an Error instance (e.g., throwing a string).
**Action:** Replaced these with the safer, shared `getErrorMessage(err)` utility, ensuring consistent and crash-free error parsing.
