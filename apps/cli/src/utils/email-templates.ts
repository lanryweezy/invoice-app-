import { Invoice } from '../types';
import { formatCurrency, formatDate } from './formatter';

/**
 * 🔩 Hinge Extension Point: EmailTemplateStrategy
 *
 * Pressure: The `send` command had a growing `switch (template)` block
 * that needed modification every time a new email template was added.
 *
 * Contract:
 * - Implementors provide a function taking an `Invoice` and config object.
 * - The strategy is responsible for returning an object containing `subject` and `body` strings.
 */
export type EmailTemplateStrategy = (invoice: Invoice, config: any) => { subject: string; body: string };

export const emailTemplateStrategies = new Map<string, EmailTemplateStrategy>();

export function registerEmailTemplateStrategy(name: string, strategy: EmailTemplateStrategy): void {
  emailTemplateStrategies.set(name, strategy);
}

const getSharedVars = (invoice: Invoice, config: any) => {
  const amount = formatCurrency(invoice.total || 0, invoice.currency);
  const itemsList = invoice.lineItems
    .map((item) => `- ${item.description}: ${formatCurrency(item.price * item.quantity, invoice.currency)}`)
    .join('\n');

  const bankDetails = config.bankName
    ? `\nBank: ${config.bankName}\nAccount: ${config.bankAccount}\nSort Code: ${config.bankSortCode}`
    : '';

  return { amount, itemsList, bankDetails };
};

registerEmailTemplateStrategy('casual', (invoice, config) => {
  const { amount, itemsList, bankDetails } = getSharedVars(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: `Hi ${invoice.client.name}! Here's your invoice ${invoice.invoiceNumber}:

${itemsList}

Total: ${amount}
Due: ${formatDate(invoice.dueDate)}
${bankDetails}

Best regards,
${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('followup', (invoice, config) => {
  const { amount } = getSharedVars(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber} - Payment Reminder`,
    body: `Hi ${invoice.client.name},

This is a friendly reminder about invoice ${invoice.invoiceNumber} for ${amount} which was due on ${formatDate(invoice.dueDate)}.

Please let us know if you have any questions.

Best regards,
${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('overdue', (invoice, config) => {
  const { amount, bankDetails } = getSharedVars(invoice, config);
  return {
    subject: `URGENT: Invoice ${invoice.invoiceNumber}`,
    body: `URGENT: Invoice ${invoice.invoiceNumber} for ${amount} is now past due. Please arrange immediate payment.

${bankDetails}

Contact us if you need to discuss payment arrangements.

${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('formal', (invoice, config) => {
  const { amount, itemsList, bankDetails } = getSharedVars(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: `Dear ${invoice.client.name},

Please find below the details for invoice ${invoice.invoiceNumber}:

${itemsList}

Amount Due: ${amount}
Due Date: ${formatDate(invoice.dueDate)}

Payment Details:${bankDetails}

Thank you for your valued business.

Best regards,
${config.businessName || 'InvoiceApp'}`
  };
});

export function generateEmailContent(invoice: Invoice, template: string, config: any): { subject: string; body: string } {
  const strategy = emailTemplateStrategies.get(template) || emailTemplateStrategies.get('formal')!;
  return strategy(invoice, config);
}
