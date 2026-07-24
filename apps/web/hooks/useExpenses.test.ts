
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpenses } from './useExpenses';
import * as firebaseFirestore from 'firebase/firestore';
import { useSubscription } from './useSubscription';
import * as offlineSync from '../utils/offlineSync';
import { trackEvent } from '../utils/analytics';
vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));


// Mock useSubscription
vi.mock('./useSubscription', () => ({
    useSubscription: vi.fn()
}));

// Mock firebase/firestore

vi.mock('../services/firebase', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        analytics: null, // or mock whatever triggers dynamic config
        getAnalytics: vi.fn(),
        isSupported: vi.fn().mockResolvedValue(false),
        app: {}
    };
});


vi.mock('firebase/analytics', () => ({
    getAnalytics: vi.fn(),
    isSupported: vi.fn().mockResolvedValue(false),
    logEvent: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    getFirestore: vi.fn(),
    db: {}
}));

// Mock offlineSync
vi.mock('../utils/offlineSync', () => ({
    queueMutation: vi.fn().mockResolvedValue(undefined),
    getQueueCount: vi.fn().mockResolvedValue(0)
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
    let navigatorOnLine = true;

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
        navigatorOnLine = true;
        vi.stubGlobal('navigator', {
            get onLine() {
                return navigatorOnLine;
            }
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
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

    it('queues mutation locally when offline instead of syncing to cloud', async () => {
        navigatorOnLine = false;

        const { result } = renderHook(() => useExpenses());
        await act(async () => { await Promise.resolve(); });

        const expense = { title: 'Offline Expense', amount: 100, date: '2023-01-01', category: 'Food' };

        act(() => {
            result.current.addExpense(expense);
        });

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(firebaseFirestore.setDoc).not.toHaveBeenCalled();
        expect(offlineSync.queueMutation).toHaveBeenCalledWith('users', 'test-user', { expenses: result.current.expenses });
    });

    it('queues mutation locally when cloud sync throws an error', async () => {
        (firebaseFirestore.setDoc as any).mockRejectedValueOnce(new Error('Network Error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useExpenses());
        await act(async () => { await Promise.resolve(); });

        const expense = { title: 'Error Expense', amount: 100, date: '2023-01-01', category: 'Food' };

        act(() => {
            result.current.addExpense(expense);
        });

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        expect(firebaseFirestore.setDoc).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith("Failed to sync expenses, queueing locally instead", expect.any(Error));
        expect(offlineSync.queueMutation).toHaveBeenCalledWith('users', 'test-user', { expenses: result.current.expenses });
    });

    it('does not attempt cloud load or sync when user is not Pro', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'free-user' },
            isPro: false,
            loading: false
        });

        const { result } = renderHook(() => useExpenses());
        await act(async () => { await Promise.resolve(); });

        const expense = { title: 'Free Expense', amount: 10, date: '2023-01-01', category: 'Food' };

        act(() => {
            result.current.addExpense(expense);
        });

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(firebaseFirestore.setDoc).not.toHaveBeenCalled();
        expect(offlineSync.queueMutation).not.toHaveBeenCalled();
    });

    it('loads cloud data when pro user and no offline queue exists', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        // Mock getDoc to return expenses
        const mockExpenses = [{ id: 'mock-1', title: 'Cloud Expense', amount: 50, date: '2023-01-01', category: 'Food' }];
        (firebaseFirestore.getDoc as any).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ expenses: mockExpenses })
        });

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(result.current.expenses).toEqual(mockExpenses);
    });

    it('does not load cloud data if there are items in the offline queue', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        (offlineSync.getQueueCount as any).mockResolvedValueOnce(1);

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(firebaseFirestore.getDoc).not.toHaveBeenCalled();
    });

    it('handles errors when loading cloud data', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        (firebaseFirestore.getDoc as any).mockRejectedValueOnce(new Error('Cloud load failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(consoleSpy).toHaveBeenCalledWith("Failed to load cloud expenses", expect.any(Error));
    });

    it('catches invalid JSON in localStorage gracefully', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{ invalid json');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useExpenses());

        expect(result.current.expenses).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load initial expenses', expect.any(SyntaxError));
    });

    it('sets expenses from cloud if they exist on the user document', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        // Mock getDoc to return expenses
        const mockExpenses = [{ id: 'mock-1', title: 'Cloud Expense', amount: 50, date: '2023-01-01', category: 'Food' }];
        (firebaseFirestore.getDoc as any).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ expenses: mockExpenses })
        });

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(result.current.expenses).toEqual(mockExpenses);
    });

    it('does not set expenses if they do not exist on the user document', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        (firebaseFirestore.getDoc as any).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({})
        });

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(result.current.expenses).toEqual([]);
    });

    it('does not set expenses if user document does not exist', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        (firebaseFirestore.getDoc as any).mockResolvedValueOnce({
            exists: () => false
        });

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(result.current.expenses).toEqual([]);
    });

    it('does not load cloud data when pro user but no firebase user', async () => {
        (useSubscription as any).mockReturnValue({
            user: null,
            isPro: true,
            loading: false
        });

        const { result } = renderHook(() => useExpenses());
        await act(async () => { await Promise.resolve(); });

        expect(firebaseFirestore.getDoc).not.toHaveBeenCalled();
        expect(offlineSync.queueMutation).not.toHaveBeenCalled();
    });

    it('catches trackEvent errors when cloud load fails gracefully', async () => {
        (useSubscription as any).mockReturnValue({
            user: { uid: 'pro-user' },
            isPro: true,
            loading: false
        });

        (firebaseFirestore.getDoc as any).mockRejectedValueOnce(new Error('Cloud load failed'));
        // Mock trackEvent to throw
        (trackEvent as any).mockImplementationOnce(() => { throw new Error('trackEvent error'); });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useExpenses());

        await act(async () => { await Promise.resolve(); });

        expect(result.current.expenses).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load cloud expenses', expect.any(Error));
    });
});
