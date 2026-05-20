
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
    db: {}
}));

// Mock crypto.randomUUID
const MOCK_UUID = '123e4567-e89b-12d3-a456-426614174000' as `${string}-${string}-${string}-${string}-${string}`;

if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-1111-1111-111111111111');
} else if (!global.crypto) {
    (global as any).crypto = {
        randomUUID: vi.fn().mockReturnValue('11111111-1111-1111-1111-111111111111')
    };
} else {
    global.crypto.randomUUID = vi.fn().mockReturnValue('11111111-1111-1111-1111-111111111111');
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

        // Initial render triggers useEffect that sets isCloudLoaded to true asynchronously
        await act(async () => {
            await Promise.resolve(); // flush promises so loadCloudData finishes and isCloudLoaded.current becomes true
        });

        act(() => {
            result.current.addExpense(expense);
            result.current.addExpense(expense);
            result.current.addExpense(expense);
        });

        // Immediately after additions, no sync should have happened
        expect(firebaseFirestore.setDoc).toHaveBeenCalledTimes(0);

        // Advance time by 1000ms
        await act(async () => {
            vi.advanceTimersByTime(1000);
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
        expect(result.current.expenses[0].id).toBe('11111111-1111-1111-1111-111111111111');
    });

    it('should remove an expense from the list', async () => {
        const { result } = renderHook(() => useExpenses());
        const expense = { title: 'Test Expense', amount: 50, date: '2023-01-01', category: 'General' };

        act(() => {
            result.current.addExpense(expense);
        });

        expect(result.current.expenses.length).toBe(1);

        act(() => {
            result.current.removeExpense('11111111-1111-1111-1111-111111111111');
        });

        expect(result.current.expenses.length).toBe(0);
    });
});
