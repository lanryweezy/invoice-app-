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
## 2025-02-14 - Fix SSRF and Open Relay in SMTP Endpoint
**Vulnerability:** The `/api/send-email` serverless function previously accepted raw SMTP configuration (host, port, credentials) directly from the client's request body to instantiate a nodemailer transport, exposing the server to Server-Side Request Forgery (SSRF) and Open Email Relay abuse.
**Learning:** Accepting connection parameters from untrusted clients effectively turns a server into an open proxy. Attackers could pass internal network IPs to scan ports or use the Vercel infrastructure to blast spam through their own (or compromised) SMTP servers while masking their true IP.
**Prevention:** Never trust client payloads for backend infrastructure connections. Always hardcode or read connection secrets (like SMTP details) exclusively from server-side environment variables (`process.env`).
## 2025-02-14 - Missing Input Length Limits
**Vulnerability:** The `/api/send-email` endpoint accepted arbitrary lengths for `to`, `subject`, `text`, and `html` fields from user input.
**Learning:** This exposes the endpoint to possible Denial of Service (DoS) attacks or unintended system load if attackers supply excessively large payloads to be processed by the server and SMTP transporter.
**Prevention:** Always implement input validation, particularly maximum length constraints, on any user-provided data sent to API endpoints to prevent excessive resource consumption.
