## 2024-05-13 - [Accessibility Pass: Modal Controls]
**Learning:** Found several icon-only controls for closing modals or deleting entries across multiple components (AuthModal, SettingsModal, PaymentModal, BranchesManager, etc.) lacking accessible text names. This prevents screen reader users from understanding the button purpose.
**Action:** When adding icon-only SVG buttons in React for core interactions (Close, Delete, Remove), ensure `aria-label` is always included by default.

## 2024-05-14 - [Accessibility Pass: Icon Button Interaction Polish]
**Learning:** Adding screen reader accessibility (`aria-label`) to icon buttons is good, but UX isn't just about screen readers. The "Remove expense" button was inaccessible to keyboard users (no focus states) and lacked a mouse hover tooltip (`title`). The tap target was also too small, which was improved by adding `p-1`. When updating icon buttons, addressing interaction patterns across all input methods (mouse, keyboard, touch, screen reader) at once yields a more complete UX win.
**Action:** Always check the holistic UX state of icon buttons (tooltip, focus state, tap target, accessible name) rather than just fixing `aria-label` alone.

## 2024-05-18 - [Accessibility Pass: Form Label Associations]
**Learning:** In React components with multiple inputs (like modals and forms), it's a common oversight to style `label` elements correctly but forget to explicitly associate them with their respective `input` elements using `htmlFor` and `id`. This not only impacts screen readers which fail to announce the label when the input is focused, but also degrades mouse/touch UX as clicking the label does not focus the input.
**Action:** When creating or reviewing form inputs, always verify that `label` tags include an `htmlFor` attribute that matches a unique `id` on the corresponding input field, particularly in reusable modals or dynamic forms.
## 2024-05-24 - Isolated Forms without Label Associations
**Learning:** In simple, isolated admin views (like `AccountingDashboard` or `BranchesManager`), forms were built using standard `<input>` tags but lacked semantic connection to their preceding text strings because they weren't wrapped in a `<label>` or using `htmlFor`/`id` bindings. This made clicking the label text unreactive, shrinking the touch target area, and making them inaccessible to screen readers.
**Action:** When working on generic configuration forms that don't use shared custom components (like `<InputField />`), ensure manual `id` and `htmlFor` pairings are added, along with basic focus rings for keyboard navigation.
