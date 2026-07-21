import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePortalToken, createPortalLink, getPortalLink } from './portalLinks';
import type { Invoice } from '../types';

describe('portalLinks', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn()
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const mockInvoice = {
    invoiceNumber: 'INV-001',
    client: { name: 'Acme Corp', email: 'acme@example.com' },
    total: 1000,
    currency: 'NGN',
    status: 'Draft'
  } as unknown as Invoice;

  describe('generatePortalToken', () => {
    it('generates a 64-character alphanumeric token', () => {
      const token = generatePortalToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[A-Za-z0-9]{64}$/);
    });

    it('generates unique tokens', () => {
      const token1 = generatePortalToken();
      const token2 = generatePortalToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createPortalLink', () => {
    it('creates a new portal link and stores it in localStorage if no portalToken exists on invoice', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const link = createPortalLink(mockInvoice);

      const token = link.split('/').pop();
      expect(token).toHaveLength(64);
      expect(link).toBe(`https://www.invoiceapp.ng/portal/${token}`);

      expect(localStorage.setItem).toHaveBeenCalledWith('invoiceapp_portal_links', expect.stringContaining(token!));
      expect(localStorage.setItem).toHaveBeenCalledWith('invoiceapp_portal_links', expect.stringContaining('INV-001'));
      expect(localStorage.setItem).toHaveBeenCalledWith('invoiceapp_portal_links', expect.stringContaining('Acme Corp'));
    });

    it('handles a missing invoice total by defaulting to 0', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const noTotalInvoice = { ...mockInvoice, total: undefined } as unknown as Invoice;

      const link = createPortalLink(noTotalInvoice);
      const token = link.split('/').pop();

      const setCall = vi.mocked(localStorage.setItem).mock.calls[0][1];
      const parsedStored = JSON.parse(setCall);

      expect(parsedStored[token!].total).toBe(0);
    });

    it('uses existing portalToken if present on the invoice', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const existingTokenInvoice = { ...mockInvoice, portalToken: 'EXISTING_TOK' } as Invoice;

      const link = createPortalLink(existingTokenInvoice);

      expect(link).toBe('https://www.invoiceapp.ng/portal/EXISTING_TOK');
      expect(localStorage.setItem).toHaveBeenCalledWith('invoiceapp_portal_links', expect.stringContaining('EXISTING_TOK'));
    });

    it('preserves existing links when creating a new one', () => {
      const existingData = { 'old-token': { invoiceNumber: 'INV-OLD' } };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existingData));

      createPortalLink(mockInvoice);

      const setCall = vi.mocked(localStorage.setItem).mock.calls[0][1];
      const parsedStored = JSON.parse(setCall);

      expect(parsedStored['old-token']).toBeDefined();
      expect(Object.keys(parsedStored).length).toBe(2);
    });

    it('handles localStorage read errors gracefully by creating a fresh object', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('Access denied'); });

      const link = createPortalLink(mockInvoice);
      const token = link.split('/').pop();

      const setCall = vi.mocked(localStorage.setItem).mock.calls[0][1];
      const parsedStored = JSON.parse(setCall);

      expect(parsedStored[token!]).toBeDefined();
    });

    it('handles malformed JSON in stored links gracefully by creating a fresh object, testing the catch branch in getStoredLinks', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('not-json');

      const link = createPortalLink(mockInvoice);
      const token = link.split('/').pop();

      const setCall = vi.mocked(localStorage.setItem).mock.calls[0][1];
      const parsedStored = JSON.parse(setCall);

      expect(localStorage.getItem).toHaveBeenCalledWith('invoiceapp_portal_links');
      expect(parsedStored[token!]).toBeDefined();
    });
  });

  describe('getPortalLink', () => {
    it('retrieves the link data if token exists', () => {
      const existingData = {
        'my-token': { invoiceNumber: 'INV-001', clientName: 'Acme Corp' }
      };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existingData));

      const linkData = getPortalLink('my-token');

      expect(linkData).toEqual(existingData['my-token']);
    });

    it('returns null if token does not exist', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({}));

      const linkData = getPortalLink('my-token');

      expect(linkData).toBeNull();
    });

    it('returns null if localStorage is empty', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const linkData = getPortalLink('my-token');

      expect(linkData).toBeNull();
    });

    it('returns null if localStorage read throws an error', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('Access denied'); });

      const linkData = getPortalLink('my-token');

      expect(linkData).toBeNull();
    });

    it('returns null if stored links contain malformed JSON, testing the catch branch in getStoredLinks', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('not-json');

      const linkData = getPortalLink('my-token');

      expect(localStorage.getItem).toHaveBeenCalledWith('invoiceapp_portal_links');
      expect(linkData).toBeNull();
    });
  });
});
