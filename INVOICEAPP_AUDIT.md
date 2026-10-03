# InvoiceApp.ng Full Product Audit & Recommendation

## 1. Current Architecture
**Frontend**: React 19, Vite, Tailwind CSS (v4), Zustand, TypeScript.
**Backend**: Firebase Functions (Node 22), Vercel serverless functions (`api/send-email.ts`).
**Database**: Firebase Firestore.
**Authentication**: Firebase Authentication.
**Payment**: Paystack webhook stub in functions; client-side payment links.
**NRS Integration**: Full client-side implementation of JSON/XML generation and FIRS API requests (`services/nrsApi.ts`).

## 2. Existing Capabilities
- Invoice Creation & PDF Generation (Client-side HTML-to-Image).
- Tax calculation (VAT, WHT).
- NRS Payload Validation and Transmission (Sandbox & Production toggles).
- Client portal links for viewing invoices.
- Basic Recurring/Expense models.
- Support for multiple template designs.

## 3. Missing Capabilities
- Abstracted `PaymentService` handling multiple providers (currently hardcoded around Paystack).
- Robust `Payment Reconciliation` feeding a proper Ledger.
- `Aura` Domain Events pipeline.
- AI Assistant capabilities (Invoice Assistant, Collections Assistant).
- Formal Accounts Receivable / Revenue Dashboard (currently just basic charts in `AccountingDashboard.tsx`).

## 4. Broken Capabilities
- Webhook pipeline lacks complete idempotency and domain event publishing.
- FIRS API requests are executed client-side, which risks exposing credentials if not routed through a secure proxy (API config uses a local state).
- Paystack integration is mostly a mocked MVP (`README.md` acknowledges this).

## 5. Required APIs
- Abstracted Payments API: `POST /api/payments/initialize`, `POST /api/payments/verify`.
- Receivables & Reporting API: `GET /api/receivables`, `GET /api/reports/revenue`.
- Webhooks: `POST /api/webhooks/paystack`, `POST /api/webhooks/flutterwave`, `POST /api/webhooks/nrs`.

## 6. Provider Integrations
- Need a `PaymentProvider` adapter pattern (Paystack, Flutterwave).
- Need a `NotificationService` adapter (Email, SMS, WhatsApp).

## 7. NRS Integration Requirements
- Currently implemented via `services/eInvoicing.ts` & `nrsApi.ts`.
- Needs to be shifted to a secure backend proxy to protect FIRS credentials.
- Status state machine (`LOCAL_DRAFT` -> `READY_FOR_NRS` -> `SUBMITTED`) needs robust server-side enforcement.

## 8. Database Changes
- Need new Collections/Tables: `PaymentRecords`, `DomainEvents`, `AuditLogs`, `WebhookEvents`.
- Separate `BusinessProfile` from `User` to allow multi-user organizations.

## 9. API Changes
- Migrate business logic out of client-side React hooks into API boundaries.

## 10. UI Changes
- A/R Dashboard with Aging (Current, 1-7 Days, 8-30 Days, etc.).
- Natural Language Finance UI component (Chat interface).
- Provider Capability toggles in Business Settings.

## 11. AI Capabilities
- Implement LangChain / OpenAI layer for translating natural language into structured queries on the Firestore db.
- Prompt templates for Invoice creation from text.

## 12. Security Risks
- Generating PDFs and interacting with NRS APIs completely client-side.
- Potential exposure of API keys if environment variables leak in Vite build.

## 13. Compliance Risks
- Relying on client-side time/date for tax calculations.
- Immutability of invoices post-transmission to NRS is not strongly enforced server-side.

## 14. Testing gaps
- Extensive UI unit tests exist, but critical backend paths (e.g. webhook verification, idempotency) are untested.

## 15. Production Blockers
- Mocked Paystack implementations.
- Lack of server-side NRS transmission pipeline.

## 16. Aura Integration Strategy
- Build a generic `EventPublisher` in Firebase Functions.
- When `invoice.paid` or `invoice.sent` occurs, publish to an EventBus (e.g., Google Cloud Pub/Sub) that Aura can subscribe to.
- Maintain stable IDs across systems.

## 17. Recommended Implementation Order
1. **Security & Refactor**: Move NRS API calls and Payment initialization to Firebase/Vercel Functions.
2. **Provider Abstraction**: Implement `PaymentService` and `NotificationService` interfaces.
3. **Webhook Robustness**: Build the Webhook event storage and idempotency pipeline.
4. **Data Modeling**: Update Firestore models to explicitly separate User from Business and introduce PaymentRecords.
5. **Dashboard & A/R**: Build the Accounts Receivable and Aging UI.
6. **Automation**: Implement Collection reminder cron jobs.
7. **Aura Pipeline**: Introduce Domain Events logging.
8. **AI Assistant**: Add the Natural Language Finance chat layer.
