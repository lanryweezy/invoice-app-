1. **Identify the missing context observability gap**: In `apps/web/services/pushNotifications.ts`, when push subscription/unsubscription fails, the current logging is unstructured and missing critical context (`userId`), e.g., `console.error('Failed to subscribe:', error);`. This causes silent/opaque failures where support cannot link a subscription failure to the user experiencing the issue.
2. **Update logging in `pushNotifications.ts`**: Replace unstructured `console.error` logs with structured ones containing context (`userId`, `error`) and use `trackEvent` for analytics tracking of these failures.
3. **Write/update tests**: Update `apps/web/services/pushNotifications.test.ts` to assert that `console.error` and `trackEvent` are called with the correct structured payload.
4. **Run Tests & Verify**: Run `pnpm test` (with vitest) to verify that the tests for `pushNotifications.ts` pass and nothing is broken.
5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
6. **Submit PR**.
