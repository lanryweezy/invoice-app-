## 2024-07-06 - Test Coverage in InvoiceApp Monorepo
**Learning:** This repo has a monorepo structure with tests in `apps/web`. Vitest and `@vitest/coverage-v8` handle testing and coverage reports. Vitest is configured to run tests over all files via `pnpm -w run test`. Coverage for specific files requires installing the dependencies properly. The `offlineSync.ts` file initially had zero testing for its core offline sync behaviour.
**Action:** When adding tests in `apps/web/utils`, always write complete test suites using `vitest` covering all logical branches. We added 100% test coverage to `offlineSync.ts`.

## 2024-07-08 - Pure Service Function Testing Pattern
**Learning:** Pure business logic functions (like those in `taxCalculator.ts`) may completely lack test coverage despite being critical paths. These are high-value, easy-to-test targets that require no mocking. Running `pnpm -w run test` may not run `apps/web` tests if `apps/web/package.json` is missing the `test` script, so tests in `apps/web` must be run via `cd apps/web && npx vitest run`.
**Action:** When testing pure functions, aim for 100% coverage immediately, covering missing edge cases like unknown parameter values (e.g. `unknown` WHT types), and ensure assertions handle JS floating-point precision logic properly if present.
