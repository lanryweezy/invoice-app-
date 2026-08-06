import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayISODate } from './date';

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns today as ISO date string', () => {
    vi.setSystemTime(new Date('2024-05-15T12:30:45Z'));
    expect(getTodayISODate()).toBe('2024-05-15');
  });
});
