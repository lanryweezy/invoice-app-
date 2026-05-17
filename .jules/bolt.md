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
## 2025-05-16 - [String.prototype.toLocaleString inside Loops]
**Learning:** Calling `(number).toLocaleString()` implicitly instantiates a new `Intl.NumberFormat` internally on each invocation, taking around ~0.6ms to ~1ms per call. When rendering lists containing prices (like `ReceiptsManager.tsx` or `AccountingDashboard.tsx` with hundreds of expenses), this can noticeably block the React main thread leading to poor scrolling and laggy renders.
**Action:** Replace dynamic `.toLocaleString()` formatting within lists with a static, globally cached instance of `new Intl.NumberFormat('en-US')` and use its `.format(number)` method instead. This drops the formatting time for 10,000 items from ~280ms down to ~11ms.
## 2025-05-17 - [Memoizing Form Components for Keystroke Optimization]
**Learning:** Frequent state updates in large forms (like during typing keystrokes) cause the entire parent form component (e.g., `InvoiceForm`) and all its children to re-render. If child input components (like `InputField` or `RichTextarea`) are not memoized, this leads to significant main thread blocking and noticeable input lag on slower devices.
**Action:** Wrap generic UI components (`InputField`, `RichTextarea`, `CollapsibleSection`) in `React.memo` and ensure the callbacks passed to them (`onChange` handlers like `handleLineItemChange`) are wrapped in `useCallback` with proper dependency arrays to maintain referential equality across renders, avoiding unnecessary DOM diffing for unaffected inputs.
