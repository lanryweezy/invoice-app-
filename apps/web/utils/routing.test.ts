import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // @ts-ignore
    delete window.location;

    window.location = {
      ...originalLocation,
      pathname: '/',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('returns the pathname unchanged when it contains no encoded characters', () => {
    window.location.pathname = '/dashboard/settings';
    expect(getDecodedPathname()).toBe('/dashboard/settings');
  });

  it('decodes URL-encoded characters in the pathname', () => {
    window.location.pathname = '/folder/my%20file%20name';
    expect(getDecodedPathname()).toBe('/folder/my file name');
  });

  it('falls back to the raw pathname when it contains malformed URI sequences', () => {
    window.location.pathname = '/search/100%_discount';
    expect(getDecodedPathname()).toBe('/search/100%_discount');
  });
});
