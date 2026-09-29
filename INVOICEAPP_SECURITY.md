# INVOICEAPP.NG - Security Architecture

## 1. Secrets Management
- No API Keys (Paystack, Flutterwave, FIRS) in the frontend.
- All keys must reside in Firebase Environment config / Vercel Environment variables.

## 2. API Security
- Firestore Security Rules enforce tenant isolation.
- Webhooks must be cryptographically verified.

## 3. Data Integrity
- Invoices transition to an immutable state once submitted to NRS or Paid. Edit capabilities are locked; changes require Credit Notes or Voids.
- Audit trails track `actor`, `action`, `resource_id`, and `timestamp`.

## 4. PII Protection
- Mask sensitive identifiers in logs (e.g., TINs, Account Numbers).
