import { useState, useEffect, useCallback } from 'react';
import type { Receipt } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc } from '../services/firebase';
import { trackEvent } from '../utils/analytics';
import { getErrorMessage } from '../utils/error';

export const useReceipts = () => {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const { user: firebaseUser, isPro } = useSubscription();

    // Load from local storage initially
    useEffect(() => {
        try {
            const stored = localStorage.getItem('invoiceReceipts');
            if (stored) setReceipts(JSON.parse(stored));
        } catch (e) { console.error('Failed to load receipts', { event: 'receipts.load.local.failed', error: getErrorMessage(e) }); }
    }, []);

    // Load from cloud if Pro
    useEffect(() => {
        if (isPro && firebaseUser) {
            const loadCloudData = async () => {
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.receipts) {
                            setReceipts(data.receipts);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load cloud receipts", { event: 'receipts.load.cloud.failed', userId: firebaseUser.uid, error: getErrorMessage(error) });
                    try { trackEvent('cloud_data_load_failed', { collection: 'users', doc_id: firebaseUser.uid, error: String(error) }); } catch {}
                }
            };
            loadCloudData();
        }
    }, [isPro, firebaseUser]);

    const syncToCloud = useCallback(async (newReceipts: Receipt[]) => {
        if (isPro && firebaseUser) {
            try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                await setDoc(userRef, { receipts: newReceipts }, { merge: true });
            } catch (error) {
                console.error("Failed to sync receipts", { event: 'receipts.sync.cloud.failed', userId: firebaseUser.uid, error: getErrorMessage(error) });
                try { trackEvent('cloud_data_sync_failed', { collection: 'users', doc_id: firebaseUser.uid, error: String(error) }); } catch {}
            }
        }
    }, [isPro, firebaseUser]);

    const addReceipt = useCallback((receipt: Omit<Receipt, 'id'>) => {
        setReceipts(prev => {
            const year = new Date().getFullYear();
            const count = prev.length + 1;
            const id = `RCP-${year}-${String(count).padStart(3, '0')}`;
            const updated = [...prev, { ...receipt, id }];
            localStorage.setItem('invoiceReceipts', JSON.stringify(updated));
            syncToCloud(updated).catch(e => console.error('Failed to trigger background sync', { event: 'receipts.sync.trigger.failed', error: getErrorMessage(e) }));
            return updated;
        });
    }, [syncToCloud]);

    const removeReceipt = useCallback((id: string) => {
        setReceipts(prev => {
            const updated = prev.filter(r => r.id !== id);
            localStorage.setItem('invoiceReceipts', JSON.stringify(updated));
            syncToCloud(updated).catch(e => console.error('Failed to trigger background sync', { event: 'receipts.sync.trigger.failed', error: getErrorMessage(e) }));
            return updated;
        });
    }, [syncToCloud]);

    return { receipts, addReceipt, removeReceipt };
};



