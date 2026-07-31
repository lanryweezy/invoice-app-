## 2024-03-24 - Audit Trail Tests Added
**Learning:** Testing logic involving `localforage` mock behavior inside vitest is robust and supports testing higher-order behaviors like formatting, mapping, and escaping strings correctly as long as we properly stub the `getItem` and `setItem` calls beforehand.
**Action:** When working on data-storage interacting services in the web layer, always use Vitest's `vi.mock` capabilities to bypass real IndexedDB dependencies so edge cases (such as gracefully handling missing `previousValues` properties or empty storage limits) can be safely tested locally.
## 2024-07-06 - Test Coverage in InvoiceApp Monorepo
**Learning:** This repo has a monorepo structure with tests in `apps/web`. Vitest and `@vitest/coverage-v8` handle testing and coverage reports. Vitest is configured to run tests over all files via `pnpm -w run test`. Coverage for specific files requires installing the dependencies properly. The `offlineSync.ts` file initially had zero testing for its core offline sync behaviour.
**Action:** When adding tests in `apps/web/utils`, always write complete test suites using `vitest` covering all logical branches. We added 100% test coverage to `offlineSync.ts`.

## 2024-07-10 - Math.random in Vite environment
**Learning:** Testing functions that rely on Math.random() to generate strings via toString(36) requires careful mocking. Mocking Math.random() with a static float requires verifying that the output matches standard javascript float-to-string implementation. Otherwise strict equality assertions fail, as seen in generateStampReceipt.
**Action:** When testing ID generation logic dependent on math random, verify the mocked output manually before applying it in the test assertion.

