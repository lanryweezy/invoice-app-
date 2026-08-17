import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Invoice, InvoiceStatus } from '../types';
import { formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail, handleCliError } from '../utils/spinner';


export interface ExportData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  wht: number;
  total: number;
  status: InvoiceStatus | string;
  currency: string;
}

/**
 * 🔩 Hinge Extension Point: ExportStrategy
 *
 * Pressure: The export command had an if-else block for formats (json/csv) that
 * would grow with every new format requested (XML, YAML, etc).
 *
 * Contract:
 * - Implementors provide an `id` string (used via --format) and a `serialize` function.
 * - `serialize` receives an array of standardized `ExportData` and returns a string.
 * - The core handles database fetching, filtering, and file writing.
 */
export interface ExportStrategy {
  id: string;
  serialize(data: ExportData[]): string;
}

const exportStrategies = new Map<string, ExportStrategy>();

export function registerExportStrategy(strategy: ExportStrategy) {
  exportStrategies.set(strategy.id, strategy);
}

registerExportStrategy({
  id: 'json',
  serialize: (data) => JSON.stringify(data, null, 2),
});

registerExportStrategy({
  id: 'csv',
  serialize: (data) => {
    const header = 'Invoice #,Client Name,Client Email,Issue Date,Due Date,Subtotal,Tax,WHT,Total,Status,Currency';
    const lines = data.map(
      (d) =>
        `"${d.invoiceNumber}","${d.clientName}","${d.clientEmail}","${formatDate(d.issueDate)}","${formatDate(d.dueDate)}",${d.subtotal},${d.tax},${d.wht},${d.total},"${d.status}","${d.currency}"`
    );
    return [header, ...lines].join('\n');
  },
});

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

        let fromDate: number | null = null;
        if (options.from) {
          fromDate = Date.parse(options.from);
        }
        let toDate: number | null = null;
        if (options.to) {
          const toDateObj = new Date(options.to);
          toDateObj.setHours(23, 59, 59, 999);
          toDate = toDateObj.getTime();
        }

        const filterStatus = options.status ? options.status.toLowerCase() : null;
        const filterClient = options.client ? options.client.toLowerCase() : null;
        const minAmount = options.minAmount ? parseFloat(options.minAmount) : null;
        const maxAmount = options.maxAmount ? parseFloat(options.maxAmount) : null;

        // ⚡ Bolt: Combine multiple filter conditions into a single pass to avoid multiple array allocations and O(N * num_filters) iterations
        invoices = invoices.filter((inv) => {
          if (fromDate || toDate) {
            const issueDate = Date.parse(inv.issueDate);
            if (fromDate && issueDate < fromDate) return false;
            if (toDate && issueDate > toDate) return false;
          }
          if (filterStatus && inv.status.toLowerCase() !== filterStatus) return false;
          if (filterClient && !inv.client.name.toLowerCase().includes(filterClient)) return false;
          const total = inv.total || 0;
          if (minAmount !== null && total < minAmount) return false;
          if (maxAmount !== null && total > maxAmount) return false;

          return true;
        });

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

                const exportStrategy = exportStrategies.get(options.format || 'csv');
        if (!exportStrategy) {
          console.error(chalk.red(`Unsupported export format: ${options.format}`));
          process.exit(1);
        }

        const output = exportStrategy.serialize(exportData);

        fs.writeFileSync(options.output, output, 'utf-8');
        succeed(spinner, chalk.green(`✓ Exported ${invoices.length} invoice(s) to ${options.output}`));
      } catch (error: any) {
        handleCliError(error, 'Failed to export invoices:');
      }
    });
}
