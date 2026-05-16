
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpenses } from './useExpenses';
import * as firebaseFirestore from 'firebase/firestore';
import { useSubscription } from './useSubscription';

// Mock useSubscription
vi.mock('./useSubscription', () => ({
    useSubscription: vi.fn()
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    getFirestore: vi.fn(),
    db: {},
}));

// Mock crypto.randomUUID
if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid');
} else if (!global.crypto) {
    (global as any).crypto = {
        randomUUID: () => 'test-uuid'
    };
}

describe('useExpenses', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        localStorage.clear();
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        (useSubscription as any).mockReturnValue({
            user: { uid: 'test-user' },
            isPro: true,
            loading: false
        });
    });

    it('should debounce syncToCloud calls', async () => {
        const { result } = renderHook(() => useExpenses());
        await act(async () => { await Promise.resolve(); }); // flush initial effect

        const expense = { title: 'Test', amount: 100, date: '2023-01-01', category: 'Food' };

        act(() => {
            result.current.addExpense(expense);
            result.current.addExpense(expense);
            result.current.addExpense(expense);
        });

        // Immediately after additions, no sync should have happened
        expect(firebaseFirestore.setDoc).toHaveBeenCalledTimes(0);

        // Advance time by 1000ms
        await act(async () => {
            vi.advanceTimersByTime(1500);
            await Promise.resolve();
        });

        // Now it should have been called exactly once
        expect(firebaseFirestore.setDoc).toHaveBeenCalledTimes(1);
    });

    it('should add an expense to the list', async () => {
        const { result } = renderHook(() => useExpenses());
        const expense = { title: 'Test Expense', amount: 50, date: '2023-01-01', category: 'General' };

        act(() => {
            result.current.addExpense(expense);
        });

        expect(result.current.expenses.length).toBe(1);
        expect(result.current.expenses[0]).toMatchObject(expense);
        expect(result.current.expenses[0].id).toBe('test-uuid');
    });

    it('should remove an expense from the list', async () => {
        const { result } = renderHook(() => useExpenses());
        const expense = { title: 'Test Expense', amount: 50, date: '2023-01-01', category: 'General' };

        act(() => {
            result.current.addExpense(expense);
        });

        expect(result.current.expenses.length).toBe(1);

        act(() => {
            result.current.removeExpense('test-uuid');
        });

        expect(result.current.expenses.length).toBe(0);
    });
});
