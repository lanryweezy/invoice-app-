## 2024-11-20 - Forms Missing Accessible Labels
**Learning:** Discovered that some quick-entry forms (like the expense logger in `AccountingDashboard`) rely solely on visual placeholders instead of proper `<label>` elements, rendering them completely opaque to screen readers.
**Action:** Always ensure quick-entry forms at minimum use `aria-label` attributes if visual labels are omitted to save space, preserving a clean UI without sacrificing accessibility.

## 2024-11-20 - Standardize Password Visibility Toggles
**Learning:** Adding a "Show/Hide" toggle to password fields significantly reduces user friction and errors during authentication, especially on mobile devices where typing is harder.
**Action:** Always include a password visibility toggle (eye icon or text) within password input fields as a standard UX pattern across all authentication and settings forms.
