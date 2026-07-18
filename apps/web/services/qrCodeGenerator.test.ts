import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import QRCode from 'qrcode';
import {
  generatePaymentQR,
  generateInvoiceQR,
  generateVerificationQR,
  getQRCodeImage,
  generateInvoiceQRWithLogo
} from './qrCodeGenerator';
import type { Invoice } from '../types';

vi.mock('qrcode', () => ({ default: { toString: vi.fn() } }));

describe('qrCodeGenerator', () => {
  beforeEach(() => {
    (QRCode.toString as any).mockResolvedValue('<svg>test</svg>');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('generates a payment QR code with the correct structured payload', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    const result = await generatePaymentQR(15000, 'GTB', '01234', 'John');

    expect(QRCode.toString).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'payment',
        amount: 15000,
        currency: 'NGN',
        bankName: 'GTB',
        accountNumber: '01234',
        accountName: 'John',
        reference: 'INV-1234567890',
        description: 'Payment of NGN 15,000',
      }),
      expect.objectContaining({ type: 'svg', errorCorrectionLevel: 'M' })
    );
    expect(result).toBe(`data:image/svg+xml;base64,${btoa('<svg>test</svg>')}`);
  });

  it('generates an invoice QR code with the correct structured payload', async () => {
    const mockInvoice = {
      invoiceNumber: 'INV-001',
      total: 50000,
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-01-15',
      user: { name: 'Acme Corp' }
    } as Invoice;

    const result = await generateInvoiceQR(mockInvoice);

    expect(QRCode.toString).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'invoice',
        invoiceNumber: 'INV-001',
        amount: 50000,
        currency: 'USD',
        issuer: 'Acme Corp',
        issueDate: '2024-01-01',
        dueDate: '2024-01-15',
      }),
      expect.objectContaining({ type: 'svg', errorCorrectionLevel: 'M' })
    );
    expect(result).toBe(`data:image/svg+xml;base64,${btoa('<svg>test</svg>')}`);
  });

  it('generates a verification QR code with the correct structured payload', async () => {
    const result = await generateVerificationQR('invoice-123');

    expect(QRCode.toString).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'verification',
        invoiceId: 'invoice-123',
        timestamp: '2024-01-01T12:00:00.000Z',
        verificationUrl: 'https://invoiceapp.ng/verify/invoice-123',
      }),
      expect.objectContaining({ type: 'svg', errorCorrectionLevel: 'M' })
    );
    expect(result).toBe(`data:image/svg+xml;base64,${btoa('<svg>test</svg>')}`);
  });

  it('generates a QR code image from raw string data', async () => {
    const result = await getQRCodeImage('raw-qr-data');

    expect(QRCode.toString).toHaveBeenCalledWith(
      'raw-qr-data',
      expect.objectContaining({ type: 'svg', errorCorrectionLevel: 'M' })
    );
    expect(result).toBe(`data:image/svg+xml;base64,${btoa('<svg>test</svg>')}`);
  });

  it('generates an invoice QR code with logo using a short payload', async () => {
    const mockInvoice = {
      invoiceNumber: 'INV-002',
      total: 75000,
    } as Invoice;

    const result = await generateInvoiceQRWithLogo(mockInvoice, 'logo-base64');

    expect(QRCode.toString).toHaveBeenCalledWith(
      JSON.stringify({
        invoiceNumber: 'INV-002',
        amount: 75000,
        type: 'invoice',
      }),
      expect.objectContaining({ type: 'svg', errorCorrectionLevel: 'M' })
    );
    expect(result).toBe(`data:image/svg+xml;base64,${btoa('<svg>test</svg>')}`);
  });
});
