import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';
import { useSubscription } from './useSubscription';

vi.mock('./useSubscription', () => ({
  useSubscription: vi.fn(),
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

    // Subtotal: (2*100) + (1*50) = 250
    // Discount: 250 * 0.1 = 25
    // Taxable: 250 - 25 = 225
    // Tax: 225 * 0.075 = 16.875
    // Total: 225 + 16.875 + 20 = 261.875

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

    // Subtotal: 100000
    // Tax (VAT 7.5%): 7500
    // WHT (5%): 5000
    // Total: 100000 + 7500 - 5000 = 102500

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

    // Initial state has 1 line item
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
    // Verify it's a UUID (basic check)
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
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    let uuidCounter = 1;
    vi.stubGlobal('crypto', {
      randomUUID: () => `mock-uuid-${uuidCounter++}`
    });

    const mockStorage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      clear: () => {
        for (const key in mockStorage) {
          delete mockStorage[key];
        }
      }
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects invalid writes when client name is empty', () => {
    const { result } = renderHook(() => useInvoice());

    let success;
    act(() => {
      success = result.current.saveClient({ name: '   ', email: 'test@example.com' } as any);
    });

    expect(success).toBe(false);
    expect(result.current.savedClients).toHaveLength(0);
    expect(localStorage.getItem('invoiceSavedClients')).toBeNull();
  });

  it('adds new clients, sorts them alphabetically, and syncs state', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Charlie', email: 'charlie@example.com' } as any);
      result.current.saveClient({ name: 'Alice', email: 'alice@example.com' } as any);
      result.current.saveClient({ name: 'Bob', email: 'bob@example.com' } as any);
    });

    const clients = result.current.savedClients;
    expect(clients).toHaveLength(3);
    expect(clients[0].name).toBe('Alice');
    expect(clients[1].name).toBe('Bob');
    expect(clients[2].name).toBe('Charlie');

    const stored = JSON.parse(localStorage.getItem('invoiceSavedClients') || '[]');
    expect(stored).toHaveLength(3);
    expect(stored[0].name).toBe('Alice');
  });

  it('updates existing clients using case-insensitive duplicate matching', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'contact@acme.com' } as any);
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].email).toBe('contact@acme.com');

    act(() => {
      result.current.saveClient({ name: 'acme corp', email: 'new@acme.com' } as any);
    });

    const clients = result.current.savedClients;
    expect(clients).toHaveLength(1);
    expect(clients[0].name).toBe('acme corp'); // Updates to the new name casing
    expect(clients[0].email).toBe('new@acme.com');

    const stored = JSON.parse(localStorage.getItem('invoiceSavedClients') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe('new@acme.com');
  });
});
