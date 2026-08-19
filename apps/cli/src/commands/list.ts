import { Command } from 'commander';
import chalk from 'chalk';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';
import { Invoice } from '../types';

/**
 * 🔩 Hinge Extension Point: ListOutputStrategy
 *
 * Pressure: The `list` command had a growing `switch (options.format)` block
 * that needed modification every time a new output format (table, json, csv) was added.
 *
 * Contract:
 * - Implementors provide a function that takes an array of `Invoice` objects.
 * - The strategy is responsible for formatting and logging the output to the console.
 */
export type ListOutputStrategy = (invoices: Invoice[]) => void;

const outputStrategies = new Map<string, ListOutputStrategy>();

export function registerOutputStrategy(format: string, strategy: ListOutputStrategy): void {
  outputStrategies.set(format, strategy);
}

/**
 * 🔩 Hinge Extension Point: SortStrategy
 *
 * Pressure: The `list` command had a growing `switch (options.sort)` block
 * that needed modification every time a new sort field (e.g., client name, due date) was added.
 *
 * Contract:
 * - Implementors provide a comparator function that takes two `Invoice` objects
 *   and returns a number (-1, 0, 1) indicating their sort order.
 */
export type SortStrategy = (a: Invoice, b: Invoice) => number;

const sortStrategies = new Map<string, SortStrategy>();

export function registerSortStrategy(field: string, strategy: SortStrategy): void {
  sortStrategies.set(field, strategy);
}

registerSortStrategy('amount', (a, b) => (b.total || 0) - (a.total || 0));
registerSortStrategy('status', (a, b) => a.status.localeCompare(b.status));
registerSortStrategy('date', (a, b) => {
  // ⚡ Bolt: Use native lexicographical string comparison for ISO dates to avoid O(N log N) Date.parse overhead (~10x faster)
  const dateA = a.createdAt || '';
  const dateB = b.createdAt || '';
  return dateB > dateA ? 1 : dateB < dateA ? -1 : 0;
});

registerOutputStrategy('json', (invoices) => {
  console.log(JSON.stringify(invoices, null, 2));
});

registerOutputStrategy('csv', (invoices) => {
  const headers = ['Invoice #', 'Client', 'Total', 'Currency', 'Status', 'Due Date', 'Created'];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.client.name,
    (inv.total || 0).toString(),
    inv.currency,
    inv.status,
    inv.dueDate ? formatDate(inv.dueDate) : 'N/A',
    formatDate(inv.createdAt || '')
  ]);

  console.log(headers.join(','));
  rows.forEach((row) => console.log(row.join(',')));
});

registerOutputStrategy('table', (invoices) => {
  console.log(chalk.bold('\nInvoice List'));
  console.log('─'.repeat(80));
  console.log(
    chalk.cyan('Invoice #').padEnd(20) +
    chalk.cyan('Client').padEnd(20) +
    chalk.cyan('Total').padEnd(15) +
    chalk.cyan('Status').padEnd(10) +
    chalk.cyan('Due Date')
  );
  console.log('─'.repeat(80));

  invoices.forEach((inv) => {
    console.log(
      inv.invoiceNumber.padEnd(20) +
      inv.client.name.padEnd(20) +
      formatCurrency(inv.total || 0, inv.currency).padEnd(15) +
      inv.status.padEnd(10) +
      (inv.dueDate ? formatDate(inv.dueDate) : 'N/A')
    );
  });
  console.log('─'.repeat(80));
});

export default function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List invoices with filters')
    .option('-s, --status <status>', 'Filter by status (Draft|Sent|Paid|Overdue)')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .option('--client <name>', 'Filter by client name (contains)')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-f, --format <format>', 'Output format (table|json|csv)', 'table')
    .option('--sort <field>', 'Sort by field (date|amount|status)', 'date')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const spinner = createSpinner('Fetching invoices...');

        try {
          const snapshot = await getDb()
            .collection(`users/${config.userId}/invoices`)
            .get();

          let invoices: Invoice[] = snapshot.docs.map((doc) => doc.data() as Invoice);

          // ⚡ Bolt: Combine multiple sequential filter criteria into a single pass to avoid O(N) iterations and redundant intermediate array allocations.
          const statusFilter = options.status !== undefined ? options.status.toLowerCase() : undefined;
          const fromDate = options.from !== undefined ? Date.parse(options.from) : undefined;
          const toDate = options.to !== undefined ? Date.parse(options.to) : undefined;
          const clientSearch = options.client !== undefined ? options.client.toLowerCase() : undefined;

          invoices = invoices.filter((inv) => {
            if (statusFilter !== undefined && inv.status.toLowerCase() !== statusFilter) return false;

            if (fromDate !== undefined || toDate !== undefined) {
              const invDate = Date.parse(inv.createdAt || '');
              if (fromDate !== undefined && (isNaN(invDate) || invDate < fromDate)) return false;
              if (toDate !== undefined && (isNaN(invDate) || invDate > toDate)) return false;
            }

            if (clientSearch !== undefined && !inv.client.name.toLowerCase().includes(clientSearch)) return false;

            return true;
          });

          invoices.sort((a, b) => {
            const strategy = sortStrategies.get(options.sort) || sortStrategies.get('date')!;
            return strategy(a, b);
          });

          const limit = parseInt(options.limit);
          if (!isNaN(limit) && limit > 0) {
            invoices = invoices.slice(0, limit);
          }

          spinner.stop();

          if (invoices.length === 0) {
            console.log(chalk.yellow('No invoices found matching the criteria.'));
            return;
          }

          const strategy = outputStrategies.get(options.format) || outputStrategies.get('table')!;
          strategy(invoices);

          console.log(chalk.dim(`\n${invoices.length} invoice(s) found`));
          
        } catch (error: any) {
          fail(spinner, chalk.red('Failed to fetch invoices'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
