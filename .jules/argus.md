## 2024-03-24 - Frontend Telemetry Isolation
**Learning:** In the frontend React application (`apps/web`), calls to `trackEvent` for analytics tracking must be resilient to prevent telemetry failures from breaking core application logic.
**Action:** When adding observability telemetry using `trackEvent` in the frontend code, always wrap the invocation in an empty `try/catch` block (e.g., `try { trackEvent(...) } catch {}`) to swallow telemetry errors and preserve the control flow.

## 2024-05-24 - Add structured context to push notification failures
**Learning:** Unstructured string error logs in push notification failures (e.g., `console.error('Push notification failed:', error)`) omitted the `userId` context, making it impossible to trace which user missed a push notification or investigate token registration issues for a specific user in production.
**Action:** Ensure `console.error` logs in background jobs and cloud functions use the structured log pattern `{ event, userId, errorCode, errorMessage }` to maintain queryability and context.

## 2024-08-09 - Missing Observability in NIBSS Payment Integration
**Learning:** The payment initiation and status check methods (`apps/web/services/nibssApi.ts`) were catching API and network errors, but only logging plain string errors without business context (like `invoiceId` or `transactionId`). Additionally, they were completely skipping analytics event tracking for failures in production.
**Action:** Always ensure critical integration wrappers (like payment gateways) log structured metadata alongside errors and utilize existing application-wide telemetry (`trackEvent`) so operations have visibility. Wrap telemetry calls in empty `try...catch` blocks to protect business logic.

## 2024-08-10 - Masking TINs in Telemetry and Logs
**Learning:** TINs (Tax Identification Numbers) are highly sensitive Personally Identifiable Information (PII) equivalent to a SSN for many businesses. When modifying `apps/web/services/nrsApi.ts`, logging the raw TIN in structured payloads (`console.error`) or passing it to external analytics (`trackEvent`) represents a major compliance and security risk.
**Action:** Always safely mask sensitive IDs (e.g., `const maskedTin = tin ? \`***\${tin.slice(-4)}\` : 'unknown'`) or omit them completely when enriching logs to prevent data exposure.
## 2026-08-11 - Swallowed sync failures
**Learning:** An empty catch block in the `offlineSync` service was swallowing granular sync errors and masking the reasons for failure, reducing visibility during offline operations.
**Action:** Always include a `console.error` with structured contextual data (and consider attaching a `trackEvent` wrapped in a try/catch) inside catch blocks that process critical batch or synchronization operations.
