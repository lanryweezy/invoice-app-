## 2026-08-08 - Payment Method Strategy
**Learning:** Hardcoded arrays for configuration lists like Payment Methods create duplication across UI components.
**Action:** Introduced a generic `PaymentMethodStrategy` registry to centralize available options. Future features can extend options by calling `registerPaymentMethod` instead of editing individual select inputs.
