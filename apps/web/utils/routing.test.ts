import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('routing', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { ...originalLocation };
  });

  afterEach(() => {
    // @ts-ignore
    window.location = originalLocation;
  });

  describe('getDecodedPathname', () => {
    it('decodes standard URI components in the pathname', () => {
      window.location.pathname = '/invoice/INV%20123';
      expect(getDecodedPathname()).toBe('/invoice/INV 123');
    });

    it('returns the raw pathname when the URI is malformed', () => {
      // % followed by an invalid hex sequence causes decodeURIComponent to throw
      window.location.pathname = '/invoice/INV%X';
      expect(getDecodedPathname()).toBe('/invoice/INV%X');
    });

    it('handles paths with no encoded characters', () => {
      window.location.pathname = '/editor/settings';
      expect(getDecodedPathname()).toBe('/editor/settings');
    });
  });
});
