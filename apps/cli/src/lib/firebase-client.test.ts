import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as admin from 'firebase-admin';
import { initFirebase, getDb, getUserDoc, writeDoc, setDoc } from './firebase-client';

// We need to mock firebase-admin
vi.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      initializeApp: vi.fn().mockReturnValue({
        firestore: vi.fn().mockReturnValue(firestoreMock),
      }),
      credential: {
        cert: vi.fn(),
        applicationDefault: vi.fn(),
      },
    },
    credential: {
      cert: vi.fn(),
      applicationDefault: vi.fn(),
    },
    initializeApp: vi.fn().mockReturnValue({
      firestore: vi.fn().mockReturnValue(firestoreMock),
    }),
  };
});

describe('firebase-client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initFirebase', () => {
    it('initializes with FIREBASE_SERVICE_ACCOUNT when present', async () => {
      // Setup mock env
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test-project' });

      const firebaseClient = await import('./firebase-client');
      const adminMock = await import('firebase-admin');

      firebaseClient.initFirebase();

      expect(adminMock.credential.cert).toHaveBeenCalledWith({ project_id: 'test-project' });
      expect(adminMock.initializeApp).toHaveBeenCalled();
    });

    it('initializes with applicationDefault when FIREBASE_SERVICE_ACCOUNT is absent', async () => {
      const firebaseClient = await import('./firebase-client');
      const adminMock = await import('firebase-admin');

      firebaseClient.initFirebase();

      expect(adminMock.credential.applicationDefault).toHaveBeenCalled();
      expect(adminMock.initializeApp).toHaveBeenCalled();
    });

    it('throws error when initialization fails', async () => {
      const adminMock = await import('firebase-admin');
      vi.mocked(adminMock.initializeApp).mockImplementationOnce(() => {
        throw new Error('Firebase init failed');
      });

      const firebaseClient = await import('./firebase-client');

      expect(() => firebaseClient.initFirebase()).toThrow('Run invoiceapp login first or set FIREBASE_SERVICE_ACCOUNT env var');
      expect(console.error).toHaveBeenCalledWith('Run invoiceapp login first or set FIREBASE_SERVICE_ACCOUNT env var');
    });

    it('does not initialize again if already initialized', async () => {
      const firebaseClient = await import('./firebase-client');
      const adminMock = await import('firebase-admin');

      firebaseClient.initFirebase();
      firebaseClient.initFirebase();

      expect(adminMock.initializeApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDb', () => {
    it('initializes firebase if db is not present and returns db', async () => {
      const firebaseClient = await import('./firebase-client');
      const adminMock = await import('firebase-admin');

      const db = firebaseClient.getDb();

      expect(adminMock.initializeApp).toHaveBeenCalledTimes(1);
      expect(db).toBeDefined();
    });
  });

  describe('getUserDoc', () => {
    it('returns user document reference', async () => {
      const firebaseClient = await import('./firebase-client');

      firebaseClient.getUserDoc('test-user-id');

      const db = firebaseClient.getDb();
      expect(db.collection).toHaveBeenCalledWith('users');
      expect(db.collection('users').doc).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('writeDoc', () => {
    it('writes document with merge true', async () => {
      const firebaseClient = await import('./firebase-client');

      await firebaseClient.writeDoc('invoices', 'inv-1', { amount: 100 });

      const db = firebaseClient.getDb();
      expect(db.collection).toHaveBeenCalledWith('invoices');
      expect(db.collection('invoices').doc).toHaveBeenCalledWith('inv-1');
      expect(db.collection('invoices').doc('inv-1').set).toHaveBeenCalledWith(
        { amount: 100 },
        { merge: true }
      );
    });
  });

  describe('setDoc', () => {
    it('sets document without merge', async () => {
      const firebaseClient = await import('./firebase-client');

      await firebaseClient.setDoc('invoices', 'inv-1', { amount: 100 });

      const db = firebaseClient.getDb();
      expect(db.collection).toHaveBeenCalledWith('invoices');
      expect(db.collection('invoices').doc).toHaveBeenCalledWith('inv-1');
      expect(db.collection('invoices').doc('inv-1').set).toHaveBeenCalledWith(
        { amount: 100 }
      );
    });
  });
});
