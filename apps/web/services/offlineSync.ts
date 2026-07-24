// Offline Sync Service for InvoiceApp
// Queues changes when offline, syncs when back online

import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

interface PendingChange {
  id: string;
  collection: string;
  docId: string;
  type: 'create' | 'update' | 'delete';
  data?: unknown;
  timestamp: string;
  synced: boolean;
}

const QUEUE_KEY = 'invoiceapp_offline_queue';

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
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

        switch (change.type) {
          case 'create':
          case 'update':
            if (change.data) {
              batch.set(docRef, change.data, { merge: true });
            }
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }

        change.synced = true;
        synced++;
      } catch {
        failed++;
      }
    }

    await batch.commit();
    saveQueue(queue.filter((c) => !c.synced));

    return { synced, failed };
  } catch (error) {
    console.error('Sync failed:', error);
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
