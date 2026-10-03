# INVOICEAPP.NG - Current Architecture

## Core Tech Stack
- **Frontend Framework:** React 19, React Router DOM, Vite.
- **Styling:** Tailwind CSS (v4).
- **State Management:** Zustand for global state, React Hooks for component state.
- **Backend/API Layer:** Vercel serverless functions (e.g. `api/send-email.ts`) and Firebase Cloud Functions (`functions/index.js`).
- **Database:** Firebase Firestore, with offline IndexedDB persistence enabled.
- **Authentication:** Firebase Auth (Google Provider + Email/Password).
- **PDF Generation:** Client-side using `html-to-image` and `jspdf`.
- **Testing:** Vitest, Testing Library (React/DOM).

## Product Modules
- **Invoicing:** `InvoiceForm`, `InvoicePreview`. Generates standard Tax Invoices, Pro-formas, Quotes, and Receipts.
- **Clients (Customer Management):** Handled via `Client` interface and hooks (`useInvoice-clients.ts`).
- **Payments & Billing:** Paystack integrations partially implemented (mocked in places), handling dedicated virtual accounts (DVA) or Webhooks.
- **NRS E-Invoicing:** Client-side module `services/eInvoicing.ts` & `services/nrsApi.ts` integrated directly with FIRS/NRS endpoints. Computes tax (VAT, WHT) and validates payload before submission.
- **Client Portal:** Standalone view (`ClientPortalView.tsx`) to allow clients to view invoices via portal token.

## Existing Models (Data Structures)
- **User / BusinessProfile:** Holds business information, TIN, CAC, bank details, logo, and payment link config.
- **Client:** Customer information (Name, Email, Address, TIN, CAC).
- **Invoice:** Highly structured. Captures LineItems, Tax/WHT rates, Discount, Shipping, totals, status, NRS compliance status, and portal interactions.
- **LineItem:** Individual invoice row items including unit of measure and tax category.
- **Expense:** Basic expense tracking model.
- **Receipt:** Records payment method, transaction reference, amount, and invoice snapshot.

## Missing or Incomplete Capabilities
- Multi-tenant Organization/Business model (currently tied to 1 User = 1 BusinessProfile).
- Robust Server-Side Payment Provider abstraction (currently mostly Paystack-specific or mocked).
- Formal Webhook System (Firebase functions have some Paystack code, but need structured idempotency and multiple providers).
- AI Financial Assistant (no current AI layer exists in the codebase).
- Comprehensive Audit Log storage (some trails exist client-side but need a robust server-side Ledger feed).
