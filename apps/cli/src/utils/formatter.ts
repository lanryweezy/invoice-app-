import { Currency, Invoice } from '../types';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: Currency): string {
  if (!currencyFormatters.has(currency)) {
    currencyFormatters.set(currency, new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }));
  }
  return currencyFormatters.get(currency)!.format(amount);
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateISO(date: string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

export function parseItemsString(items: string): { description: string; amount: number }[] {
  if (!items) return [];
  return items.split(',').map((item) => {
    const [description, amountStr] = item.split(':');
    return {
      description: description.trim(),
      amount: parseFloat(amountStr) || 0,
    };
  });
}

export function generateInvoiceNumber(invoices: Invoice[]): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `INV-${year}-${month}`;

  const existingNumbers = invoices
    .map((inv) => inv.invoiceNumber)
    .filter((num) => num && num.startsWith(prefix))
    .map((num) => {
      const match = num.match(/-(\d{4})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}
