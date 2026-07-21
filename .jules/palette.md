## 2024-07-16 - Tactile Feedback
**Learning:** For a more native mobile-like feel, primary buttons (like form submissions) should always use the `active:scale-[0.98]` Tailwind class to provide direct visual feedback immediately on press/tap. This prevents users from clicking multiple times before any async loading state kicks in or when the action is purely synchronous (like updating local state in BranchesManager).
**Action:** When creating or modifying primary form action buttons, always check if `active:scale-[0.98]` is present.

## 2024-07-19 - Auth Modal Focus States
**Learning:** Some elements in the Auth Modal (like the close button and the Google Login button) lacked comprehensive `focus-visible` ring states, which are critical for keyboard navigation. Additionally, the password visibility toggle button was missing an `aria-label`, making it less accessible for screen readers since the text changes dynamically. Adding `id` to modal titles is also crucial so `aria-labelledby` points correctly.
**Action:** When auditing modals or interactive components, ensure `aria-labelledby` IDs actually exist on the target element, all interactive buttons have `focus-visible` states (using offsets if needed for contrast), and icon/text-toggle buttons have clear `aria-label`s.

## 2025-07-20 - Palette: Add missing ARIA labels to icon-only buttons
**Learning:** Found that custom icon-only buttons inside generic action managers (`RecurringManager`, `TINValidator`) frequently miss `aria-label`s, rendering them inaccessible to screen readers. Even if they have a `title` attribute for visual tooltips, it does not guarantee accessibility.
**Action:** When auditing or implementing icon-only buttons across the app, always strictly require an `aria-label` or `aria-labelledby`, ensuring both visual (title/tooltip) and non-visual contexts are addressed.
## 2024-07-21 - Added cursor-pointer to form labels
**Learning:** Found that many `<label>` elements connected via `htmlFor` to input fields lacked a `cursor-pointer` class, which decreases visual affordance for users indicating they can click the text to focus the input.
**Action:** Always add `cursor-pointer` to `htmlFor` labels in React/Tailwind forms to make the clickable hit area visually obvious.
