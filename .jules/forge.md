## 2025-05-19 - Test Coverage for Non-Error Rejections in offlineSync
**Learning:** In asynchronous Promise queues (e.g., `Promise.allSettled` in `flushQueue`), rejections can occur with non-Error objects (like plain strings). While tests may cover standard `new Error()` cases, explicit tests for non-Error strings ensure fallback stringification logic (`String(error)`) works correctly and provides full branch coverage.
**Action:** When writing future tests for `catch` blocks or Promise rejections in this repo, explicitly include a test case that rejects with a non-Error string alongside the standard `new Error()` cases.
## 2026-04-14 - Testing JSON.parse Error Branches
**Learning:** When testing the `catch` branch of `JSON.parse` wrappers (e.g., when reading from `localStorage`), mocking the data source to return a malformed JSON string (like `'not-json'`) rather than forcing a mock to throw an error is the most explicit way to verify the parser's syntax error handling capabilities.
**Action:** When testing JSON parsing logic, always include a test case that provides a malformed string to ensure correct fallback execution.
