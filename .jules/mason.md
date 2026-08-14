## 2024-08-14 - Extract Error Parsing Logic
**Learning:** The codebase repeatedly used the pattern `error instanceof Error ? error.message : String(error)` to parse unknown error types, especially in catch blocks before logging or tracking events.
**Action:** Extracted this into a pure utility function `getErrorMessage` in `apps/web/utils/error.ts` to enforce a single source of truth for error stringification. Also learned not to unnecessarily mock pure utility functions in tests to avoid ReferenceErrors.
