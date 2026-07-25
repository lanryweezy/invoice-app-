import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSecureId } from './crypto';

describe('crypto', () => {
  describe('generateSecureId', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', {
        randomUUID: () => '12345678-1234-1234-1234-123456789abc'
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generates a 6-character ID by default', () => {
      const id = generateSecureId();
      expect(id).toHaveLength(6);
      expect(id).toBe('123456');
    });

    it('generates an ID of the requested length', () => {
      const id = generateSecureId(12);
      expect(id).toHaveLength(12);
      expect(id).toBe('123456781234');
    });

    it('handles lengths greater than a standard UUID (32 chars without dashes) by repeating the UUID string', () => {
      const id = generateSecureId(50);
      expect(id).toHaveLength(50);
      // The mocked UUID without dashes is 32 chars: 12345678123412341234123456789abc
      // 50 chars means the full 32 chars + first 18 chars of the same string repeated
      expect(id).toBe('12345678123412341234123456789ABC123456781234123412');
    });

    it('returns uppercase strings', () => {
      const id = generateSecureId(32);
      expect(id).toBe('12345678123412341234123456789ABC');
    });
  });
});
