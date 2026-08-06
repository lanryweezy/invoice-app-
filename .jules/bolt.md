## 2024-06-25 - Replace Date object instantiation with Date.parse in CLI hot loops
**Learning:** `new Date()` incurs costly object allocation and garbage collection overhead, which scales poorly in `Array.prototype.sort()` (O(N log N)) and `filter` over large lists of invoices or database snapshots.
**Action:** Use `Date.parse(dateString)` instead of `new Date(dateString).getTime()` in array methods (`sort`, `filter`, `forEach`) for better performance when processing large lists.
