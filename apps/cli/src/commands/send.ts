import { Command } from 'commander';
import { ensureAuthenticated, getConfig } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { generateEmailContent } from '../utils/email-templates';
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

          const { subject: generatedSubject, body: emailBody } = generateEmailContent(invoice, options.template, config);
          const subject = options.subject || generatedSubject;

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

