## 2024-07-16 - Tactile Feedback
**Learning:** For a more native mobile-like feel, primary buttons (like form submissions) should always use the `active:scale-[0.98]` Tailwind class to provide direct visual feedback immediately on press/tap. This prevents users from clicking multiple times before any async loading state kicks in or when the action is purely synchronous (like updating local state in BranchesManager).
**Action:** When creating or modifying primary form action buttons, always check if `active:scale-[0.98]` is present.

## 2024-07-19 - Auth Modal Focus States
**Learning:** Some elements in the Auth Modal (like the close button and the Google Login button) lacked comprehensive `focus-visible` ring states, which are critical for keyboard navigation. Additionally, the password visibility toggle button was missing an `aria-label`, making it less accessible for screen readers since the text changes dynamically. Adding `id` to modal titles is also crucial so `aria-labelledby` points correctly.
**Action:** When auditing modals or interactive components, ensure `aria-labelledby` IDs actually exist on the target element, all interactive buttons have `focus-visible` states (using offsets if needed for contrast), and icon/text-toggle buttons have clear `aria-label`s.
