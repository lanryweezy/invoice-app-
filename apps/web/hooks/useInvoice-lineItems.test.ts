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

describe('useInvoice - Line Items', () => {
  let uuidCounter = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    uuidCounter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `mock-uuid-line-item-${uuidCounter++}`)
    });

    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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
  });

  it('adds multiple line items', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.addLineItem();
      result.current.addLineItem();
    });

    expect(result.current.invoice.lineItems.length).toBe(3);
  });

  it('removes a line item by id', () => {
    const { result } = renderHook(() => useInvoice());

    act(() => {
      result.current.addLineItem();
    });

    const firstId = result.current.invoice.lineItems[0].id;
    const secondId = result.current.invoice.lineItems[1].id;

    expect(result.current.invoice.lineItems.length).toBe(2);

    act(() => {
      result.current.removeLineItem(firstId);
    });

    expect(result.current.invoice.lineItems.length).toBe(1);
    expect(result.current.invoice.lineItems[0].id).toBe(secondId);
  });

  it('updates a line item field by id', () => {
    const { result } = renderHook(() => useInvoice());

    const id = result.current.invoice.lineItems[0].id;

    act(() => {
      result.current.updateLineItem(id, 'description', 'Web Development');
      result.current.updateLineItem(id, 'price', '500');
      result.current.updateLineItem(id, 'quantity', 2);
    });

    const updatedItem = result.current.invoice.lineItems[0];
    expect(updatedItem.description).toBe('Web Development');
    expect(updatedItem.price).toBe('500');
    expect(updatedItem.quantity).toBe(2);
  });
});
