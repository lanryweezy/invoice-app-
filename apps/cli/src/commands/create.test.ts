import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/config', () => ({
  ensureAuthenticated: vi.fn(() => ({
    userId: 'user123',
    email: 'test@test.com',
    businessName: 'Test Business',
    businessAddress: '123 St',
    businessPhone: '08012345678',
    bankName: 'Test Bank',
    bankAccount: '1234567890',
  })),
}));

vi.mock('../lib/firebase-client', () => ({
  writeDoc: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(),
}));

vi.mock('../utils/spinner', () => ({
  createSpinner: vi.fn(() => ({})),
  succeed: vi.fn(),
  fail: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    bold: (s: string) => s,
  },
}));

import { Command } from 'commander';
import registerCreateCommand from './create';
import { writeDoc } from '../lib/firebase-client';

describe('create command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
  });

  it('parses items string and generates invoice number', async () => {
    registerCreateCommand(program);

    await program.parseAsync(['node', 'test', 'create', '--client', 'ACME', '--items', 'Design:20000,Development:30000', '--due-date', '2026-08-15']);

    expect(writeDoc).toHaveBeenCalledTimes(1);
    const callArgs = (writeDoc as any).mock.calls[0];
    const invoice = callArgs[2];
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-\d{4}$/);
    expect(invoice.client.name).toBe('ACME');
    expect(invoice.lineItems).toHaveLength(2);
    expect(invoice.lineItems[0].description).toBe('Design');
    expect(invoice.lineItems[0].price).toBe(20000);
    expect(invoice.lineItems[1].description).toBe('Development');
    expect(invoice.lineItems[1].price).toBe(30000);
  });

  it('saves invoice to Firestore with correct collection path', async () => {
    registerCreateCommand(program);

    await program.parseAsync(['node', 'test', 'create', '--client', 'ACME', '--amount', '50000', '--due-date', '2026-08-15']);

    expect(writeDoc).toHaveBeenCalledWith(
      'users/user123/invoices',
      expect.stringMatching(/^INV-/),
      expect.objectContaining({ invoiceNumber: expect.stringMatching(/^INV-/) })
    );
  });
});
