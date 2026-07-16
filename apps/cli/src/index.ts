#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { registerCommands } from './commands';

const program = new Command();

program
  .name('invoiceapp')
  .description('InvoiceApp CLI - Create and manage invoices from your terminal')
  .version('1.0.0');

registerCommands(program);

program.on('command:*', () => {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log('Run ' + chalk.cyan('invoiceapp --help') + ' for usage information');
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
