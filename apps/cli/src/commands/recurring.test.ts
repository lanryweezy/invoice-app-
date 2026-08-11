import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRecurrenceStrategy, RecurrenceStrategy, calculateNextDueDate } from './recurring';

vi.mock('../lib/config', () => ({
  ensureAuthenticated: vi.fn(() => ({
    userId: 'user123',
    email: 'test@test.com',
  })),
}));

const mockAdd = vi.fn().mockResolvedValue({ id: 'rec-123' });
const mockGet = vi.fn().mockResolvedValue([
  { id: 'rec-1', data: () => ({ clientName: 'A', amount: 100, interval: 'weekly', isActive: true }) },
  { id: 'rec-2', data: () => ({ clientName: 'B', amount: 200, interval: 'monthly', isActive: false }) }
]);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('../lib/firebase-client', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          add: mockAdd,
          get: mockGet,
          doc: vi.fn().mockReturnValue({
            update: mockUpdate,
            delete: mockDelete
          })
        })
      })
    })
  })),
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
    cyan: (s: string) => s,
    yellow: (s: string) => s,
  },
}));

describe('Recurrence Strategy Registry', () => {
  it('registers and retrieves custom strategies', () => {
    const customStrategy: RecurrenceStrategy = (startDate) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 14);
      return date.toISOString().split('T')[0];
    };

    registerRecurrenceStrategy('biweekly', customStrategy);

    const result = calculateNextDueDate('2023-01-01', 'biweekly');
    expect(result).toBe('2023-01-15');
  });

  it('uses default weekly strategy correctly', () => {
    const result = calculateNextDueDate('2023-01-01', 'weekly');
    expect(result).toBe('2023-01-08');
  });

  it('uses default monthly strategy correctly', () => {
    const result = calculateNextDueDate('2023-01-01', 'monthly');
    expect(result).toBe('2023-02-01');
  });

  it('uses default quarterly strategy correctly', () => {
    const result = calculateNextDueDate('2023-01-01', 'quarterly');
    expect(result).toBe('2023-04-01');
  });

  it('uses default yearly strategy correctly', () => {
    const result = calculateNextDueDate('2023-01-01', 'yearly');
    expect(result).toBe('2024-01-01');
  });

  it('throws an error for an unsupported interval', () => {
    expect(() => calculateNextDueDate('2023-01-01', 'unknown')).toThrow('Unsupported recurrence interval: unknown');
  });
});

describe('recurring commands', () => {
  let program: any;
  beforeEach(async () => {
    vi.clearAllMocks();
    const { Command } = await import('commander');
    program = new Command();
    program.exitOverride();
  });

  it('adds a recurring invoice when valid input is provided', async () => {
    const { default: registerRecurringCommands } = await import('./recurring');
    registerRecurringCommands(program);

    const inquirer = await import('inquirer');
    (inquirer.default.prompt as any).mockResolvedValueOnce({
      client: 'ACME',
      amount: '5000',
      items: '',
      interval: 'monthly',
      day: '1',
      start: '2023-01-01'
    });

    await program.parseAsync(['node', 'test', 'recurring', 'add']);
    expect(mockAdd).toHaveBeenCalled();
  });

  it('lists recurring invoices when the list command is executed', async () => {
    const { default: registerRecurringCommands } = await import('./recurring');
    registerRecurringCommands(program);

    await program.parseAsync(['node', 'test', 'recurring', 'list']);
    expect(mockGet).toHaveBeenCalled();
  });

  it('pauses a recurring invoice when the pause command is executed with an ID', async () => {
    const { default: registerRecurringCommands } = await import('./recurring');
    registerRecurringCommands(program);

    await program.parseAsync(['node', 'test', 'recurring', 'pause', 'rec-123']);
    expect(mockUpdate).toHaveBeenCalledWith({ isActive: false });
  });

  it('resumes a recurring invoice when the resume command is executed with an ID', async () => {
    const { default: registerRecurringCommands } = await import('./recurring');
    registerRecurringCommands(program);

    await program.parseAsync(['node', 'test', 'recurring', 'resume', 'rec-123']);
    expect(mockUpdate).toHaveBeenCalledWith({ isActive: true });
  });

  it('deletes a recurring invoice when the delete command is executed and confirmed', async () => {
    const { default: registerRecurringCommands } = await import('./recurring');
    registerRecurringCommands(program);

    const inquirer = await import('inquirer');
    (inquirer.default.prompt as any).mockResolvedValueOnce({ confirm: true });

    await program.parseAsync(['node', 'test', 'recurring', 'delete', 'rec-123']);
    expect(mockDelete).toHaveBeenCalled();
  });
});
