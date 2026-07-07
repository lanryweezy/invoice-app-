import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';
import { useSubscription } from './useSubscription';
import * as firebaseFirestore from '../services/firebase';
import * as offlineSync from '../utils/offlineSync';

vi.mock('./useSubscription', () => ({
  useSubscription: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  db: {},
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  getFirestore: vi.fn(),
}));

vi.mock('../utils/offlineSync', () => ({
  queueMutation: vi.fn().mockResolvedValue(undefined),
  getQueueCount: vi.fn().mockResolvedValue(0),
}));

describe('useInvoice - calculateTotals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  it('calculates totals correctly with percentage discount', () => {
    const { result } = renderHook(() => useInvoice());

    // Set up a controlled state
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

describe('useInvoice - addLineItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  it('adds a new line item with default values', () => {
    const { result } = renderHook(() => useInvoice());

    expect(result.current.invoice.lineItems.length).toBe(1);

    act(() => {
      result.current.addLineItem();
    });

    expect(result.current.invoice.lineItems.length).toBe(2);
    const newItem = result.current.invoice.lineItems[1];
    expect(newItem.description).toBe('');
    expect(newItem.quantity).toBe(1);
    expect(newItem.price).toBe('');
    expect(newItem.id).toBeDefined();
    expect(newItem.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('adds multiple line items', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.addLineItem();
      result.current.addLineItem();
    });

    expect(result.current.invoice.lineItems.length).toBe(3);
  });
});

describe('useInvoice - saveClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  it('adds a new client, saves to localStorage, and sorts alphabetically', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Zebra Corp', email: 'zebra@example.com', address: '' });
      result.current.saveClient({ name: 'Acme Corp', email: 'acme@example.com', address: '' });
    });

    expect(result.current.savedClients).toHaveLength(2);
    expect(result.current.savedClients[0].name).toBe('Acme Corp');
    expect(result.current.savedClients[1].name).toBe('Zebra Corp');

    const stored = JSON.parse(localStorage.getItem('invoiceSavedClients') || '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0].name).toBe('Acme Corp');

    // Check syncToCloud was called (it might be debounced/timeout in the component, but saveClient calls it directly)
    // Actually, saveClient calls syncToCloud which checks if isPro. We mocked setDoc to check if firebase gets called.
  });

  it('updates an existing client case-insensitively', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'acme@example.com', address: 'Old Address' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].address).toBe('Old Address');

    act(() => {
      result.current.saveClient({ name: 'acme corp', email: 'new@example.com', address: 'New Address' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].name).toBe('acme corp'); // Takes the new name casing
    expect(result.current.savedClients[0].email).toBe('new@example.com');
    expect(result.current.savedClients[0].address).toBe('New Address');
  });

  it('rejects and returns false for clients with empty or whitespace-only names', () => {
    const { result } = renderHook(() => useInvoice());

    let saved = true;
    act(() => {
      saved = result.current.saveClient({ name: '   ', email: 'empty@example.com', address: '' });
    });

    expect(saved).toBe(false);
    expect(result.current.savedClients).toHaveLength(0);
    expect(localStorage.getItem('invoiceSavedClients')).toBeNull();
  });
});
