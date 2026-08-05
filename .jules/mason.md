## 2024-07-19 - Extracted duplicated Intl.NumberFormat to shared utility
**Learning:** `Intl.NumberFormat` instantiation has a minor (~0.6ms) overhead and was duplicated across 8 components, sometimes correctly memoized but mostly not.
**Action:** Always extract stateless formatting utilities to a single source of truth (`apps/web/utils/formatters.ts`) to ensure performance optimization without cluttering individual components.
## 2024-10-18 - Avoid repeated Intl.NumberFormat instantiation
**Learning:** Found multiple instances of `new Intl.NumberFormat()` with hardcoded 'en-NG' locales across different modules (like `emailGenerator.ts` and `nibssIntegration.ts`), despite a centralized `formatCurrency` utility existing in `formatters.ts`.
**Action:** Always import and use the shared `formatCurrency` function to centralize formatting logic, prevent duplicate caching overhead, and avoid inline configuration inconsistencies.
## 2024-10-18 - Extracted duplicated decodeURIComponent to shared utility
**Learning:** `decodeURIComponent(window.location.pathname)` wrapped in a try/catch block was duplicated across 5 different routing initializations and state update handlers in `App.tsx`, causing unnecessary bloat and potential inconsistencies if error handling needed to change.
**Action:** Always extract repetitive safe-parsing boilerplate (like decoding URLs) into a dedicated utility function (e.g., `getDecodedPathname` in `utils/routing.ts`) to maintain a single source of truth and cleaner component logic.
## 2026-08-05 - Avoid repeated inline toLocaleString formatting
**Learning:** Found instances of inline `.toLocaleString()` with currency formatting configurations in `apps/cli/src/commands/batch.ts`, duplicating the logic already centralized in the `formatCurrency` utility.
**Action:** Always import and use the shared `formatCurrency` utility (from `utils/formatter.ts`) for consistent currency string formatting and to prevent scattered inline formatting logic.
