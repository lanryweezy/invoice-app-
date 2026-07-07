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

describe('useInvoice - line item operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });
  });

  it('updates an existing line item', () => {
    const { result } = renderHook(() => useInvoice());

    let lineItemId: string;
    act(() => {
      // initial invoice has 1 line item by default
      lineItemId = result.current.invoice.lineItems[0].id;
      result.current.updateLineItem(lineItemId, 'description', 'Updated Item');
      result.current.updateLineItem(lineItemId, 'price', 1500);
      result.current.updateLineItem(lineItemId, 'quantity', 3);
    });

    const updatedItem = result.current.invoice.lineItems[0];
    expect(updatedItem.description).toBe('Updated Item');
    expect(updatedItem.price).toBe(1500);
    expect(updatedItem.quantity).toBe(3);
  });

  it('removes a line item by ID', () => {
    const { result } = renderHook(() => useInvoice());

    let lineItemId: string;
    act(() => {
      lineItemId = result.current.invoice.lineItems[0].id;
      result.current.removeLineItem(lineItemId);
    });

    expect(result.current.invoice.lineItems.length).toBe(0);
  });
});

describe('useInvoice - saveInvoice', () => {
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('adds a new invoice to the beginning of the savedInvoices list', () => {
    const { result } = renderHook(() => useInvoice());

    const newInvoice = { invoiceNumber: 'INV-001', total: 500 } as any;

    act(() => {
      result.current.saveInvoice(newInvoice);
    });

    expect(result.current.savedInvoices).toHaveLength(1);
    expect(result.current.savedInvoices[0]).toEqual(newInvoice);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'invoiceHistory',
      JSON.stringify([newInvoice])
    );
  });

  it('updates an existing invoice without duplicating it', () => {
    const { result } = renderHook(() => useInvoice());

    const initialInvoice = { invoiceNumber: 'INV-001', total: 500, status: 'draft' } as any;
    const updatedInvoice = { invoiceNumber: 'INV-001', total: 600, status: 'paid' } as any;

    act(() => {
      result.current.saveInvoice(initialInvoice);
    });

    expect(result.current.savedInvoices).toHaveLength(1);

    act(() => {
      result.current.saveInvoice(updatedInvoice);
    });

    expect(result.current.savedInvoices).toHaveLength(1);
    expect(result.current.savedInvoices[0].total).toBe(600);
    expect(result.current.savedInvoices[0].status).toBe('paid');

    // Check that it set the updated array in local storage
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      'invoiceHistory',
      JSON.stringify([updatedInvoice])
    );
  });

  it('adds a new invoice and prepends it when history exists', () => {
    const { result } = renderHook(() => useInvoice());

    const invoice1 = { invoiceNumber: 'INV-001', total: 500 } as any;
    const invoice2 = { invoiceNumber: 'INV-002', total: 1000 } as any;

    act(() => {
      result.current.saveInvoice(invoice1);
    });
    act(() => {
      result.current.saveInvoice(invoice2);
    });

    expect(result.current.savedInvoices).toHaveLength(2);
    // The most recently saved one should be first
    expect(result.current.savedInvoices[0]).toEqual(invoice2);
    expect(result.current.savedInvoices[1]).toEqual(invoice1);
  });
});
