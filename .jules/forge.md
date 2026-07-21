## 2025-05-19 - Test Coverage for Non-Error Rejections in offlineSync
**Learning:** In asynchronous Promise queues (e.g., `Promise.allSettled` in `flushQueue`), rejections can occur with non-Error objects (like plain strings). While tests may cover standard `new Error()` cases, explicit tests for non-Error strings ensure fallback stringification logic (`String(error)`) works correctly and provides full branch coverage.
**Action:** When writing future tests for `catch` blocks or Promise rejections in this repo, explicitly include a test case that rejects with a non-Error string alongside the standard `new Error()` cases.
## 2026-04-14 - Testing JSON.parse Error Branches
**Learning:** When testing the `catch` branch of `JSON.parse` wrappers (e.g., when reading from `localStorage`), mocking the data source to return a malformed JSON string (like `'not-json'`) rather than forcing a mock to throw an error is the most explicit way to verify the parser's syntax error handling capabilities.
**Action:** When testing JSON parsing logic, always include a test case that provides a malformed string to ensure correct fallback execution.
## 2026-07-20 - Testing Sync Error Paths
**Learning:** When testing `Promise.allSettled` mapping loops (e.g., in offline sync queues), write distinct test cases for both asynchronous promise rejections (e.g., via `mockRejectedValue`) and synchronous exceptions thrown directly within the mapping function (e.g., via `mockImplementation` throwing an Error) to guarantee comprehensive coverage of error handling paths.
**Action:** Always explicitly test both sync throws and async rejections for critical queue processing logic.
## 2024-03-26 - XML Generation Escaping Bugs
**Learning:** XML generation methods (like `generateNRSXML`) using manual string replacements (e.g., `.replace()`) can silently crash with `TypeError: Cannot read properties of undefined (reading 'replace')` if optional fields on the payload fall back to `undefined` or null and are not gracefully coalesced to empty strings.
**Action:** When testing exports or transformations containing optional nested properties, always write tests that mock missing optional properties to ensure that the transformer functions coalesce defaults instead of throwing runtime errors.
