# INVOICEAPP.NG - Payment Reconciliation

## Core Concept
Do not mutate invoice statuses directly from a webhook. Create an immutable `PaymentRecord` that ties back to the invoice.

## Schema
`PaymentRecords`:
- `id` (uuid)
- `invoice_id`
- `customer_id`
- `provider` (e.g. 'Paystack')
- `provider_transaction_id`
- `amount`
- `currency`
- `status` (PENDING, SUCCESS, FAILED, REFUNDED)
- `timestamp`
- `provider_metadata` (JSON dump)

## Flow
PROVIDER TRANSACTION -> PAYMENT RECORD -> UPDATE INVOICE BALANCE -> GENERATE RECEIPT.

This explicit lineage ensures accurate financial reporting and allows clean synchronization into the Aura Ledger.
