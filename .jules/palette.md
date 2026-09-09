## 2024-05-24 - Accessible Command Palette
**Learning:** Command palettes that allow keyboard navigation (ArrowUp/ArrowDown) need explicit ARIA roles (`role="listbox"` for container, `role="option"` with `aria-selected` for items, and `role="dialog"`/`aria-modal="true"` for the wrapper) to correctly announce state changes and focus to screen readers.
**Action:** Always verify `role="listbox"`, `role="option"`, and `aria-selected` are present on custom select dropdowns and palettes built without native HTML `<select>` elements.
