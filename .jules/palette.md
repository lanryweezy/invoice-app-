## 2024-11-20 - Forms Missing Accessible Labels
**Learning:** Discovered that some quick-entry forms (like the expense logger in `AccountingDashboard`) rely solely on visual placeholders instead of proper `<label>` elements, rendering them completely opaque to screen readers.
**Action:** Always ensure quick-entry forms at minimum use `aria-label` attributes if visual labels are omitted to save space, preserving a clean UI without sacrificing accessibility.

## 2024-11-20 - Standardize Password Visibility Toggles
**Learning:** Adding a "Show/Hide" toggle to password fields significantly reduces user friction and errors during authentication, especially on mobile devices where typing is harder.
**Action:** Always include a password visibility toggle (eye icon or text) within password input fields as a standard UX pattern across all authentication and settings forms.

## 2024-11-20 - Mobile Input Modes
**Learning:** Using `type="number"` does not consistently bring up the optimal numeric keypad on all mobile browsers, especially iOS Safari, leading to a poor data entry experience for monetary values.
**Action:** Always pair `type="number"` with `inputMode="decimal"` (or `inputMode="numeric"`) for monetary or quantity fields to guarantee the correct, finger-friendly keypad appears for mobile users.

## 2024-11-20 - High-Impact Micro-UX Improvements
**Learning:** Consistently applying small HTML and CSS improvements—such as `autoComplete`, `autoCapitalize`, proper `aria-labelledby` on modals, loading states on form submissions, and `focus-visible` outlines—creates a dramatically more polished and accessible product without requiring massive engineering overhauls. Forms should always protect against double-submission visually.
**Action:** Establish these 10 micro-UX patterns as a baseline standard for all new components and forms built in this repository.
