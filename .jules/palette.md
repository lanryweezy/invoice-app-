## 2024-11-20 - Ensure invisible interactive elements have focus visibility
**Learning:** Hiding secondary action buttons via `opacity-0` and showing them on `group-hover:opacity-100` completely breaks keyboard navigation because they receive focus but remain invisible.
**Action:** When using this pattern, always pair it with `focus:opacity-100` or `focus-visible:opacity-100` so the element becomes fully visible when navigated via keyboard.

## 2024-08-15 - ARIA and Focus Visibility on Icon-Only Dialog Actions
**Learning:** Icon-only close buttons in dialog panels often lack descriptive `aria-label`s and proper focus indicators, hindering screen reader users and keyboard navigation. Using `aria-labelledby` on the dialog container linked to the header's `id` significantly improves context for screen readers.
**Action:** When implementing or updating modal/dialog components, always verify the dialog container has `aria-labelledby`, and ensure icon-only buttons have descriptive `aria-label`s along with explicit `focus-visible` styles using the design system's focus utility classes.
