import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, setApiKey, setTin, setSandbox, getHeaders, NrsApiError } from './apiConfig';

describe('apiConfig', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it('returns headers reflecting current state', () => {
    setApiKey('key'); setTin('tin'); setSandbox(false);
    expect(getHeaders()).toMatchObject({
      'Authorization': 'Bearer key', 'X-TIN': 'tin', 'X-Environment': 'production'
    });
  });

  it('throws NrsApiError on bad response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401, json: async () => ({}) } as Response);
    await expect(apiRequest('/test')).rejects.toThrow(NrsApiError);
  });

  it('returns JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: 1 }) } as Response);
    const result = await apiRequest('/test', 'POST', { id: 1 });
    expect(result).toEqual({ ok: 1 });
  });
});
