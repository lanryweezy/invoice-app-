const STORAGE_KEY = 'invoiceapp_invoice_sequence';

// 🏗️ Mason: Extracted duplicated date parsing logic to a single source of truth
function getCurrentYearAndMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return { year, month, yearMonth: `${year}-${month}` };
}

function getCurrentSequence(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const { yearMonth } = getCurrentYearAndMonth();
      if (data.month === yearMonth) {
        return data.sequence;
      }
      return 0;
    }
  } catch {}
  return 0;
}

function saveSequence(sequence: number): void {
  const { yearMonth } = getCurrentYearAndMonth();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ month: yearMonth, sequence }));
}

export function generateSequentialInvoiceNumber(prefix: string = 'INV'): string {
  const sequence = getCurrentSequence() + 1;
  saveSequence(sequence);
  const { year, month } = getCurrentYearAndMonth();
  return `${prefix}-${year}-${month}-${String(sequence).padStart(4, '0')}`;
}

export function getInvoiceSequencePreview(): string {
  const next = getCurrentSequence() + 1;
  const { year, month } = getCurrentYearAndMonth();
  return `INV-${year}-${month}-${String(next).padStart(4, '0')}`;
}
