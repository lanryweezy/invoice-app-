import localforage from 'localforage';
import { db, doc, setDoc } from '../services/firebase';
import { trackEvent } from './analytics';

// Configure the IndexedDB store
localforage.config({
  name: 'InvoiceApp',
  storeName: 'offline_mutations',
  description: 'Queues Firestore updates when the app is offline'
});

export interface Mutation {
  id: string;
  collection: string;
  docId: string;
  data: any;
  timestamp: number;
}

/**
 * Pushes a mutation into the IndexedDB queue to be synced later.
 */
export const queueMutation = async (collectionName: string, docId: string, data: any) => {
  try {
    const queue = (await localforage.getItem<Mutation[]>('syncQueue')) || [];

    // Check if there's already a pending mutation for this document.
    // If so, merge the data instead of creating a new queue item to prevent redundant writes.
    const existingIndex = queue.findIndex(m => m.collection === collectionName && m.docId === docId);

    if (existingIndex >= 0) {
      queue[existingIndex].data = { ...queue[existingIndex].data, ...data };
      queue[existingIndex].timestamp = Date.now();
    } else {
      const newMutation: Mutation = {
        id: crypto.randomUUID(),
        collection: collectionName,
        docId,
        data,
        timestamp: Date.now()
      };
      queue.push(newMutation);
    }

    await localforage.setItem('syncQueue', queue);
    console.log(`[Offline Sync] Queued mutation for ${collectionName}/${docId}`);
    trackEvent('sync_mutation_queued', { collection: collectionName, docId });
  } catch (error) {
    console.error("[Offline Sync] Failed to queue mutation", error);
    trackEvent('sync_mutation_queue_failed', {
      collection: collectionName,
      docId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Attempts to flush all queued mutations to Firestore.
 * Returns true if the queue was fully flushed, false if errors occurred or if offline.
 */
export const flushQueue = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    const queue = (await localforage.getItem<Mutation[]>('syncQueue')) || [];

    if (queue.length === 0) {
      return true; // Nothing to sync
    }

    console.log(`[Offline Sync] Flushing ${queue.length} items to cloud...`);
    trackEvent('sync_flush_started', { queue_length: queue.length });

    // Sort by timestamp to ensure older mutations are processed first (if we had distinct mutations per doc)
    queue.sort((a, b) => a.timestamp - b.timestamp);

    const failedMutations: Mutation[] = [];

    // Process concurrently since queueMutation guarantees unique docIds per collection in the queue
    const results = await Promise.allSettled(
      queue.map(async (mutation) => {
        const docRef = doc(db, mutation.collection, mutation.docId);
        // Using merge: true as this is primarily used for partial updates (e.g. { invoiceUser: ... })
        await setDoc(docRef, mutation.data, { merge: true });
        console.log(`[Offline Sync] Synced ${mutation.collection}/${mutation.docId}`);
        trackEvent('sync_item_success', { collection: mutation.collection, docId: mutation.docId });
      })
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const mutation = queue[i];
      if (result.status === 'rejected') {
        const err = result.reason;
        console.error(`[Offline Sync] Failed to sync ${mutation.id}`, err);
        trackEvent('sync_item_failed', {
          collection: mutation.collection,
          docId: mutation.docId,
          error: err instanceof Error ? err.message : String(err)
        });
        failedMutations.push(mutation); // Keep failed ones in the queue for next time
      }
    }

    await localforage.setItem('syncQueue', failedMutations);

    trackEvent('sync_flush_completed', {
      success_count: queue.length - failedMutations.length,
      failed_count: failedMutations.length
    });

    return failedMutations.length === 0;

  } catch (error) {
    console.error("[Offline Sync] Critical failure during flushQueue", error);
    trackEvent('sync_flush_critical_failure', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
};

/**
 * Gets the current count of items in the sync queue
 */
export const getQueueCount = async (): Promise<number> => {
  try {
    const queue = await localforage.getItem<Mutation[]>('syncQueue');
    return queue ? queue.length : 0;
  } catch (e) {
    return 0;
  }
};
