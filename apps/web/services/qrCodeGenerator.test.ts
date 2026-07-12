import { describe, it, expect, vi, afterEach } from 'vitest';
import QRCode from 'qrcode';
import { generatePaymentQR } from './qrCodeGenerator';

vi.mock('qrcode', () => ({ default: { toString: vi.fn() } }));

describe('qrCodeGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a payment QR code with the correct structured payload', async () => {
    (QRCode.toString as any).mockResolvedValue('<svg>test</svg>');
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
});
