import { Command } from 'commander';
import { ensureAuthenticated, getConfig } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';
import chalk from 'chalk';
import { Invoice } from '../types';

export default function registerSendCommand(program: Command): void {
  program
    .command('send <invoice-number>')
    .description('Send invoice via email')
    .option('-e, --email <email>', 'Recipient email (default: client email from invoice)')
    .option('-t, --template <template>', 'Email template (formal|casual|followup|overdue)', 'formal')
    .option('-s, --subject <subject>', 'Email subject override')
    .action(async (invoiceNumber: string, options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        if (!config.smtp?.host || !config.smtp?.user || !config.smtp?.pass) {
          console.error(chalk.red('SMTP configuration incomplete. Run "invoiceapp auth config init" to set up email.'));
          process.exit(1);
        }

        const spinner = createSpinner('Loading invoice...');

        try {
          const snapshot = await getDb()
            .collection(`users/${uid}/invoices`)
            .where('invoiceNumber', '==', invoiceNumber)
            .get();

          if (snapshot.empty) {
            fail(spinner, chalk.red(`Invoice ${invoiceNumber} not found`));
            process.exit(1);
          }

          const doc = snapshot.docs[0];
          const invoice = doc.data() as Invoice;

          const recipientEmail = options.email || invoice.client.email;
          if (!recipientEmail) {
            fail(spinner, chalk.red('No recipient email provided. Use --email flag or ensure invoice has client email.'));
            process.exit(1);
          }

          spinner.text = 'Sending email...';

          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port || 587,
            secure: config.smtp.secure || false,
            auth: {
              user: config.smtp.user,
              pass: config.smtp.pass,
            },
          });

          const strategy = emailTemplates.get(options.template) || emailTemplates.get('formal')!;
          const templateData = strategy(invoice, config);
          const emailBody = templateData.body;
          const subject = options.subject || templateData.subject;

          await transporter.sendMail({
            from: `"${config.businessName || 'InvoiceApp'}" <${config.smtp.user}>`,
            to: recipientEmail,
            subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          });

          await doc.ref.update({ status: 'Sent', updatedAt: new Date().toISOString() });

          succeed(spinner, chalk.green(`Invoice ${invoiceNumber} sent successfully to ${recipientEmail}`));

          console.log('\nEmail Details:');
          console.log(`  To: ${recipientEmail}`);
          console.log(`  Subject: ${subject}`);
          console.log(`  Template: ${options.template}`);
          console.log(`  Status: Updated to "Sent"`);
        } catch (error: any) {
          fail(spinner, chalk.red('Failed to send invoice'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * 🔩 Hinge Extension Point: EmailTemplateStrategy
 *
 * Pressure: The `send` command had growing `switch` blocks in `generateEmailBody` and `generateSubject`
 * that needed modification every time a new email template was added.
 *
 * Contract:
 * - Implementors provide a function that takes an `Invoice` and `config`.
 * - The strategy must return an object containing both `{ subject: string, body: string }`
 *   to prevent fragmented extension points.
 */
export type EmailTemplateStrategy = (invoice: Invoice, config: any) => { subject: string; body: string };

const emailTemplates = new Map<string, EmailTemplateStrategy>();

export function registerEmailTemplateStrategy(name: string, strategy: EmailTemplateStrategy): void {
  emailTemplates.set(name, strategy);
}

function getCommonData(invoice: Invoice, config: any) {
  return {
    amount: formatCurrency(invoice.total || 0, invoice.currency),
    itemsList: invoice.lineItems
      .map((item) => `- ${item.description}: ${formatCurrency(item.price * item.quantity, invoice.currency)}`)
      .join('\n'),
    bankDetails: config.bankName
      ? `\nBank: ${config.bankName}\nAccount: ${config.bankAccount}\nSort Code: ${config.bankSortCode}`
      : ''
  };
}

registerEmailTemplateStrategy('casual', (invoice, config) => {
  const { amount, itemsList, bankDetails } = getCommonData(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: `Hi ${invoice.client.name}! Here's your invoice ${invoice.invoiceNumber}:\n\n${itemsList}\n\nTotal: ${amount}\nDue: ${formatDate(invoice.dueDate)}\n${bankDetails}\n\nBest regards,\n${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('followup', (invoice, config) => {
  const { amount } = getCommonData(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber} - Payment Reminder`,
    body: `Hi ${invoice.client.name},\n\nThis is a friendly reminder about invoice ${invoice.invoiceNumber} for ${amount} which was due on ${formatDate(invoice.dueDate)}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('overdue', (invoice, config) => {
  const { amount, bankDetails } = getCommonData(invoice, config);
  return {
    subject: `URGENT: Invoice ${invoice.invoiceNumber}`,
    body: `URGENT: Invoice ${invoice.invoiceNumber} for ${amount} is now past due. Please arrange immediate payment.\n\n${bankDetails}\n\nContact us if you need to discuss payment arrangements.\n\n${config.businessName || 'InvoiceApp'}`
  };
});

registerEmailTemplateStrategy('formal', (invoice, config) => {
  const { amount, itemsList, bankDetails } = getCommonData(invoice, config);
  return {
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: `Dear ${invoice.client.name},\n\nPlease find below the details for invoice ${invoice.invoiceNumber}:\n\n${itemsList}\n\nAmount Due: ${amount}\nDue Date: ${formatDate(invoice.dueDate)}\n\nPayment Details:${bankDetails}\n\nThank you for your valued business.\n\nBest regards,\n${config.businessName || 'InvoiceApp'}`
  };
});
