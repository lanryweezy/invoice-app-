import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    window.location = { ...originalLocation };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('returns the decoded pathname when it contains valid encoded characters', () => {
    window.location.pathname = '/folder%20name/file';

    const result = getDecodedPathname();

    expect(result).toBe('/folder name/file');
  });

  it('returns the original pathname when it contains no encoded characters', () => {
    window.location.pathname = '/normal/path';

    const result = getDecodedPathname();

    expect(result).toBe('/normal/path');
  });

  it('returns the raw pathname when it contains a malformed URI sequence', () => {
    window.location.pathname = '/malformed/%URI';

    const result = getDecodedPathname();

    expect(result).toBe('/malformed/%URI');
  });
});
