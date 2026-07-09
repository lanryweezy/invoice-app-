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
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      getItem: vi.fn((key) => localStorageMock[key] || null),
    });
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'mock-uuid-1234'),
    });
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects saving a client with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    let saved = true;
    act(() => {
      saved = result.current.saveClient({ name: '   ', email: 'test@example.com', address: '123 Test St' });
    });

    expect(saved).toBe(false);
    expect(result.current.savedClients).toHaveLength(0);
    expect(localStorageMock['invoiceSavedClients']).toBeUndefined();
  });

  it('adds a new client and sorts alphabetically', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Zebra Corp', email: 'zebra@example.com', address: '1 Zebra Way' });
      result.current.saveClient({ name: 'Apple Inc', email: 'apple@example.com', address: '1 Apple Park' });
    });

    expect(result.current.savedClients).toHaveLength(2);
    expect(result.current.savedClients[0].name).toBe('Apple Inc');
    expect(result.current.savedClients[1].name).toBe('Zebra Corp');
    expect(JSON.parse(localStorageMock['invoiceSavedClients'])).toHaveLength(2);
  });

  it('updates an existing client case-insensitively instead of duplicating', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'old@acme.com', address: '1 Old St' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].email).toBe('old@acme.com');

    act(() => {
      // Use different casing
      result.current.saveClient({ name: 'ACME corp', email: 'new@acme.com', address: '1 New St' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].email).toBe('new@acme.com'); // Updated
    expect(result.current.savedClients[0].name).toBe('ACME corp'); // Using new casing
  });
});

describe('useInvoice - saveBusinessProfile', () => {

  let localStorageMock: Record<string, string> = {};
  let uuidCounter = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
    uuidCounter = 1;
    vi.stubGlobal('localStorage', {
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      getItem: vi.fn((key) => localStorageMock[key] || null),
    });

    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `mock-uuid-${uuidCounter++}`),
    });

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects saving a profile with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    let saved = true;
    act(() => {
      saved = result.current.saveBusinessProfile({ name: '   ', email: 'test@example.com', address: '', bankName: '', accountNumber: '' });
    });

    expect(saved).toBe(false);
    expect(result.current.businessProfiles).toHaveLength(0);
  });

  it('adds a new profile with a generated ID and sorts alphabetically', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveBusinessProfile({ name: 'My Second Biz', email: 'second@example.com', address: '', bankName: '', accountNumber: '' });
      result.current.saveBusinessProfile({ name: 'A First Biz', email: 'first@example.com', address: '', bankName: '', accountNumber: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(2);
    expect(result.current.businessProfiles[0].name).toBe('A First Biz');
    expect(result.current.businessProfiles[0].id).toBeDefined();
    expect(result.current.businessProfiles[1].name).toBe('My Second Biz');
    expect(result.current.businessProfiles[0].id).not.toEqual(result.current.businessProfiles[1].id);
    expect(result.current.businessProfiles[1].id).toBeDefined();
  });

  it('updates an existing profile case-insensitively and preserves its ID', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveBusinessProfile({ name: 'Main Brand', email: 'main@example.com', address: 'Old Address', bankName: '', accountNumber: '' });
    });

    const firstId = result.current.businessProfiles[0].id;

    act(() => {
      result.current.saveBusinessProfile({ name: 'MAIN brand', email: 'new@example.com', address: 'New Address', bankName: '', accountNumber: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(1);
    expect(result.current.businessProfiles[0].email).toBe('new@example.com');
    expect(result.current.businessProfiles[0].address).toBe('New Address');
    expect(result.current.businessProfiles[0].id).toBe(firstId); // ID preserved
  });
});
