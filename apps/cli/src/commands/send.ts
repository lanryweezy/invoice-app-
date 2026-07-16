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

          const emailBody = generateEmailBody(invoice, options.template, config);
          const subject = options.subject || generateSubject(invoice, options.template);

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

function generateEmailBody(invoice: Invoice, template: string, config: any): string {
  const amount = formatCurrency(invoice.total || 0, invoice.currency);
  const itemsList = invoice.lineItems
    .map((item) => `- ${item.description}: ${formatCurrency(item.price * item.quantity, invoice.currency)}`)
    .join('\n');

  const bankDetails = config.bankName
    ? `\nBank: ${config.bankName}\nAccount: ${config.bankAccount}\nSort Code: ${config.bankSortCode}`
    : '';

  switch (template) {
    case 'casual':
      return `Hi ${invoice.client.name}! Here's your invoice ${invoice.invoiceNumber}:

${itemsList}

Total: ${amount}
Due: ${formatDate(invoice.dueDate)}
${bankDetails}

Best regards,
${config.businessName || 'InvoiceApp'}`;

    case 'followup':
      return `Hi ${invoice.client.name},

This is a friendly reminder about invoice ${invoice.invoiceNumber} for ${amount} which was due on ${formatDate(invoice.dueDate)}.

Please let us know if you have any questions.

Best regards,
${config.businessName || 'InvoiceApp'}`;

    case 'overdue':
      return `URGENT: Invoice ${invoice.invoiceNumber} for ${amount} is now past due. Please arrange immediate payment.

${bankDetails}

Contact us if you need to discuss payment arrangements.

${config.businessName || 'InvoiceApp'}`;

    case 'formal':
    default:
      return `Dear ${invoice.client.name},

Please find below the details for invoice ${invoice.invoiceNumber}:

${itemsList}

Amount Due: ${amount}
Due Date: ${formatDate(invoice.dueDate)}

Payment Details:${bankDetails}

Thank you for your valued business.

Best regards,
${config.businessName || 'InvoiceApp'}`;
  }
}

function generateSubject(invoice: Invoice, template: string): string {
  const prefix = template === 'overdue' ? 'URGENT: ' : '';
  const suffix = template === 'followup' ? ' - Payment Reminder' : '';
  return `${prefix}Invoice ${invoice.invoiceNumber}${suffix}`;
}
