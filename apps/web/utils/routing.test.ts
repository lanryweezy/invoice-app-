import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // @ts-ignore - allowing modification for testing
    delete window.location;
    window.location = { ...originalLocation };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it('returns the decoded pathname when the URI is well-formed', () => {
    window.location.pathname = '/editor/my%20invoice%20data';
    expect(getDecodedPathname()).toBe('/editor/my invoice data');
  });

  it('returns the raw pathname when the URI contains malformed encoding', () => {
    window.location.pathname = '/editor/my%invoice';
    expect(getDecodedPathname()).toBe('/editor/my%invoice');
  });

  it('returns the pathname unchanged when there is no encoding', () => {
    window.location.pathname = '/editor/branches';
    expect(getDecodedPathname()).toBe('/editor/branches');
  });
});
