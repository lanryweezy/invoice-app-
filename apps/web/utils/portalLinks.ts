import type { Invoice } from '../types';

const STORAGE_KEY = 'invoiceapp_portal_links';

export function generatePortalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
  } catch {
    return {};
  }
}
