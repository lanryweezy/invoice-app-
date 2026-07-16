import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Invoice, InvoiceStatus } from '../types';
import { formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';

export default function registerExportCommand(program: Command) {
  program
    .command('export')
    .description('Export invoices to CSV or JSON')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .option('--status <status>', 'Filter by status')
    .option('--client <name>', 'Filter by client name')
    .option('--min-amount <amount>', 'Minimum total amount')
    .option('--max-amount <amount>', 'Maximum total amount')
    .option('-f, --format <format>', 'Output format: csv or json', 'csv')
    .option('-o, --output <path>', 'Output file path (required)')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        if (!options.output) {
          console.error(chalk.red('Output file path is required. Use --output <path>'));
          process.exit(1);
        }

        const spinner = createSpinner('Fetching invoices...');
        const db = getDb();
        const snapshot = await db.collection('users').doc(uid).collection('invoices').get();

        let invoices: Invoice[] = [];
        snapshot.forEach((doc) => {
          invoices.push({ id: doc.id, ...doc.data() } as Invoice);
        });

        if (options.from) {
          const fromDate = new Date(options.from);
          invoices = invoices.filter((inv) => new Date(inv.issueDate) >= fromDate);
        }
        if (options.to) {
          const toDate = new Date(options.to);
          toDate.setHours(23, 59, 59, 999);
          invoices = invoices.filter((inv) => new Date(inv.issueDate) <= toDate);
        }
        if (options.status) {
          invoices = invoices.filter(
            (inv) => inv.status.toLowerCase() === options.status.toLowerCase()
          );
        }
        if (options.client) {
          invoices = invoices.filter((inv) =>
            inv.client.name.toLowerCase().includes(options.client.toLowerCase())
          );
        }
        if (options.minAmount) {
          invoices = invoices.filter((inv) => (inv.total || 0) >= parseFloat(options.minAmount));
        }
        if (options.maxAmount) {
          invoices = invoices.filter((inv) => (inv.total || 0) <= parseFloat(options.maxAmount));
        }

        if (invoices.length === 0) {
          fail(spinner, chalk.yellow('No invoices match the specified filters'));
          return;
        }

        const exportData = invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client.name,
          clientEmail: inv.client.email,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          subtotal: inv.subtotal || 0,
          tax: inv.tax || 0,
          wht: inv.whtAmount || 0,
          total: inv.total || 0,
          status: inv.status,
          currency: inv.currency,
        }));

        let output: string;
        if (options.format === 'json') {
          output = JSON.stringify(exportData, null, 2);
        } else {
          const header = 'Invoice #,Client Name,Client Email,Issue Date,Due Date,Subtotal,Tax,WHT,Total,Status,Currency';
          const lines = exportData.map(
            (d) =>
              `"${d.invoiceNumber}","${d.clientName}","${d.clientEmail}","${formatDate(d.issueDate)}","${formatDate(d.dueDate)}",${d.subtotal},${d.tax},${d.wht},${d.total},"${d.status}","${d.currency}"`
          );
          output = [header, ...lines].join('\n');
        }

        fs.writeFileSync(options.output, output, 'utf-8');
        succeed(spinner, chalk.green(`✓ Exported ${invoices.length} invoice(s) to ${options.output}`));
      } catch (error: any) {
        console.error(chalk.red('Failed to export invoices:'), error.message);
        process.exit(1);
      }
    });
}
