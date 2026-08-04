import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ensureAuthenticated, getConfig } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Invoice } from '../types';
import { createSpinner, succeed, fail } from '../utils/spinner';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEmailBody(invoice: Invoice, template: string): string {
  const amount = (invoice.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  switch (template) {
    case 'formal':
      return `Dear ${invoice.client.name},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${invoice.currency} ${amount}.\n\nPayment is due by ${invoice.dueDate}.\n\nKindly remit payment to the bank details on the invoice.\n\nThank you.`;
    case 'overdue':
      return `Dear ${invoice.client.name},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for ${invoice.currency} ${amount} is now overdue.\n\nPlease make payment as soon as possible to avoid further charges.\n\nThank you.`;
    default:
      return `Dear ${invoice.client.name},\n\nInvoice ${invoice.invoiceNumber} for ${invoice.currency} ${amount} is attached.\n\nDue date: ${invoice.dueDate}.\n\nThank you.`;
  }
}

async function sendInvoiceEmail(invoice: Invoice, template: string): Promise<boolean> {
  const config = getConfig();
  if (!config.smtp?.host || !config.smtp?.user || !config.smtp?.pass) {
    throw new Error('SMTP not configured. Run "invoiceapp auth config" to set up email.');
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port || 587,
      secure: config.smtp.secure || false,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });

    await transporter.sendMail({
      from: config.smtp.user,
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber}`,
      text: buildEmailBody(invoice, template),
    });
    return true;
  } catch {
    return false;
  }
}

export default function registerBatchCommand(program: Command) {
  program
    .command('batch-send')
    .description('Batch send invoices by status')
    .requiredOption('--status <status>', 'Invoice status to filter: Sent or Overdue')
    .option('-t, --template <template>', 'Email template: formal, followup, overdue', 'followup')
    .option('--dry-run', 'Preview invoices without sending', false)
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const { status, template, dryRun } = options;

        if (!['Sent', 'Overdue'].includes(status)) {
          console.error(chalk.red('--status must be "Sent" or "Overdue"'));
          process.exit(1);
        }

        const spinner = createSpinner('Fetching invoices...');
        const db = getDb();
        const snapshot = await db
          .collection('users')
          .doc(uid)
          .collection('invoices')
          .where('status', '==', status)
          .get();

        const invoices: Invoice[] = [];
        snapshot.forEach((doc) => {
          invoices.push({ id: doc.id, ...doc.data() } as Invoice);
        });

        if (invoices.length === 0) {
          fail(spinner, chalk.yellow(`No ${status} invoices found`));
          return;
        }

        succeed(spinner, `Found ${invoices.length} ${status} invoice(s)`);

        if (dryRun) {
          console.log(chalk.cyan('\nDry run - invoices that would be sent:'));
          invoices.forEach((inv, i) => {
            console.log(`  ${i + 1}. ${inv.invoiceNumber} → ${inv.client.email} (${inv.currency} ${(inv.total || 0).toLocaleString()})`);
          });
          console.log(chalk.cyan(`\nTotal: ${invoices.length} invoice(s)`));
          return;
        }

        const spinnerProgress = ora(`Sending invoices...`).start();
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < invoices.length; i++) {
          const inv = invoices[i];
          spinnerProgress.text = `[${i + 1}/${invoices.length}] Sending ${inv.invoiceNumber}...`;

          // 🌱 Flora: Wrap individual item updates in a try/catch block to prevent a single transient failure from crashing the entire batch process and leaving subsequent items unprocessed.
          try {
            const success = await sendInvoiceEmail(inv, template);
            if (success) {
              if (inv.status === 'Overdue') {
                await db
                  .collection('users')
                  .doc(uid)
                  .collection('invoices')
                  .doc(inv.id!)
                  .update({ status: 'Sent', updatedAt: new Date().toISOString() });
              }
              sent++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
            console.error(chalk.red(`Failed to process invoice ${inv.invoiceNumber}:`), error);
          }

          // Rate limit: max 10 per minute
          if ((i + 1) % 10 === 0 && i < invoices.length - 1) {
            spinnerProgress.text = 'Rate limit pause (10/min)...';
            await sleep(60000);
          }
        }

        spinnerProgress.succeed(chalk.green(`Batch send complete`));
        console.log(`  Sent: ${chalk.green(sent)}`);
        console.log(`  Failed: ${chalk.red(failed)}`);
      } catch (error: any) {
        console.error(chalk.red('Batch send failed:'), error.message);
        process.exit(1);
      }
    });
}
