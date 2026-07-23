import type { Invoice } from '../types';
import { formatCurrency } from './formatters';

export type EmailTemplateType = 'formal' | 'casual' | 'followup' | 'overdue' | (string & {});

export interface EmailTemplate {
  id: EmailTemplateType;
  name: string;
  description: string;
  icon: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'formal', name: 'Formal', description: 'Professional business tone', icon: '👔' },
  { id: 'casual', name: 'Casual', description: 'Friendly and relaxed', icon: '😊' },
  { id: 'followup', name: 'Follow-up', description: 'Gentle payment reminder', icon: '🔔' },
  { id: 'overdue', name: 'Overdue', description: 'Urgent past-due notice', icon: '⚠️' },
];

const currencyFmt = (amount: number, currency: string) =>
  formatCurrency(amount, currency, 'en-NG');

function itemsList(inv: Invoice): string {
  return inv.lineItems
    .map(item => `  - ${item.description} (${item.quantity} x ${currencyFmt(Number(item.price) || 0, inv.currency)})`)
    .join('\n');
}

function bankDetails(inv: Invoice): string {
  return [
    `Bank: ${inv.user.bankName}`,
    `Account: ${inv.user.accountNumber}`,
    `Name: ${inv.user.name}`,
  ].join('\n');
}

const templates: Record<string, (inv: Invoice) => { subject: string; body: string }> = {
  formal: (inv) => ({
    subject: `Invoice ${inv.invoiceNumber} from ${inv.user.name}`,
    body: `Dear ${inv.client.name},

I hope this message finds you well.

Please find below the details for invoice ${inv.invoiceNumber}:

Services Provided:
${itemsList(inv)}

Amount Due: ${currencyFmt(inv.total || 0, inv.currency)}
Due Date: ${inv.dueDate}

Payment Instructions:
${bankDetails(inv)}

${inv.notes ? `Additional Notes: ${inv.notes}\n\n` : ''}Kindly ensure payment is made by the due date to avoid any late fees.

Should you have any questions regarding this invoice, please do not hesitate to contact me.

Thank you for your valued business.

Best regards,
${inv.user.name}
${inv.user.email}
${inv.user.address}`,
  }),

  casual: (inv) => ({
    subject: `Hey ${inv.client.name} — here's your invoice`,
    body: `Hi ${inv.client.name}! 👋

Hope you're doing well! Here's the invoice for the work we've done together:

${itemsList(inv)}

Total: ${currencyFmt(inv.total || 0, inv.currency)}
Due: ${inv.dueDate}

Payment details:
${bankDetails(inv)}

${inv.notes ? `Note: ${inv.notes}\n\n` : ''}Let me know if you have any questions. Thanks for working with me!

Cheers,
${inv.user.name}`,
  }),

  followup: (inv) => ({
    subject: `Gentle reminder: Invoice ${inv.invoiceNumber} — ${currencyFmt(inv.total || 0, inv.currency)}`,
    body: `Hi ${inv.client.name},

I hope you're doing well. I wanted to follow up on invoice ${inv.invoiceNumber} which was issued on ${inv.issueDate}.

Invoice Summary:
${itemsList(inv)}

Amount Due: ${currencyFmt(inv.total || 0, inv.currency)}
Due Date: ${inv.dueDate}

Payment Details:
${bankDetails(inv)}

If you've already made payment, please disregard this message. If not, I'd appreciate it if you could process the payment at your earliest convenience.

Thank you!

Best,
${inv.user.name}`,
  }),

  overdue: (inv) => ({
    subject: `OVERDUE: Invoice ${inv.invoiceNumber} — Immediate Payment Required`,
    body: `Dear ${inv.client.name},

This is to formally notify you that invoice ${inv.invoiceNumber}, originally due on ${inv.dueDate}, is now overdue.

Invoice Details:
${itemsList(inv)}

Outstanding Amount: ${currencyFmt(inv.total || 0, inv.currency)}
Original Due Date: ${inv.dueDate}
Days Overdue: ${Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000))}

Payment Instructions:
${bankDetails(inv)}

Please arrange for immediate payment of this outstanding balance. Failure to settle this invoice may result in additional late fees and suspension of services.

If you have already sent payment, please disregard this notice and accept our apologies for the reminder.

Regards,
${inv.user.name}
${inv.user.email}
${inv.user.address}`,
  }),
};

export function generateEmailTemplate(inv: Invoice, templateType: EmailTemplateType = 'formal'): string {
  const template = templates[templateType] || templates['formal'];
  const { subject, body } = template(inv);
  const footer = `\n\n---\nCreated with InvoiceApp.ng — free invoicing for Nigerian businesses\nhttps://www.invoiceapp.ng`;
  return `Subject: ${subject}\n\n${body}${footer}`;
}

export function getEmailSubject(inv: Invoice, templateType: EmailTemplateType = 'formal'): string {
  const template = templates[templateType] || templates['formal'];
  return template(inv).subject;
}

export function getEmailBody(inv: Invoice, templateType: EmailTemplateType = 'formal'): string {
  const template = templates[templateType] || templates['formal'];
  return template(inv).body;
}

/**
 * 🔩 Hinge Extension Point: EmailTemplateStrategy
 *
 * Pressure: The email generator required modifying a central type, array, and map to add a new template.
 * Contract: Implementors provide metadata (id, name, description, icon) and a generator
 *           function returning { subject, body }. The core handles fallback and the footer signature.
 */
export interface EmailTemplateStrategy extends EmailTemplate {
  generate: (inv: Invoice) => { subject: string; body: string };
}

export function registerEmailTemplate(strategy: EmailTemplateStrategy): void {
  const { generate, ...metadata } = strategy;
  if (!EMAIL_TEMPLATES.some(t => t.id === strategy.id)) {
    EMAIL_TEMPLATES.push(metadata);
  }
  templates[strategy.id] = generate;
}

// 🧪 Forge: Generate attachment metadata
export function generateAttachmentOptions(inv: Invoice, includePdf = true): any[] {
  const attachments = [];
  if (includePdf) {
     attachments.push({
         filename: `Invoice_${inv.invoiceNumber}.pdf`,
         type: 'application/pdf',
         content: 'BASE64_PLACEHOLDER_PDF_CONTENT'
     });
  }
  return attachments;
}
