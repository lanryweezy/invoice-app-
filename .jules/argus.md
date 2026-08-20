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

## 2024-10-24 - Structured logging in offline sync batch failures
**Learning:** Batch sync operations were failing with an unstructured log (`console.error('Sync failed:', error)`), omitting the critical business context like `userId` and `pendingCount`. This made it impossible to trace offline failure trends by user or understand the scale of the dropped batches in production.
**Action:** When catching errors during batch synchronization loops (like Firestore `batch.commit()`), use a structured `console.error` payload `{ event, userId, pendingCount, error }` and track an associated analytics event wrapped safely in a try/catch block.
## 2024-10-25 - Import Requirements for Observability Wrappers\n**Learning:** Adding new calls to `trackEvent` (or any telemetry wrapper) in existing catch blocks requires explicitly checking and importing the utility if it wasn't previously used in the file, otherwise the build will break with ReferenceErrors.\n**Action:** Always verify imports at the top of the file before inserting calls to observability functions.
## 2024-10-25 - Updating test assertions for structured logging
**Learning:** When modifying `console.error` calls to use structured JSON contexts instead of unstructured strings, existing test assertions (e.g., using `expect(consoleSpy).toHaveBeenCalledWith`) will fail unless they are also updated to expect the new object structure.
**Action:** Always update corresponding tests using `expect.objectContaining(...)` to match the structured log payload and prevent regressions.
## 2024-03-24 - Structured logging in Rev360 API failures\n**Learning:** The `apps/web/services/rev360Api.ts` API client was catching fetch failures and returning generic  payloads without logging the error, making it impossible to diagnose third-party integration issues in production. Furthermore, the `checkCompliance` endpoint handles TINs (Tax Identification Numbers) which must be masked to prevent PII exposure in logs.\n**Action:** When adding observability to API catch blocks, always include an event name, relevant parameters, and a structured error using `getErrorMessage`. Explicitly mask sensitive IDs like TINs (`***${tin.slice(-4)}`) before including them in the log context.

## 2024-03-24 - Structured logging in Rev360 API failures
**Learning:** The `apps/web/services/rev360Api.ts` API client was catching fetch failures and returning generic `{ success: false }` payloads without logging the error, making it impossible to diagnose third-party integration issues in production. Furthermore, the `checkCompliance` endpoint handles TINs (Tax Identification Numbers) which must be masked to prevent PII exposure in logs.
**Action:** When adding observability to API catch blocks, always include an event name, relevant parameters, and a structured error using `getErrorMessage`. Explicitly mask sensitive IDs like TINs (`***${tin.slice(-4)}`) before including them in the log context.
## 2024-10-25 - Structured logging in local storage load failures
**Learning:** React state initializers were catching parsing or loading errors from local storage with unstructured logs (`console.error('Failed to load initial expenses', e)`). This made it impossible to trace the rate of corrupted offline state on client devices.
**Action:** When adding observability telemetry using `trackEvent` for state initialization failures in frontend code, always include a structured log with `{ event, error }` and a `trackEvent` inside an empty `try/catch` block.
