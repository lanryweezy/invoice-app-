## 2025-05-13 - [Intl.NumberFormat in render loop]
**Learning:** `new Intl.NumberFormat()` is relatively slow to instantiate (~1ms per instantiation in Node, which can add up if called frequently or inside tight loops). In `InvoiceForm.tsx` and `InvoicePreview.tsx`, we are instantiating it inside the component render body. Moving it to `useMemo` or a constant outside the component can save unnecessary re-creations during renders. However, because it depends on the dynamic `currency` prop/state, it makes sense to wrap it in `useMemo`.

**Action:** Whenever formatting numbers inside a component based on a currency prop, wrap the `Intl.NumberFormat` instance in `useMemo` with `currency` as a dependency instead of creating it on every render.

## 2025-05-14 - [Debounced Cloud Sync in useExpenses]
**Learning:** Debouncing I/O operations (especially network calls) is a key performance optimization to reduce overhead and costs. However, when combined with client-side state hydration (e.g., from LocalStorage and then Firebase), care must be taken to prevent "race-to-empty" conditions where an uninitialized state overwrites existing data. Additionally, data durability should not be compromised; fast, synchronous I/O like LocalStorage should often remain immediate, while high-latency network calls are debounced.

**Action:** When debouncing cloud sync in React hooks:
1. Maintain immediate persistence for LocalStorage to ensure data durability.
2. Debounce high-latency network calls (e.g., Firebase 'setDoc').
3. Use a guard (e.g., a 'isLoaded' ref) to prevent syncing until the initial hydration from all sources is complete.
4. Move side effects out of 'setState' updaters to keep them pure and predictable.

## 2025-05-15 - [.toLocaleString() is essentially Intl.NumberFormat]
**Learning:** Calling `Number.prototype.toLocaleString()` implicitly creates and destroys an `Intl.NumberFormat` instance internally. Because instantiating `Intl.NumberFormat` is relatively slow (~1ms in some environments), doing `(amount).toLocaleString()` inside loops or large React list renders can become a hidden performance bottleneck, causing render times to easily spike to 10s or 100s of milliseconds.
**Action:** Always prefer creating a single `Intl.NumberFormat` instance (memoized with `useMemo` in React components, or as a module-level constant) and reusing its `.format()` method instead of calling `.toLocaleString()` on individual numbers.
