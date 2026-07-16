# Jules Task: Test Coverage (Monday)

Write comprehensive unit tests for the InvoiceApp web app at apps/web/.

## Priority Files (test these first)
1. `utils/emailGenerator.ts` — test all 4 email templates (formal, casual, followup, overdue)
2. `services/taxCalculator.ts` — test VAT, WHT, stamp duty calculations
3. `services/qrCodeGenerator.ts` — test QR code generation
4. `utils/stampDuty.ts` — test stamp duty calculations
5. `services/structuredExport.ts` — test CSV/JSON export

## Test Framework
- Use Vitest (already configured)
- Use React Testing Library for component tests
- Mock Firebase with vi.mock('../services/firebase')
- Mock external APIs (Paystack, NIBSS)

## What to Test
- All exported functions: correct output for known inputs
- Edge cases: empty arrays, zero amounts, negative values, max values
- Error handling: invalid inputs, missing required fields
- Currency formatting: NGN, USD, EUR, GBP
- Date handling: timezone issues, invalid dates

## Rules
- Do NOT modify source files — only create .test.ts files
- Each test file should be self-contained
- Use descriptive test names: "calculates 7.5% VAT on standard items"
- Group tests with describe blocks by function/module
- Run `npx vitest run` to verify tests pass
