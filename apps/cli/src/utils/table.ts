import Table from 'cli-table3';
import chalk from 'chalk';
import { Invoice, Client } from '../types';
import { formatCurrency, formatDate } from './formatter';

export function createInvoiceTable(invoices: Invoice[]): InstanceType<typeof Table> {
  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('Client'),
      chalk.cyan('Amount'),
      chalk.cyan('Status'),
      chalk.cyan('Due Date'),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  invoices.forEach((invoice, index) => {
    table.push([
      index + 1,
      invoice.client.name,
      formatCurrency(invoice.total || 0, invoice.currency),
      invoice.status,
      formatDate(invoice.dueDate),
    ]);
  });

  return table;
}

export function createClientTable(clients: Client[]): InstanceType<typeof Table> {
  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('Name'),
      chalk.cyan('Email'),
      chalk.cyan('Phone'),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  clients.forEach((client, index) => {
    table.push([
      index + 1,
      client.name,
      client.email,
      client.phone || '-',
    ]);
  });

  return table;
}

export function printTable(table: InstanceType<typeof Table>): void {
  console.log(table.toString());
}
