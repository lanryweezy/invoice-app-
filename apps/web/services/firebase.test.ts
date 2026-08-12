import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' }))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn()
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({}))
}));

describe('firebase setup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes Firebase app with default config when env vars are missing', async () => {
    const { initializeApp } = await import('firebase/app');
    await import('./firebase');

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: "mock-key",
      authDomain: "mock-domain.firebaseapp.com",
      projectId: "mock-project",
      storageBucket: "mock-bucket.appspot.com",
      messagingSenderId: "000000",
      appId: "1:0000:web:0000",
      measurementId: undefined
    });
  });

  it('initializes auth, firestore, and analytics (when window is defined)', async () => {
    const { getAuth } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');
    const { getAnalytics } = await import('firebase/analytics');
    const { initializeApp } = await import('firebase/app');

    const firebaseModule = await import('./firebase');

    const mockApp = vi.mocked(initializeApp).mock.results[0].value;
    expect(getAuth).toHaveBeenCalledWith(mockApp);
    expect(getFirestore).toHaveBeenCalledWith(mockApp);

    expect(typeof window).not.toBe('undefined');
    expect(getAnalytics).toHaveBeenCalledWith(mockApp);
    expect(firebaseModule.analytics).not.toBeNull();
  });

  it('does not initialize analytics if window is undefined', async () => {
    vi.stubGlobal('window', undefined);

    const { getAnalytics } = await import('firebase/analytics');
    const firebaseModule = await import('./firebase');

    expect(getAnalytics).not.toHaveBeenCalled();
    expect(firebaseModule.analytics).toBeNull();
  });
});
