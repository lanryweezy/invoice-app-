import type { Invoice } from '../types';

export const generateEmailTemplate = (invoice: Invoice): string => {
  const { user, client, invoiceNumber, total, dueDate, currency, notes, lineItems } = invoice;
  
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  const formattedTotal = currencyFormatter.format(total || 0);

  // Create a simple list of items for the email body
  const itemsList = lineItems
    .map(item => `- ${item.description} (${item.quantity} x ${currencyFormatter.format(Number(item.price))})`)
    .join('\n');

  return `Subject: Invoice ${invoiceNumber} from ${user.name}

Dear ${client.name},

I hope this email finds you well.

Please find attached invoice ${invoiceNumber} for the following services:

${itemsList}

Total Amount Due: ${formattedTotal}
Due Date: ${dueDate}

PAYMENT DETAILS:
Bank Name: ${user.bankName}
Account Number: ${user.accountNumber}
Account Name: ${user.name}

${notes ? `Note: ${notes}` : ''}

If you have any questions regarding this invoice, please don't hesitate to reach out.

Thank you for your business!

Best regards,

${user.name}
${user.email}
${user.address}`;
};