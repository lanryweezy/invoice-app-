## 2024-03-24 - Frontend Telemetry Isolation
**Learning:** In the frontend React application (`apps/web`), calls to `trackEvent` for analytics tracking must be resilient to prevent telemetry failures from breaking core application logic.
**Action:** When adding observability telemetry using `trackEvent` in the frontend code, always wrap the invocation in an empty `try/catch` block (e.g., `try { trackEvent(...) } catch {}`) to swallow telemetry errors and preserve the control flow.

## 2024-05-24 - Add structured context to push notification failures
**Learning:** Unstructured string error logs in push notification failures (e.g., `console.error('Push notification failed:', error)`) omitted the `userId` context, making it impossible to trace which user missed a push notification or investigate token registration issues for a specific user in production.
**Action:** Ensure `console.error` logs in background jobs and cloud functions use the structured log pattern `{ event, userId, errorCode, errorMessage }` to maintain queryability and context.
