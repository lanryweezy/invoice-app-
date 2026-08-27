## 2024-11-20 - Ensure invisible interactive elements have focus visibility
**Learning:** Hiding secondary action buttons via `opacity-0` and showing them on `group-hover:opacity-100` completely breaks keyboard navigation because they receive focus but remain invisible.
**Action:** When using this pattern, always pair it with `focus:opacity-100` or `focus-visible:opacity-100` so the element becomes fully visible when navigated via keyboard.

## 2024-08-15 - ARIA and Focus Visibility on Icon-Only Dialog Actions
**Learning:** Icon-only close buttons in dialog panels often lack descriptive `aria-label`s and proper focus indicators, hindering screen reader users and keyboard navigation. Using `aria-labelledby` on the dialog container linked to the header's `id` significantly improves context for screen readers.
**Action:** When implementing or updating modal/dialog components, always verify the dialog container has `aria-labelledby`, and ensure icon-only buttons have descriptive `aria-label`s along with explicit `focus-visible` styles using the design system's focus utility classes.

## 2025-03-05 - Focus Visible for Collapsible Sections
**Learning:** Collapsible accordion buttons that control layout elements (like `<CollapsibleSection>` in InvoiceForm) frequently lack keyboard focus indicators (`focus-visible`) despite being primary interactive targets. Standard Tailwind pseudo-classes like `hover:bg-slate-50` exist, but keyboard navigation (Tab) relies heavily on `focus-visible` styles to be accessible.
**Action:** When adding or auditing complex interactive components (like custom accordions or side-panels), always ensure the root interactive element (usually `<button>`) explicitly includes `focus:outline-none focus-visible:ring-2` (and optionally `focus-visible:ring-inset` if `overflow-hidden` is applied on the parent) to maintain keyboard accessibility parity with mouse interactions.
## 2024-03-24 - Ensure keyboard focus visibility and aria-modal on common dialogs
**Learning:** Common dialogs like PricingModal and SidePanel often lack essential focus rings on secondary buttons (like 'Maybe Later') and the `aria-modal="true"` attribute on elements with `role="dialog"`, respectively, making keyboard navigation and screen reader experiences subpar.
**Action:** Always verify that all interactive elements, especially secondary actions, have explicit `focus-visible` styles and that dialog containers implement the correct ARIA attributes for modal behavior.
