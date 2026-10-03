# INVOICEAPP.NG - NRS E-Invoicing

## Current Implementation
- Full TypeScript SDK implemented in `apps/web/services/eInvoicing.ts` and `apps/web/services/nrsApi.ts`.
- Validates payload against FIRS specs.
- Calculates standard 7.5% VAT (configurable).
- Submits XML/JSON payload to FIRS endpoint (`https://api.nrs.gov.ng`).

## Action Items
1. **Server-Side Shift**: Move the actual API transmission (`fetch` calls) to Firebase Functions to protect API Keys/TINs from client exposure.
2. **Status Machine**:
   - `LOCAL_DRAFT`
   - `READY_FOR_NRS`
   - `SUBMITTED`
   - `VALIDATED`
   - `TRANSMITTED`
   - `ACCEPTED` / `REJECTED`
3. **Database Map**: Maintain `nrs_invoice_id` alongside internal `invoice_id`. Never replace internal ID.
