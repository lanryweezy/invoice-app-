## 2024-07-19 - Extracted duplicated Intl.NumberFormat to shared utility
**Learning:** `Intl.NumberFormat` instantiation has a minor (~0.6ms) overhead and was duplicated across 8 components, sometimes correctly memoized but mostly not.
**Action:** Always extract stateless formatting utilities to a single source of truth (`apps/web/utils/formatters.ts`) to ensure performance optimization without cluttering individual components.
## 2024-10-18 - Avoid repeated Intl.NumberFormat instantiation
**Learning:** Found multiple instances of `new Intl.NumberFormat()` with hardcoded 'en-NG' locales across different modules (like `emailGenerator.ts` and `nibssIntegration.ts`), despite a centralized `formatCurrency` utility existing in `formatters.ts`.
**Action:** Always import and use the shared `formatCurrency` function to centralize formatting logic, prevent duplicate caching overhead, and avoid inline configuration inconsistencies.
