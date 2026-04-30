import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc } from '../services/firebase';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { user: firebaseUser, isPro } = useSubscription();

    // Load from local storage initially
    useEffect(() => {
        try {
            const stored = localStorage.getItem('invoiceExpenses');
            if (stored) setExpenses(JSON.parse(stored));
        } catch (e) { console.error('Failed to load expenses', e); }
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
                        if (data.expenses) {
                            setExpenses(data.expenses);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load cloud expenses", error);
                }
            };
            loadCloudData();
        }
    }, [isPro, firebaseUser]);

    const syncToCloud = useCallback(async (newExpenses: Expense[]) => {
        if (isPro && firebaseUser) {
            try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                await setDoc(userRef, { expenses: newExpenses }, { merge: true });
            } catch (error) {
                console.error("Failed to sync expenses", error);
            }
        }
    }, [isPro, firebaseUser]);

    const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
        setExpenses(prev => {
            const updated = [...prev, { ...expense, id: crypto.randomUUID() }];
            localStorage.setItem('invoiceExpenses', JSON.stringify(updated));
            syncToCloud(updated);
            return updated;
        });
    }, [syncToCloud]);

    const removeExpense = useCallback((id: string) => {
        setExpenses(prev => {
            const updated = prev.filter(e => e.id !== id);
            localStorage.setItem('invoiceExpenses', JSON.stringify(updated));
            syncToCloud(updated);
            return updated;
        });
    }, [syncToCloud]);

    return { expenses, addExpense, removeExpense };
};
