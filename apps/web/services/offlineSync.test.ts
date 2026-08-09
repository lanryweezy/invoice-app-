import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncPendingChanges, registerSyncStrategy } from './offlineSync';
import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => {
  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  };
  return {
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn().mockReturnValue('mock-doc-ref'),
    writeBatch: vi.fn(() => mockBatch)
  };
});

describe('offlineSync', () => {
  let mockGetItem: any;
  let mockSetItem: any;
  let originalOnLine: boolean;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock online status
    originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    // Mock localStorage
    mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
    mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true
    });
    vi.restoreAllMocks();
  });

  it('executes the registered custom strategy when a custom change type is processed', async () => {
    // Arrange
    const mockData = { status: 'custom_status' };
    const mockBatch = writeBatch(db);

    // Add custom strategy
    const strategyMock = vi.fn((batch, docRef, data) => {
      batch.update(docRef, data);
    });

    registerSyncStrategy('custom_op', strategyMock);

    mockGetItem.mockReturnValue(JSON.stringify([{
      id: 'test-id',
      collection: 'invoices',
      docId: 'doc-123',
      type: 'custom_op',
      data: mockData,
      timestamp: new Date().toISOString(),
      synced: false
    }]));

    // Act
    const result = await syncPendingChanges('user-123');

    // Assert
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);

    expect(doc).toHaveBeenCalledWith(db, 'users', 'user-123', 'invoices', 'doc-123');

    // Verify our custom strategy was executed
    expect(strategyMock).toHaveBeenCalled();
    expect(strategyMock.mock.calls[0][1]).toBe('mock-doc-ref');
    expect(strategyMock.mock.calls[0][2]).toEqual(mockData);

    // Verify it mutated the batch as intended
    expect(mockBatch.update).toHaveBeenCalledWith('mock-doc-ref', mockData);
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
