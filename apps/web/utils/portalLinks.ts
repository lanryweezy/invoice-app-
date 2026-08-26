import type { Invoice } from '../types';
import { generateSecureId } from './crypto';
import { trackEvent } from './analytics';
import { getErrorMessage } from './error';

const STORAGE_KEY = 'invoiceapp_portal_links';

export function generatePortalToken(): string {
  // UUID without dashes is 32 chars
  return generateSecureId(64).toLowerCase();
}

export function createPortalLink(invoice: Invoice): string {
  const token = invoice.portalToken || generatePortalToken();
  const baseUrl = 'https://www.invoiceapp.ng';

  const links = getStoredLinks();
  links[token] = {
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.client.name,
    clientEmail: invoice.client.email,
    total: invoice.total || 0,
    currency: invoice.currency,
    status: invoice.status,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));

  return `${baseUrl}/portal/${token}`;
}

export function getPortalLink(token: string) {
  const links = getStoredLinks();
  return links[token] || null;
}

function getStoredLinks(): Record<string, any> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load portal links from storage', { event: 'portal_links.load.failed', error: getErrorMessage(error) });
    try { trackEvent('portal_links_load_failed', { error: String(error) }); } catch {}
    return {};
  }
}
