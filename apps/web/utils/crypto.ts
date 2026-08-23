import type { Invoice } from "../types";

export function generateSecureId(length: number = 6): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, length);
}

export function computeInvoiceHash(invoice: Invoice, includeDueDate: boolean = false): string {
  const payloadParts = [
    invoice.invoiceNumber,
    invoice.issueDate,
  ];

  if (includeDueDate) {
    payloadParts.push(invoice.dueDate);
  }

  payloadParts.push(
    invoice.user.tin || "",
    invoice.client.tin || "",
    invoice.client.name,
    String(invoice.total || 0),
    invoice.currency
  );

  const payload = payloadParts.join("|");

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
