// Offline Sync Service for InvoiceApp
// Queues changes when offline, syncs when back online

import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch, type WriteBatch, type DocumentReference } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';

interface PendingChange {
  id: string;
  collection: string;
  docId: string;
  type: 'create' | 'update' | 'delete' | (string & {});
  data?: unknown;
  timestamp: string;
  synced: boolean;
}

const QUEUE_KEY = 'invoiceapp_offline_queue';

/**
 * 🔩 Hinge Extension Point: SyncOperationStrategy
 *
 * Pressure: The `syncPendingChanges` function had a hardcoded `switch (change.type)` block.
 * Adding new types of offline operations required modifying this core sync loop.
 *
 * Contract:
 * - Implementors provide a function that takes a Firestore write batch, a document reference,
 *   and optional data.
 * - The strategy must apply its specific mutation (e.g. set, update, delete) to the batch.
 * - Do NOT commit the batch; the core sync loop handles batch committing.
 */
export type SyncOperationStrategy = (batch: WriteBatch, docRef: DocumentReference, data?: unknown) => void;

const syncStrategies = new Map<string, SyncOperationStrategy>();

export function registerSyncStrategy(type: string, strategy: SyncOperationStrategy): void {
  syncStrategies.set(type, strategy);
}

registerSyncStrategy('create', (batch, docRef, data) => {
  if (data) {
    batch.set(docRef, data, { merge: true });
  }
});

registerSyncStrategy('update', (batch, docRef, data) => {
  if (data) {
    batch.set(docRef, data, { merge: true });
  }
});

registerSyncStrategy('delete', (batch, docRef) => {
  batch.delete(docRef);
});

function getQueue(): PendingChange[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingChange[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(change: Omit<PendingChange, 'id' | 'timestamp' | 'synced'>) {
  const queue = getQueue();
  queue.push({
    ...change,
    id: `offline_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
    timestamp: new Date().toISOString(),
    synced: false,
  });
  saveQueue(queue);
}

export function queueInvoiceChange(type: 'create' | 'update' | 'delete', docId: string, data?: unknown) {
  addToQueue({ collection: 'invoices', docId, type, data });
}

export function queueExpenseChange(type: 'create' | 'update' | 'delete', docId: string, data?: unknown) {
  addToQueue({ collection: 'expenses', docId, type, data });
}

export function queueClientChange(type: 'create' | 'update' | 'delete', docId: string, data?: unknown) {
  addToQueue({ collection: 'clients', docId, type, data });
}

export async function syncPendingChanges(userId: string): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getQueue();
  const pending = queue.filter((c) => !c.synced);

  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  try {
    const batch = writeBatch(db);

    for (const change of pending) {
      try {
        const docRef = doc(db, 'users', userId, change.collection, change.docId);
        const strategy = syncStrategies.get(change.type);

        if (!strategy) {
          console.warn(`Unknown sync operation type: ${change.type}`);
          failed++;
          continue;
        }

        strategy(batch, docRef, change.data);

        change.synced = true;
        synced++;
      } catch (error) {
        console.error('Failed to sync individual offline change', {
          event: 'offline.sync.item.failed',
          userId,
          collection: change.collection,
          docId: change.docId,
          type: change.type,
          error: error instanceof Error ? error.message : String(error)
        });
        try {
          trackEvent('offline_sync_item_failed', {
            user_id: userId,
            collection: change.collection,
            doc_id: change.docId,
            type: change.type,
            error: error instanceof Error ? error.message : String(error)
          });
        } catch {}
        failed++;
      }
    }

    await batch.commit();
    saveQueue(queue.filter((c) => !c.synced));

    return { synced, failed };
  } catch (error) {
    console.error('Sync failed:', {
      event: 'offline.sync.batch.failed',
      userId,
      pendingCount: pending.length,
      error: error instanceof Error ? error.message : String(error)
    });
    try {
      trackEvent('offline_sync_batch_failed', {
        user_id: userId,
        pending_count: pending.length,
        error: error instanceof Error ? error.message : String(error)
      });
    } catch {}
    return { synced, failed: pending.length };
  }
}

export function getPendingChangesCount(): number {
  return getQueue().filter((c) => !c.synced).length;
}

export function clearSyncedChanges() {
  const queue = getQueue().filter((c) => !c.synced);
  saveQueue(queue);
}

// Register online/offline listeners
export function registerSyncListeners(userId: string) {
  window.addEventListener('online', async () => {
    console.log('Back online — syncing changes...');
    const result = await syncPendingChanges(userId);
    if (result.synced > 0) {
      console.log(`Synced ${result.synced} changes`);
      // Show toast notification
      const event = new CustomEvent('pwa-sync', { detail: result });
      window.dispatchEvent(event);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline — changes will be queued');
    const event = new CustomEvent('pwa-offline');
    window.dispatchEvent(event);
  });
}
