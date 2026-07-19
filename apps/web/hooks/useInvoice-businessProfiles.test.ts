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

describe('useInvoice - Business Profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useSubscription as any).mockReturnValue({
      user: { uid: 'test-user' },
      isPro: true,
      loading: false
    });

    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-bp-' + Math.random().toString(36).substring(7)), getRandomValues: vi.fn((arr: any) => { for(let i=0; i<arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; }) });
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('rejects saving a business profile with an empty name', () => {
    const { result } = renderHook(() => useInvoice());

    vi.mocked(localStorage.setItem).mockClear();

    let success;
    act(() => {
      success = result.current.saveBusinessProfile({ name: '   ', email: 'test@example.com' } as any);
    });

    expect(success).toBe(false);
    expect(result.current.businessProfiles).toEqual([]);
    expect(localStorage.setItem).not.toHaveBeenCalledWith('invoiceBusinessProfiles', expect.any(String));
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('adds a new business profile, sorts the list alphabetically, and syncs to local storage and cloud', () => {
    const { result } = renderHook(() => useInvoice());

    vi.stubGlobal('navigator', { onLine: true });

    let success1, success2;
    act(() => {
      success1 = result.current.saveBusinessProfile({ name: 'Zebra Consulting', email: 'zebra@example.com' } as any);
      success2 = result.current.saveBusinessProfile({ name: 'Alpha Solutions', email: 'alpha@example.com' } as any);
    });

    expect(success1).toBe(true);
    expect(success2).toBe(true);

    const profiles = result.current.businessProfiles;
    expect(profiles.length).toBe(2);
    expect(profiles[0].name).toBe('Alpha Solutions');
    expect(profiles[0].id).toBeDefined();
    expect(profiles[0].id).toContain('mock-uuid-bp-');
    expect(profiles[1].name).toBe('Zebra Consulting');
    expect(profiles[1].id).toBeDefined();
    expect(profiles[1].id).toContain('mock-uuid-bp-');

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceBusinessProfiles', JSON.stringify(profiles));

    expect(setDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      { businessProfiles: profiles },
      { merge: true }
    );
  });

  it('updates an existing business profile case-insensitively and syncs to local storage and cloud', () => {
    const { result } = renderHook(() => useInvoice());
    vi.stubGlobal('navigator', { onLine: true });

    act(() => {
      result.current.saveBusinessProfile({ name: 'Global Tech', email: 'global@tech.com' } as any);
    });

    expect(result.current.businessProfiles.length).toBe(1);
    const existingId = result.current.businessProfiles[0].id;

    act(() => {
      // Use lowercase name to verify case-insensitive matching
      result.current.saveBusinessProfile({ name: 'global tech', email: 'new@tech.com', phone: '12345' } as any);
    });

    const profiles = result.current.businessProfiles;
    expect(profiles.length).toBe(1); // Should update existing, not add new
    expect(profiles[0].email).toBe('new@tech.com');
    expect(profiles[0].phone).toBe('12345');
    // ID should remain the same
    expect(profiles[0].id).toBe(existingId);

    expect(localStorage.setItem).toHaveBeenLastCalledWith('invoiceBusinessProfiles', JSON.stringify([
      { name: 'global tech', email: 'new@tech.com', phone: '12345', id: existingId }
    ]));
  });

  it('removes a business profile accurately, persisting locally and remotely', () => {
    const { result } = renderHook(() => useInvoice());
    vi.stubGlobal('navigator', { onLine: true });

    act(() => {
      result.current.saveBusinessProfile({ name: 'Profile A', email: 'a@test.com' } as any);
      result.current.saveBusinessProfile({ name: 'Profile B', email: 'b@test.com' } as any);
    });

    const initialProfiles = result.current.businessProfiles;
    expect(initialProfiles.length).toBe(2);

    // Clear previous setItem calls
    vi.mocked(localStorage.setItem).mockClear();

    const profileIdToRemove = initialProfiles.find(p => p.name === 'Profile A')?.id;

    act(() => {
      result.current.removeBusinessProfile(profileIdToRemove!);
    });

    const profiles = result.current.businessProfiles;
    expect(profiles.length).toBe(1);
    expect(profiles[0].name).toBe('Profile B');

    expect(localStorage.setItem).toHaveBeenCalledWith('invoiceBusinessProfiles', JSON.stringify(profiles));
    expect(setDoc).toHaveBeenLastCalledWith(
      'mock-doc-ref',
      { businessProfiles: profiles },
      { merge: true }
    );
  });
});
