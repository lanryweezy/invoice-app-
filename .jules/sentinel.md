## 2026-08-08 - Mailto Header Injection
**Vulnerability:** User-controlled input was interpolated directly into a `mailto:` URL string without URL encoding.
**Learning:** Unencoded query parameters in `mailto:` links (like `subject=` or `body=`) allow attackers to inject additional headers (e.g., `&cc=`, `&bcc=`) or manipulate the body content, leading to potential social engineering or information disclosure.
**Prevention:** Always wrap dynamically interpolated values in `mailto:` URLs with `encodeURIComponent()` to ensure special characters are safely neutralized as literals.
