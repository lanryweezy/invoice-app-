## 2024-05-20 - Vitest JSDOM Global Mocking
**Learning:** In Vitest environments like apps/web, window.Notification behaves as both a constructor and an object with static methods. Mocking by directly deleting/assigning window.Notification causes failures because window might not be fully defined or accessible.
**Action:** Always use vi.stubGlobal('Notification', mock) where mock is a vi.fn() casted as any, explicitly assigning static methods like requestPermission as separate mock functions. Restore using vi.unstubAllGlobals() in afterEach.
## 2024-05-20 - Coverage Artifact Pollution
**Learning:** Running `npx vitest run --coverage` generates a `coverage/` directory containing large HTML and JS artifacts. If `.gitignore` doesn't strictly exclude it, these files will end up staged for commit, polluting the repository and violating version control hygiene.
**Action:** Always check `git status` after generating test coverage. If a `coverage/` directory is present and staged, run `git restore --staged <dir>` and `rm -rf <dir>` before requesting code review or submitting the patch.
## 2026-08-08 - Testing API abstractions
**Learning:** When adding tests for API wrapper layers (like `nrsApi`) that depend on an internal fetch abstraction (like `apiRequest`), it's better to mock the internal abstraction rather than `global.fetch` to isolate the specific logic mapping and ensure the test describes behavior cleanly.
**Action:** Mock `apiConfig.apiRequest` using `vi.mock` when testing services that consume it.

## 2025-02-14 - Clean Test Outputs
**Learning:** Some test suites (like `exchangeRates.test.ts` and `invoiceSequence.test.ts`) test error boundaries/fallback logic and intentionally log to `console.error` and `console.warn`. This litters the console when running vitest.
**Action:** When testing expected error paths, use `vi.spyOn(console, 'error').mockImplementation(() => {})` in the `beforeEach` hook to ensure clean vitest output without suppressing genuine unexpected failures in other tests.
## 2025-02-14 - Test isolation for storage
**Learning:** Added test coverage for `queuePathMutation` in `apps/web/utils/offlineSync.test.ts`.
**Action:** When working on storage-related services in apps/web, always use `vi.mocked` against localforage functions and ensure proper setup of state to prevent tests from leaking.
## 2026-08-21 - Cleaning Test Noise from Intentional Errors
**Learning:** In the CLI configuration tests, testing invalid JSON parsing intentionally triggered `console.error('Error reading config:', error)`. This kind of intentional error logging pollutes test output, which makes test suites harder to read.
**Action:** Mock the `console.error` explicitly for tests that intentionally trigger fallback logic by using `const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});` and ensuring we call `consoleSpy.mockRestore();` after the assertion.
## 2025-02-14 - Test Commands for CLI Workspace
**Learning:** The `apps/cli` workspace lacks a standard `test` script in its `package.json`. Running `pnpm --filter "./apps/cli" test` fails.
**Action:** When adding tests in `apps/cli`, run tests directly using vitest, e.g., `cd apps/cli && npx vitest run src/utils`.
## 2026-08-25 - Coverage Artifact Pollution
**Learning:** Running `npx vitest run --coverage` dynamically generates `coverage/` directories containing HTML and JS artifacts. These are build artifacts that should not be committed to the repository to avoid immense clutter and merge conflicts. If they are accidentally staged, they can block PRs.
**Action:** Always clean up dynamically generated `coverage/` directories (e.g., `rm -rf coverage apps/*/coverage`) before staging and committing changes, or ensure they are explicitly excluded in `.gitignore`.
