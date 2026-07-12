# Argus Journal - Observability Learnings

This journal tracks critical observability learnings for InvoiceApp.ng.

## 2025-05-14 - Initial Scan
**Learning:** Initializing Argus journal.
**Action:** Starting scan for silent failures and missing instrumentation.

## 2025-05-14 - Unmonitored Offline Sync Engine
**Learning:** The Offline-First Sync Engine (`utils/offlineSync.ts`) relied strictly on local `console.log` and `console.error` for its operations. This created a production blind spot where synchronization failures (e.g., Firestore permission issues, quota limits, or data validation errors) were invisible to developers unless they manually inspected a specific user's browser console.
**Action:** Instrumented `queueMutation` and `flushQueue` with structured `trackEvent` calls to capture sync health, failure rates, and error context in production analytics.

## 2025-05-14 - Monetization Funnel Observability & Privacy Constraints
**Learning:** The monetization funnel in `apps/web/context/AuthContext.tsx` had significant observability gaps. First, critical payment events (`upgrade_initiated`, `payment_success`) were tracking raw user emails (PII), which violates privacy constraints for structured logging. Second, silent failure paths existed: a) database write failures after successful payments were swallowed with only a generic `console.error` and no telemetry; b) user cancellations during the Paystack iframe process were untracked; and c) Paystack setup initialization errors were silently caught and hidden from production metrics. This created blind spots in diagnosing conversion drop-offs and backend sync failures.
**Action:** Replaced PII (`user.email`) with anonymized identifiers (`user_id: user.uid`) in existing tracking. Instrumented silent failure paths (`payment_upgrade_save_failed`, `payment_cancelled`, `payment_error_callback`) with structured `trackEvent` calls to gain full visibility into the payment lifecycle without altering business logic. Ensure future telemetry avoids PII and covers failure branches.

## 2024-05-24 - Unmonitored Database Writes Post-Payment Callback
**Learning:** Found a critical silent failure pattern specific to this codebase's monetization funnel. After a successful Paystack payment callback (`payment_success`), the subsequent Firestore database write to upgrade the user's plan state can fail. The original catch block swallowed this with just a generic `console.error`, meaning a user could be charged but not granted upgraded status, with no telemetry emitted.
**Action:** Always emit a structured failure event (like `payment_upgrade_save_failed`) containing the `user_id`, `ref`, and `error` details whenever a system state update fails after a successful third-party financial callback. This allows support to proactively trace and manually resolve state mismatches.

## 2025-05-14 - Auth Telemetry Convention
**Learning:** Found a specific logging schema and field naming convention used by this team consistently for `trackEvent` calls, particularly in `AuthContext.tsx`. These calls are wrapped in an empty `try/catch` to ensure telemetry failures never crash the app. Fields always use `snake_case` (e.g., `user_id`, `plan_type`), and errors are explicitly stringified (`String(error)`). PII is avoided in favor of UUIDs.
**Action:** When adding observability metrics to existing systems, explicitly wrap `trackEvent` in `try/catch {}` blocks to preserve system resilience, and stick strictly to the established `snake_case` naming and `String(error)` serialization pattern.
