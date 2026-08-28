import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';
import Table from 'cli-table3';

/**
 * 🔩 Hinge Extension Point: TaxReportOutputStrategy
 *
 * Pressure: The tax report command had a growing `if (options.format === 'csv') { ... } else if (options.format === 'json') { ... } else { ... }` block for formats. Adding new output formats required modifying the core reporting logic.
 *
 * Contract:
 * - Implementors provide an `id` string (e.g. 'csv', 'json', 'table') and a `serialize` function.
 * - `serialize` receives the formatted rows, totals, and currency, and returns a formatted string.
 */
export interface TaxReportOutputStrategy {
  id: string;
  serialize(
    rows: any[],
    totals: any,
    currency: string
  ): string;
}

const taxReportOutputStrategies = new Map<string, TaxReportOutputStrategy>();

export function registerTaxReportOutputStrategy(strategy: TaxReportOutputStrategy) {
  taxReportOutputStrategies.set(strategy.id, strategy);
}

registerTaxReportOutputStrategy({
  id: 'csv',
  serialize: (rows, totals) => {
    const header = 'Invoice #,Client,Subtotal,VAT,WHT,Stamp Duty,Net,Date';
    const lines = rows.map(
      (r) => `"${r.number}","${r.client}",${r.subtotal},${r.vat},${r.wht},${r.stampDuty},${r.net},"${formatDate(r.date)}"`
    );
    lines.push('');
    lines.push(`TOTALS,,,,,${totals.subtotal},${totals.vat},${totals.wht},${totals.stampDuty},${totals.net}`);
    return [header, ...lines].join('\n');
  },
});

registerTaxReportOutputStrategy({
  id: 'json',
  serialize: (rows, totals, currency) => {
    return JSON.stringify({ invoices: rows, summary: totals, currency }, null, 2);
  },
});

registerTaxReportOutputStrategy({
  id: 'table',
  serialize: (rows, totals, currency) => {
    const table = new Table({
      head: [
        chalk.cyan('Invoice #'), chalk.cyan('Client'), chalk.cyan('Subtotal'),
        chalk.cyan('VAT'), chalk.cyan('WHT'), chalk.cyan('Stamp Duty'),
        chalk.cyan('Net'), chalk.cyan('Date'),
      ],
      style: { head: [], border: [] },
    });
    const cur = rows[0]?.currency || currency;
    rows.forEach((r) => {
      table.push([
        r.number, r.client, formatCurrency(r.subtotal, cur as any),
        formatCurrency(r.vat, cur as any), formatCurrency(r.wht, cur as any),
        formatCurrency(r.stampDuty, cur as any), formatCurrency(r.net, cur as any),
        formatDate(r.date),
      ]);
    });
    table.push([
      chalk.bold('TOTALS'), '', formatCurrency(totals.subtotal, cur as any),
      formatCurrency(totals.vat, cur as any), formatCurrency(totals.wht, cur as any),
      formatCurrency(totals.stampDuty, cur as any), formatCurrency(totals.net, cur as any), '',
    ]);
    return table.toString();
  },
});

const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseMonth(val: string): number {
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  const named = MONTH_MAP[val.toLowerCase()];
  if (named) return named;
  throw new Error(`Invalid month "${val}". Use 1-12 or month name (e.g., "july")`);
}

function calculateInvoiceTax(inv: Invoice) {
  const subtotal = inv.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = subtotal * (inv.taxRate / 100);
  const wht = subtotal * (inv.whtRate / 100);
  const stampDuty = subtotal * 0.005;
  const net = subtotal + vat - wht - stampDuty;
  return { subtotal, vat, wht, stampDuty, net };
}

export default function registerTaxReportCommand(program: Command) {
  program
    .command('tax-report')
    .description('Generate tax report')
    .option('-m, --month <month>', 'Month (1-12 or name like "july")')
    .option('-y, --year <year>', 'Year (default: current year)')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format: table, csv, json', 'table')
    .option('-o, --output <path>', 'Write to file instead of stdout')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const currency = config.defaultCurrency || 'NGN';
        const currentYear = new Date().getFullYear();
        const year = options.year ? parseInt(options.year, 10) : currentYear;

        let startDate: Date;
        let endDate: Date;

        if (options.from && options.to) {
          startDate = new Date(options.from);
          endDate = new Date(options.to);
          endDate.setHours(23, 59, 59, 999);
        } else if (options.month) {
          const monthNum = parseMonth(options.month);
          startDate = new Date(year, monthNum - 1, 1);
          endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
        } else {
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        }

        const spinner = createSpinner('Generating tax report...');
        const db = getDb();
        const snapshot = await db.collection('users').doc(uid).collection('invoices').get();

        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const rows: any[] = [];
        let invoiceCount = 0;

        snapshot.forEach((doc) => {
          const inv = { id: doc.id, ...doc.data() } as Invoice;
          // ⚡ Bolt: Use Date.parse instead of new Date() in the map/filter loop to prevent object allocation
          const issueTimestamp = Date.parse(inv.issueDate);
          if (issueTimestamp >= startTimestamp && issueTimestamp <= endTimestamp) {
            invoiceCount++;
            const tax = calculateInvoiceTax(inv);
            rows.push({
              number: inv.invoiceNumber,
              client: inv.client.name,
              subtotal: tax.subtotal,
              vat: tax.vat,
              wht: tax.wht,
              stampDuty: tax.stampDuty,
              net: tax.net,
              date: inv.issueDate,
              currency: inv.currency || currency,
            });
          }
        });

        if (invoiceCount === 0) {
          fail(spinner, chalk.yellow('No invoices found for the specified period'));
          return;
        }

        const totals = rows.reduce(
          (acc, r) => ({
            subtotal: acc.subtotal + r.subtotal,
            vat: acc.vat + r.vat,
            wht: acc.wht + r.wht,
            stampDuty: acc.stampDuty + r.stampDuty,
            net: acc.net + r.net,
          }),
          { subtotal: 0, vat: 0, wht: 0, stampDuty: 0, net: 0 }
        );

        succeed(spinner, `Found ${invoiceCount} invoice(s)`);

        const strategy = taxReportOutputStrategies.get(options.format) || taxReportOutputStrategies.get('table')!;
        const output = strategy.serialize(rows, totals, currency as string);

        if (options.output) {
          fs.writeFileSync(options.output, output, 'utf-8');
          console.log(chalk.green(`✓ Report written to ${options.output}`));
        } else {
          console.log(output);
        }
      } catch (error: any) {
        console.error(chalk.red('Failed to generate tax report:'), error.message);
        process.exit(1);
      }
    });
}
