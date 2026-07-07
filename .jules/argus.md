# Argus Journal - Observability Learnings

This journal tracks critical observability learnings for InvoiceApp.ng.

## 2025-05-14 - Initial Scan
**Learning:** Initializing Argus journal.
**Action:** Starting scan for silent failures and missing instrumentation.

## 2025-05-14 - Unmonitored Offline Sync Engine
**Learning:** The Offline-First Sync Engine (`utils/offlineSync.ts`) relied strictly on local `console.log` and `console.error` for its operations. This created a production blind spot where synchronization failures (e.g., Firestore permission issues, quota limits, or data validation errors) were invisible to developers unless they manually inspected a specific user's browser console.
**Action:** Instrumented `queueMutation` and `flushQueue` with structured `trackEvent` calls to capture sync health, failure rates, and error context in production analytics.

## 2025-05-14 - Missing Monetization Funnel Signals
**Learning:** The Paystack integration in `AuthContext.tsx` lacked critical analytics events for the monetization funnel (`payment_cancelled`, `payment_error_callback`) and swallowed Firestore save errors after a successful charge. This created a silent failure pattern where successful payments were not reflected in the user's plan state without raising an actionable production error.
**Action:** Instrument Paystack's `onClose` and error paths, and add structured tracking to the `.catch()` block when saving the upgraded plan state to Firebase.
