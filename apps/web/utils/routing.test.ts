import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // @ts-ignore
    delete window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('decodes a valid URI encoded pathname', () => {
    window.location = { ...originalLocation, pathname: '/editor/my%20invoice' } as Location;

    expect(getDecodedPathname()).toBe('/editor/my invoice');
  });

  it('returns the raw pathname when URI decoding fails due to malformed input', () => {
    window.location = { ...originalLocation, pathname: '/editor/bad%path' } as Location;

    expect(getDecodedPathname()).toBe('/editor/bad%path');
  });

  it('returns the unmodified pathname if it does not contain encoded characters', () => {
    window.location = { ...originalLocation, pathname: '/editor/settings' } as Location;

    expect(getDecodedPathname()).toBe('/editor/settings');
  });
});
