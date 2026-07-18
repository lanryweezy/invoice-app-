## 2024-07-16 - Tactile Feedback
**Learning:** For a more native mobile-like feel, primary buttons (like form submissions) should always use the `active:scale-[0.98]` Tailwind class to provide direct visual feedback immediately on press/tap. This prevents users from clicking multiple times before any async loading state kicks in or when the action is purely synchronous (like updating local state in BranchesManager).
**Action:** When creating or modifying primary form action buttons, always check if `active:scale-[0.98]` is present.

## 2024-07-23 - Modal Accessibility IDs and Focus
**Learning:** In React components acting as modals (`role="dialog"`), simply adding `aria-labelledby="[id]"` is not enough; we must ensure the targeted ID actually exists on the modal's title element (e.g. `id="[id]"` on `<h2>` or `<h3>`). Additionally, interactive elements like modal close buttons must have clear focus rings, specifically pairing `focus-visible:ring-2` with `focus-visible:ring-offset-2` to guarantee visibility against varying backgrounds.
**Action:** When auditing or creating a modal, verify the `aria-labelledby` ID is present on the header element and ensure close buttons use `focus-visible:ring-offset-2`.
