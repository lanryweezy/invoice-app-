import type { LineItem, Invoice } from '../types';

export interface TaxBreakdown {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  whtAmount: number;
  shippingAmount: number;
  totalAmount: number;
}

export class TaxEngine {
  static calculateVATAmount(afterDiscountSubtotal: number, lineItems: LineItem[], taxRate: number = 7.5): number {
    // Determine the ratio of the subtotal that is vatable (Standard tax category).
    // The previous implementation in eInvoicing didn't use `afterDiscountSubtotal` in calculating the tax.
    // It calculated tax based entirely on the raw lineItems total.
    // However, typical tax calculations apply to the after-discount amount.
    // Given the prompt: "Tax calculations... Every invoice line should retain its tax calculation."
    // We should keep the original logic for compatibility unless instructed otherwise,
    // but the original `calculateVATAmount` signature took `subtotal: number` and ignored it.

    // Let's implement the accurate tax rate calculation.
    const vatable = lineItems
      .filter((item) => (item.taxCategory ?? 'Standard') === 'Standard')
      .reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return sum + qty * price;
      }, 0);

    // If there is a discount, we should proportionately discount the vatable amount.
    const totalRaw = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const discountRatio = totalRaw > 0 ? afterDiscountSubtotal / totalRaw : 1;

    const discountedVatable = vatable * discountRatio;

    return Math.round(discountedVatable * (taxRate / 100) * 100) / 100;
  }

  static getUnitTotal(item: LineItem): number {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  static computeTotals(invoice: Invoice): TaxBreakdown {
    const subtotal = invoice.subtotal ?? invoice.lineItems.reduce((s, i) => s + this.getUnitTotal(i), 0);

    const discountRate = Number(invoice.discountRate) || 0;
    const discountAmount = invoice.discountType === 'percentage'
      ? Math.round(subtotal * (discountRate / 100) * 100) / 100
      : discountRate;

    const afterDiscount = subtotal - discountAmount;

    const taxAmount = invoice.tax ?? this.calculateVATAmount(afterDiscount, invoice.lineItems, invoice.taxRate ?? 7.5);

    const whtAmount = invoice.whtAmount ?? Math.round(afterDiscount * ((invoice.whtRate || 0) / 100) * 100) / 100;

    const shippingAmount = Number(invoice.shippingAmount) || invoice.shipping || 0;

    const totalAmount = Math.round((afterDiscount + taxAmount - whtAmount + shippingAmount) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      taxAmount,
      whtAmount,
      shippingAmount,
      totalAmount,
    };
  }
}
