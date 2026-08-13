import { describe, it, expect, vi } from 'vitest';
import { createInvoiceTable, createClientTable } from './table';
import { Invoice, Client, User } from '../types';

vi.mock('chalk', () => ({ default: { cyan: vi.fn((str) => str) } }));

describe('table utils', () => {
  it('creates invoice table correctly', () => {
    const table = createInvoiceTable([{
      client: { name: 'Acme Corp' },
      invoiceNumber: 'INV-1',
      dueDate: '2023-01-15',
      currency: 'USD',
      status: 'Draft',
      total: 1000,
    } as Invoice]);
    expect(table.toString()).toContain('Acme Corp');
    expect(table.toString()).toContain('1,000');
  });

  it('creates client table correctly', () => {
    const table = createClientTable([
      { name: 'John Doe', email: 'john@example.com', address: '123' } as Client
    ]);
    expect(table.toString()).toContain('John Doe');
    expect(table.toString()).toContain('-');
  });
});
