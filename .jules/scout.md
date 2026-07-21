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
## 2024-05-24 - Storage Read Error Handling Tests
**Learning:** When testing `localStorage.getItem` or similar persistence reading utilities, both runtime execution errors (e.g. `mockImplementation(() => { throw new Error('Quota exceeded') })`) and data corruption errors (e.g. `mockReturnValue('invalid-json')` failing inside `JSON.parse`) must be explicitly simulated. Often, developers only test one type of failure, leaving the other uncovered.
**Action:** When adding tests for storage reads, explicitly add a test case that injects an invalid string (like `'not-json'`) and confirms the catch branch of `JSON.parse` is hit and handled gracefully without crashing the application.
