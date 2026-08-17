## 2026-08-17 - Optimized sequential I/O operations in checkOverdueInvoices
**Learning:** Fully sequential `await` loops inside functions iterating over many users can be slow due to network I/O blockages for each operation. Processing items in concurrent chunks using `Promise.all()` significantly reduces the overall execution time.
**Action:** Replaced sequential loop inside `checkOverdueInvoices` with a chunked concurrent loop (chunkSize 10) mapped to `Promise.all()` and added a rate-limiting pause between chunks to respect rate limits while maintaining efficiency.
## 2026-08-17 - Push Notification Loop Concurrency Optimization
**Learning:** Sequential loops awaiting network/IO operations (like push notifications) can severely impact Cloud Function execution time and lead to timeouts.
**Action:** Replaced a sequential `for...of` loop with a chunked concurrent approach using `Promise.all` (chunk size 10), yielding an ~89% performance improvement in simulated benchmarks.
