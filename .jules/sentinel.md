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

## 2024-05-18 - Mask authentication tokens in CLI outputs
**Vulnerability:** The CLI `config get` command printed the entire `config.json` file content, including sensitive `idToken` and `refreshToken` properties in plain text.
**Learning:** Any debug or status commands that print configuration objects to the console must actively filter or mask all sensitive authentication tokens, not just third-party passwords like SMTP.
**Prevention:** Always implement an explicit omit or mask list (e.g. `['pass', 'idToken', 'refreshToken']`) when serializing configuration objects for console output.
## 2024-09-10 - Security Fix: Prevent CLI from leaking auth tokens
**Vulnerability:** The CLI `config get` command printed the entire configuration object to the console, including sensitive `idToken` and `refreshToken` without masking them, exposing tokens to shoulder surfers and logs.
**Learning:** Never assume JSON stringification of configuration objects is safe. Sensitive keys (like tokens and passwords) must be explicitly filtered or masked before any console output.
**Prevention:** Always mask sensitive fields before printing.
## 2024-05-24 - Fix Predictable Payment References
**Vulnerability:** The Paystack payment initialization in the Client Portal used a predictable reference format (`INV-{invoiceNumber}-{timestamp}`).
**Learning:** Predictable payment references can allow attackers to enumerate or replay transactions, potentially causing state manipulation or denial of service on payment webhooks.
**Prevention:** Always use cryptographically secure random identifiers (e.g., `generateSecureId`) appended to predictable data when generating transaction references for external payment gateways.
## 2025-05-24 - Predictable Payment Transaction References
**Vulnerability:** Payment QR references were predictably generated using Date.now().
**Learning:** Using predictable timestamps for payment gateways can lead to transaction enumeration and replay vulnerabilities.
**Prevention:** Always append cryptographically secure random identifiers (like generateSecureId) when generating transaction references.
## 2024-10-04 - Fix CSV Injection in Audit Trail Export
**Vulnerability:** The CSV export function `escapeCSV` in `apps/web/services/auditTrail.ts` failed to sanitize cells starting with formula characters (`=`, `+`, `-`, `@`), enabling CSV Injection (Formula Injection) attacks.
**Learning:** Just escaping commas and quotes is insufficient for secure CSV exports when the file might be opened in spreadsheet software.
**Prevention:** Always prepend a single quote (`'`) to any CSV value starting with `=, +, -, or @` before wrapping in double quotes.
## 2024-10-04 - Fix CSV Injection in Invoice Export
**Vulnerability:** The CSV export functions in `apps/web/services/structuredExport.ts` and `apps/web/services/eInvoicing.ts` failed to sanitize cells starting with formula characters (`=`, `+`, `-`, `@`), enabling CSV Injection (Formula Injection) attacks.
**Learning:** Reusing logic without consistently applying security patches can lead to vulnerabilities. We must ensure all CSV export functions sanitize against formula injection.
**Prevention:** Always prepend a single quote (`'`) to any CSV value starting with `=, +, -, or @` before wrapping in double quotes, and enforce the use of centralized, secure CSV escaping utilities.

## 2024-10-24 - Fix Predictable Transaction References
**Vulnerability:** External payment gateways (e.g., Paystack, Flutterwave) used predictable `Date.now()` strings for transaction references, enabling transaction enumeration and replay attacks.
**Learning:** Never use purely time-based IDs for security-sensitive references.
**Prevention:** Use a cryptographically secure random identifier (e.g., `generateSecureId`) for all payment and transaction references.
## 2024-11-13 - [Predictable Identifiers Overwriting Secure Ones]
**Vulnerability:** `stampDuty.ts` securely generated a receipt number in `calculateStampDuty`, but `generateStampReceipt` subsequently overwrote it with a predictable `SD-${invoice.id}-${Date.now()}`. A similar issue existed in `whrCalculator.ts` for WHT certificates.
**Learning:** Functions that wrap or extend core logic may inadvertently regress security enhancements (like secure IDs) if they attempt to rebuild or customize identifiers locally without including the necessary entropy.
**Prevention:** Always reuse the securely generated identifier from the base object rather than recreating it, or ensure all layers use `generateSecureId` when generating public-facing identifiers like receipt or certificate numbers to prevent enumeration.
