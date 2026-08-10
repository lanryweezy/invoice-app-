## 2024-06-25 - Replace Date object instantiation with Date.parse in CLI hot loops
**Learning:** `new Date()` incurs costly object allocation and garbage collection overhead, which scales poorly in `Array.prototype.sort()` (O(N log N)) and `filter` over large lists of invoices or database snapshots.
**Action:** Use `Date.parse(dateString)` instead of `new Date(dateString).getTime()` in array methods (`sort`, `filter`, `forEach`) for better performance when processing large lists.
## 2024-12-05 - Lexicographical sorting of ISO date strings
**Learning:** ISO date strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) can be sorted lexicographically using native string comparison (`a > b`), which avoids the severe O(N log N) overhead of instantiating `Date.parse()` multiple times inside array `.sort()` comparators.
**Action:** When sorting arrays of ISO date strings, always use string comparison (e.g. `(a, b) => a > b ? -1 : a < b ? 1 : 0`) instead of calling `Date.parse()` or `new Date().getTime()` on the values.
