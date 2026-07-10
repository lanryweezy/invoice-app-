# Argus Journal - Observability Learnings

This journal tracks critical observability learnings for InvoiceApp.ng.

## 2025-05-14 - Initial Scan
**Learning:** Initializing Argus journal.
**Action:** Starting scan for silent failures and missing instrumentation.

## 2025-05-14 - Unmonitored Offline Sync Engine
**Learning:** The Offline-First Sync Engine (`utils/offlineSync.ts`) relied strictly on local `console.log` and `console.error` for its operations. This created a production blind spot where synchronization failures (e.g., Firestore permission issues, quota limits, or data validation errors) were invisible to developers unless they manually inspected a specific user's browser console.
**Action:** Instrumented `queueMutation` and `flushQueue` with structured `trackEvent` calls to capture sync health, failure rates, and error context in production analytics.

## 2024-05-24 - Unmonitored Database Writes Post-Payment Callback
**Learning:** Found a critical silent failure pattern specific to this codebase's monetization funnel. After a successful Paystack payment callback (`payment_success`), the subsequent Firestore database write to upgrade the user's plan state can fail. The original catch block swallowed this with just a generic `console.error`, meaning a user could be charged but not granted upgraded status, with no telemetry emitted.
**Action:** Always emit a structured failure event (like `payment_upgrade_save_failed`) containing the `user_id`, `ref`, and `error` details whenever a system state update fails after a successful third-party financial callback. This allows support to proactively trace and manually resolve state mismatches.
