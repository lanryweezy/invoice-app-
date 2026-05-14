## 2024-05-13 - [Accessibility Pass: Modal Controls]
**Learning:** Found several icon-only controls for closing modals or deleting entries across multiple components (AuthModal, SettingsModal, PaymentModal, BranchesManager, etc.) lacking accessible text names. This prevents screen reader users from understanding the button purpose.
**Action:** When adding icon-only SVG buttons in React for core interactions (Close, Delete, Remove), ensure `aria-label` is always included by default.
