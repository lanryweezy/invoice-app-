## 2024-05-19 - Consolidated Privacy and Terms Modals
**Learning:** Found two nearly identical modal components (PrivacyModal.tsx and TermsModal.tsx) duplicating the entire dialog, backdrop, layout, and animation markup.
**Action:** Created a reusable `TextModal` component for generic text/policy popups.
