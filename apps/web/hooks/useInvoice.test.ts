import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('useInvoice - State Mutations (saveClient, saveBusinessProfile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      getItem: vi.fn().mockReturnValue(null), // Empty local storage by default
    });
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid-1234' });

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saveClient returns false and does not save if name is empty', () => {
    const { result } = renderHook(() => useInvoice());

    let success: boolean;
    act(() => {
      success = result.current.saveClient({ name: '   ', email: '', address: '' });
    });

    expect(success!).toBe(false);
    expect(result.current.savedClients).toHaveLength(0);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceSavedClients', expect.anything());
  });

  it('saveClient adds a new client, sorts alphabetically, and triggers sync', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Zebra Corp', email: 'z@example.com', address: '' });
      result.current.saveClient({ name: 'Apple Inc', email: 'a@example.com', address: '' });
    });

    expect(result.current.savedClients).toHaveLength(2);
    // Should be sorted alphabetically by name
    expect(result.current.savedClients[0].name).toBe('Apple Inc');
    expect(result.current.savedClients[1].name).toBe('Zebra Corp');

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'invoiceSavedClients',
      JSON.stringify(result.current.savedClients)
    );
  });

  it('saveClient updates an existing client by matching lowercased name', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'old@acme.com', address: 'Old St' });
    });
    expect(result.current.savedClients).toHaveLength(1);

    act(() => {
      // Different case, should still match
      result.current.saveClient({ name: 'ACME corp', email: 'new@acme.com', address: 'New St' });
    });

    expect(result.current.savedClients).toHaveLength(1);
    expect(result.current.savedClients[0].email).toBe('new@acme.com');
    expect(result.current.savedClients[0].address).toBe('New St');
  });

  it('saveBusinessProfile returns false if name is empty', () => {
    const { result } = renderHook(() => useInvoice());

    let success: boolean;
    act(() => {
      success = result.current.saveBusinessProfile({ name: '   ', email: '', address: '', tin: '', bankName: '', accountNumber: '' });
    });

    expect(success!).toBe(false);
    expect(result.current.businessProfiles).toHaveLength(0);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceBusinessProfiles', expect.anything());
  });

  it('saveBusinessProfile adds a new profile, assigns ID, sorts alphabetically, and triggers sync', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.saveBusinessProfile({ name: 'Zebra LLC', email: '', address: '', tin: '', bankName: '', accountNumber: '' });
      result.current.saveBusinessProfile({ name: 'Alpha LLC', email: '', address: '', tin: '', bankName: '', accountNumber: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(2);

    expect(result.current.businessProfiles[0].name).toBe('Alpha LLC');
    expect(result.current.businessProfiles[0].id).toBe('mock-uuid-1234');
    expect(result.current.businessProfiles[1].name).toBe('Zebra LLC');

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'invoiceBusinessProfiles',
      JSON.stringify(result.current.businessProfiles)
    );
  });

  it('saveBusinessProfile updates an existing profile without changing its ID', () => {
    const { result } = renderHook(() => useInvoice());

    // First, let's mock crypto just for this test to ensure we get a specific ID
    vi.stubGlobal('crypto', { randomUUID: () => 'original-id' });

    act(() => {
      result.current.saveBusinessProfile({ name: 'My Business', email: 'old@example.com', address: '', tin: '', bankName: '', accountNumber: '' });
    });

    // Now change the mock to return something else, to prove we don't re-assign
    vi.stubGlobal('crypto', { randomUUID: () => 'new-id' });

    act(() => {
      result.current.saveBusinessProfile({ name: 'my business', email: 'new@example.com', address: '', tin: '', bankName: '', accountNumber: '' });
    });

    expect(result.current.businessProfiles).toHaveLength(1);
    expect(result.current.businessProfiles[0].email).toBe('new@example.com');
    expect(result.current.businessProfiles[0].id).toBe('original-id'); // ID is preserved
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
