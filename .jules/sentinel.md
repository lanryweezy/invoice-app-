## 2024-07-16 - Committed Secrets in Source Control
**Vulnerability:** A production `.env` file (`apps/web/.env`) containing sensitive credentials (like `VITE_FIREBASE_API_KEY` and `VITE_PAYSTACK_PUBLIC_KEY`) was checked into source control.
**Learning:** This repo's root `.gitignore` missed excluding standard `.env` files, which allowed secrets to leak into git history.
**Prevention:** Always add `*.env`, `.env`, and similar patterns to `.gitignore` from project inception and use a `.env.example` file instead for templating.
## 2024-07-16 - Committed Secrets in Source Control
**Vulnerability:** A production `.env` file (`apps/web/.env`) containing sensitive credentials (like `VITE_FIREBASE_API_KEY` and `VITE_PAYSTACK_PUBLIC_KEY`) was checked into source control.
**Learning:** This repo's root `.gitignore` missed excluding standard `.env` files, which allowed secrets to leak into git history.
**Prevention:** Always add `*.env`, `.env`, and similar patterns to `.gitignore` from project inception and use a `.env.example` file instead for templating.
## 2026-07-18 - XSS and Weak RNG in NIBSS receipt HTML generation
**Vulnerability:** The `generateReceiptHTML` function in `apps/web/services/nibssIntegration.ts` was vulnerable to Cross-Site Scripting (XSS) because user inputs were directly interpolated without escaping. Furthermore, `Math.random()` was used for reference generation, which is highly insecure for financial transaction identifiers.
**Learning:** Hardcoded HTML generators are prone to XSS if not explicitly escaping all dynamic inputs. JavaScript's `Math.random()` should never be used for security-sensitive references.
**Prevention:** Always use `escapeHTML()` (or equivalent sanitization) on user inputs when manually building HTML strings. Always use `crypto.randomUUID()` (or `crypto.getRandomValues()`) for secure reference or token generation.
