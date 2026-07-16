import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ensureAuthenticated } from '../lib/config';
import { writeDoc, getDb } from '../lib/firebase-client';
import { createSpinner, succeed, fail } from '../utils/spinner';
import { createInvoice, CreateInvoiceData } from '../lib/invoice-builder';
import { Invoice, LineItem } from '../types';
import { formatCurrency } from '../utils/formatter';

export default function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Create a new invoice')
    .option('-c, --client <name>', 'Client name')
    .option('-a, --amount <amount>', 'Total amount (if no items)')
    .option('-i, --items <items>', 'Comma-separated items (desc:amount)')
    .option('--currency <currency>', 'Currency', 'NGN')
    .option('-d, --due-date <date>', 'Due date (YYYY-MM-DD)')
    .option('-n, --notes <notes>', 'Invoice notes')
    .option('--tax-rate <rate>', 'Tax rate percentage', '7.5')
    .option('--wht-rate <rate>', 'Withholding tax rate percentage', '0')
    .option('--discount <amount>', 'Discount amount', '0')
    .option('--discount-type <type>', 'Discount type (percentage|fixed)', 'percentage')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();

        const spinner = createSpinner('Creating invoice...');

        try {
          const prompts = [];
          
          if (!options.client) {
            prompts.push({
              type: 'input',
              name: 'client',
              message: 'Client name:',
              validate: (input: string) => input.trim() !== '' || 'Client name is required'
            });
          }
          
          if (!options.amount && !options.items) {
            prompts.push({
              type: 'input',
              name: 'amount',
              message: 'Total amount:',
              validate: (input: string) => {
                const num = parseFloat(input);
                return !isNaN(num) && num > 0 || 'Please enter a valid amount';
              }
            });
          }
          
          if (!options.dueDate) {
            prompts.push({
              type: 'input',
              name: 'dueDate',
              message: 'Due date (YYYY-MM-DD):',
              default: () => {
                const date = new Date();
                date.setDate(date.getDate() + 30);
                return date.toISOString().split('T')[0];
              },
              validate: (input: string) => {
                const date = new Date(input);
                return !isNaN(date.getTime()) || 'Please enter a valid date';
              }
            });
          }

          if (prompts.length > 0) {
            const answers = await inquirer.prompt(prompts);
            Object.assign(options, answers);
          }

          let items: LineItem[] = [];
          
          if (options.items) {
            items = options.items.split(',').map((item: string, index: number) => {
              const [desc, amount] = item.split(':');
              return {
                id: `item_${index + 1}`,
                description: desc.trim(),
                quantity: 1,
                price: parseFloat(amount.trim()),
              };
            });
          } else {
            items = [{
              id: 'item_1',
              description: `Invoice for ${options.client}`,
              quantity: 1,
              price: parseFloat(options.amount),
            }];
          }

          const invoiceData: CreateInvoiceData = {
            user: {
              name: config.businessName || '',
              email: config.email || '',
              address: config.businessAddress || '',
              phoneNumber: config.businessPhone,
              bankName: config.bankName || '',
              accountNumber: config.bankAccount || '',
            },
            client: {
              name: options.client,
              email: '',
              address: '',
            },
            lineItems: items,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: options.dueDate,
            notes: options.notes || '',
            taxRate: parseFloat(options.taxRate),
            whtRate: parseFloat(options.whtRate),
            discountRate: parseFloat(options.discount),
            discountType: options.discountType as 'percentage' | 'fixed',
            currency: options.currency,
            existingInvoices: [],
          };

          const invoice = createInvoice(invoiceData);

          await writeDoc(
            `users/${config.userId}/invoices`,
            invoice.invoiceNumber,
            invoice as any
          );

          succeed(spinner, chalk.green(`Invoice ${invoice.invoiceNumber} created successfully`));
          
          console.log('\nInvoice Details:');
          console.log(`  Invoice #: ${chalk.bold(invoice.invoiceNumber)}`);
          console.log(`  Client: ${options.client}`);
          console.log(`  Total: ${chalk.bold(formatCurrency(invoice.total || 0, invoice.currency))}`);
          console.log(`  Due Date: ${options.dueDate}`);
          console.log(`  Status: Draft`);
          
        } catch (error: any) {
          fail(spinner, chalk.red('Failed to create invoice'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
