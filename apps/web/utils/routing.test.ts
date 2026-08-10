import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { pathname: '/default/path' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the decoded pathname when the URI is well-formed', () => {
    expect(getDecodedPathname('/editor/my%20invoice%20data')).toBe('/editor/my invoice data');
  });

  it('returns the raw pathname when the URI contains malformed encoding', () => {
    expect(getDecodedPathname('/editor/my%invoice')).toBe('/editor/my%invoice');
  });

  it('returns the pathname unchanged when there is no encoding', () => {
    expect(getDecodedPathname('/editor/branches')).toBe('/editor/branches');
  });

  it('uses window.location.pathname as default argument', () => {
    expect(getDecodedPathname()).toBe('/default/path');
  });
});
