import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAction, getAuditTrail, searchAuditTrail, getAuditSummary, exportAuditTrail } from './auditTrail';
import localforage from 'localforage';
import type { Invoice } from '../types';

vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('auditTrail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('logAction', () => {
    it('creates a new audit entry and saves it to localforage', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      const invoiceId = 'inv-123';
      const userId = 'user-abc';
      const action = 'create';
      const details = { source: 'web' };

      const entry = await logAction(invoiceId, action, userId, details);

      expect(entry).toEqual({
        id: expect.any(String),
        invoiceId,
        action,
        userId,
        timestamp: '2024-01-01T12:00:00.000Z',
        details,
        previousValues: undefined,
        newValues: undefined,
      });

      expect(localforage.setItem).toHaveBeenCalledWith('entries', [entry]);
    });
  });

  describe('getAuditTrail', () => {
    it('returns entries sorted by timestamp descending for a specific invoice', async () => {
      const entries = [
        { id: '1', invoiceId: 'inv-123', action: 'create', userId: 'u1', timestamp: '2024-01-01T10:00:00Z', details: {} },
        { id: '2', invoiceId: 'inv-456', action: 'create', userId: 'u1', timestamp: '2024-01-01T11:00:00Z', details: {} },
        { id: '3', invoiceId: 'inv-123', action: 'edit', userId: 'u1', timestamp: '2024-01-01T12:00:00Z', details: {} },
      ];
      vi.mocked(localforage.getItem).mockResolvedValue(entries);

      const trail = await getAuditTrail('inv-123');
      expect(trail).toHaveLength(2);
      expect(trail[0].id).toBe('3'); // 12:00 is most recent
      expect(trail[1].id).toBe('1'); // 10:00 is oldest
    });
  });
});
