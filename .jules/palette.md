## 2024-11-20 - Ensure invisible interactive elements have focus visibility
**Learning:** Hiding secondary action buttons via `opacity-0` and showing them on `group-hover:opacity-100` completely breaks keyboard navigation because they receive focus but remain invisible.
**Action:** When using this pattern, always pair it with `focus:opacity-100` or `focus-visible:opacity-100` so the element becomes fully visible when navigated via keyboard.
