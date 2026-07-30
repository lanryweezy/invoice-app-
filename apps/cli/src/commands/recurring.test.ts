import { describe, it, expect } from 'vitest';
import { registerRecurrenceStrategy, RecurrenceStrategy, calculateNextDueDate } from './recurring';

describe('Recurrence Strategy Registry', () => {
  it('registers and retrieves custom strategies', () => {
    const customStrategy: RecurrenceStrategy = (startDate) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 14);
      return date.toISOString().split('T')[0];
    };

    registerRecurrenceStrategy('biweekly', customStrategy);

    // Test the newly registered strategy via the calculate function
    const result = calculateNextDueDate('2023-01-01', 'biweekly');
    expect(result).toBe('2023-01-15');
  });

  it('uses default weekly strategy correctly', () => {
    const result = calculateNextDueDate('2023-01-01', 'weekly');
    expect(result).toBe('2023-01-08');
  });
});
