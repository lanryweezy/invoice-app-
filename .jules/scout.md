## 2024-05-24 - Isolated Test Execution and Global Linting\n**Learning:** The `apps/web` workspace currently has pre-existing TypeScript (`tsc --noEmit`) and ESLint (`pnpm lint`) errors on the main branch. When running verifications for isolated changes, it is necessary to differentiate between pre-existing global errors and regressions introduced by the specific change.\n**Action:** Focus verification on running targeted tests (e.g., `vitest run path/to/file.ts`) and the full test suite (`vitest run`) to ensure no regressions are introduced, while ignoring pre-existing linter/compiler errors unless they are directly related to the modified files.

## 2026-07-15 - Never Commit Generated Test Reports
**Learning:** When generating coverage reports or test outputs into text files during exploration, they often contain ANSI escape codes and pollute the workspace, leading to rejected patches if committed.
**Action:** Always clean up temporary files like `coverage_report.txt` using `rm` before submitting, or pipe them to `/dev/null` / use `grep` directly on standard output.
## 2026-07-18 - File Truncation when Reading Source Files
**Learning:** When reading files using `cat`, the output may be truncated, which hides function signatures and implementations further down the file, leading to hallucinatory test implementations.
**Action:** Use tools like `cat <file> | tail -n +<line_number>` or `grep` to bypass truncation and ensure you read the full function implementation before writing tests.
## 2024-05-15 - localforage Mocking

**Learning:** Testing services that rely on `localforage` (like `auditTrail.ts`) requires mocking its `config`, `getItem`, and `setItem` methods globally using `vi.mock('localforage', ...)` to prevent unhandled promise rejections and IndexedDB initialization errors during Vitest runs.

**Action:** When adding tests for modules using `localforage`, use `vi.mock('localforage', () => ({ default: { config: vi.fn(), getItem: vi.fn(), setItem: vi.fn() } }))` before `describe` blocks.
## 2024-03-XX - Implement Value-Driven Feature Gating for Accounting
**Learning:** Current "Pro feature" gates block users and create friction. Replacing them with in-app sales pages that focus on value, context, and emotion converts better.
**Action:** Replace `handleProFeatureClick` modals with full-screen, value-driven feature landing pages.

## 2024-05-25 - Extracted and Documented Routing Utility with Test Coverage
**Learning:** `getDecodedPathname` in `apps/web/utils/routing.ts` was an undocumented utility function without test coverage, handling malformed URIs.
**Action:** Added proper JSDoc to explain *why* it gracefully falls back (to prevent routing crashes on malformed URIs) and added missing test coverage handling happy paths and error paths, conforming to Vitest setup best practices.

## 2024-05-25 - Mocking window.location in JSDOM
**Learning:** In Vitest environments using JSDOM like `apps/web`, attempting to mock `window.location` directly using `window.location = new URL(...)` will result in test failure, as `window.location` properties cannot be modified that way. It's necessary to clone the object and re-assign properties for successful test modification.
**Action:** When mocking `window.location` properties without triggering JSDOM errors, store the original object, delete the global object (`// @ts-ignore \n delete window.location;`), reassign it with a cloned object in `beforeEach`, and restore it in `afterEach`.
