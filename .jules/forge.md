## 2024-07-06 - Test Coverage in InvoiceApp Monorepo
**Learning:** This repo has a monorepo structure with tests in `apps/web`. Vitest and `@vitest/coverage-v8` handle testing and coverage reports. Vitest is configured to run tests over all files via `pnpm -w run test`. Coverage for specific files requires installing the dependencies properly. The `offlineSync.ts` file initially had zero testing for its core offline sync behaviour.
**Action:** When adding tests in `apps/web/utils`, always write complete test suites using `vitest` covering all logical branches. We added 100% test coverage to `offlineSync.ts`.

## 2024-07-10 - Math.random in Vite environment
**Learning:** Testing functions that rely on Math.random() to generate strings via toString(36) requires careful mocking. Mocking Math.random() with a static float requires verifying that the output matches standard javascript float-to-string implementation. Otherwise strict equality assertions fail, as seen in generateStampReceipt.
**Action:** When testing ID generation logic dependent on math random, verify the mocked output manually before applying it in the test assertion.

## 2026-07-11 - Stubbing Browser Globals in React Hook Tests
**Learning:** When unit testing React hooks that manage lists of entities (like clients or profiles) and interact with browser globals like `localStorage` and `crypto`, relying on unmocked globals or static string mocks can lead to test failures (e.g., uniqueness check failures). You need to properly stub these globals across render cycles.
**Action:** Ensure test assertions cover duplicate matching logic (case-insensitivity), invalid write rejection (e.g. empty strings), and verify state is accurately synced. Always use `vi.stubGlobal` to mock `localStorage` (with a mock object that tracks `setItem`) and `crypto` (returning sequentially unique identifiers like `mock-uuid-${uuidCounter++}`) in `beforeEach`. Clean up with `vi.unstubAllGlobals()` in `afterEach`.
