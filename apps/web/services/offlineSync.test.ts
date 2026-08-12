import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncPendingChanges, registerSyncStrategy, queueInvoiceChange, queueExpenseChange, queueClientChange, getPendingChangesCount, clearSyncedChanges } from './offlineSync';
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

  it('queues an invoice change when queueInvoiceChange is called', () => {
    mockGetItem.mockReturnValue('[]');
    queueInvoiceChange('create', 'doc-123', { amount: 100 });

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const setArgs = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(setArgs).toHaveLength(1);
    expect(setArgs[0]).toMatchObject({
      collection: 'invoices',
      docId: 'doc-123',
      type: 'create',
      data: { amount: 100 },
      synced: false
    });
    expect(setArgs[0].id).toBeDefined();
    expect(setArgs[0].timestamp).toBeDefined();
  });

  it('queues an expense change when queueExpenseChange is called', () => {
    mockGetItem.mockReturnValue('[]');
    queueExpenseChange('update', 'doc-456', { category: 'food' });

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const setArgs = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(setArgs).toHaveLength(1);
    expect(setArgs[0]).toMatchObject({
      collection: 'expenses',
      docId: 'doc-456',
      type: 'update',
      data: { category: 'food' },
      synced: false
    });
  });

  it('queues a client change when queueClientChange is called', () => {
    mockGetItem.mockReturnValue('[]');
    queueClientChange('delete', 'doc-789');

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const setArgs = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(setArgs).toHaveLength(1);
    expect(setArgs[0]).toMatchObject({
      collection: 'clients',
      docId: 'doc-789',
      type: 'delete',
      synced: false
    });
  });

  it('returns the correct count of unsynced pending changes', () => {
    mockGetItem.mockReturnValue(JSON.stringify([
      { synced: false },
      { synced: true },
      { synced: false }
    ]));

    expect(getPendingChangesCount()).toBe(2);
  });

  it('clears only synced changes from the queue', () => {
    mockGetItem.mockReturnValue(JSON.stringify([
      { id: '1', synced: false },
      { id: '2', synced: true },
      { id: '3', synced: false }
    ]));

    clearSyncedChanges();

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const setArgs = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(setArgs).toHaveLength(2);
    expect(setArgs.map((c: any) => c.id)).toEqual(['1', '3']);
  });

  it('processes a create operation using the standard strategy', async () => {
    const mockData = { test: true };
    const mockBatch = writeBatch(db);

    mockGetItem.mockReturnValue(JSON.stringify([{
      id: 'test-1',
      collection: 'invoices',
      docId: 'inv-1',
      type: 'create',
      data: mockData,
      timestamp: new Date().toISOString(),
      synced: false
    }]));

    const result = await syncPendingChanges('user-1');

    expect(result.synced).toBe(1);
    expect(mockBatch.set).toHaveBeenCalledWith('mock-doc-ref', mockData, { merge: true });
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('processes an update operation using the standard strategy', async () => {
    const mockData = { test: false };
    const mockBatch = writeBatch(db);

    mockGetItem.mockReturnValue(JSON.stringify([{
      id: 'test-2',
      collection: 'expenses',
      docId: 'exp-1',
      type: 'update',
      data: mockData,
      timestamp: new Date().toISOString(),
      synced: false
    }]));

    const result = await syncPendingChanges('user-1');

    expect(result.synced).toBe(1);
    expect(mockBatch.set).toHaveBeenCalledWith('mock-doc-ref', mockData, { merge: true });
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('processes a delete operation using the standard strategy', async () => {
    const mockBatch = writeBatch(db);

    mockGetItem.mockReturnValue(JSON.stringify([{
      id: 'test-3',
      collection: 'clients',
      docId: 'cli-1',
      type: 'delete',
      timestamp: new Date().toISOString(),
      synced: false
    }]));

    const result = await syncPendingChanges('user-1');

    expect(result.synced).toBe(1);
    expect(mockBatch.delete).toHaveBeenCalledWith('mock-doc-ref');
    expect(mockBatch.commit).toHaveBeenCalled();
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
