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

## 2024-05-24 - Network Level API Telemetry
**Learning:** Found an observability blind spot in `apps/web/services/apiConfig.ts` where fundamental network errors (e.g., DNS resolution failures) and request timeouts (`AbortError`) bypassed the standard HTTP fetch error logging path. The catch block only threw the `NrsApiError` without tracking the network failure event, causing these issues to be invisible in production analytics.
**Action:** Always capture latency and emit a log entry (or `trackEvent`) with synthetic status codes (`0` for network failures, `408` for timeouts) before re-throwing errors in API wrappers to ensure that total API availability, including network-level drops, is measurable.

## 2025-05-14 - Data Destruction via Silent Read Failures
**Learning:** Found a dangerous failure mode in offline-first synchronization architectures (`useInvoice`, `useExpenses`, `useReceipts`). When a remote cloud read (`loadCloudData`) silently fails (e.g., due to Firestore permission drop or network interruption) and only logs a generic `console.error`, the application proceeds with a clean, empty local state. If the user then performs any action that triggers a `syncToCloud` write, that empty local state is pushed to the server, silently overwriting and destroying the existing cloud data without generating any failure telemetry.
**Action:** Telemetry for synchronization read failures (`cloud_data_load_failed`) must be treated as critically as write failures, as read failures in offline-first systems are the direct precursor to silent data destruction.
## 2026-07-17 - Silent Data Degradation on API Failure
**Learning:** When falling back to hardcoded data after a failed native fetch request (e.g., in apps/web/utils/exchangeRates.ts), silent data degradation occurs without telemetry. The application continues functioning, but users receive potentially stale fallback data.
**Action:** Explicitly emit telemetry (e.g., trackEvent wrapped in a defensive try/catch block) when falling back to hardcoded data to ensure silent data degradation remains visible in production metrics.
