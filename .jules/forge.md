## 2024-07-06 - Test Coverage in InvoiceApp Monorepo
**Learning:** This repo has a monorepo structure with tests in `apps/web`. Vitest and `@vitest/coverage-v8` handle testing and coverage reports. Vitest is configured to run tests over all files via `pnpm -w run test`. Coverage for specific files requires installing the dependencies properly. The `offlineSync.ts` file initially had zero testing for its core offline sync behaviour.
**Action:** When adding tests in `apps/web/utils`, always write complete test suites using `vitest` covering all logical branches. We added 100% test coverage to `offlineSync.ts`.

## 2024-07-10 - Math.random in Vite environment
**Learning:** Testing functions that rely on Math.random() to generate strings via toString(36) requires careful mocking. Mocking Math.random() with a static float requires verifying that the output matches standard javascript float-to-string implementation. Otherwise strict equality assertions fail, as seen in generateStampReceipt.
**Action:** When testing ID generation logic dependent on math random, verify the mocked output manually before applying it in the test assertion.
## 2024-07-11 - Vitest Coverage All Option
**Learning:** Vitest v4.1.6 in this codebase will throw a CACError if you use `--coverage --all`. You must instead use `--coverage.all=true` to properly report coverage for isolated files not directly imported by tests.
**Action:** Always use `--coverage.all=true` when needing full project coverage reports to find completely untested files.
