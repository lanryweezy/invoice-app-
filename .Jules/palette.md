## 2024-05-13 - [Accessibility Pass: Modal Controls]
**Learning:** Found several icon-only controls for closing modals or deleting entries across multiple components (AuthModal, SettingsModal, PaymentModal, BranchesManager, etc.) lacking accessible text names. This prevents screen reader users from understanding the button purpose.
**Action:** When adding icon-only SVG buttons in React for core interactions (Close, Delete, Remove), ensure `aria-label` is always included by default.

## 2024-05-14 - [Accessibility Pass: Icon Button Interaction Polish]
**Learning:** Adding screen reader accessibility (`aria-label`) to icon buttons is good, but UX isn't just about screen readers. The "Remove expense" button was inaccessible to keyboard users (no focus states) and lacked a mouse hover tooltip (`title`). The tap target was also too small, which was improved by adding `p-1`. When updating icon buttons, addressing interaction patterns across all input methods (mouse, keyboard, touch, screen reader) at once yields a more complete UX win.
**Action:** Always check the holistic UX state of icon buttons (tooltip, focus state, tap target, accessible name) rather than just fixing `aria-label` alone.
