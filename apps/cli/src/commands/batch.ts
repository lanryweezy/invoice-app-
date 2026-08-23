import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ensureAuthenticated, getConfig } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Invoice } from '../types';
import { generateEmailContent } from '../utils/email-templates';
import { createSpinner, succeed, fail } from '../utils/spinner';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      // 🌱 Flora: Add timeouts to prevent indefinite hangs if the external SMTP server is unresponsive
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });

    const { subject, body } = generateEmailContent(invoice, template, config);

    await transporter.sendMail({
      from: config.smtp.user,
      to: invoice.client.email,
      subject,
      text: body,
    });
    return true;
  } catch (error: any) {
    console.error('Batch email send failed', {
      event: 'batch.email.failed',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      error: error.message
    });
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

        const CHUNK_SIZE = 10;
        for (let i = 0; i < invoices.length; i += CHUNK_SIZE) {
          const chunk = invoices.slice(i, i + CHUNK_SIZE);
          spinnerProgress.text = `[${Math.min(i + CHUNK_SIZE, invoices.length)}/${invoices.length}] Sending invoices...`;

          // 🌱 Flora: Replace Promise.all with Promise.allSettled to prevent partial failures from rejecting the entire batch
          const results = await Promise.allSettled(
            chunk.map(async (inv) => {
              const success = await sendInvoiceEmail(inv, template);
              if (success) {
                try {
                  if (inv.status === 'Overdue') {
                    await db
                      .collection('users')
                      .doc(uid)
                      .collection('invoices')
                      .doc(inv.id!)
                      .update({ status: 'Sent', updatedAt: new Date().toISOString() });
                  }
                  return true;
                } catch (err: any) {
                  // 🌱 Flora: Catch individual DB update failures to prevent a single transient error from crashing the entire batch loop
                  console.error('\nFailed to update invoice status', { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, error: err });
                  return false;
                }
              }
              return false;
            })
          );

          results.forEach(res => {
            if (res.status === 'fulfilled') {
              if (res.value) sent++;
              else failed++;
            } else if (res.status === 'rejected') {
              console.error('\nFailed to process invoice in batch', { error: res.reason });
              failed++;
            }
          });

          // Rate limit: max 10 per minute
          if (i + CHUNK_SIZE < invoices.length) {
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
