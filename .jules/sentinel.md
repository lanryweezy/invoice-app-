## 2026-08-15 - Security Fix: Prevent predictable receipt numbers

**Learning:** When using random strings for security-sensitive IDs such as NIBSS receipt numbers, `crypto.randomUUID()` generates strings that might be too long and thus break API requirements. We need to use `crypto.randomBytes(N).toString('hex')` to maintain length compatibility while increasing entropy.

**Action:** Replaced `generateSecureId(8)` with `crypto.randomBytes(4).toString('hex').toUpperCase()` to maintain an 8-character string with strong cryptographic randomness.

## 2026-08-16 - Security Fix: Ensure all cryptographically secure random ID generators use consistent implementations
**Learning:** Hardcoded usages of `crypto.randomBytes(N).toString('hex')` within services (like `nibssIntegration`) are less DRY and couple the service to Node.js `crypto` modules directly, when instead they should rely on the shared `generateSecureId` utility (which itself implements cryptographic randomness using `crypto.getRandomValues`).
**Action:** Replaced inline `crypto.randomBytes` usages with `generateSecureId(N)` calls to enforce consistency and simplify service dependencies.
