## 2024-05-19 - Consolidated Privacy and Terms Modals
**Learning:** Found two nearly identical modal components (PrivacyModal.tsx and TermsModal.tsx) duplicating the entire dialog, backdrop, layout, and animation markup.
**Action:** Created a reusable `TextModal` component for generic text/policy popups.
## 2026-07-17 - Refactor invoice sequence date parsing

**Learning:** Extracted duplicated date parsing logic (getting current year and padded month string) across multiple functions into a single source of truth (`getCurrentYearAndMonth`) in `apps/web/utils/invoiceSequence.ts`. Also learned that it's critical to scope refactoring strictly and to ignore unrelated pre-existing test/lint failures.
**Action:** Apply next time by looking for similar repeated date string formats across related functions, extracting them, and remaining disciplined in ignoring out-of-scope errors during verifications.
