## 2026-08-08 - Payment Method Strategy
**Learning:** Hardcoded arrays for configuration lists like Payment Methods create duplication across UI components.
**Action:** Introduced a generic `PaymentMethodStrategy` registry to centralize available options. Future features can extend options by calling `registerPaymentMethod` instead of editing individual select inputs.
## 2026-08-08 - Status Color Strategy
**Learning:** The CLI status colors were hardcoded in a switch statement, making it difficult to style newly added custom invoice statuses.
**Action:** Replaced the hardcoded `switch` block in `getStatusColor` with a `StatusColorStrategy` registry that maps lowercase status strings to a colored string generator function, allowing statuses to be styled dynamically.
## 2024-08-13 - Extracted tax report output formats into a strategy pattern
**Learning:** The CLI's `tax-report.ts` command used a hard-coded `if (options.format === 'csv')` block that would require modifying the core logic to add new formats like XML or YAML. I extracted this into a `TaxReportOutputStrategy` registry pattern to make it strictly additive for consumers.
**Action:** When I encounter `if-else` or `switch` blocks handling different formatting types, I should refactor them into a strategy/registry pattern using an interface and map to ensure the core is closed for modification but open for extension.
