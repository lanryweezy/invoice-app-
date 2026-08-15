## 2026-08-15 - Testing gap for fallback error parser
**Learning:** Verified the `catch()` handler on `response.json()` in API utilities functions correctly.
**Action:** Added a unit test validating fallback to `'Request failed'` if the server responds with a 500 status but malformed JSON.
