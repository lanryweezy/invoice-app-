import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAction, getAuditTrail, searchAuditTrail, getAuditSummary, exportAuditTrail, registerAuditExportStrategy } from './auditTrail';
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
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      })
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
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

  describe('searchAuditTrail', () => {
    const mockEntries = [
      { id: '1', invoiceId: 'inv-1', action: 'create', userId: 'u1', timestamp: '2024-01-01T10:00:00Z', details: {} },
      { id: '2', invoiceId: 'inv-1', action: 'edit', userId: 'u2', timestamp: '2024-01-02T10:00:00Z', details: {} },
      { id: '3', invoiceId: 'inv-2', action: 'create', userId: 'u1', timestamp: '2024-01-03T10:00:00Z', details: {} },
      { id: '4', invoiceId: 'inv-2', action: 'delete', userId: 'u3', timestamp: '2024-01-04T10:00:00Z', details: {} },
    ];

    beforeEach(() => {
      vi.mocked(localforage.getItem).mockResolvedValue(mockEntries);
    });

    it('filters by invoiceId', async () => {
      const results = await searchAuditTrail({ invoiceId: 'inv-1' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['2', '1']); // Sorted descending
    });

    it('filters by userId', async () => {
      const results = await searchAuditTrail({ userId: 'u1' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['3', '1']);
    });

    it('filters by action', async () => {
      // @ts-ignore - using literal string for brevity
      const results = await searchAuditTrail({ action: 'create' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['3', '1']);
    });

    it('filters by startDate', async () => {
      const results = await searchAuditTrail({ startDate: '2024-01-03T00:00:00Z' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['4', '3']);
    });

    it('filters by endDate', async () => {
      const results = await searchAuditTrail({ endDate: '2024-01-02T23:59:59Z' });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['2', '1']);
    });

    it('filters by multiple criteria simultaneously', async () => {
      const results = await searchAuditTrail({
        invoiceId: 'inv-2',
        startDate: '2024-01-04T00:00:00Z'
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('4');
    });

    it('limits the number of results and defaults to 500', async () => {
      const results = await searchAuditTrail({ limit: 1 });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('4'); // Most recent

      // Test default limit is applied when limit not provided
      const defaultResults = await searchAuditTrail({});
      expect(defaultResults).toHaveLength(4);
    });
  });

  describe('getAuditSummary', () => {
    it('generates summary data for an existing audit trail', async () => {
      // NOTE: getAuditTrail internally filters by invoiceId and sorts by timestamp descending.
      // So the returned trail order will be: [newest, older, oldest]
      const mockEntries = [
        { id: '1', invoiceId: 'inv-1', action: 'create', userId: 'creator-1', timestamp: '2024-01-01T10:00:00Z', details: {} }, // oldest
        { id: '2', invoiceId: 'inv-1', action: 'edit', userId: 'editor-1', timestamp: '2024-01-02T10:00:00Z', details: {} },
        { id: '3', invoiceId: 'inv-1', action: 'send', userId: 'sender-1', timestamp: '2024-01-03T10:00:00Z', details: {} }, // newest
        { id: '4', invoiceId: 'inv-other', action: 'create', userId: 'other-1', timestamp: '2024-01-04T10:00:00Z', details: {} },
      ];
      vi.mocked(localforage.getItem).mockResolvedValue(mockEntries);

      const summary = await getAuditSummary('inv-1');

      expect(summary.totalActions).toBe(3);

      // first is trail[trail.length - 1], which is the oldest entry
      expect(summary.createdBy).toBe('creator-1');
      expect(summary.createdAt).toBe('2024-01-01T10:00:00Z');

      // last is trail[0], which is the newest entry
      expect(summary.lastModifiedBy).toBe('sender-1');
      expect(summary.lastModifiedAt).toBe('2024-01-03T10:00:00Z');

      expect(summary.actionCounts).toEqual({
        create: 1,
        edit: 1,
        send: 1,
      });
    });

    it('handles empty audit trails gracefully', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([]);

      const summary = await getAuditSummary('inv-empty');

      expect(summary.totalActions).toBe(0);
      expect(summary.createdBy).toBeNull();
      expect(summary.createdAt).toBeNull();
      expect(summary.lastModifiedBy).toBeNull();
      expect(summary.lastModifiedAt).toBeNull();
      expect(summary.actionCounts).toEqual({});
    });
  });

  describe('exportAuditTrail', () => {
    const mockEntries = [
      {
        id: '1',
        invoiceId: 'inv-1',
        action: 'edit',
        userId: 'u1',
        timestamp: '2024-01-01T12:00:00Z',
        details: { note: 'A note with, a comma and "quotes" and \n newline' },
        previousValues: { amount: 100 },
        newValues: { amount: 200 }
      },
      {
        id: '2',
        invoiceId: 'inv-1',
        action: 'create',
        userId: 'u1',
        timestamp: '2024-01-01T10:00:00Z',
        details: { simple: true },
      }
    ];

    beforeEach(() => {
      vi.mocked(localforage.getItem).mockResolvedValue(mockEntries);
    });

    it('exports as JSON', async () => {
      const result = await exportAuditTrail('inv-1', 'json');
      // The output of export is filtered by invoiceId and sorted by timestamp desc,
      // so mockEntries are already in the correct returned order [1, 2].
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('1');
      expect(parsed[1].id).toBe('2');
    });

    it('exports as CSV and correctly escapes commas, quotes, and newlines', async () => {
      const result = await exportAuditTrail('inv-1', 'csv');
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 rows
      expect(lines[0]).toBe('ID,Invoice ID,Action,User ID,Timestamp,Details,Previous Values,New Values');

      // The first data row has complex characters in the details JSON
      // Expected details string: {"note":"A note with, a comma and \"quotes\" and \n newline"}
      // Expected CSV escaped: "{""note"":""A note with, a comma and \""quotes\"" and \n newline""}"
      const complexRow = lines[1];
      expect(complexRow).toContain('1,inv-1,edit,u1,2024-01-01T12:00:00Z');

      // Specifically test the escaped JSON block. Note that JSON.stringify also escapes newlines to \n.
      const stringifiedDetails = JSON.stringify(mockEntries[0].details);
      // escapeCSV replaces " with "" and wraps in quotes because of commas and quotes
      const escapedDetails = `"${stringifiedDetails.replace(/"/g, '""')}"`;
      expect(complexRow).toContain(escapedDetails);

      const stringifiedPrev = JSON.stringify(mockEntries[0].previousValues);
      const stringifiedNew = JSON.stringify(mockEntries[0].newValues);
      expect(complexRow).toContain(`"${stringifiedPrev.replace(/"/g, '""')}"`);
      expect(complexRow).toContain(`"${stringifiedNew.replace(/"/g, '""')}"`);

      // The second data row has simple details, but stringified JSON always has quotes, so it gets wrapped.
      const simpleRow = lines[2];
      const stringifiedSimpleDetails = JSON.stringify(mockEntries[1].details);
      expect(simpleRow).toContain(`"${stringifiedSimpleDetails.replace(/"/g, '""')}"`);

      // Test missing previousValues/newValues are exported as empty object {}
      // The `escapeCSV` function only wraps in quotes if there are commas, quotes, or newlines.
      // JSON.stringify({}) is "{}" which doesn't have any of those, so it should just be "{}" without outer quotes.
      const stringifiedEmpty = JSON.stringify({});
      expect(simpleRow.endsWith(`${stringifiedEmpty},${stringifiedEmpty}`)).toBe(true);
    });

    it('throws an error for unsupported export formats', async () => {
      await expect(exportAuditTrail('inv-1', 'pdf' as any)).rejects.toThrow(
        'Unsupported export format: pdf'
      );
    });

    it('allows registering and executing custom export strategies', async () => {
      // Register a mock 'xml' strategy
      registerAuditExportStrategy({
        format: 'xml',
        export: (entries) => {
          const rows = entries.map((e) => `<entry id="${e.id}">${e.action}</entry>`).join('');
          return `<audit>${rows}</audit>`;
        }
      });

      const result = await exportAuditTrail('inv-1', 'xml');

      expect(result).toBe('<audit><entry id="1">edit</entry><entry id="2">create</entry></audit>');
    });
  });
});
