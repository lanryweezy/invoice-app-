## 2024-07-16 - Committed Secrets in Source Control
**Vulnerability:** A production `.env` file (`apps/web/.env`) containing sensitive credentials (like `VITE_FIREBASE_API_KEY` and `VITE_PAYSTACK_PUBLIC_KEY`) was checked into source control.
**Learning:** This repo's root `.gitignore` missed excluding standard `.env` files, which allowed secrets to leak into git history.
**Prevention:** Always add `*.env`, `.env`, and similar patterns to `.gitignore` from project inception and use a `.env.example` file instead for templating.
## 2024-07-16 - Committed Secrets in Source Control
**Vulnerability:** A production `.env` file (`apps/web/.env`) containing sensitive credentials (like `VITE_FIREBASE_API_KEY` and `VITE_PAYSTACK_PUBLIC_KEY`) was checked into source control.
**Learning:** This repo's root `.gitignore` missed excluding standard `.env` files, which allowed secrets to leak into git history.
**Prevention:** Always add `*.env`, `.env`, and similar patterns to `.gitignore` from project inception and use a `.env.example` file instead for templating.
## 2024-07-19 - Insecure Random Number Generation for Identifiers
**Vulnerability:** Across multiple core services (e.g. `auditTrail`, `complianceTracker`, `stampDuty`, `nibssIntegration`, `digitalSignature`, `useInvoice`), `Math.random()` was being used to generate sensitive references, keys, and receipt IDs.
**Learning:** `Math.random()` is predictable and not cryptographically secure, which could allow attackers to guess or brute-force invoice identifiers or payment links.
**Prevention:** Always use `crypto.getRandomValues()` for generating UUIDs, tokens, identifiers, and any cryptographically sensitive string within frontend/backend codebases.
