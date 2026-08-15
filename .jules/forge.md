## 2025-01-20 - Fix missing error formatter mock in pushNotifications.test.ts
**Learning:** `pushNotifications.ts` recently started using `getErrorMessage` to properly format caught errors before tracking or logging them, but the testing suite `pushNotifications.test.ts` was never updated to provide a mock implementation for it. Because of this, testing error branches resulted in an unhandled ReferenceError.

**Action:** Added mock implementation of `getErrorMessage` which resolves ReferenceError and allows testing error handling branches for full code coverage in `pushNotifications.ts`
