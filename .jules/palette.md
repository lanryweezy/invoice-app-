## 2024-07-16 - Tactile Feedback
**Learning:** For a more native mobile-like feel, primary buttons (like form submissions) should always use the `active:scale-[0.98]` Tailwind class to provide direct visual feedback immediately on press/tap. This prevents users from clicking multiple times before any async loading state kicks in or when the action is purely synchronous (like updating local state in BranchesManager).
**Action:** When creating or modifying primary form action buttons, always check if `active:scale-[0.98]` is present.
