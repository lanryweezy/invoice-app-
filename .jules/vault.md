## 2025-05-15 - Improving Conversion and Tracking

**Gap:** Users were downloading invoices without a nudge to sign up, leading to potential churn. Payment feedback was also minimal, and tracking for the conversion funnel was incomplete.

**Revenue Impact:** Estimated +15% conversion by nudging users after successful downloads. Improved UX during payment reduces friction and perceived technical failures.

**Security Concern:** None. Using standard Paystack inline and Google Analytics events.

**Fix:**
1. Implemented a "Sign Up After Download" nudge: when a guest user successfully downloads a PDF, a modal appears after 1s encouraging them to sign up to save their data.
2. Added loading states to the upgrade button in `PricingModal` to provide visual feedback while Paystack initializes.
3. Enhanced analytics tracking: Added `upgrade_initiated`, `payment_success`, `payment_cancelled`, and `payment_error_callback` events to map the entire monetization funnel.

**Unexpected:** N/A
## 2024-06-18 - Atomic Multi-Document Writes in Firestore
**Learning:** When performing multi-step write operations in Firestore (like creating a new document, updating another, and deleting an old one based on the new one's state) alongside read-then-write validations (like checking for username uniqueness), these operations must be wrapped in a `runTransaction` to ensure atomicity. Failing to do so can lead to partial state corruption (e.g., updating the internal user document but failing to create the public profile document) or race conditions during uniqueness checks.
**Action:** Always use `runTransaction` or `writeBatch` from `firebase/firestore` when executing multiple interdependent document writes, especially when the writes depend on a prior read validation (like global uniqueness).

## 2026-07-11 - Prevent Data Overwrite on User Creation via Transaction
**Learning:** Initializing user documents in Firestore with a read-then-write sequence (`getDoc` then `setDoc` without `{ merge: true }`) is unsafe. Concurrent background operations (like offline sync flushes) may create partial documents in the brief window between the read and the write. Using a standard `setDoc` without a merge in this scenario will silently destroy the concurrently written data.
**Action:** Always wrap initial document creation logic that relies on a "does it exist" check in a Firestore `runTransaction`. Furthermore, always pass `{ merge: true }` when setting the fallback default state to ensure that even within a transaction, any concurrently accumulated offline fields are preserved.
