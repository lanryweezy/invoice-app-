export type DocumentType = 'invoice' | 'contract' | 'receipt';

export interface StampDutyResult {
  type: DocumentType;
  amount: number;
  rate: number;
  stampType: 'electronic' | 'physical';
  receiptNumber: string;
  date: string;
}

const STAMP_DUTY_RATES: Record<DocumentType, number> = {
  invoice: 50,
  contract: 200,
  receipt: 50,
};

export function getStampDutyRate(type: DocumentType): number {
  return STAMP_DUTY_RATES[type] ?? 50;
}

export function calculateStampDuty(
  type: DocumentType,
  _amount: number
): StampDutyResult {
  const rate = getStampDutyRate(type);
  return {
    type,
    amount: rate,
    rate,
    stampType: 'electronic',
    receiptNumber: `SD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    date: new Date().toISOString(),
  };
}

export function generateStampReceipt(invoice: {
  id: string;
  type?: DocumentType;
  amount: number;
}): StampDutyResult {
  const docType = invoice.type ?? 'invoice';
  const result = calculateStampDuty(docType, invoice.amount);
  result.receiptNumber = `SD-${invoice.id}-${Date.now()}`;
  return result;
}
