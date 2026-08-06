import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';
import { useSubscription } from './useSubscription';
import { setDoc } from '../services/firebase';

vi.mock('./useSubscription', () => ({
  useSubscription: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  db: {},
  doc: vi.fn(() => 'mock-doc-ref'),
  setDoc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
}));

vi.mock('../utils/offlineSync', () => ({
  queueMutation: vi.fn(),
  getQueueCount: vi.fn().mockResolvedValue(0),
}));

describe('useInvoice - Recurring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-recurring'), getRandomValues: vi.fn((arr: any) => { for(let i=0; i<arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; }) });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('adds a new recurring invoice and syncs to local storage and cloud when saveRecurringInvoice is called', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    const recurringInvoice1 = { invoiceNumber: 'REC-001', amount: 100 } as any;
    const recurringInvoice2 = { invoiceNumber: 'REC-002', amount: 200 } as any;

    act(() => {
      result.current.saveRecurringInvoice(recurringInvoice1);
      result.current.saveRecurringInvoice(recurringInvoice2);
    });

    const recurring = result.current.recurringInvoices;
    expect(recurring.length).toBe(2);
    expect(recurring[0].invoiceNumber).toBe('REC-001');
    expect(recurring[1].invoiceNumber).toBe('REC-002');

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceRecurring', JSON.stringify([
      recurringInvoice1,
      recurringInvoice2
    ]));

    expect(setDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      { recurringInvoices: [recurringInvoice1, recurringInvoice2] },
      { merge: true }
    );
  });

  it('removes a recurring invoice by index when removeRecurringInvoice is executed', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    const recurringInvoice1 = { invoiceNumber: 'REC-001', amount: 100 } as any;
    const recurringInvoice2 = { invoiceNumber: 'REC-002', amount: 200 } as any;

    act(() => {
      result.current.saveRecurringInvoice(recurringInvoice1);
      result.current.saveRecurringInvoice(recurringInvoice2);
    });

    expect(result.current.recurringInvoices.length).toBe(2);

    act(() => {
      result.current.removeRecurringInvoice(0);
    });

    const recurring = result.current.recurringInvoices;
    expect(recurring.length).toBe(1);
    expect(recurring[0].invoiceNumber).toBe('REC-002');

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceRecurring', JSON.stringify([
      recurringInvoice2
    ]));

    expect(setDoc).toHaveBeenLastCalledWith(
      'mock-doc-ref',
      { recurringInvoices: [recurringInvoice2] },
      { merge: true }
    );
  });

  it('toggles the active state of a recurring invoice when toggleRecurringActive is called', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    const recurringInvoice1 = { invoiceNumber: 'REC-001', amount: 100, recurringIsActive: true } as any;

    act(() => {
      result.current.saveRecurringInvoice(recurringInvoice1);
    });

    expect(result.current.recurringInvoices.length).toBe(1);
    expect(result.current.recurringInvoices[0].recurringIsActive).toBe(true);

    act(() => {
      result.current.toggleRecurringActive(0, false);
    });

    const recurring = result.current.recurringInvoices;
    expect(recurring.length).toBe(1);
    expect(recurring[0].recurringIsActive).toBe(false);

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceRecurring', JSON.stringify([
      { ...recurringInvoice1, recurringIsActive: false }
    ]));

    expect(setDoc).toHaveBeenLastCalledWith(
      'mock-doc-ref',
      { recurringInvoices: [{ ...recurringInvoice1, recurringIsActive: false }] },
      { merge: true }
    );
  });
});
