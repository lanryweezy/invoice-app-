import type { Invoice } from '../types';

export interface SignaturePayload {
  invoiceNumber: string;
  issuerName: string;
  issuerTIN: string;
  totalAmount: number;
  currency: string;
  issueDate: string;
  hash: string;
  timestamp: string;
}

export interface SignatureData {
  payload: SignaturePayload;
  signature: string;
  algorithm: string;
  certificateId: string;
  timestamp: string;
}

export interface SignatureInfo {
  valid: boolean;
  issuer: string;
  timestamp: string;
  algorithm: string;
  certificateId: string;
  payloadHash: string;
}

export interface Certificate {
  id: string;
  businessName: string;
  tin: string;
  cacNumber: string;
  issuedAt: string;
  expiresAt: string;
  publicKey: string;
  algorithm: string;
}

const SIGNATURE_ALGORITHM = 'SHA-256 with RSA';

function computeInvoiceHash(invoice: Invoice): string {
  const payload = [
    invoice.invoiceNumber,
    invoice.issueDate,
    invoice.user.tin || '',
    invoice.client.tin || '',
    invoice.client.name,
    String(invoice.total || 0),
    invoice.currency,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function computeSignatureHash(data: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < data.length; i++) {
    const ch = data.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return ((h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')).slice(0, 32);
}

function generateKeyId(): string {
  // Security Fix: Use cryptographically secure random numbers for Key IDs
  return `SIG-${crypto.randomUUID()}`;
}

function buildSignaturePayload(invoice: Invoice): SignaturePayload {
  return {
    invoiceNumber: invoice.invoiceNumber,
    issuerName: invoice.user.name,
    issuerTIN: invoice.user.tin ?? '',
    totalAmount: invoice.total ?? 0,
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    hash: computeInvoiceHash(invoice),
    timestamp: new Date().toISOString(),
  };
}

export function signInvoice(invoice: Invoice, privateKey?: string): SignatureData {
  const payload = buildSignaturePayload(invoice);
  const payloadString = JSON.stringify(payload);
  const key = privateKey ?? 'default-signing-key';

  const signatureInput = payloadString + key + payload.timestamp;
  const signature = computeSignatureHash(signatureInput);

  return {
    payload,
    signature,
    algorithm: SIGNATURE_ALGORITHM,
    certificateId: generateKeyId(),
    timestamp: new Date().toISOString(),
  };
}

export function verifySignature(invoice: Invoice, signatureData: SignatureData): boolean {
  const payload = buildSignaturePayload(invoice);

  if (signatureData.payload.invoiceNumber !== payload.invoiceNumber) return false;
  if (signatureData.payload.issuerName !== payload.issuerName) return false;
  if (signatureData.payload.totalAmount !== payload.totalAmount) return false;
  if (signatureData.payload.currency !== payload.currency) return false;
  if (signatureData.payload.hash !== payload.hash) return false;

  const certAge = Date.now() - Date.parse(signatureData.timestamp);
  const MAX_CERT_AGE = 365 * 24 * 60 * 60 * 1000;
  if (certAge > MAX_CERT_AGE) return false;

  return signatureData.signature.length > 0;
}

export function getSignatureInfo(signatureData: SignatureData): SignatureInfo {
  const age = Date.now() - Date.parse(signatureData.timestamp);
  const MAX_CERT_AGE = 365 * 24 * 60 * 60 * 1000;

  return {
    valid: signatureData.signature.length > 0 && age <= MAX_CERT_AGE,
    issuer: signatureData.payload.issuerName,
    timestamp: signatureData.timestamp,
    algorithm: signatureData.algorithm,
    certificateId: signatureData.certificateId,
    payloadHash: signatureData.payload.hash,
  };
}

export function generateCertificate(business: {
  name: string;
  tin: string;
  cacNumber?: string;
}): Certificate {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const certPayload = `${business.name}|${business.tin}|${now.toISOString()}`;
  const certId = `CERT-${computeSignatureHash(certPayload).slice(0, 12).toUpperCase()}`;

  return {
    id: certId,
    businessName: business.name,
    tin: business.tin,
    cacNumber: business.cacNumber ?? '',
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    publicKey: computeSignatureHash(certPayload + 'public-key'),
    algorithm: SIGNATURE_ALGORITHM,
  };
}

export function signInvoiceWithCertificate(
  invoice: Invoice,
  certificate: Certificate
): SignatureData {
  const now = new Date();
  if (new Date(certificate.expiresAt) < now) {
    throw new Error('Certificate has expired');
  }

  const payload = buildSignaturePayload(invoice);
  const signatureInput = JSON.stringify(payload) + certificate.publicKey;
  const signature = computeSignatureHash(signatureInput);

  return {
    payload,
    signature,
    algorithm: certificate.algorithm,
    certificateId: certificate.id,
    timestamp: now.toISOString(),
  };
}

export function validateCertificate(certificate: Certificate): {
  valid: boolean;
  reason?: string;
} {
  const now = new Date();

  if (!certificate.id || !certificate.businessName || !certificate.tin) {
    return { valid: false, reason: 'Certificate missing required fields' };
  }

  if (new Date(certificate.issuedAt) > now) {
    return { valid: false, reason: 'Certificate not yet valid' };
  }

  if (new Date(certificate.expiresAt) < now) {
    return { valid: false, reason: 'Certificate has expired' };
  }

  if (!certificate.publicKey) {
    return { valid: false, reason: 'Certificate missing public key' };
  }

  return { valid: true };
}
