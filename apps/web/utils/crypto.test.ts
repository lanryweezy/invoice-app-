import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSecureId } from './crypto';

describe('crypto', () => {
  describe('generateSecureId', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn((arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 256;
          }
          return arr;
        })
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generates a 6-character ID by default', () => {
      const id = generateSecureId();
      expect(id).toHaveLength(6);
      expect(id).toBe('000102');
    });

    it('generates an ID of the requested length', () => {
      const id = generateSecureId(12);
      expect(id).toHaveLength(12);
      expect(id).toBe('000102030405');
    });

    it('generates strings longer than 32 characters securely without repeating entropy', () => {
      const id = generateSecureId(50);
      expect(id).toHaveLength(50);
      expect(id).toBe('000102030405060708090A0B0C0D0E0F101112131415161718');
    });

    it('returns uppercase strings', () => {
      const id = generateSecureId(32);
      expect(id).toBe('000102030405060708090A0B0C0D0E0F');
    });
  });
});
