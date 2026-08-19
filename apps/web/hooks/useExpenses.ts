import { useState, useEffect, useCallback, useRef } from 'react';
import type { Expense } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc } from '../services/firebase';
import { trackEvent } from '../utils/analytics';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>(() => {
        try {
            const stored = localStorage.getItem('invoiceExpenses');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load initial expenses', e);
            return [];
        }
    });

    const { user: firebaseUser, isPro } = useSubscription();
    const isCloudLoaded = useRef(false);

    // Load from cloud if Pro
    useEffect(() => {
        if (isPro && firebaseUser) {
            const loadCloudData = async () => {
                try {
                    

                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.expenses) {
                            setExpenses(data.expenses);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load cloud expenses", error);
                    try { trackEvent('cloud_data_load_failed', { collection: 'users', doc_id: firebaseUser.uid, error: String(error) }); } catch {}
                } finally {
                    isCloudLoaded.current = true;
                }
            };
            loadCloudData();
        } else if (!isPro) {
            isCloudLoaded.current = true;
        }
    }, [isPro, firebaseUser]);

      const syncToCloud = useCallback(async (newExpenses: Expense[]) => {
      if (isPro && firebaseUser) {
          try {
              const userRef = doc(db, 'users', firebaseUser.uid);
              setDoc(userRef, { expenses: newExpenses }, { merge: true }).catch(e => console.error("Expense sync failed", e));
          } catch (error) {
              console.error("Failed to sync expenses", error);
          }
      }
  }, [isPro, firebaseUser]);

    // Immediate local persistence
    useEffect(() => {
        localStorage.setItem('invoiceExpenses', JSON.stringify(expenses));
    }, [expenses]);

    // Debounced sync to cloud
    useEffect(() => {
        // Only sync if we've finished the initial cloud load (or if not Pro)
        if (!isCloudLoaded.current) return;

        const timeoutId = setTimeout(() => {
            // ðŸŒ± Flora: Catch floating promise rejections inside setTimeout to prevent silent failures
            // bypassing standard React error boundaries.
            syncToCloud(expenses).catch(console.error);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [expenses, syncToCloud]);

    const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
        setExpenses(prev => [...prev, { ...expense, id: crypto.randomUUID() }]);
    }, []);

    const removeExpense = useCallback((id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }, []);

    return { expenses, addExpense, removeExpense };
};

