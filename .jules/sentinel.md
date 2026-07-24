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
## 2025-02-14 - Exposed Error Details in SMTP Endpoint
**Vulnerability:** The `/api/send-email` endpoint was directly returning the `error.message` and `error.code` from Nodemailer failures in its JSON response.
**Learning:** This can inadvertently expose sensitive internal infrastructure details, such as IP addresses, stack traces, internal paths, or misconfigurations, to unauthenticated users when the SMTP server fails or rejects a connection.
**Prevention:** Always implement a secure error boundary for external API responses. Log detailed error information internally via `console.error` or a logging provider, but return a sanitized, generic message (e.g., "Failed to send email") to the client.
## 2024-07-22 - Fix Webhook Signature Validation
**Vulnerability:** The Paystack webhook validation in `functions/index.js` was using `JSON.stringify(req.body)` to compute the HMAC signature.
**Learning:** Reconstructing a JSON payload with `JSON.stringify` can introduce property order and whitespace differences compared to the raw request. This can cause valid webhook signatures to fail validation, leading to missed events. In addition, computing hashes against processed request bodies increases the risk of tampering.
**Prevention:** Always use the raw unparsed request body (`req.rawBody`) when computing cryptographic signatures for webhooks to ensure bit-for-bit accuracy.
## 2025-02-14 - Fix Reverse Tabnabbing Vulnerability in window.open Calls
**Vulnerability:** Several `window.open` calls across the application (e.g., in `SettingsModal.tsx`, `PaymentDetails.tsx`, and `ActionButtons.tsx`) used `_blank` without setting `noopener,noreferrer`.
**Learning:** Using `target="_blank"` or `window.open` without `noopener` or `noreferrer` exposes the application to Reverse Tabnabbing, where the newly opened page can maliciously redirect the original page using `window.opener.location`. This is especially dangerous when linking to external, user-provided, or untrusted URLs.
**Prevention:** Always include `'noopener,noreferrer'` in the features parameter of `window.open(url, '_blank', ...)` to sever the relationship between the tabs.
## 2024-05-24 - Remove Client PII from Analytics Tracking
**Vulnerability:** Client's name (PII) was being sent to a third-party analytics service (`trackEvent('save_client', { client_name: client.name })`).
**Learning:** Sending PII data to third-party analytics services without anonymization or hashing creates a privacy and data exposure risk.
**Prevention:** Analytics events should be designed carefully to only send metadata, avoiding real names or any identifiers that can be traced back to individuals.
## 2024-05-24 - Unsafe Random Number Generation
**Vulnerability:** The `generateId` function in `apps/web/services/auditTrail.ts` used `Math.random()` to generate unique identifiers for audit logs. `Math.random()` is not cryptographically secure, which could allow an attacker to predict generated IDs.
**Learning:** This vulnerability existed due to the use of a simple `Math.random()` function to generate random alphanumeric strings, which is a common but insecure pattern.
**Prevention:** Always use `crypto.getRandomValues()` (Web Crypto API) or `crypto.randomUUID()` to generate identifiers for security-sensitive or globally unique items.
