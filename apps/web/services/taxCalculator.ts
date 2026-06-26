export interface TaxItem {
  description: string;
  amount: number;
  type: 'standard' | 'exempt' | 'zero-rated';
}

export interface Invoice {
  items: TaxItem[];
  whtType?: 'professional' | 'contract' | 'rent' | 'dividend';
}

export interface TaxBreakdown {
  subtotal: number;
  vat: number;
  wht: number;
  stampDuty: number;
  totalTax: number;
  grandTotal: number;
  vatRate: number;
  whtRate: number;
}

const VAT_RATE = 0.075;

const WHT_RATES: Record<string, number> = {
  professional: 0.10,
  contract: 0.05,
  rent: 0.10,
  dividend: 0.10,
};

export function calculateVAT(subtotal: number): number {
  return Math.round(subtotal * VAT_RATE * 100) / 100;
}

export function calculateWHT(amount: number, type: string): number {
  const rate = WHT_RATES[type] ?? 0;
  return Math.round(amount * rate * 100) / 100;
}

export function calculateStampDuty(amount: number): number {
  if (amount <= 1000) return 50;
  if (amount <= 5000) return 100;
  if (amount <= 50000) return 200;
  return 500;
}

export function getVATableTotal(items: TaxItem[]): number {
  return items
    .filter((item) => item.type === 'standard')
    .reduce((sum, item) => sum + item.amount, 0);
}

export function calculateTotalTax(invoice: Invoice): number {
  const breakdown = getTaxBreakdown(invoice);
  return breakdown.totalTax;
}

export function getTaxBreakdown(invoice: Invoice): TaxBreakdown {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const vatableTotal = getVATableTotal(invoice.items);
  const vat = calculateVAT(vatableTotal);

  const whtType = invoice.whtType ?? 'professional';
  const wht = calculateWHT(subtotal, whtType);
  const stampDuty = calculateStampDuty(subtotal);

  const totalTax = vat + stampDuty;
  const grandTotal = subtotal + totalTax - wht;

  return {
    subtotal,
    vat,
    wht,
    stampDuty,
    totalTax,
    grandTotal,
    vatRate: VAT_RATE,
    whtRate: WHT_RATES[whtType] ?? 0,
  };
}
