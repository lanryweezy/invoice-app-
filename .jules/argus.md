## 2026-07-18 - Added telemetry to silent network failures in Rev360 API calls
**Learning:** The `fetchWithTimeout` wrapper silently caught `AbortError` and generic network failures inside its `try/finally` mechanism (without `catch`) because the inner native `fetch` rejected on network failure, which cascaded to the outer `catch` blocks of each endpoint method. Those outer blocks simply returned an unstructured string message `(error as Error).message` instead of logging the failure, effectively swallowing network/timeout errors for business-critical external API calls.
**Action:** When wrapping native `fetch`, explicitly catch the error inside the wrapper to emit telemetry (using synthetic status codes like `408` or `0`) before rethrowing or returning.

## 2026-07-21 - Swallowed localforage IndexedDB read errors on app startup
**Learning:** `getQueueCount()` had an empty catch block that silently returned 0 when reading from IndexedDB `localforage`. This made initialization errors and database corruption completely invisible on app startup, leading developers to believe the queue was empty rather than inaccessible.
**Action:** Always add structured logging (with error payload and event tracking) to storage read operations that serve as fallbacks or startup checks, as silent defaults mask underlying infrastructure failures.

## 2026-07-22 - Swallowed invoice sequence generation errors
**Learning:** `getCurrentSequence()` silently returned 0 on `localStorage.getItem` or JSON parsing errors. This caused all new invoices for affected users to reset to sequence 1 (e.g., `INV-2023-10-0001`), leading to duplicate invoice numbers without leaving any trace of why the sequence reset occurred.
**Action:** Always capture and log exceptions explicitly in fallback logic for local storage reads to expose underlying initialization failures.
## 2026-08-04 - Silent Failure in Batch Email Sending
**Learning:** The batch invoice command silently swallowed email sending errors, making it impossible to diagnose failures in production without modifying the code. It is also important to use identifiers like invoiceId and invoiceNumber instead of PII like client email addresses when logging these failures.
**Action:** Add structured console.error logs with relevant entity IDs and error messages to catch blocks that previously swallowed errors.
