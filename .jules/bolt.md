## 2026-07-19 - Fast Single Regex Matching

**Learning:** When optimizing multiple regex calls over an array into a single combined regex, attempting to use unanchored lookaheads to enforce precedence order (`(?=.*?(?<type1>...))|(?=.*?(?<type2>...))`) causes catastrophic backtracking (O(N^2) time) if the string does not contain the target keywords. A standard combination (`(?<type1>...)|(?<type2>...)`) resolves in O(N) but alters matching logic from sequential precedence to left-to-right positional priority.

**Action:** When a fallback default exists and strict cross-string precedence is explicitly dropped in favor of raw performance, build a single compiled regex using `Object.entries(keywords).map(([type, kw]) => '(?<' + type + '>' + kw.join('|') + ')').join('|')`. To dynamically map the matched groups back to types, extract the keys using `Object.keys()` over the keywords configuration and iterate them inside the `exec` callback instead of hardcoding.
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

## 2026-05-23 - [Inline Functions Break React.memo]
**Learning:** Wrapping a large component (like `InvoiceForm`) in `React.memo()` is useless if you pass it inline functions as props (e.g., `onProFeatureClick={() => handleProFeatureClick('Recurring')}`). Because the inline function is redefined on every render of the parent (`App.tsx`), the `React.memo` shallow comparison will always fail, causing the expensive component to re-render anyway.
**Action:** When using `React.memo()`, strictly verify that *all* object and function props passed to the component are stable. Extract inline functions and wrap them in `useCallback` in the parent.

## 2026-05-23 - [Redundant Hook Overhead]
**Learning:** When a module-level constant (like a global `Intl.NumberFormat` instance) is already defined and cached, redefining it inside a component using `useMemo` shadows the global variable and creates an unnecessary hook allocation on every render cycle. While `useMemo` prevents recreation of the object, the hook itself still incurs a tiny performance cost and memory footprint during the render phase.
**Action:** Avoid declaring `useMemo` wrappers for static variables that are already cached globally outside the component scope.

## 2025-05-24 - [O(1) Map Lookups for Array Finds]
**Learning:** React components mapping over arrays to generate `<select>` options frequently perform `Array.find()` to retrieve the selected object during onChange handlers. Because `Array.find()` is O(N), this introduces unnecessary performance overhead as the dataset grows, blocking the main thread during component interactions.
**Action:** Replace `O(N)` array lookups with `O(1)` Map lookups for frequently accessed selection lists (like `businessProfiles`). Memoize the Map using `useMemo` with the array as a dependency, and use `map.get(id)` instead of `.find()` to improve lookup efficiency.

## 2026-05-27 - [Extracting inline functions to fix React.memo]
**Learning:** Passing inline arrow functions directly in JSX to memoized components (e.g., `<InvoiceForm updateInvoice={(key, value) => updateInvoice(key, value)} />`) defeats `React.memo`. The inline function reference is recreated on every render of the parent component, causing the shallow comparison to fail and forcing the child component to re-render, negating any performance benefits of memoization.
**Action:** Always extract inline callback functions into `useCallback` hooks in the parent component before passing them down to components wrapped in `React.memo`.

## 2026-07-17 - [Debounce frequent window events]
**Learning:** Attaching heavy UI updates or layout calculations (such as updating preview scales) directly to synchronous window events like `resize` or `scroll` causes massive re-render cascades and layout thrashing, severely degrading UI responsiveness.
**Action:** Always wrap the handlers for high-frequency window events (`resize`, `scroll`, `mousemove`) with a debounce or throttle mechanism (e.g. `setTimeout`) to limit execution frequency, clearing the previous timeout on subsequent fires.

## 2026-07-20 - [Date instantiation inside loops]
**Learning:** Comparing Date objects (using `<` or `>`) works by implicitly calling `.valueOf()` which gets the timestamp. However, when comparing inside a loop like `filter`, explicitly converting the static `start`/`to` boundary conditions into `.getTime()` numbers beforehand, and then parsing the inner `item.date` directly to `.getTime()` is slightly faster and removes the overhead of comparing complex Date objects.
**Action:** When filtering dates inside an array loop, convert the boundary target dates into numerical timestamps outside the loop, and use numerical comparison `getTime()` against them inside the loop.
## 2024-05-18 - Avoid N+1 execution by mapping intermediate results once
**Learning:** When generating both summary stats and detailed lists from an array, ensure expensive transformations (like `checkCompliance`) aren't run multiple times per item. Pre-calculating them into a `results` array and passing that down halves processing time.
**Action:** Extract statistical calculation logic into pure functions that accept the intermediate result array (e.g. `calculateStatsFromResults(results)`) rather than accepting raw entities and re-calculating everything.
## 2026-07-19 - Prevent JSON bloat when optimizing arrays\n**Learning:** Caching detailed array evaluations inside a summary stats object eliminates N+1 loops, but can inadvertently blow up JSON export sizes if that stats object is passed raw to `JSON.stringify()`.\n**Action:** Always use destructuring (e.g., `const { results: _, ...summaryStats } = stats;`) to strip caching fields before final serialization.
