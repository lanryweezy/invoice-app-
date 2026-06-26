export interface Invoice {
  id: string;
  clientName: string;
  clientTIN?: string;
  amount: number;
  description: string;
  date: string;
}

export interface WHTCertificate {
  invoiceId: string;
  payer: string;
  payerTIN?: string;
  payee: string;
  amount: number;
  whtType: string;
  whtRate: number;
  whtAmount: number;
  date: string;
  certificateNumber: string;
}

export interface WHTSummary {
  totalInvoiced: number;
  totalWHT: number;
  byType: Record<string, { count: number; invoiced: number; wht: number }>;
}

export type WHTType = 'professional' | 'contract' | 'rent' | 'dividend';

const WHT_RATES: Record<WHTType, number> = {
  professional: 0.10,
  contract: 0.05,
  rent: 0.10,
  dividend: 0.10,
};

const WHT_KEYWORDS: Record<WHTType, string[]> = {
  professional: ['consulting', 'professional', 'legal', 'accounting', 'audit', 'advisory', 'management fee'],
  contract: ['contract', 'subcontract', 'construction', 'supply', 'procurement'],
  rent: ['rent', 'lease', 'tenancy', 'accommodation', 'office space'],
  dividend: ['dividend', 'distribution', 'profit share', 'bonus'],
};

export function detectWHTType(description: string): WHTType {
  const lower = description.toLowerCase();
  for (const [type, keywords] of Object.entries(WHT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return type as WHTType;
    }
  }
  return 'professional';
}

export function calculateWHT(amount: number, type: WHTType): number {
  const rate = WHT_RATES[type] ?? 0.10;
  return Math.round(amount * rate * 100) / 100;
}

export function generateWHTCertificate(invoice: Invoice): WHTCertificate {
  const whtType = detectWHTType(invoice.description);
  const whtRate = WHT_RATES[whtType];
  const whtAmount = calculateWHT(invoice.amount, whtType);
  const certNumber = `WHT-${invoice.id}-${Date.now()}`;

  return {
    invoiceId: invoice.id,
    payer: invoice.clientName,
    payerTIN: invoice.clientTIN,
    payee: invoice.clientName,
    amount: invoice.amount,
    whtType,
    whtRate,
    whtAmount,
    date: invoice.date,
    certificateNumber: certNumber,
  };
}

export function getWHTSummary(invoices: Invoice[]): WHTSummary {
  const summary: WHTSummary = {
    totalInvoiced: 0,
    totalWHT: 0,
    byType: {},
  };

  for (const inv of invoices) {
    const type = detectWHTType(inv.description);
    const whtAmount = calculateWHT(inv.amount, type);

    summary.totalInvoiced += inv.amount;
    summary.totalWHT += whtAmount;

    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, invoiced: 0, wht: 0 };
    }
    summary.byType[type].count += 1;
    summary.byType[type].invoiced += inv.amount;
    summary.byType[type].wht += whtAmount;
  }

  summary.totalInvoiced = Math.round(summary.totalInvoiced * 100) / 100;
  summary.totalWHT = Math.round(summary.totalWHT * 100) / 100;

  return summary;
}
