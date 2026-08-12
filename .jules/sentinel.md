## 2026-08-08 - Mailto Header Injection
**Vulnerability:** User-controlled input was interpolated directly into a `mailto:` URL string without URL encoding.
**Learning:** Unencoded query parameters in `mailto:` links (like `subject=` or `body=`) allow attackers to inject additional headers (e.g., `&cc=`, `&bcc=`) or manipulate the body content, leading to potential social engineering or information disclosure.
**Prevention:** Always wrap dynamically interpolated values in `mailto:` URLs with `encodeURIComponent()` to ensure special characters are safely neutralized as literals.

## 2024-05-27 - [Timing Attack Risk in Paystack Webhook]
**Vulnerability:** The Paystack webhook signature verification in `functions/index.js` used a standard string comparison (`!==`) to validate the HMAC signature against the `x-paystack-signature` header.
**Learning:** Standard string equality checks evaluate characters sequentially and return `false` upon the first mismatch, allowing an attacker to theoretically deduce a valid signature by measuring verification response times.
**Prevention:** Always use `crypto.timingSafeEqual()` for cryptographic comparisons (like HMAC signatures). Ensure inputs are cast to `Buffer` objects and verified to be of equal length *before* calling `timingSafeEqual()` to prevent application crashes.
