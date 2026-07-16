import { LineItem } from '../types';

export interface TaxBreakdown {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  whtAmount: number;
  stampDuty: number;
  shipping: number;
  total: number;
}

export function calculateVAT(amount: number, rate: number = 7.5): number {
  return amount * (rate / 100);
}

export function calculateWHT(amount: number, rate: number = 5): number {
  return amount * (rate / 100);
}

export function calculateStampDuty(amount: number): number {
  if (amount <= 1000) return 0;
  if (amount <= 5000) return 10;
  if (amount <= 50000) return 20;
  if (amount <= 100000) return 50;
  return 100;
}

export function getTaxBreakdown(
  lineItems: LineItem[],
  taxRate: number = 7.5,
  whtRate: number = 5,
  discountRate: number = 0,
  discountType: 'percentage' | 'fixed' = 'percentage',
  shippingAmount: number = 0
): TaxBreakdown {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discountRate / 100);
  } else {
    discountAmount = discountRate;
  }

  const taxableAmount = subtotal - discountAmount;

  const standardItems = lineItems.filter(
    (item) => !item.taxCategory || item.taxCategory === 'Standard'
  );
  const standardSubtotal = standardItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const standardTaxableAmount =
    discountType === 'percentage'
      ? standardSubtotal * (1 - discountRate / 100)
      : standardSubtotal - discountAmount * (standardSubtotal / subtotal || 0);

  const vatAmount = calculateVAT(standardTaxableAmount, taxRate);
  const whtAmount = calculateWHT(taxableAmount, whtRate);
  const stampDuty = calculateStampDuty(taxableAmount);
  const total = taxableAmount + vatAmount - whtAmount + stampDuty + shippingAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    vatAmount,
    whtAmount,
    stampDuty,
    shipping: shippingAmount,
    total,
  };
}
