# INVOICEAPP.NG - Payments Infrastructure

## Concept
Do not hard-code directly to Paystack in business logic. Use a `PaymentService` adapter.

## Core Interface
```typescript
interface PaymentProvider {
  initialize(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink>;
  verify(reference: string): Promise<PaymentStatus>;
  refund(transactionId: string, amount?: number): Promise<RefundStatus>;
  createVirtualAccount(customer: Customer): Promise<VirtualAccount>;
}
```

## Current State
- **Paystack**: Webhook stubbed in Firebase (`functions/index.js`), verifying transaction using standard `verifyTransaction` API call. DVA (Dedicated Virtual Accounts) needs mapping to Invoice references.
- **Flutterwave**: Missing adapter. Needs implementation using standard API requirements.
- **Payment Link**: Currently generated via standard Paystack inline standard checkout UI. Must be shifted to a generated Public URL containing the Payment Gateway abstraction.
