## 2025-05-13 - [Intl.NumberFormat in render loop]
**Learning:** `new Intl.NumberFormat()` is relatively slow to instantiate (~1ms per instantiation in Node, which can add up if called frequently or inside tight loops). In `InvoiceForm.tsx` and `InvoicePreview.tsx`, we are instantiating it inside the component render body. Moving it to `useMemo` or a constant outside the component can save unnecessary re-creations during renders. However, because it depends on the dynamic `currency` prop/state, it makes sense to wrap it in `useMemo`.

**Action:** Whenever formatting numbers inside a component based on a currency prop, wrap the `Intl.NumberFormat` instance in `useMemo` with `currency` as a dependency instead of creating it on every render.
