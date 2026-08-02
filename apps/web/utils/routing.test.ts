import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { ...originalLocation };
  });

  afterEach(() => {
    // @ts-ignore
    window.location = originalLocation;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns decoded pathname when URI is correctly encoded', () => {
    window.location.pathname = '/my%20folder/test';
    expect(getDecodedPathname()).toBe('/my folder/test');
  });

  it('returns original pathname when URI is malformed', () => {
    window.location.pathname = '/invalid%path'; // decodeURIComponent will throw
    expect(getDecodedPathname()).toBe('/invalid%path');
  });

  it('returns original pathname when no encoding is present', () => {
    window.location.pathname = '/normal/path';
    expect(getDecodedPathname()).toBe('/normal/path');
  });
});
