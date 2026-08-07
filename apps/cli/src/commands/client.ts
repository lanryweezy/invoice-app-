import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ensureAuthenticated } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { Client } from '../types';
import { createClientTable, printTable } from '../utils/table';
import { createSpinner, succeed, fail } from '../utils/spinner';

async function findClientByName(uid: string, name: string): Promise<Client | undefined> {
  const db = getDb();
  const snapshot = await db.collection('users').doc(uid).collection('clients').get();
  const clients: Client[] = [];
  snapshot.forEach((doc) => {
    clients.push({ id: doc.id, ...doc.data() } as Client);
  });
  return clients.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
}

export function registerClientCommands(program: Command): void {
  const client = program
    .command('client')
    .description('Manage your clients');

  client
    .command('add')
    .description('Add a new client')
    .option('-n, --name <name>', 'Client name')
    .option('-e, --email <email>', 'Client email')
    .option('-p, --phone <phone>', 'Client phone')
    .option('-a, --address <address>', 'Client address')
    .option('--tin <tin>', 'Tax Identification Number')
    .option('--cac <cac>', 'CAC registration number')
    .action(async (options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        let { name, email, phone, address, tin, cac } = options;

        if (!name || !email || !address) {
          const answers = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Client name:', when: !name },
            { type: 'input', name: 'email', message: 'Client email:', when: !email },
            { type: 'input', name: 'phone', message: 'Client phone (optional):', when: !phone },
            { type: 'input', name: 'address', message: 'Client address:', when: !address },
            { type: 'input', name: 'tin', message: 'TIN (optional):', when: !tin },
            { type: 'input', name: 'cac', message: 'CAC number (optional):', when: !cac },
          ]);
          name = name || answers.name;
          email = email || answers.email;
          phone = phone || answers.phone;
          address = address || answers.address;
          tin = tin || answers.tin;
          cac = cac || answers.cac;
        }

        const spinner = createSpinner('Adding client...');
        const db = getDb();
        const docRef = await db.collection('users').doc(uid).collection('clients').add({
          name,
          email,
          phone: phone || '',
          address,
          tin: tin || '',
          cacNumber: cac || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        succeed(spinner, chalk.green(`✓ Client "${name}" added successfully (ID: ${docRef.id})`));
      } catch (error: any) {
        console.error(chalk.red('Failed to add client:'), error.message);
        process.exit(1);
      }
    });

  client
    .command('list')
    .description('List all clients')
    .action(async () => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Fetching clients...');

        const db = getDb();
        const snapshot = await db.collection('users').doc(uid).collection('clients').get();
        const clients: Client[] = [];
        snapshot.forEach((doc) => {
          clients.push({ id: doc.id, ...doc.data() } as Client);
        });

        if (clients.length === 0) {
          succeed(spinner, chalk.yellow('No clients found. Add one with: invoiceapp client add'));
          return;
        }

        succeed(spinner, chalk.green(`Found ${clients.length} client(s)`));
        printTable(createClientTable(clients));
      } catch (error: any) {
        console.error(chalk.red('Failed to list clients:'), error.message);
        process.exit(1);
      }
    });

  client
    .command('get <name>')
    .description('Get client details by name')
    .action(async (name: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Searching for client...');

        const found = await findClientByName(uid, name);

        if (!found) {
          fail(spinner, chalk.red(`No client found matching "${name}"`));
          return;
        }

        succeed(spinner, 'Client found');
        console.log(chalk.cyan('\nClient Details:'));
        console.log(`  Name:   ${found.name}`);
        console.log(`  Email:  ${found.email}`);
        console.log(`  Phone:  ${found.phone || 'N/A'}`);
        console.log(`  Address: ${found.address}`);
        console.log(`  TIN:    ${found.tin || 'N/A'}`);
        console.log(`  CAC:    ${found.cacNumber || 'N/A'}`);
        console.log(`  ID:     ${found.id}`);
      } catch (error: any) {
        console.error(chalk.red('Failed to get client:'), error.message);
        process.exit(1);
      }
    });

  client
    .command('update <name>')
    .description('Update client details')
    .option('-e, --email <email>', 'New email')
    .option('-p, --phone <phone>', 'New phone')
    .option('-a, --address <address>', 'New address')
    .action(async (name: string, options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Searching for client...');

        const found = await findClientByName(uid, name);

        if (!found) {
          fail(spinner, chalk.red(`No client found matching "${name}"`));
          return;
        }

        const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
        if (options.email) updates.email = options.email;
        if (options.phone) updates.phone = options.phone;
        if (options.address) updates.address = options.address;

        const db = getDb();
        await db.collection('users').doc(uid).collection('clients').doc(found.id!).update(updates);
        succeed(spinner, chalk.green(`✓ Client "${found.name}" updated successfully`));
      } catch (error: any) {
        console.error(chalk.red('Failed to update client:'), error.message);
        process.exit(1);
      }
    });

  client
    .command('delete <name>')
    .description('Delete a client')
    .action(async (name: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Searching for client...');

        const found = await findClientByName(uid, name);

        if (!found) {
          fail(spinner, chalk.red(`No client found matching "${name}"`));
          return;
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete "${found.name}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Deletion cancelled'));
          return;
        }

        const db = getDb();
        await db.collection('users').doc(uid).collection('clients').doc(found.id!).delete();
        succeed(spinner, chalk.green(`✓ Client "${found.name}" deleted successfully`));
      } catch (error: any) {
        console.error(chalk.red('Failed to delete client:'), error.message);
        process.exit(1);
      }
    });
}
