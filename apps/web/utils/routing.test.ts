import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('routing', () => {
  describe('getDecodedPathname', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      // @ts-ignore
      delete window.location;
    });

    afterEach(() => {
      // @ts-ignore
      window.location = originalLocation;
    });

    it('returns the decoded pathname when the URI contains encoded characters', () => {
      // @ts-ignore
      window.location = { ...originalLocation, pathname: '/editor%20path' };
      expect(getDecodedPathname()).toBe('/editor path');
    });

    it('returns the original pathname when the URI is malformed and cannot be decoded', () => {
      // % is malformed if not followed by valid hex
      // @ts-ignore
      window.location = { ...originalLocation, pathname: '/editor%2path' };
      expect(getDecodedPathname()).toBe('/editor%2path');
    });

    it('returns the original pathname when no decoding is needed', () => {
      // @ts-ignore
      window.location = { ...originalLocation, pathname: '/editor/branches' };
      expect(getDecodedPathname()).toBe('/editor/branches');
    });
  });
});
