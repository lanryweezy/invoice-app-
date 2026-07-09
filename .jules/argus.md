# Argus Journal - Observability Learnings

This journal tracks critical observability learnings for InvoiceApp.ng.

## 2025-05-14 - Initial Scan
**Learning:** Initializing Argus journal.
**Action:** Starting scan for silent failures and missing instrumentation.

## 2025-05-14 - Unmonitored Offline Sync Engine
**Learning:** The Offline-First Sync Engine (`utils/offlineSync.ts`) relied strictly on local `console.log` and `console.error` for its operations. This created a production blind spot where synchronization failures (e.g., Firestore permission issues, quota limits, or data validation errors) were invisible to developers unless they manually inspected a specific user's browser console.
**Action:** Instrumented `queueMutation` and `flushQueue` with structured `trackEvent` calls to capture sync health, failure rates, and error context in production analytics.

## 2025-05-14 - Silent Failure in Monetization Funnel
**Learning:** A successful Paystack payment that failed to save the upgraded status to the Firestore database (e.g., due to network drop or permission issue) would silently log a console error and leave the user un-upgraded without triggering a business-level alert. This hid real bugs where users were charged but didn't receive Pro status.
**Action:** Always add structured error logs or metric events (like `payment_upgrade_save_failed`) to database write operations that occur *after* a third-party success callback in monetization or billing flows.
