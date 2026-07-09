## 2025-05-15 - Improving Conversion and Tracking

**Gap:** Users were downloading invoices without a nudge to sign up, leading to potential churn. Payment feedback was also minimal, and tracking for the conversion funnel was incomplete.

**Revenue Impact:** Estimated +15% conversion by nudging users after successful downloads. Improved UX during payment reduces friction and perceived technical failures.

**Security Concern:** None. Using standard Paystack inline and Google Analytics events.

**Fix:**
1. Implemented a "Sign Up After Download" nudge: when a guest user successfully downloads a PDF, a modal appears after 1s encouraging them to sign up to save their data.
2. Added loading states to the upgrade button in `PricingModal` to provide visual feedback while Paystack initializes.
3. Enhanced analytics tracking: Added `upgrade_initiated`, `payment_success`, `payment_cancelled`, and `payment_error_callback` events to map the entire monetization funnel.

**Unexpected:** N/A
## 2026-07-09 - Atomic Profile Updates
**Learning:** The previous implementation for claiming public profiles performed sequential read/writes (`getDoc` then `updateDoc` / `setDoc`), leading to race conditions where two users could claim the same username simultaneously. Replacing these operations with Firestore's `runTransaction` ensures the uniqueness check and the subsequent document creations/deletions occur atomically.
**Action:** Use `runTransaction` for multi-document operations that depend on read-time conditions, particularly for enforcing global uniqueness in NoSQL databases.
