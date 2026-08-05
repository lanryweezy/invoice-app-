/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDecodedPathname } from './routing';

describe('routing utils', () => {
  describe('getDecodedPathname', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      // @ts-ignore
      delete window.location;
      window.location = { ...originalLocation } as Location;
    });

    afterEach(() => {
      window.location = originalLocation;
      vi.restoreAllMocks();
      vi.clearAllMocks();
    });

    it('returns the decoded pathname when the URI is well-formed', () => {
      window.location.pathname = '/my%20test%20path';

      const result = getDecodedPathname();

      expect(result).toBe('/my test path');
    });

    it('returns the original pathname when the URI is malformed', () => {
      // A standalone % character causes decodeURIComponent to throw a URIError
      window.location.pathname = '/invalid%path';

      const result = getDecodedPathname();

      expect(result).toBe('/invalid%path');
    });
  });
});
