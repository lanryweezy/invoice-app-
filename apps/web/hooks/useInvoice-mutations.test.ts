import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';
import { useSubscription } from './useSubscription';

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

describe('useInvoice - Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-mutations'), getRandomValues: vi.fn((arr: any) => { for(let i=0; i<arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; }) });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('resets invoice to initial state', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.updateInvoice('notes', 'some note');
      result.current.resetInvoice();
    });

    expect(result.current.invoice.notes).toBe('');
    expect(localStorage.removeItem).toHaveBeenCalledWith('invoiceDraft');
  });

  it('updates an invoice field via updateInvoice', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.updateInvoice('notes', 'hello world');
    });

    expect(result.current.invoice.notes).toBe('hello world');
  });

  it('calculates totals correctly with safe parsing', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
        result.current.updateInvoice('lineItems', [
            { id: '1', description: 'Item 1', quantity: 2, price: '100', taxCategory: 'Standard' }
        ]);
        result.current.updateInvoice('discountRate', '10');
        result.current.updateInvoice('discountType', 'percentage');
        result.current.updateInvoice('taxRate', 5);
        result.current.updateInvoice('whtRate', 2);
        result.current.updateInvoice('shippingAmount', '50');
    });

    let totals;
    act(() => {
        totals = result.current.calculateTotals();
    });

    expect(totals).toBeDefined();
    expect(totals?.subtotal).toBe(200); // 2 * 100
    expect(totals?.discountAmount).toBe(20); // 10% of 200
    expect(totals?.tax).toBe(9); // 5% of (200 - 20)
    expect(totals?.whtAmount).toBe(3.6); // 2% of (200 - 20)
    expect(totals?.shipping).toBe(50);
    // 180 + 9 - 3.6 + 50 = 235.4
    expect(totals?.total).toBe(235.4);
  });
});
