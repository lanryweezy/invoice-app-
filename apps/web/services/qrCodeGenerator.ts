import QRCode from 'qrcode';
import type { Invoice } from '../types';

export interface QRCodeOptions {
  size?: number;
  foreground?: string;
  background?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface PaymentQRData {
  type: 'payment';
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  description: string;
}

export interface InvoiceQRData {
  type: 'invoice';
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuer: string;
  issueDate: string;
  dueDate: string;
}

export interface VerificationQRData {
  type: 'verification';
  invoiceId: string;
  timestamp: string;
  verificationUrl: string;
}

const ERROR_MAP: Record<string, string> = { L: 'L', M: 'M', Q: 'Q', H: 'H' };

async function generateQRDataURL(data: string, options?: QRCodeOptions): Promise<string> {
  const opts = { ...options };
  const errorLevel = opts.errorCorrectionLevel ? ERROR_MAP[opts.errorCorrectionLevel] || 'M' : 'M';

  const svg = await QRCode.toString(data, {
    type: 'svg',
    width: opts.size || 256,
    margin: opts.margin || 2,
    color: {
      dark: opts.foreground || '#000000',
      light: opts.background || '#FFFFFF',
    },
    errorCorrectionLevel: errorLevel as any,
  });

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export async function generatePaymentQR(
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string,
  options?: QRCodeOptions
): Promise<string> {
  const paymentData: PaymentQRData = {
    type: 'payment',
    amount,
    currency: 'NGN',
    bankName,
    accountNumber,
    accountName,
    reference: `INV-${Date.now()}`,
    description: `Payment of NGN ${amount.toLocaleString()}`,
  };

  return generateQRDataURL(JSON.stringify(paymentData), options);
}

export async function generateInvoiceQR(
  invoice: Invoice,
  options?: QRCodeOptions
): Promise<string> {
  const qrData: InvoiceQRData = {
    type: 'invoice',
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total ?? 0,
    currency: invoice.currency,
    issuer: invoice.user.name,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
  };

  return generateQRDataURL(JSON.stringify(qrData), options);
}

export async function generateVerificationQR(
  invoiceId: string,
  options?: QRCodeOptions
): Promise<string> {
  const verificationData: VerificationQRData = {
    type: 'verification',
    invoiceId,
    timestamp: new Date().toISOString(),
    verificationUrl: `https://invoiceapp.ng/verify/${invoiceId}`,
  };

  return generateQRDataURL(JSON.stringify(verificationData), options);
}

export async function getQRCodeImage(
  qrData: string,
  options?: QRCodeOptions
): Promise<string> {
  return generateQRDataURL(qrData, options);
}

export async function generateInvoiceQRWithLogo(
  invoice: Invoice,
  logoBase64?: string,
  options?: QRCodeOptions
): Promise<string> {
  const data = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total,
    type: 'invoice',
  });

  return generateQRDataURL(data, options);
}
