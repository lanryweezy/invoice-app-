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
