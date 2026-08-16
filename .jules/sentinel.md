## 2024-05-18 - Use cryptographically secure random numbers for Key IDs
**Learning:** `crypto.randomUUID()` might not be suitable for all security contexts where a cryptographically secure random string of a specific format is needed. Using a custom `generateSecureId` function built on `crypto.getRandomValues()` ensures cryptographically secure randomness while allowing for custom length and formatting.
**Action:** Replaced `crypto.randomUUID()` in `generateKeyId` with `generateSecureId(6)` to generate a cryptographically secure random string for Key IDs.
