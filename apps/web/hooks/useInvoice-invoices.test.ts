import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoice } from './useInvoice';
import { useSubscription } from './useSubscription';
import { setDoc } from '../services/firebase';

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

describe('useInvoice - Invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-invoice') });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('prepends a new invoice to history when no invoice with the same number exists', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    const invoice1 = { invoiceNumber: 'INV-001', amount: 100 } as any;
    const invoice2 = { invoiceNumber: 'INV-002', amount: 200 } as any;

    act(() => {
      result.current.saveInvoice(invoice1);
      result.current.saveInvoice(invoice2);
    });

    const saved = result.current.savedInvoices;
    expect(saved.length).toBe(2);
    // newest first
    expect(saved[0].invoiceNumber).toBe('INV-002');
    expect(saved[1].invoiceNumber).toBe('INV-001');

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceHistory', JSON.stringify([
      invoice2,
      invoice1
    ]));

    expect(setDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      { savedInvoices: [invoice2, invoice1] },
      { merge: true }
    );
  });

  it('updates an existing invoice instead of adding a new one when the invoice number matches', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    const initialInvoice = { invoiceNumber: 'INV-001', status: 'draft', amount: 100 } as any;
    const updatedInvoice = { invoiceNumber: 'INV-001', status: 'paid', amount: 150 } as any;
    const secondInvoice = { invoiceNumber: 'INV-002', status: 'draft', amount: 200 } as any;

    act(() => {
      result.current.saveInvoice(initialInvoice);
      result.current.saveInvoice(secondInvoice);
    });

    expect(result.current.savedInvoices.length).toBe(2);

    act(() => {
      result.current.saveInvoice(updatedInvoice);
    });

    const saved = result.current.savedInvoices;
    expect(saved.length).toBe(2);
    // Should update existing, keeping it in its original position
    expect(saved[1].status).toBe('paid');
    expect(saved[1].amount).toBe(150);

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceHistory', JSON.stringify([
      secondInvoice,
      updatedInvoice
    ]));

    expect(setDoc).toHaveBeenLastCalledWith(
      'mock-doc-ref',
      { savedInvoices: [secondInvoice, updatedInvoice] },
      { merge: true }
    );
  });
});
