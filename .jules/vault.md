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
## 2024-05-19 - Enforcing field immutability and enum constraints in Firestore rules
**Learning:** Adding validation at the application layer is insufficient if direct database writes or optimistic UI updates can bypass it. For document-based NoSQL like Firestore, property-level enum checks (e.g. `request.resource.data.plan in ['free', 'pro']`) and field immutability constraints (e.g., `request.resource.data.uid == resource.data.uid`) must be explicitly enforced in `firestore.rules` to prevent data corruption.
**Action:** Always enforce property-level constraints directly within `firestore.rules` to prevent application layer bugs from bypassing validation and corrupting schema.
