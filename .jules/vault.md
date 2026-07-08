## 2025-05-15 - Improving Conversion and Tracking

**Gap:** Users were downloading invoices without a nudge to sign up, leading to potential churn. Payment feedback was also minimal, and tracking for the conversion funnel was incomplete.

**Revenue Impact:** Estimated +15% conversion by nudging users after successful downloads. Improved UX during payment reduces friction and perceived technical failures.

**Security Concern:** None. Using standard Paystack inline and Google Analytics events.

**Fix:**
1. Implemented a "Sign Up After Download" nudge: when a guest user successfully downloads a PDF, a modal appears after 1s encouraging them to sign up to save their data.
2. Added loading states to the upgrade button in `PricingModal` to provide visual feedback while Paystack initializes.
3. Enhanced analytics tracking: Added `upgrade_initiated`, `payment_success`, `payment_cancelled`, and `payment_error_callback` events to map the entire monetization funnel.

**Unexpected:** N/A
## 2026-07-08 - Atomic Profile Updates
**Learning:** In Firestore, read-then-write validations (like checking if a username is already taken by another user) followed by multi-document writes (updating the user doc, setting the public profile, and optionally deleting the old public profile) are highly susceptible to race conditions and partial failures if executed sequentially. Wrapping these operations in `runTransaction` ensures atomicity. Note that Firestore requires all `transaction.get()` reads to happen before any writes (`transaction.set()`, `transaction.update()`, `transaction.delete()`) within the transaction block.
**Action:** Always use `runTransaction` when a write depends on a preceding read validation, and ensure all reads are grouped at the beginning of the transaction callback.
