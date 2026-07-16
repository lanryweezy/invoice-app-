import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig, saveConfig, ensureAuthenticated } from '../lib/config';
import { createSpinner, succeed, fail } from '../utils/spinner';
import { AppConfig } from '../types';

export function registerConfigCommands(program: Command): void {
  program
    .command('config')
    .description('Configure InvoiceApp settings')
    .action(async () => {
      const currentConfig = getConfig();

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'businessName',
          message: 'Business name:',
          default: currentConfig.businessName,
        },
        {
          type: 'input',
          name: 'businessAddress',
          message: 'Business address:',
          default: currentConfig.businessAddress,
        },
        {
          type: 'input',
          name: 'businessPhone',
          message: 'Business phone:',
          default: currentConfig.businessPhone,
        },
        {
          type: 'input',
          name: 'bankName',
          message: 'Bank name:',
          default: currentConfig.bankName,
        },
        {
          type: 'input',
          name: 'bankAccount',
          message: 'Account number:',
          default: currentConfig.bankAccount,
        },
        {
          type: 'input',
          name: 'bankSortCode',
          message: 'Sort code:',
          default: currentConfig.bankSortCode,
        },
        {
          type: 'list',
          name: 'defaultCurrency',
          message: 'Default currency:',
          choices: ['NGN', 'USD', 'EUR', 'GBP'],
          default: currentConfig.defaultCurrency || 'NGN',
        },
        {
          type: 'number',
          name: 'defaultVatRate',
          message: 'Default VAT rate (%):',
          default: currentConfig.defaultVatRate || 7.5,
        },
      ]);

      const spinner = createSpinner('Saving configuration...');
      try {
        const newConfig: AppConfig = {
          ...currentConfig,
          businessName: answers.businessName,
          businessAddress: answers.businessAddress,
          businessPhone: answers.businessPhone,
          bankName: answers.bankName,
          bankAccount: answers.bankAccount,
          bankSortCode: answers.bankSortCode,
          defaultCurrency: answers.defaultCurrency,
          defaultVatRate: answers.defaultVatRate,
        };

        saveConfig(newConfig);
        succeed(spinner, chalk.green('Configuration saved successfully!'));
      } catch (error) {
        fail(spinner, chalk.red('Failed to save configuration'));
        console.error(error);
      }
    });

  program
    .command('config:show')
    .description('Show current configuration')
    .action(() => {
      const config = getConfig();
      console.log(chalk.cyan('Current Configuration:'));
      console.log('─'.repeat(40));
      console.log(`Business Name: ${config.businessName || 'Not set'}`);
      console.log(`Address: ${config.businessAddress || 'Not set'}`);
      console.log(`Phone: ${config.businessPhone || 'Not set'}`);
      console.log(`Bank: ${config.bankName || 'Not set'}`);
      console.log(`Account: ${config.bankAccount || 'Not set'}`);
      console.log(`Sort Code: ${config.bankSortCode || 'Not set'}`);
      console.log(`Currency: ${config.defaultCurrency || 'NGN'}`);
      console.log(`VAT Rate: ${config.defaultVatRate || 7.5}%`);
    });
}
