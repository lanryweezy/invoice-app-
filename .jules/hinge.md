## 2026-08-08 - Payment Method Strategy
**Learning:** Hardcoded arrays for configuration lists like Payment Methods create duplication across UI components.
**Action:** Introduced a generic `PaymentMethodStrategy` registry to centralize available options. Future features can extend options by calling `registerPaymentMethod` instead of editing individual select inputs.
## 2026-08-08 - Status Color Strategy
**Learning:** The CLI status colors were hardcoded in a switch statement, making it difficult to style newly added custom invoice statuses.
**Action:** Replaced the hardcoded `switch` block in `getStatusColor` with a `StatusColorStrategy` registry that maps lowercase status strings to a colored string generator function, allowing statuses to be styled dynamically.
