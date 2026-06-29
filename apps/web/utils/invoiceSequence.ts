const STORAGE_KEY = 'invoiceapp_invoice_sequence';

function getCurrentSequence(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (data.month === currentMonth) {
        return data.sequence;
      }
      return 0;
    }
  } catch {}
  return 0;
}

function saveSequence(sequence: number): void {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ month, sequence }));
}

export function generateSequentialInvoiceNumber(prefix: string = 'INV'): string {
  const sequence = getCurrentSequence() + 1;
  saveSequence(sequence);
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${now.getFullYear()}-${month}-${String(sequence).padStart(4, '0')}`;
}

export function getInvoiceSequencePreview(): string {
  const next = getCurrentSequence() + 1;
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `INV-${now.getFullYear()}-${month}-${String(next).padStart(4, '0')}`;
}
