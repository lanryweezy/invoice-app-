# INVOICEAPP.NG - Tax Engine

## Architecture
- Tax calculation logic must remain pure and separated from UI rendering components.
- Currently, logic lives in `calculateVATAmount` and `computeTotals` in `services/eInvoicing.ts` and `services/taxCalculator.ts`.

## Rules
- Support configurable VAT (Standard is 7.5% in Nigeria).
- Support WHT (Withholding Tax) calculations.
- Tax details must be saved to the database *as they were at the time of calculation* to prevent historical invoices from shifting if rates change in the future.
- Each line item can have independent Tax Categories (Standard, ZeroRated, Exempt).

## Output Requirement
Taxes calculated here must seamlessly map to the FIRS/NRS expected JSON/XML schema.
