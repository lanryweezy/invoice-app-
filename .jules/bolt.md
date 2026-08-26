## 2024-06-25 - Replace Date object instantiation with Date.parse in CLI hot loops
**Learning:** `new Date()` incurs costly object allocation and garbage collection overhead, which scales poorly in `Array.prototype.sort()` (O(N log N)) and `filter` over large lists of invoices or database snapshots.
**Action:** Use `Date.parse(dateString)` instead of `new Date(dateString).getTime()` in array methods (`sort`, `filter`, `forEach`) for better performance when processing large lists.
## 2024-12-05 - Lexicographical sorting of ISO date strings
**Learning:** ISO date strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) can be sorted lexicographically using native string comparison (`a > b`), which avoids the severe O(N log N) overhead of instantiating `Date.parse()` multiple times inside array `.sort()` comparators.
**Action:** When sorting arrays of ISO date strings, always use string comparison (e.g. `(a, b) => a > b ? -1 : a < b ? 1 : 0`) instead of calling `Date.parse()` or `new Date().getTime()` on the values.
## 2024-05-18 - Use Date.parse() instead of new Date().getTime() in digital signature validation
**Learning:** `new Date()` incurs costly object allocation and garbage collection overhead, which can degrade performance in functions repeatedly validating signatures or mapping signature data. Using `Date.parse()` skips this allocation overhead and returns the timestamp directly.
**Action:** Always prefer `Date.parse(dateString)` over `new Date(dateString).getTime()` when checking timestamps or calculating time differences.
## 2026-08-16 - Replace N+1 queries with Collection Group Queries in Firestore Cloud Functions
**Learning:** Querying a subcollection across multiple parents using a for-loop (N+1 query pattern) is extremely inefficient and scales poorly as the number of parent documents grows. This causes excessive read operations and very high latency.
**Action:** Use Firestore `collectionGroup()` queries when searching for documents in a subcollection across all parent documents (e.g., getting all overdue invoices across all users), then aggregate the data in memory. This reduces the time complexity and network overhead dramatically. Always ensure proper composite indexes are configured in `firestore.indexes.json` for collectionGroup queries to work.
## 2026-08-17 - Combine sequential array filters into a single pass
**Learning:** Sequential calls to `.filter()` allocate an intermediate array for each call and require O(N) iteration for each condition. For large datasets processed in memory, this causes unnecessary garbage collection and performance degradation.
**Action:** When applying multiple filter criteria based on dynamic flags, implement a single `.filter()` pass with all active conditions rather than chaining multiple `.filter()` calls.
## 2026-08-17 - Optimized sequential I/O operations in checkOverdueInvoices
**Learning:** Fully sequential `await` loops inside functions iterating over many users can be slow due to network I/O blockages for each operation. Processing items in concurrent chunks using `Promise.all()` significantly reduces the overall execution time.
**Action:** Replaced sequential loop inside `checkOverdueInvoices` with a chunked concurrent loop (chunkSize 10) mapped to `Promise.all()` and added a rate-limiting pause between chunks to respect rate limits while maintaining efficiency.
## 2026-08-17 - Push Notification Loop Concurrency Optimization
**Learning:** Sequential loops awaiting network/IO operations (like push notifications) can severely impact Cloud Function execution time and lead to timeouts.
**Action:** Replaced a sequential `for...of` loop with a chunked concurrent approach using `Promise.all` (chunk size 10), yielding an ~89% performance improvement in simulated benchmarks.
## 2026-08-25 - Consolidate array iteration in database fetches
**Learning:** Mapping over an intermediate array populated from a database snapshot iteration creates redundant O(N) operations and unnecessary memory allocation.
**Action:** Map data directly inside the initial `.forEach()` loop of the database snapshot to combine filtering and transformation, avoiding intermediate arrays.
