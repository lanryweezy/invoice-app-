# INVOICEAPP.NG - API Architecture

## Overview
The API layer must enforce isolation, security, and cleanly abstract underlying providers.

## Target Endpoints

### Invoices
`POST /api/invoices` - Create draft
`GET /api/invoices` - List invoices
`GET /api/invoices/:id` - Get invoice details
`PATCH /api/invoices/:id` - Update invoice
`POST /api/invoices/:id/send` - Send to client
`POST /api/invoices/:id/cancel` - Cancel/Void

### Payments
`POST /api/payments/initialize` - Initialize payment via active provider
`POST /api/payments/verify` - Verify payment status
`GET /api/payments/:id` - Get payment record

### Receipts
`POST /api/receipts` - Generate receipt
`GET /api/receipts/:id` - Fetch receipt

### Customers
`POST /api/customers` - Create customer
`GET /api/customers/:id` - Get customer ledger

### NRS / E-Invoicing
`POST /api/nrs/invoices` - Submit to FIRS
`GET /api/nrs/invoices/:id/status` - Check submission status

### Webhooks
`POST /api/webhooks/paystack`
`POST /api/webhooks/flutterwave`
`POST /api/webhooks/nrs`

## Security
- Authentication required for all non-webhook, non-public endpoints.
- Organization isolation enforced at the data layer.
- Webhooks must verify signatures (e.g. `x-paystack-signature`).
