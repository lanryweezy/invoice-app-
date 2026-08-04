## 2024-07-19 - Extracted duplicated Intl.NumberFormat to shared utility
**Learning:** `Intl.NumberFormat` instantiation has a minor (~0.6ms) overhead and was duplicated across 8 components, sometimes correctly memoized but mostly not.
**Action:** Always extract stateless formatting utilities to a single source of truth (`apps/web/utils/formatters.ts`) to ensure performance optimization without cluttering individual components.
## 2024-10-18 - Avoid repeated Intl.NumberFormat instantiation
**Learning:** Found multiple instances of `new Intl.NumberFormat()` with hardcoded 'en-NG' locales across different modules (like `emailGenerator.ts` and `nibssIntegration.ts`), despite a centralized `formatCurrency` utility existing in `formatters.ts`.
**Action:** Always import and use the shared `formatCurrency` function to centralize formatting logic, prevent duplicate caching overhead, and avoid inline configuration inconsistencies.
## 2024-10-18 - Extracted duplicated decodeURIComponent to shared utility
**Learning:** `decodeURIComponent(window.location.pathname)` wrapped in a try/catch block was duplicated across 5 different routing initializations and state update handlers in `App.tsx`, causing unnecessary bloat and potential inconsistencies if error handling needed to change.
**Action:** Always extract repetitive safe-parsing boilerplate (like decoding URLs) into a dedicated utility function (e.g., `getDecodedPathname` in `utils/routing.ts`) to maintain a single source of truth and cleaner component logic.
## 2024-10-18 - Maintain non-deterministic mock for crypto.getRandomValues
**Learning:** When replacing custom crypto generation logic with a centralized utility like `generateSecureId` and its corresponding tests, ensure that global test mocks (e.g., `crypto.getRandomValues`) remain non-deterministic (using `Math.random()`). If system time is frozen via `vi.setSystemTime` and a deterministic mock (like `i % 256`) is used, all IDs generated in the same test tick will be identical, destroying uniqueness and breaking tests that evaluate multiple items (like audit trails).
**Action:** When updating tests that involve ID generation under frozen timers, carefully audit any `crypto.getRandomValues` mocks to confirm they still introduce adequate entropy across sequential calls.
