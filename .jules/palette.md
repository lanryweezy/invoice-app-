## 2024-11-20 - Forms Missing Accessible Labels
**Learning:** Discovered that some quick-entry forms (like the expense logger in `AccountingDashboard`) rely solely on visual placeholders instead of proper `<label>` elements, rendering them completely opaque to screen readers.
**Action:** Always ensure quick-entry forms at minimum use `aria-label` attributes if visual labels are omitted to save space, preserving a clean UI without sacrificing accessibility.
