## 2024-08-06 - Test file creation

**Learning:** When using `as any` in mock data inside vitest, while it circumvents TypeScript's stringent checks on big interfaces, it is completely acceptable within tests here because it safely mimics complex objects (like invoices) without needing full instantiations, a common strategy applied across the repo.
**Action:** When stubbing massive objects such as `Invoice` or `Client`, rely on `as any` or `as unknown as Type` for partial mocks instead of exhaustively creating large fixtures that clutter tests, so long as the fields vital to the test logic are correctly initialized.
## 2024-08-10 - Mocking Storage APIs

**Learning:** When spying on global browser APIs like `Storage.prototype.getItem` and `Storage.prototype.setItem`, use `mockClear()` in `beforeEach` to reset call counts and `mockRestore()` in `afterAll` to clean up the spies entirely.
**Action:** When testing modules that interact with `localStorage` or `sessionStorage`, ensure global spies are properly restored to prevent cross-test pollution. Use `vi.spyOn(Storage.prototype, 'getItem')` and restore it afterward.

## 2024-08-11 - Testing Commander CLI with Inquirer
**Learning:** When testing CLI commands that use inquirer for interactive prompts alongside commander, use vi.mock to mock inquirer and return the expected resolved values to simulate user input without halting the test.
**Action:** For all future tests involving interactive CLI flows, mock inquirer.prompt and use .mockResolvedValueOnce() to provide sequence-specific answers.
## 2024-05-18 - Improve test coverage for offlineSync.ts

**Learning:** When testing queues relying on `localStorage`, mocking `Storage.prototype.getItem` and `Storage.prototype.setItem` ensures predictable outcomes without test cross-pollution. Additionally, extracting queue operations into easily testable pure functions (`queueInvoiceChange` etc) enables comprehensive coverage for both normal offline changes and edge cases without executing complex Firebase mocks.
**Action:** Added extensive tests covering previously untested functionality in `offlineSync.ts` such as specific collection queues, synced status clearing, pending changes count, and the standard sync strategies for 'create', 'update', and 'delete' offline events.
## 2024-05-24 - Testing Firebase Initialization
**Learning:** When mocking Firebase classes like `GoogleAuthProvider` in Vitest, they must be mocked as classes (e.g., `class {}`) rather than functions (`vi.fn()`) to avoid constructor errors upon initialization. Additionally, always read the target module to confirm its actual exports instead of relying on the issue description, which may omit critical information.
**Action:** Created `apps/web/services/firebase.test.ts` to test initialization logic and safely mock Firebase dependencies.

## 2024-08-12 - Added AbortController timeout coverage to exchangeRates
**Learning:** We can simulate AbortController signal events during fetch mocks in Vitest by extracting the signal from fetch options and attaching an abort listener that throws an error, combined with `vi.runAllTimersAsync()` to fast-forward timeouts.
**Action:** Added a specific mock implementation that accurately simulates fetch abort behaviour when testing timeout handlers, successfully achieving 100% code coverage on `exchangeRates.ts`.
## 2026-08-12 - Concise API Testing
**Learning:** When instructed to write API test files in under 50 lines, do not mock internal modules (like  or ). Instead, directly mock `global.fetch` and perform all assertions in a single concise test block to minimize boilerplate while covering all paths.
**Action:** Created `apps/web/services/nibssApi.test.ts` in <30 lines by mocking `global.fetch`.
## 2024-08-12 - Concise API Testing
**Learning:** When instructed to write API test files in under 50 lines, do not mock internal modules (like `apiConfig.apiRequest` or `analytics`). Instead, directly mock `global.fetch` and perform all assertions in a single concise test block to minimize boilerplate while covering all paths.
**Action:** Created `apps/web/services/nibssApi.test.ts` in <30 lines by mocking `global.fetch`.
## 2024-05-18 - Missing error path test in nrsApi.ts VAT report failure
**Learning:** Testing error paths that trigger side effects like logging (`console.error`) and analytics (`trackEvent`) is critical for resilience. In `nrsApi.ts`, while the happy path for `reportVAT` and `reportWHT` was tested, their respective catch blocks weren't. We must mock the external services (e.g. `vi.mock('../utils/analytics')`) and verify the exact arguments passed to them.
**Action:** Added targeted unit tests asserting that `console.error` and `trackEvent` receive correctly formatted payloads when the API request (via `apiConfig.apiRequest`) rejects in both `reportVAT` and `reportWHT`.
## 2026-08-14 - Add Tests for firebase-client.ts
**Learning:** Ensure that testing wrappers like firebase client effectively isolate state between tests by using `vi.resetModules()` and dynamic imports. Setting up mocks properly is critical for wrapper libraries without doing network requests.
**Action:** Created comprehensive Vitest suite for `apps/cli/src/lib/firebase-client.ts` ensuring full 100% test coverage including error paths, credential checking, and firestore method proxies.
## 2023-10-26 - Add Spinner Tests
**Learning:** Adding unit tests for console utilities like `ora` and `chalk` requires careful mocking to ensure process state (like `process.exit`) and console output can be asserted without terminating the test runner or cluttering the output.
**Action:** Implemented a full test suite for `apps/cli/src/utils/spinner.ts` mocking `ora`, `chalk`, `console.error`, and `process.exit`.
