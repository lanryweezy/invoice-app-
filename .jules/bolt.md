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
## 2026-05-19 - [React.memo and useCallback for Complex Forms]
**Learning:** Form components like `InvoiceForm` containing many inputs can suffer from expensive cross-form re-renders. Typing in one field (e.g. updating a line item quantity) causes the entire form tree, including unrelated sections like user details, to re-render. If child input components aren't memoized, and their event handlers are recreated on every render, React will deeply render all form inputs.
**Action:** Wrap reusable form input components (`InputField`, `RichTextarea`, `CollapsibleSection`) with `React.memo()` and stabilize their callback props using `useCallback` with precise dependency arrays. This ensures an input only re-renders when its specific value or handler actually changes, greatly improving keystroke latency on complex forms.

## 2026-05-20 - [List Item Re-rendering with React.memo]
**Learning:** In React, mapping over an array to render complex child components inline (like a form row with multiple inputs) means the entire array block is re-rendered whenever any state in the parent changes. By extracting the item into its own component and wrapping it in `React.memo()`, and passing down stable callbacks, React can skip rendering items that haven't changed.
**Action:** Extract list items that contain inputs or expensive elements into their own `React.memo` components. Ensure all passed functions (like `onChange`, `onRemove`) are stable (`useCallback` in the parent) and all primitive props are correct to avoid unnecessary `O(N)` re-renders of the list.

## 2026-05-21 - [O(1) Map Lookups for Performance]
**Learning:** React components (like `BlogPost.tsx`) frequently map over large static arrays (like `mockPosts`) to find a specific item by ID during render using `Array.find()` (`O(N)`). While this is usually fine for small lists, as the dataset grows, this `O(N)` search happens on every single render. Over time, this can lead to unnecessary main-thread blocking and reduced performance.
**Action:** Replace `O(N)` array lookups with `O(1)` Map lookups. Export a memoized Map (e.g. `new Map(items.map(i => [i.id, i]))`) from the data source file, and use `map.get(id)` inside the component's `useMemo`.

## 2026-05-23 - [React.memo on large route/page components]
**Learning:** Large, expensive components like `InvoiceForm` and `InvoicePreview` frequently take props that are carefully memoized (e.g. `useCallback` or primitive states), but if the parent component (`App.tsx`) re-renders due to unrelated state changes (like opening a modal, showing a toast, or toggling mobile tabs), these expensive components will unnecessarily re-render if not wrapped in `React.memo()`.
**Action:** Always consider wrapping large top-level layout or heavy visual components in `React.memo` (especially if their props are already stable) to insulate them from frequent, unrelated state updates in their parent container.
