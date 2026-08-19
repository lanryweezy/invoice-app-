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
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  collection: vi.fn(() => 'mock-collection-ref'),
}));

vi.mock('../utils/offlineSync', () => ({
  queueMutation: vi.fn(),
  getQueueCount: vi.fn().mockResolvedValue(0),
}));

describe('useInvoice - Totals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-totals'), getRandomValues: vi.fn((arr) => { for(let i=0; i<arr.length; i++) arr[i] = 1; return arr; }) });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('calculates totals correctly with percentage discount', () => {
    const { result } = renderHook(() => useInvoice());

    const lineItems = [
      { id: '1', description: 'Item 1', quantity: 2, price: 100 },
      { id: '2', description: 'Item 2', quantity: 1, price: 50 },
    ];

    act(() => {
      result.current.updateInvoice('lineItems', lineItems as any);
      result.current.updateInvoice('discountRate', 10);
      result.current.updateInvoice('discountType', 'percentage');
      result.current.updateInvoice('taxRate', 7.5);
      result.current.updateInvoice('shippingAmount', 20);
    });

    const totals = result.current.calculateTotals();

    expect(totals.subtotal).toBe(250);
    expect(totals.discountAmount).toBe(25);
    expect(totals.tax).toBe(16.875);
    expect(totals.shipping).toBe(20);
    expect(totals.total).toBe(261.875);
  });

  it('calculates totals correctly with fixed discount', () => {
    const { result } = renderHook(() => useInvoice());

    const lineItems = [
      { id: '1', description: 'Item 1', quantity: 1, price: 1000 },
    ];

    act(() => {
      result.current.updateInvoice('lineItems', lineItems as any);
      result.current.updateInvoice('discountRate', 100);
      result.current.updateInvoice('discountType', 'fixed');
      result.current.updateInvoice('taxRate', 0);
      result.current.updateInvoice('shippingAmount', 0);
    });

    const totals = result.current.calculateTotals();

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.total).toBe(900);
  });

  it('calculates totals correctly with WHT', () => {
    const { result } = renderHook(() => useInvoice());

    const lineItems = [
      { id: '1', description: 'Consulting', quantity: 1, price: 100000 },
    ];

    act(() => {
      result.current.updateInvoice('lineItems', lineItems as any);
      result.current.updateInvoice('discountRate', 0);
      result.current.updateInvoice('taxRate', 7.5);
      result.current.updateInvoice('whtRate', 5);
      result.current.updateInvoice('shippingAmount', 0);
    });

    const totals = result.current.calculateTotals();

    expect(totals.subtotal).toBe(100000);
    expect(totals.tax).toBe(7500);
    expect(totals.whtAmount).toBe(5000);
    expect(totals.total).toBe(102500);
  });
});
