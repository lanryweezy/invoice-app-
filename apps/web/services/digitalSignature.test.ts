import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCertificate,
  validateCertificate,
  signInvoice,
  verifySignature,
  signInvoiceWithCertificate,
  getSignatureInfo
} from './digitalSignature';
import type { Invoice } from '../types';

describe('digitalSignature', () => {
  const mockInvoice = {
    invoiceNumber: 'INV-001',
    issueDate: '2024-01-01',
    user: { name: 'Acme Corp', tin: '123456789' },
    client: { name: 'Client Ltd', tin: '987654321' },
    total: 15000,
    currency: 'NGN'
  } as Invoice;

  const mockInvoiceMissingData = {
    ...mockInvoice,
    user: { name: 'Acme Corp' },
    client: { name: 'Client Ltd' },
    total: undefined,
  } as unknown as Invoice;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateCertificate', () => {
    it('generates a valid certificate with expiry 1 year in the future', () => {
      const cert = generateCertificate({
        name: 'Test Business',
        tin: 'TIN123',
        cacNumber: 'CAC456'
      });

      expect(cert.id).toMatch(/^CERT-[A-F0-9]{12}$/);
      expect(cert.businessName).toBe('Test Business');
      expect(cert.tin).toBe('TIN123');
      expect(cert.cacNumber).toBe('CAC456');
      expect(cert.issuedAt).toBe('2024-01-01T12:00:00.000Z');
      expect(cert.expiresAt).toBe('2025-01-01T12:00:00.000Z');
      expect(cert.algorithm).toBe('SHA-256 with RSA');
      expect(cert.publicKey).toBeDefined();
    });

    it('defaults cacNumber to an empty string if not provided', () => {
      const cert = generateCertificate({
        name: 'Test Business',
        tin: 'TIN123'
      });

      expect(cert.cacNumber).toBe('');
    });
  });

  describe('validateCertificate', () => {
    const validCert = {
      id: 'CERT-123',
      businessName: 'Test Business',
      tin: 'TIN123',
      cacNumber: '',
      issuedAt: '2023-06-01T12:00:00.000Z',
      expiresAt: '2024-06-01T12:00:00.000Z',
      publicKey: 'pub-key',
      algorithm: 'SHA-256 with RSA'
    };

    it('returns valid: true for a valid certificate', () => {
      expect(validateCertificate(validCert)).toEqual({ valid: true });
    });

    it('returns invalid if certificate is missing required fields', () => {
      expect(validateCertificate({ ...validCert, id: '' })).toEqual({
        valid: false,
        reason: 'Certificate missing required fields'
      });
      expect(validateCertificate({ ...validCert, businessName: '' })).toEqual({
        valid: false,
        reason: 'Certificate missing required fields'
      });
    });

    it('returns invalid if certificate is not yet valid', () => {
      expect(validateCertificate({ ...validCert, issuedAt: '2024-02-01T12:00:00.000Z' })).toEqual({
        valid: false,
        reason: 'Certificate not yet valid'
      });
    });

    it('returns invalid if certificate has expired', () => {
      expect(validateCertificate({ ...validCert, expiresAt: '2023-12-31T12:00:00.000Z' })).toEqual({
        valid: false,
        reason: 'Certificate has expired'
      });
    });

    it('returns invalid if public key is missing', () => {
      expect(validateCertificate({ ...validCert, publicKey: '' })).toEqual({
        valid: false,
        reason: 'Certificate missing public key'
      });
    });
  });

  describe('signInvoice', () => {
    it('creates a valid signature data object', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');

      expect(signatureData.payload.invoiceNumber).toBe('INV-001');
      expect(signatureData.payload.issuerName).toBe('Acme Corp');
      expect(signatureData.payload.totalAmount).toBe(15000);
      expect(signatureData.algorithm).toBe('SHA-256 with RSA');
      expect(signatureData.signature).toBeDefined();
      expect(signatureData.certificateId).toMatch(/^SIG-/);
    });

    it('creates a valid signature data object with fallback defaults for missing invoice data', () => {
      const signatureData = signInvoice(mockInvoiceMissingData, 'test-private-key');

      expect(signatureData.payload.totalAmount).toBe(0);
      expect(signatureData.payload.issuerTIN).toBe('');
      expect(signatureData.signature).toBeDefined();
    });

    it('generates a different signature when a custom private key is provided', () => {
      const defaultSignatureData = signInvoice(mockInvoice, 'test-private-key');
      const customSignatureData = signInvoice(mockInvoice, 'custom-private-key');

      expect(customSignatureData.signature).toBeDefined();
      expect(customSignatureData.signature).not.toBe(defaultSignatureData.signature);
    });
  });

  describe('verifySignature', () => {
    it('returns true for a valid signature generated from the same invoice', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      expect(verifySignature(mockInvoice, signatureData)).toBe(true);
    });

    it('returns false if totalAmount does not match', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      const modifiedInvoice = { ...mockInvoice, total: 20000 } as Invoice;
      expect(verifySignature(modifiedInvoice, signatureData)).toBe(false);
    });

    it('returns false if issuerName does not match', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      const modifiedInvoice = { ...mockInvoice, user: { ...mockInvoice.user, name: 'Different Corp' } } as Invoice;
      expect(verifySignature(modifiedInvoice, signatureData)).toBe(false);
    });

    it('returns false if currency does not match', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      const modifiedInvoice = { ...mockInvoice, currency: 'USD' } as Invoice;
      expect(verifySignature(modifiedInvoice, signatureData)).toBe(false);
    });

    it('returns false if invoiceNumber does not match', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      const modifiedInvoice = { ...mockInvoice, invoiceNumber: 'INV-999' } as Invoice;
      expect(verifySignature(modifiedInvoice, signatureData)).toBe(false);
    });

    it('returns false if payload hash does not match', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      // Modify a field that affects computeInvoiceHash but isn't directly checked before it
      const modifiedInvoice = { ...mockInvoice, issueDate: '2024-12-31' } as Invoice;
      expect(verifySignature(modifiedInvoice, signatureData)).toBe(false);
    });

    it('returns false if certificate age is older than 1 year', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');

      // Advance time by more than 1 year
      vi.setSystemTime(new Date('2025-01-02T12:00:00Z'));

      expect(verifySignature(mockInvoice, signatureData)).toBe(false);
    });
  });

  describe('getSignatureInfo', () => {
    it('returns signature info with validity status', () => {
      const signatureData = signInvoice(mockInvoice, 'test-private-key');
      const info = getSignatureInfo(signatureData);

      expect(info.valid).toBe(true);
      expect(info.issuer).toBe('Acme Corp');
      expect(info.algorithm).toBe('SHA-256 with RSA');
    });
  });

  describe('signInvoiceWithCertificate', () => {
    const validCert = {
      id: 'CERT-123',
      businessName: 'Test Business',
      tin: 'TIN123',
      cacNumber: '',
      issuedAt: '2023-06-01T12:00:00.000Z',
      expiresAt: '2024-06-01T12:00:00.000Z',
      publicKey: 'pub-key',
      algorithm: 'SHA-256 with RSA'
    };

    it('signs an invoice using a valid certificate', () => {
      const signatureData = signInvoiceWithCertificate(mockInvoice, validCert);

      expect(signatureData.certificateId).toBe('CERT-123');
      expect(signatureData.signature).toBeDefined();
    });

    it('throws an error if the certificate is expired', () => {
      const expiredCert = { ...validCert, expiresAt: '2023-12-31T12:00:00.000Z' };

      expect(() => {
        signInvoiceWithCertificate(mockInvoice, expiredCert);
      }).toThrow('Certificate has expired');
    });
  });
});
