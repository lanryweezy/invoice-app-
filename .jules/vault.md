## 2025-05-15 - Improving Conversion and Tracking

**Gap:** Users were downloading invoices without a nudge to sign up, leading to potential churn. Payment feedback was also minimal, and tracking for the conversion funnel was incomplete.

**Revenue Impact:** Estimated +15% conversion by nudging users after successful downloads. Improved UX during payment reduces friction and perceived technical failures.

**Security Concern:** None. Using standard Paystack inline and Google Analytics events.

**Fix:**
1. Implemented a "Sign Up After Download" nudge: when a guest user successfully downloads a PDF, a modal appears after 1s encouraging them to sign up to save their data.
2. Added loading states to the upgrade button in `PricingModal` to provide visual feedback while Paystack initializes.
3. Enhanced analytics tracking: Added `upgrade_initiated`, `payment_success`, `payment_cancelled`, and `payment_error_callback` events to map the entire monetization funnel.

**Unexpected:** N/A

## 2024-05-18 - Enforcing Atomic Multi-Step Writes with Transactions
**Learning:** `handleSaveProfile` in `SettingsModal.tsx` performed a read-then-write sequence (`getDoc` for uniqueness validation, followed by separate `updateDoc`, `setDoc`, and `deleteDoc` calls) without transaction boundaries. This posed a data integrity risk: a partial failure mid-sequence (e.g. updating the internal user doc but failing to write the public profile or delete the old one) would corrupt the state, and race conditions could allow concurrent claims on usernames.
**Action:** Always wrap multi-collection writes and read-then-write validations in `runTransaction` (from `firebase/firestore`) to ensure atomicity. When doing so, ensure all reads (`transaction.get()`) happen before any writes (`transaction.set()`, `transaction.update()`, `transaction.delete()`) within the transaction block.