## 2024-07-12 - Splitting test files & strict mock return values
**Learning:** When adding tests for a large module (like `useInvoice`), keep files under 200 lines by separating them based on the functionality they test (e.g., `useInvoice-clients.test.ts`, `useInvoice-totals.test.ts`). Also, ensure mocked database functions return appropriate mock strings rather than `undefined` to accurately mirror data flow (e.g. `doc: vi.fn(() => 'mock-doc-ref')`).
**Action:** When mocking functions in external modules that are expected to return a reference or primitive value to be passed down further (like Firebase's `doc`), always supply a stubbed return value instead of an empty mock to prevent silent downstream errors. Group large test files logically and split them early.
## 2024-07-17 - portalLinks.test.ts token length validation
**Learning:** The portalLinks logic generates a 64-character token via crypto.getRandomValues, but the tests were asserting a length of 12. Also added missing validation test for handling missing totals.
**Action:** Always ensure that regex constraints in test suites properly match the actual output of the code being tested. Updated `/^[A-Za-z0-9]{12}$/` to `/^[A-Za-z0-9]{64}$/` to correctly assert the length.

## 2026-07-18 - Missing test coverage for structured exports
**Learning:** The `apps/web/services/structuredExport.ts` file contained critical functions for JSON, XML, and CSV generation, but these functions were initially completely untested. Testing formatting and escaping strings for these output types is crucial as subtle errors can lead to malformed exports.
**Action:** Always ensure robust testing for export functions, particularly focusing on validating exact data structures (like generated XML/CSV output and string escaping).
## 2024-05-19 - Test coverage sprint
**Learning:** Testing heavily branched mapping objects (like templates) and class methods requires exhaustive tests for mapping and network/service failures respectively, but the actual module structure doesn't always show coverage in files correctly mapped due to types. Mocking `global.fetch` and checking synthetic statuses ensures testing of specific retry mechanisms.
**Action:** When testing external modules, explicitly test error mappings like AbortError instead of just success responses.
## 2026-07-19 - Splitting hook tests for useInvoice mutations
**Learning:** The `useInvoice.ts` hook handles many separate data mutations (invoices, business profiles, line items, etc.) which makes it hard to test comprehensively in a single file without exceeding line constraints. The existing pattern splits tests by domain (e.g., `-clients`, `-totals`). When adding coverage for saving invoices and business profiles, creating new dedicated test files (`-invoices.test.ts` and `-businessProfiles.test.ts`) makes it easy to isolate and rigorously test both success states, edge cases (case-insensitivity, empty fields), and interactions with mocks.
**Action:** When testing complex, multi-domain hooks in this repository, always split new coverage into separate, focused test files following the `<hookName>-<domain>.test.ts` naming convention rather than appending to existing unrelated test files.
## 2026-07-19 - Explicit Math and Date Mocks for eInvoicing\n**Learning:** When unit testing functions that rely on deterministic time or strict VAT math, using explicit explicit test fixtures that mirror the logic with real world scenarios is necessary for confidence, as opposed to snapshot testing. I had to explicitly mock the system time via `vi.useFakeTimers()` to verify deterministic outputs for `metadata.generatedAt`.\n**Action:** When testing external integration formats like eInvoicing, always provide exhaustive manual assertions for specific calculated fields (like VAT and WHT amounts) using fixed mock data and explicit system time rather than mocking internal logic or relying on loose snapshots.
## 2024-05-30 - Added missing edge case test for same currency conversion in exchangeRates
**Learning:** Even simple logic branches like `if (from === to) return amount;` need explicit tests, especially when business logic specifically relies on certain currency strings (like 'NGN').
**Action:** When writing utility functions for conversions, always test the "no-op" identical inputs using the exact specific strings (e.g. 'NGN' to 'NGN') the business logic is built around.

## 2024-07-19 - Testing Time-Dependent State Reset Logic
**Learning:** Testing logic that depends on date transitions (like sequence resets on month changes) requires precise manipulation of the system time during the test run. Using `vi.setSystemTime` between successive function calls allows us to simulate the passage of time accurately without waiting. Also, mocking stateful APIs like `localStorage` using memory-backed variables is essential to capture the intermediate states across time jumps.
**Action:** When testing components or utilities that track time-based state (like daily quotas, monthly counters, or expirations), simulate the passage of time by updating `vi.setSystemTime` in the middle of a test case and use memory-backed mocks for storage.
## 2026-07-19 - Testing `JSON.parse` wrapper error paths via mock data mutation
**Learning:** When asserting the `catch` fallback block in logic that parses external stringified states (like `localStorage` data reading), the `catch` handler must be invoked by supplying functionally invalid parser data (like `'not-json'`) rather than artificially throwing standard errors via the mock. However, ensuring you test *both* scenarios guarantees robustness against IO failures *and* data corruption without losing coverage.
**Action:** When adding malformed JSON path tests, implement them as strictly additive cases alongside existing `mockImplementation(() => { throw new Error(...) })` tests rather than replacing them.
## 2026-07-19 - Testing Extensible Strategy Patterns
**Learning:** When testing extensible patterns like `registerAuditExportStrategy` that utilize `(string & {})` for loosely-typed ID mapping, verify not only the successful registration and invocation but also the failure path for an unregistered custom string ID (which might be typed correctly via casting but fails at runtime).
**Action:** When adding tests for dynamic registries or strategies in the future, include a test asserting that an unregistered key passed via `as any` or custom string explicitly throws the expected "Unsupported" error.
## 2024-07-23 - Testing expiration logic on pure dates
**Learning:** In the NIBSS integration (`apps/web/services/nibssIntegration.ts`), the `isPaymentExpired` function evaluates expiration purely based on the `expiresAt` timestamp, ignoring the state of the `status` field.
**Action:** When writing tests that verify cancellation logic (e.g., `cancelPaymentLink`), do not assert that `isPaymentExpired` becomes true unless mock timers (`vi.useFakeTimers()`) have been explicitly advanced past the expiration date.

## 2023-10-27 - Mocking Browser Globals in Vitest (JSDOM)
**Learning:** In Vitest's `jsdom` environment, `window` properties and `global` properties can sometimes get out of sync depending on how they are assigned or deleted.
**Action:** When mocking browser globals like `Notification` for test files, always explicitly mock and restore both `global.Notification` and `window.Notification` in the `beforeEach` and `afterEach` blocks to prevent variable leakage and ensure perfectly clean test environments.
