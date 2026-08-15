import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueMutation, flushQueue, getQueueCount, Mutation } from './offlineSync';
import localforage from 'localforage';
import { doc, setDoc } from '../services/firebase';
import { trackEvent } from './analytics';

vi.mock('./analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('localforage', () => {
  return {
    default: {
      config: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
    }
  };
});

vi.mock('../services/firebase', () => ({
  db: {},
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

describe('offlineSync', () => {
  let navigatorOnLine: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    navigatorOnLine = true;
    vi.stubGlobal('navigator', {
      get onLine() {
        return navigatorOnLine;
      }
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => 'mock-uuid-1234'
    });
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('queueMutation', () => {
    it('appends a new mutation when none exists for the docId', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);

      await queueMutation('invoices', 'doc-1', { amount: 100 });

      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', [
        {
          id: 'mock-uuid-1234',
          collection: 'invoices',
          docId: 'doc-1',
          data: { amount: 100 },
          timestamp: 1000
        }
      ]);
    });

    it('merges data into an existing mutation for the same docId', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        {
          id: 'old-uuid',
          collection: 'invoices',
          docId: 'doc-1',
          data: { amount: 100, currency: 'USD' },
          timestamp: 500
        }
      ]);

      await queueMutation('invoices', 'doc-1', { amount: 200, status: 'paid' });

      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', [
        {
          id: 'old-uuid',
          collection: 'invoices',
          docId: 'doc-1',
          data: { amount: 200, currency: 'USD', status: 'paid' },
          timestamp: 1000
        }
      ]);
    });

    it('handles exceptions and logs error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localforage.setItem).mockRejectedValueOnce(new Error('DB Error'));

      await queueMutation('invoices', 'doc-1', {});

      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to queue mutation', expect.objectContaining({
        event: 'offline.sync.queue_mutation.failed',
        error: 'DB Error'
      }));
      consoleSpy.mockRestore();
    });

    it('handles non-Error exceptions and logs stringified error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localforage.getItem).mockRejectedValue('String Error');

      await queueMutation('invoices', 'doc-1', {});

      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to queue mutation', expect.objectContaining({
        event: 'offline.sync.queue_mutation.failed',
        error: 'String Error'
      }));
      consoleSpy.mockRestore();
    });
  });

  describe('flushQueue', () => {
    it('returns false immediately if navigator is offline', async () => {
      navigatorOnLine = false;

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(localforage.getItem).not.toHaveBeenCalled();
    });

    it('returns true if queue is empty', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);

      const result = await flushQueue();

      expect(result).toBe(true);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('flushes mutations to firebase and clears queue on success', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 200 },
        { id: '2', collection: 'invoices', docId: 'doc-2', data: { val: 2 }, timestamp: 100 } // Older one
      ]);
      vi.mocked(doc).mockImplementation((db, coll, id) => `${coll}/${id}` as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await flushQueue();

      expect(result).toBe(true);
      // Ensure sorted by timestamp ascending
      expect(doc).toHaveBeenNthCalledWith(1, expect.anything(), 'invoices', 'doc-2');
      expect(doc).toHaveBeenNthCalledWith(2, expect.anything(), 'invoices', 'doc-1');

      expect(setDoc).toHaveBeenCalledTimes(2);
      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', []); // empty array of failed mutations
    });

    it('retains failed mutations in the queue and returns false', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100 },
        { id: '2', collection: 'invoices', docId: 'doc-2', data: { val: 2 }, timestamp: 200 }
      ]);
      vi.mocked(doc).mockImplementation((db, coll, id) => `${coll}/${id}` as any);

      // Fail on the first doc, succeed on the second
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(undefined);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to sync 1', expect.objectContaining({
        event: 'offline.sync.flush_item.failed',
        error: 'Network error'
      }));

      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', [
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100, attempts: 1 }
      ]);
      consoleSpy.mockRestore();
    });

    it('drops mutation and logs event after 5 failed attempts', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100, attempts: 4 }
      ]);
      vi.mocked(doc).mockImplementation((db, coll, id) => `${coll}/${id}` as any);

      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Persistent error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      // The flush queue should return true if ALL mutations in the newly calculated "failedMutations" array are 0.
      // Since it dropped the only one, failedMutations is empty, meaning the queue flush is technically "complete"
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to sync 1', expect.objectContaining({
        event: 'offline.sync.flush_item.failed',
        error: 'Persistent error'
      }));

      // Should drop the item, leaving failedMutations empty in storage
      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', []);
      expect(trackEvent).toHaveBeenCalledWith('sync_item_dropped_max_retries', {
        collection: 'invoices',
        docId: 'doc-1'
      });
      consoleSpy.mockRestore();
    });

    it('handles non-Error rejections during sync and logs stringified error', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100 }
      ]);
      vi.mocked(doc).mockImplementation((db, coll, id) => `${coll}/${id}` as any);

      vi.mocked(setDoc).mockRejectedValueOnce('Network Failure String');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to sync 1', expect.objectContaining({
        event: 'offline.sync.flush_item.failed',
        error: 'Network Failure String'
      }));

      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', [
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100, attempts: 1 }
      ]);
      consoleSpy.mockRestore();
    });

    it('handles synchronous exceptions thrown by setDoc during flushQueue', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100 }
      ]);
      vi.mocked(doc).mockImplementation((db, coll, id) => `${coll}/${id}` as any);

      // Simulate a synchronous error from setDoc
      vi.mocked(setDoc).mockImplementationOnce(() => {
        throw new Error('Synchronous setDoc error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to sync 1', expect.objectContaining({
        event: 'offline.sync.flush_item.failed',
        error: 'Synchronous setDoc error'
      }));

      expect(trackEvent).toHaveBeenCalledWith('sync_item_failed', {
        collection: 'invoices',
        docId: 'doc-1',
        error: 'Synchronous setDoc error'
      });

      // Failed mutation is retained in the queue for retry
      expect(localforage.setItem).toHaveBeenCalledWith('syncQueue', [
        { id: '1', collection: 'invoices', docId: 'doc-1', data: { val: 1 }, timestamp: 100, attempts: 1 }
      ]);
    });

    it('handles critical failure during queue fetch', async () => {
      vi.mocked(localforage.getItem).mockRejectedValue(new Error('Fatal read error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Critical failure during flushQueue', expect.objectContaining({
        event: 'offline.sync.flush_queue.critical_failure',
        error: 'Fatal read error'
      }));
      consoleSpy.mockRestore();
    });

    it('handles non-Error critical failure and logs stringified error', async () => {
      vi.mocked(localforage.getItem).mockRejectedValue('Fatal String Error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await flushQueue();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Critical failure during flushQueue', expect.objectContaining({
        event: 'offline.sync.flush_queue.critical_failure',
        error: 'Fatal String Error'
      }));
      consoleSpy.mockRestore();
    });
  });

  describe('getQueueCount', () => {
    it('returns the correct number of items in the queue', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([
        { id: '1', collection: 'invoices', docId: 'inv-1', data: {}, timestamp: 123 },
        { id: '2', collection: 'invoices', docId: 'inv-2', data: {}, timestamp: 124 }
      ]);
      const count = await getQueueCount();
      expect(count).toBe(2);
    });

    it('returns 0 when queue is null', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      const count = await getQueueCount();
      expect(count).toBe(0);
    });

    it('returns 0 when fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(localforage.getItem).mockRejectedValue(new Error('DB Error'));
      const count = await getQueueCount();
      expect(count).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('[Offline Sync] Failed to get queue count', expect.objectContaining({
        event: 'offline.sync.queue_count.failed',
        error: 'DB Error'
      }));
      expect(trackEvent).toHaveBeenCalledWith('sync_queue_count_failed', {
        error: 'DB Error'
      });
      consoleSpy.mockRestore();
    });
  });
});
