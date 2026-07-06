# Argus Journal - Observability Learnings

This journal tracks critical observability learnings for InvoiceApp.ng.

## 2025-05-14 - Initial Scan
**Learning:** Initializing Argus journal.
**Action:** Starting scan for silent failures and missing instrumentation.

## 2025-05-14 - Unmonitored Offline Sync Engine
**Learning:** The Offline-First Sync Engine (`utils/offlineSync.ts`) relied strictly on local `console.log` and `console.error` for its operations. This created a production blind spot where synchronization failures (e.g., Firestore permission issues, quota limits, or data validation errors) were invisible to developers unless they manually inspected a specific user's browser console.
**Action:** Instrumented `queueMutation` and `flushQueue` with structured `trackEvent` calls to capture sync health, failure rates, and error context in production analytics.
