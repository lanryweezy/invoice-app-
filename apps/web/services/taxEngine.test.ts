import { describe, it, expect } from 'vitest';
import { TaxEngine } from './taxEngine';

describe('TaxEngine', () => {
  it('calculates VAT strictly for Standard tax category line items with discount proportion applied', () => {
    const lineItems: any[] = [
      { quantity: 2, price: 1000, taxCategory: 'Standard' }, // 2000
      { quantity: 1, price: 500, taxCategory: 'Exempt' },    // 500
    ];

    // Raw total = 2500. Vatable raw = 2000.
    // If afterDiscount is 2000 (meaning a 500 discount was applied), the ratio is 2000/2500 = 0.8
    // Discounted vatable = 2000 * 0.8 = 1600.
    // Tax at 7.5% = 1600 * 0.075 = 120.
    const vat = TaxEngine.calculateVATAmount(2000, lineItems, 7.5);
    expect(vat).toBe(120);
  });

  it('computes full invoice totals correctly', () => {
    const invoice: any = {
      lineItems: [
        { quantity: 2, price: 1000, taxCategory: 'Standard' } // 2000
      ],
      discountRate: 10,
      discountType: 'percentage',
      taxRate: 7.5,
      whtRate: 5,
      shippingAmount: 500
    };

    const totals = TaxEngine.computeTotals(invoice);

    expect(totals.subtotal).toBe(2000);
    expect(totals.discountAmount).toBe(200); // 10% of 2000

    // After discount: 1800
    // Tax is 7.5% of 1800 = 135
    expect(totals.taxAmount).toBe(135);

    // WHT is 5% of 1800 = 90
    expect(totals.whtAmount).toBe(90);

    // Total: 1800 + 135 - 90 + 500 = 2345
    expect(totals.totalAmount).toBe(2345);
  });
});
