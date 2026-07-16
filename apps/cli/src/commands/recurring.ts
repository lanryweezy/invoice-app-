import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { RecurringInvoice, RecurringFrequency } from '../types';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';

function calculateNextDueDate(startDate: string, interval: RecurringFrequency): string {
  const date = new Date(startDate);
  switch (interval) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
}

export default function registerRecurringCommands(program: Command) {
  const recurring = program
    .command('recurring')
    .description('Manage recurring invoices');

  recurring
    .command('add')
    .description('Create a recurring invoice')
    .option('-c, --client <client>', 'Client name')
    .option('-a, --amount <amount>', 'Invoice amount')
    .option('-i, --items <items>', 'Line items (description:amount,...)')
    .option('--interval <interval>', 'Frequency: weekly, monthly, quarterly, yearly')
    .option('-d, --day <day>', 'Day of month/week')
    .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        let { client, amount, items, interval, day, start } = options;

        if (!client || !amount || !interval || !start) {
          const answers = await inquirer.prompt([
            { type: 'input', name: 'client', message: 'Client name:', when: !client },
            { type: 'number', name: 'amount', message: 'Amount:', when: !amount },
            { type: 'input', name: 'items', message: 'Items (description:amount,...):', when: !items },
            {
              type: 'list',
              name: 'interval',
              message: 'Recurrence interval:',
              choices: ['weekly', 'monthly', 'quarterly', 'yearly'],
              when: !interval,
            },
            { type: 'input', name: 'day', message: 'Day of month/week:', when: !day },
            { type: 'input', name: 'start', message: 'Start date (YYYY-MM-DD):', when: !start },
          ]);
          client = client || answers.client;
          amount = amount || answers.amount;
          items = items || answers.items;
          interval = interval || answers.interval;
          day = day || answers.day;
          start = start || answers.start;
        }

        const spinner = createSpinner('Creating recurring invoice...');
        const db = getDb();
        const nextDueDate = calculateNextDueDate(start, interval as RecurringFrequency);

        const docRef = await db.collection('users').doc(uid).collection('recurring').add({
          clientName: client,
          amount: parseFloat(amount),
          items: items || '',
          interval,
          dayOfMonth: day ? parseInt(day, 10) : undefined,
          startDate: start,
          isActive: true,
          nextDueDate,
          createdAt: new Date().toISOString(),
        });

        succeed(
          spinner,
          chalk.green(`✓ Recurring invoice created (ID: ${docRef.id}, next due: ${nextDueDate})`)
        );
      } catch (error: any) {
        console.error(chalk.red('Failed to create recurring invoice:'), error.message);
        process.exit(1);
      }
    });

  recurring
    .command('list')
    .description('List all recurring invoices')
    .action(async () => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Fetching recurring invoices...');

        const db = getDb();
        const snapshot = await db.collection('users').doc(uid).collection('recurring').get();
        const items: RecurringInvoice[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as RecurringInvoice);
        });

        if (items.length === 0) {
          succeed(spinner, chalk.yellow('No recurring invoices found'));
          return;
        }

        succeed(spinner, `Found ${items.length} recurring invoice(s)`);
        const table = new Table({
          head: [
            chalk.cyan('#'), chalk.cyan('ID'), chalk.cyan('Client'),
            chalk.cyan('Amount'), chalk.cyan('Interval'),
            chalk.cyan('Next Due'), chalk.cyan('Active'),
          ],
          style: { head: [], border: [] },
        });
        items.forEach((item, i) => {
          table.push([
            i + 1,
            item.id!.slice(0, 8),
            item.clientName,
            item.amount.toLocaleString(),
            item.interval,
            item.nextDueDate || 'N/A',
            item.isActive ? chalk.green('Yes') : chalk.red('No'),
          ]);
        });
        console.log(table.toString());
      } catch (error: any) {
        console.error(chalk.red('Failed to list recurring invoices:'), error.message);
        process.exit(1);
      }
    });

  recurring
    .command('pause <id>')
    .description('Pause a recurring invoice')
    .action(async (id: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Pausing recurring invoice...');

        const db = getDb();
        await db.collection('users').doc(uid).collection('recurring').doc(id).update({
          isActive: false,
        });

        succeed(spinner, chalk.green(`✓ Recurring invoice paused`));
      } catch (error: any) {
        console.error(chalk.red('Failed to pause recurring invoice:'), error.message);
        process.exit(1);
      }
    });

  recurring
    .command('resume <id>')
    .description('Resume a recurring invoice')
    .action(async (id: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Resuming recurring invoice...');

        const db = getDb();
        await db.collection('users').doc(uid).collection('recurring').doc(id).update({
          isActive: true,
        });

        succeed(spinner, chalk.green(`✓ Recurring invoice resumed`));
      } catch (error: any) {
        console.error(chalk.red('Failed to resume recurring invoice:'), error.message);
        process.exit(1);
      }
    });

  recurring
    .command('delete <id>')
    .description('Delete a recurring invoice')
    .action(async (id: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this recurring invoice?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Deletion cancelled'));
          return;
        }

        const spinner = createSpinner('Deleting recurring invoice...');
        const db = getDb();
        await db.collection('users').doc(uid).collection('recurring').doc(id).delete();

        succeed(spinner, chalk.green(`✓ Recurring invoice deleted`));
      } catch (error: any) {
        console.error(chalk.red('Failed to delete recurring invoice:'), error.message);
        process.exit(1);
      }
    });
}
