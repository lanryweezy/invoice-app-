## 2024-07-06 - Test Coverage in InvoiceApp Monorepo
**Learning:** This repo has a monorepo structure with tests in `apps/web`. Vitest and `@vitest/coverage-v8` handle testing and coverage reports. Vitest is configured to run tests over all files via `pnpm -w run test`. Coverage for specific files requires installing the dependencies properly. The `offlineSync.ts` file initially had zero testing for its core offline sync behaviour.
**Action:** When adding tests in `apps/web/utils`, always write complete test suites using `vitest` covering all logical branches. We added 100% test coverage to `offlineSync.ts`.

## 2026-07-09 - Testing Storage-Synced Hooks
**Learning:** Testing hooks that handle local data syncing (like `useInvoice`'s `saveClient` and `saveBusinessProfile`) requires stubbing `localStorage` and `crypto.randomUUID()` explicitly. Vitest's `vi.stubGlobal` is perfect for this, but because hooks might interact with globals multiple times during a render cycle, `randomUUID` stubs should provide a predictable sequence (e.g. `mock-uuid-${uuidCounter++}`) rather than a static string to ensure unique ID checks pass.
**Action:** Always use `vi.stubGlobal` to isolate browser APIs in hook tests. Ensure global stubs like `randomUUID` return uniquely identifiable mock strings across multiple calls, and always clean up with `vi.unstubAllGlobals()` in `afterEach`.
