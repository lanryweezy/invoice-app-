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

export type WHTType = 'professional' | 'contract' | 'rent' | 'dividend' | (string & {});

const WHT_RATES: Record<string, number> = {
  professional: 0.10,
  contract: 0.05,
  rent: 0.10,
  dividend: 0.10,
};

const WHT_KEYWORDS: Record<string, string[]> = {
  professional: ['consulting', 'professional', 'legal', 'accounting', 'audit', 'advisory', 'management fee'],
  contract: ['contract', 'subcontract', 'construction', 'supply', 'procurement'],
  rent: ['rent', 'lease', 'tenancy', 'accommodation', 'office space'],
  dividend: ['dividend', 'distribution', 'profit share', 'bonus'],
};

let WHT_TYPES = Object.keys(WHT_KEYWORDS) as WHTType[];
let WHT_COMPILED_PATTERN = Object.entries(WHT_KEYWORDS)
  .map(([type, keywords]) => `(?<${type}>${keywords.join('|')})`)
  .join('|');
let WHT_REGEX = new RegExp(WHT_COMPILED_PATTERN, 'i');

/**
 * 🔩 Hinge Extension Point: WHTCategoryStrategy
 *
 * Pressure: WHT_RATES and WHT_KEYWORDS were hardcoded maps, making it impossible
 * to add new WHT categories (like 'royalties' or 'commission') without modifying the core calculator.
 *
 * Contract:
 * - Implementors provide a unique `type` ID, a default `rate`, and an array of `keywords` for detection.
 * - Registration automatically rebuilds the detection regex to include the new category.
 */
export interface WHTCategoryStrategy {
  type: string;
  rate: number;
  keywords: string[];
}

export function registerWHTCategory(strategy: WHTCategoryStrategy): void {
  // Validate that type is a valid regex capture group identifier
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(strategy.type)) {
    throw new Error('Invalid category type. Must be a valid regex capture group identifier (e.g., letters, numbers, underscores).');
  }

  WHT_RATES[strategy.type] = strategy.rate;
  WHT_KEYWORDS[strategy.type] = strategy.keywords;

  WHT_TYPES = Object.keys(WHT_KEYWORDS) as WHTType[];
  WHT_COMPILED_PATTERN = Object.entries(WHT_KEYWORDS)
    .map(([type, keywords]) => `(?<${type}>${keywords.join('|')})`)
    .join('|');
  WHT_REGEX = new RegExp(WHT_COMPILED_PATTERN, 'i');
}

/**
 * Resets the WHT registry back to its default state.
 * Primarily intended for use in test environments to prevent state leakage.
 */
export function resetWHTCategories(): void {
  for (const key in WHT_RATES) {
    if (!['professional', 'contract', 'rent', 'dividend'].includes(key)) {
      delete WHT_RATES[key];
      delete WHT_KEYWORDS[key];
    }
  }

  WHT_TYPES = Object.keys(WHT_KEYWORDS) as WHTType[];
  WHT_COMPILED_PATTERN = Object.entries(WHT_KEYWORDS)
    .map(([type, keywords]) => `(?<${type}>${keywords.join('|')})`)
    .join('|');
  WHT_REGEX = new RegExp(WHT_COMPILED_PATTERN, 'i');
}

export function detectWHTType(description: string): WHTType {
  const match = WHT_REGEX.exec(description);
  if (match && match.groups) {
    for (const type of WHT_TYPES) {
      if (match.groups[type]) {
        return type;
      }
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
