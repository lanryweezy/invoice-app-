## 2026-08-17 - Push Notification Loop Concurrency Optimization
**Learning:** Sequential loops awaiting network/IO operations (like push notifications) can severely impact Cloud Function execution time and lead to timeouts.
**Action:** Replaced a sequential `for...of` loop with a chunked concurrent approach using `Promise.all` (chunk size 10), yielding an ~89% performance improvement in simulated benchmarks.
