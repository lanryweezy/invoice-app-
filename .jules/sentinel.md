## 2024-05-18 - Use cryptographically secure random numbers for Key IDs
**Learning:** `crypto.randomUUID()` might not be suitable for all security contexts where a cryptographically secure random string of a specific format is needed. Using a custom `generateSecureId` function built on `crypto.getRandomValues()` ensures cryptographically secure randomness while allowing for custom length and formatting.
**Action:** Replaced `crypto.randomUUID()` in `generateKeyId` with `generateSecureId(6)` to generate a cryptographically secure random string for Key IDs.
## 2026-08-15 - Security Fix: Prevent predictable receipt numbers

**Learning:** When using random strings for security-sensitive IDs such as NIBSS receipt numbers, `crypto.randomUUID()` generates strings that might be too long and thus break API requirements. We need to use `crypto.randomBytes(N).toString('hex')` to maintain length compatibility while increasing entropy.

**Action:** Replaced `generateSecureId(8)` with `crypto.randomBytes(4).toString('hex').toUpperCase()` to maintain an 8-character string with strong cryptographic randomness.

## 2026-08-16 - Security Fix: Ensure all cryptographically secure random ID generators use consistent implementations
**Learning:** Hardcoded usages of `crypto.randomBytes(N).toString('hex')` within services (like `nibssIntegration`) are less DRY and couple the service to Node.js `crypto` modules directly, when instead they should rely on the shared `generateSecureId` utility (which itself implements cryptographic randomness using `crypto.getRandomValues`).
**Action:** Replaced inline `crypto.randomBytes` usages with `generateSecureId(N)` calls to enforce consistency and simplify service dependencies.
**Learning:** Avoid using inline crypto implementations (`crypto.getRandomValues` inside components/hooks) for security-sensitive logic like invoice numbers. Always use the shared utility (`generateSecureId`) for secure randomness and consistency.
**Action:** Replaced inline invoice number random generator with `generateSecureId(5)` in `apps/web/hooks/useInvoice.ts`.

## 2024-05-18 - Use cryptographically secure custom character set for random IDs
**Learning:** Generating random IDs by converting a byte array to a hex string and then `.toUpperCase()` reduces the possible entropy of the string, and `.padStart(2, '0')` does not effectively increase the security. Instead, mapping cryptographically secure bytes onto a larger Base36 charset ('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') provides a wider range of possible values for the same string length, increasing unpredictability for security-sensitive IDs like payment references.
**Action:** Refactored `generateSecureId` in `crypto.ts` to use `crypto.getRandomValues()` to index into a Base36 charset instead of generating hex strings. Updated corresponding tests.
