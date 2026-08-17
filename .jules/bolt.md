## 2026-08-17 - Optimized sequential I/O operations in checkOverdueInvoices
**Learning:** Fully sequential `await` loops inside functions iterating over many users can be slow due to network I/O blockages for each operation. Processing items in concurrent chunks using `Promise.all()` significantly reduces the overall execution time.
**Action:** Replaced sequential loop inside `checkOverdueInvoices` with a chunked concurrent loop (chunkSize 10) mapped to `Promise.all()` and added a rate-limiting pause between chunks to respect rate limits while maintaining efficiency.
