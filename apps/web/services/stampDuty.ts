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
    // Security Fix: Prevent predictable receipt numbers
    receiptNumber: (() => {
      const array = new Uint8Array(4);
      crypto.getRandomValues(array);
      const randomStr = Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 4);
      return `SD-${Date.now()}-${randomStr}`;
    })(),
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
