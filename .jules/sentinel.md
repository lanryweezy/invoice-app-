## 2026-08-08 - Mailto Header Injection
**Vulnerability:** User-controlled input was interpolated directly into a `mailto:` URL string without URL encoding.
**Learning:** Unencoded query parameters in `mailto:` links (like `subject=` or `body=`) allow attackers to inject additional headers (e.g., `&cc=`, `&bcc=`) or manipulate the body content, leading to potential social engineering or information disclosure.
**Prevention:** Always wrap dynamically interpolated values in `mailto:` URLs with `encodeURIComponent()` to ensure special characters are safely neutralized as literals.

## 2024-05-27 - [Timing Attack Risk in Paystack Webhook]
**Vulnerability:** The Paystack webhook signature verification in `functions/index.js` used a standard string comparison (`!==`) to validate the HMAC signature against the `x-paystack-signature` header.
**Learning:** Standard string equality checks evaluate characters sequentially and return `false` upon the first mismatch, allowing an attacker to theoretically deduce a valid signature by measuring verification response times.
**Prevention:** Always use `crypto.timingSafeEqual()` for cryptographic comparisons (like HMAC signatures). Ensure inputs are cast to `Buffer` objects and verified to be of equal length *before* calling `timingSafeEqual()` to prevent application crashes.
## 2025-02-05 - Insecure Configuration File Permissions
**Vulnerability:** Configuration directories and files were being created with default permissions (often `0644`/`0755` depending on umask). This allows other users on the same system to read sensitive data (like `userId`, tokens, or API keys) stored in `~/.invoiceapp/config.json`.
**Learning:** Always enforce restrictive permissions when creating local storage for sensitive CLI tools.
**Prevention:** Explicitly pass `{ mode: 0o700 }` to `fs.mkdirSync` and `{ encoding: 'utf-8', mode: 0o600 }` to `fs.writeFileSync`.
## 2025-02-27 - Open Mail Relay Vulnerability
**Vulnerability:** Open Mail Relay
**Learning:** Vercel serverless functions in the `api/` directory (like `api/send-email.ts`) resolve their dependencies from the root `package.json`. Always ensure authentication checks are in place for sensitive endpoints.
**Prevention:** Verify Firebase ID tokens passed in the `Authorization: Bearer <token>` header using `firebase-admin` before processing the request.
