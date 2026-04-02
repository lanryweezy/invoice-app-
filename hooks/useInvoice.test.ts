
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';

describe('useInvoice - calculateTotals', () => {
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
});
