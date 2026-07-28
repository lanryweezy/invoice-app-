import { describe, it, expect, beforeEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      pathname: '/default/path'
    };
  });

  it('should decode window.location.pathname by default', () => {
    window.location.pathname = '/hello%20world';
    expect(getDecodedPathname()).toBe('/hello world');
  });

  it('should decode a provided path argument', () => {
    expect(getDecodedPathname('/custom%20path')).toBe('/custom path');
  });

  it('should fallback to window.location.pathname on malformed URI when no argument is provided', () => {
    const malformedUri = '/hello%20world%'; // % at the end is invalid
    window.location.pathname = malformedUri;
    expect(getDecodedPathname()).toBe(malformedUri);
  });

  it('should fallback to the provided path on malformed URI when argument is provided', () => {
    const malformedUri = '/custom%20path%'; // % at the end is invalid
    expect(getDecodedPathname(malformedUri)).toBe(malformedUri);
  });

  it('should return the original string if no decoding is needed', () => {
    expect(getDecodedPathname('/normal/path')).toBe('/normal/path');
  });
});
