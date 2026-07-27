import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDecodedPathname } from './routing';

describe('getDecodedPathname', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    window.location = { pathname: '' } as any;
  });

  afterEach(() => {
    // @ts-ignore
    window.location = originalLocation;
  });

  it('returns the decoded pathname when the URI contains valid encoded characters', () => {
    window.location.pathname = '/folder/%20file';
    expect(getDecodedPathname()).toBe('/folder/ file');
  });

  it('returns the original pathname when the URI contains malformed encoded characters', () => {
    // % is a malformed URI component
    window.location.pathname = '/folder/%';
    expect(getDecodedPathname()).toBe('/folder/%');
  });
});
