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
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    let uuidCounter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `mock-uuid-${uuidCounter++}`
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects client with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    // Clear calls from initial render (currency, status)
    vi.mocked(localStorage.setItem).mockClear();

    let success = false;
    act(() => {
      success = result.current.saveClient({ name: '   ', email: '', address: '' });
    });

    expect(success).toBe(false);
    expect(result.current.savedClients).toHaveLength(0);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceSavedClients', expect.anything());
  });

  it('saves a new client, updates state, and persists to local storage', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'hello@acme.com', address: '123 Acme St' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].name).toBe('Acme Corp');

    // Should persist to local storage
    expect(localStorage.setItem).toHaveBeenCalledWith('invoiceSavedClients', expect.any(String));
    const savedString = vi.mocked(localStorage.setItem).mock.calls.find(c => c[0] === 'invoiceSavedClients')?.[1];
    expect(JSON.parse(savedString as string)).toEqual([{ name: 'Acme Corp', email: 'hello@acme.com', address: '123 Acme St' }]);
  });

  it('updates an existing client case-insensitively instead of duplicating', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'hello@acme.com', address: '123 Acme St' });
    });
    expect(result.current.savedClients).toHaveLength(1);

    act(() => {
      result.current.saveClient({ name: 'acme corp', email: 'new@acme.com', address: '123 Acme St' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].name).toBe('acme corp'); // updated case
    expect(result.current.savedClients[0].email).toBe('new@acme.com'); // updated email
  });
});

describe('useInvoice - saveBusinessProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    let uuidCounter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `mock-uuid-${uuidCounter++}`
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects business profile with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    // Clear calls from initial render (currency, status)
    vi.mocked(localStorage.setItem).mockClear();

    let success = false;
    act(() => {
      success = result.current.saveBusinessProfile({ name: '   ', email: '', phoneNumber: '', address: '' });
    });

    expect(success).toBe(false);
    expect(result.current.businessProfiles).toHaveLength(0);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceBusinessProfiles', expect.anything());
  });

  it('saves a new business profile with a generated ID', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveBusinessProfile({ name: 'My Brand', email: 'hello@mybrand.com', phoneNumber: '', address: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(1);
    expect(result.current.businessProfiles[0].name).toBe('My Brand');
    expect(result.current.businessProfiles[0].id).toMatch(/^mock-uuid-/);

    // Should persist to local storage
    expect(localStorage.setItem).toHaveBeenCalledWith('invoiceBusinessProfiles', expect.any(String));
  });

  it('updates an existing business profile case-insensitively and preserves the ID', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveBusinessProfile({ name: 'My Brand', email: 'hello@mybrand.com', phoneNumber: '', address: '' });
    });

    const firstId = result.current.businessProfiles[0].id;

    act(() => {
      result.current.saveBusinessProfile({ name: 'my brand', email: 'new@mybrand.com', phoneNumber: '', address: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(1);
    expect(result.current.businessProfiles[0].name).toBe('my brand');
    expect(result.current.businessProfiles[0].email).toBe('new@mybrand.com');
    expect(result.current.businessProfiles[0].id).toBe(firstId); // ID preserved
  });
});
