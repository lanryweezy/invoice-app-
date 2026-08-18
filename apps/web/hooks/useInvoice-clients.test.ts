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
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  collection: vi.fn(() => 'mock-collection-ref'),
}));

vi.mock('../utils/offlineSync', () => ({
  queueMutation: vi.fn(),
  getQueueCount: vi.fn().mockResolvedValue(0),
}));

describe('useInvoice - Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-client'), getRandomValues: vi.fn((arr) => { for(let i=0; i<arr.length; i++) arr[i] = 1; return arr; }) });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('rejects saving a client with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    // Clear localStorage calls from initial render
    vi.mocked(localStorage.setItem).mockClear();

    let success;
    act(() => {
      success = result.current.saveClient({ name: '   ', email: 'test@example.com' });
    });

    expect(success).toBe(false);
    expect(result.current.savedClients).toEqual([]);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceSavedClients', expect.any(String));
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('adds a new client, sorts the list alphabetically, and syncs to local storage and cloud', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    let success1, success2;
    act(() => {
      success1 = result.current.saveClient({ name: 'Zebra Corp', email: 'zebra@example.com' });
      success2 = result.current.saveClient({ name: 'Apple Inc', email: 'apple@example.com' });
    });

    expect(success1).toBe(true);
    expect(success2).toBe(true);

    const clients = result.current.savedClients;
    expect(clients.length).toBe(2);
    expect(clients[0].name).toBe('Apple Inc');
    expect(clients[1].name).toBe('Zebra Corp');

    // Verify localStorage is updated with the sorted list
    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceSavedClients', JSON.stringify([
      { name: 'Apple Inc', email: 'apple@example.com' },
      { name: 'Zebra Corp', email: 'zebra@example.com' }
    ]));

    // Verify cloud sync (via setDoc) is called for Pro user with valid mock ref
    expect(setDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      { savedClients: [
        { name: 'Apple Inc', email: 'apple@example.com' },
        { name: 'Zebra Corp', email: 'zebra@example.com' }
      ] },
      { merge: true }
    );
  });

  it('updates an existing client case-insensitively and syncs to local storage and cloud', () => {
    const { result } = renderHook(() => useInvoice());
    vi.stubGlobal('navigator', { onLine: true });

    act(() => {
      result.current.saveClient({ name: 'Acme Corp', email: 'billing@acme.com', address: '123 Main St' });
    });

    expect(result.current.savedClients.length).toBe(1);

    act(() => {
      // Use lowercase 'acme corp' to verify case-insensitive matching
      result.current.saveClient({ name: 'acme corp', email: 'new@acme.com', address: '456 Market St' });
    });

    const clients = result.current.savedClients;
    expect(clients.length).toBe(1); // Should update existing, not add new
    expect(clients[0].email).toBe('new@acme.com');
    expect(clients[0].address).toBe('456 Market St');

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceSavedClients', JSON.stringify([
      { name: 'acme corp', email: 'new@acme.com', address: '456 Market St' }
    ]));
  });
});
