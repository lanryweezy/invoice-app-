import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loginWithToken, isAuthenticated, logout, getCurrentUser } from '../lib/auth';
import { getConfig, saveConfig } from '../lib/config';
import { createSpinner, succeed, fail } from '../utils/spinner';

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Authentication and configuration commands');

  auth
    .command('login')
    .description('Login to InvoiceApp CLI')
    .option('-t, --token <token>', 'Authentication token')
    .action(async (options) => {
      if (isAuthenticated()) {
        console.log(chalk.yellow('Already logged in.'));
        const user = getCurrentUser();
        console.log(chalk.gray(`Logged in as: ${user.email}`));
        return;
      }

      let token = options.token;

      if (!token) {
        console.log(chalk.yellow('Get your token from https://invoiceapp.ng/settings → CLI Access'));
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'token',
            message: 'Enter your authentication token:',
            mask: '*',
            validate: (input: string) => input.length > 0 || 'Token is required',
          },
        ]);
        token = answers.token;
      }

      const spinner = createSpinner('Authenticating...');
      try {
        loginWithToken(token);
        succeed(spinner, chalk.green('✓ Logged in successfully'));
      } catch (error: any) {
        fail(spinner, chalk.red('Login failed'));
        console.error(error);
      }
    });

  auth
    .command('logout')
    .description('Logout from InvoiceApp CLI')
    .action(() => {
      logout();
      console.log(chalk.green('✓ Logged out successfully'));
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .action(() => {
      if (!isAuthenticated()) {
        console.log(chalk.yellow('Not logged in. Run "invoiceapp auth login" to authenticate.'));
        return;
      }

      const config = getConfig();
      const user = getCurrentUser();

      console.log(chalk.green('✓ Authenticated'));
      console.log(`Email: ${user.email || 'Not set'}`);
      console.log(`Business: ${config.businessName || 'Not set'}`);
      console.log(`Bank: ${config.bankName || 'Not set'}`);
    });

  const configCmd = auth
    .command('config')
    .description('Configuration management');

  configCmd
    .command('init')
    .description('Interactive configuration wizard')
    .action(async () => {
      const spinner = createSpinner('Loading current config...');
      const currentConfig = getConfig();
      succeed(spinner, '');

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
          message: 'Bank account number:',
          default: currentConfig.bankAccount,
        },
        {
          type: 'input',
          name: 'bankSortCode',
          message: 'Bank sort code:',
          default: currentConfig.bankSortCode,
        },
        {
          type: 'list',
          name: 'defaultCurrency',
          message: 'Default currency:',
          choices: ['NGN', 'USD', 'GBP', 'EUR'],
          default: currentConfig.defaultCurrency || 'NGN',
        },
        {
          type: 'input',
          name: 'smtpHost',
          message: 'SMTP host:',
          default: currentConfig.smtp?.host || 'smtp.gmail.com',
        },
        {
          type: 'number',
          name: 'smtpPort',
          message: 'SMTP port:',
          default: currentConfig.smtp?.port || 587,
        },
        {
          type: 'input',
          name: 'smtpUser',
          message: 'SMTP username/email:',
          default: currentConfig.smtp?.user,
        },
        {
          type: 'password',
          name: 'smtpPass',
          message: 'SMTP password:',
          mask: '*',
          default: currentConfig.smtp?.pass,
        },
      ]);

      const saveSpinner = createSpinner('Saving configuration...');
      try {
        const updatedConfig = {
          ...currentConfig,
          businessName: answers.businessName,
          businessAddress: answers.businessAddress,
          businessPhone: answers.businessPhone,
          bankName: answers.bankName,
          bankAccount: answers.bankAccount,
          bankSortCode: answers.bankSortCode,
          defaultCurrency: answers.defaultCurrency,
          smtp: {
            host: answers.smtpHost,
            port: answers.smtpPort,
            user: answers.smtpUser,
            pass: answers.smtpPass,
            secure: answers.smtpPort === 465,
          },
        };

        saveConfig(updatedConfig);
        succeed(saveSpinner, chalk.green('✓ Configuration saved successfully'));
      } catch (error: any) {
        fail(saveSpinner, chalk.red('Failed to save configuration'));
        console.error(error.message);
        process.exit(1);
      }
    });

  configCmd
    .command('get')
    .description('Show current configuration')
    .action(() => {
      const config = getConfig();
      const masked = { ...config };

      if (masked.smtp?.pass) {
        masked.smtp = { ...masked.smtp, pass: '****' };
      }

      // 🛡️ Sentinel: Actively mask sensitive authentication tokens to prevent plaintext console leakage
      if (masked.idToken) {
        masked.idToken = '****';
      }

      if (masked.refreshToken) {
        masked.refreshToken = '****';
      }

      console.log(JSON.stringify(masked, null, 2));
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value (dot notation: branding.primaryColor)')
    .action((key: string, value: string) => {
      try {
        const config = getConfig() as any;

        const keys = key.split('.');

        if (keys.some(k => ['__proto__', 'constructor', 'prototype'].includes(k))) {
          console.error(chalk.red('Invalid configuration key.'));
          process.exit(1);
        }

        let current: any = config;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        try {
          current[keys[keys.length - 1]] = JSON.parse(value);
        } catch {
          current[keys[keys.length - 1]] = value;
        }

        saveConfig(config);
        console.log(chalk.green(`✓ Set ${key} successfully`));
      } catch (error: any) {
        console.error(chalk.red('Failed to set config:'), error.message);
        process.exit(1);
      }
    });
}
