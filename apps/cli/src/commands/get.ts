import { Command } from 'commander';
import chalk from 'chalk';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';
import { Invoice } from '../types';

export default function registerGetCommand(program: Command): void {
  program
    .command('get <invoice-number>')
    .description('Get invoice details by invoice number')
    .option('-j, --json', 'Output as JSON')
    .action(async (invoiceNumber: string, options) => {
      try {
        const config = ensureAuthenticated();
        const spinner = createSpinner('Fetching invoice...');

        try {
          const snapshot = await getDb()
            .collection(`users/${config.userId}/invoices`)
            .where('invoiceNumber', '==', invoiceNumber)
            .get();

          if (snapshot.empty) {
            fail(spinner, chalk.red(`Invoice ${invoiceNumber} not found`));
            process.exit(1);
          }

          const doc = snapshot.docs[0];
          const invoice = doc.data() as Invoice;

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(invoice, null, 2));
            return;
          }

          console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
          console.log(chalk.bold(`  INVOICE ${invoice.invoiceNumber}`));
          console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
          
          console.log(`  ${chalk.dim('Status:')} ${getStatusColor(invoice.status)}${invoice.status}`);
          console.log(`  ${chalk.dim('Created:')} ${formatDate(invoice.createdAt || '')}`);
          console.log(`  ${chalk.dim('Due Date:')} ${invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}`);
          
          console.log(chalk.bold('\n  Client:'));
          console.log(`    ${invoice.client.name}`);
          
          console.log(chalk.bold('\n  Items:'));
          invoice.lineItems.forEach((item, index) => {
            console.log(`    ${index + 1}. ${item.description}`);
            console.log(`       Qty: ${item.quantity} × Price: ${formatCurrency(item.price, invoice.currency)}`);
          });
          
          console.log(chalk.bold('\n  Summary:'));
          console.log(`    ${chalk.dim('Subtotal:')} ${formatCurrency(invoice.subtotal || 0, invoice.currency)}`);
          console.log(`    ${chalk.dim('Tax:')} ${formatCurrency(invoice.tax || 0, invoice.currency)}`);
          if ((invoice.whtAmount || 0) > 0) {
            console.log(`    ${chalk.dim('WHT:')} ${formatCurrency(invoice.whtAmount || 0, invoice.currency)}`);
          }
          if ((invoice.discountAmount || 0) > 0) {
            const discountText = invoice.discountType === 'percentage' 
              ? `${invoice.discountRate}%` 
              : formatCurrency(invoice.discountAmount || 0, invoice.currency);
            console.log(`    ${chalk.dim('Discount:')} -${discountText}`);
          }
          console.log(`    ${chalk.bold('Total:')} ${chalk.bold(formatCurrency(invoice.total || 0, invoice.currency))}`);
          
          if (invoice.notes) {
            console.log(chalk.bold('\n  Notes:'));
            console.log(`    ${invoice.notes}`);
          }
          
          console.log('\n' + chalk.dim('═══════════════════════════════════════════════════════════════'));
          
        } catch (error: any) {
          fail(spinner, chalk.red('Failed to fetch invoice'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return chalk.green('● ');
    case 'sent':
      return chalk.blue('● ');
    case 'overdue':
      return chalk.red('● ');
    case 'draft':
    default:
      return chalk.gray('● ');
  }
}
