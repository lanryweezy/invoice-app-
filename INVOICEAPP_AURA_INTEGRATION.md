# INVOICEAPP.NG - Aura Integration

## Product Positioning
InvoiceApp = Revenue & Collections Layer.
Aura = Business Operating System (Ledger, Accounting, Operations).

## Domain Events Strategy
InvoiceApp will not depend on Aura. Instead, InvoiceApp will emit events that Aura consumes.

Events:
- `invoice.created`
- `invoice.sent`
- `payment.success`
- `nrs.submitted`

## Mechanics
InvoiceApp -> Pub/Sub (or Firestore Event Bus) -> Aura Ledger.

Aura can compute cashflow, budgets, and balance sheets off these immutable financial events.
