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
## 2024-05-18 - Prevent silent data destruction during user doc initialization
**Learning:** A non-atomic read-then-write sequence (`getDoc` followed by `setDoc`) during user document initialization allows offline data accumulated before the check to be overwritten if it syncs in between the get and set.
**Action:** Always wrap user document initialization in a `runTransaction` and use `{ merge: true }` in `transaction.set` to preserve concurrently accumulated fields.
## 2024-06-25 - Enum constraints and immutability in firestore.rules
**Learning:** Firestore documents can easily be corrupted by optimistic UI updates bypassing rules if strict property-level constraints are absent. Even if the application logic correctly assumes an enum like `plan in ['free', 'pro']` or immutability of fields like `uid` and `username` in a profile, failing to enforce this explicitly in `firestore.rules` allows arbitrary string injection or ownership transfer.
**Action:** Always enforce enum-like constraints for critical fields (`request.resource.data.field in [...]`) and lock down fields that should never change during an update (`request.resource.data.field == resource.data.field`) directly within `firestore.rules`.
