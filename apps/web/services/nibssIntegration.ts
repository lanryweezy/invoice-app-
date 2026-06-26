import type { Invoice } from '../types';

export type BankCode = '044' | '014' | '023' | '011' | '057' | '033' | '030' | '032' | '050' | '035';

export interface BankInfo {
  code: string;
  name: string;
  alias: string;
  nibssCode: string;
}

export interface NIBSSPaymentLink {
  reference: string;
  amount: number;
  bank: string;
  accountNumber: string;
  customerName: string;
  expiresAt: string;
  url: string;
  status: 'active' | 'expired' | 'used';
}

export interface NIBSSBankTransferDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  beneficiaryName: string;
  narration: string;
  amount: number;
  reference: string;
  expiresAt: string;
}

export interface NIBSSPaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  reference: string;
  amount: number;
  paidAt?: string;
  bankRef?: string;
  message: string;
}

export interface NIBSSReceipt {
  receiptNumber: string;
  invoiceNumber: string;
  payer: string;
  payee: string;
  amount: number;
  bank: string;
  reference: string;
  paidAt: string;
  narration: string;
}

const SUPPORTED_BANKS: BankInfo[] = [
  { code: '044', name: 'Access Bank', alias: 'access', nibssCode: '044' },
  { code: '014', name: 'Afribank', alias: 'afribank', nibssCode: '014' },
  { code: '023', name: 'Citibank Nigeria', alias: 'citibank', nibssCode: '023' },
  { code: '011', name: 'First Bank of Nigeria', alias: 'firstbank', nibssCode: '011' },
  { code: '057', name: 'Guaranty Trust Bank', alias: 'gtbank', nibssCode: '057' },
  { code: '033', name: 'United Bank for Africa', alias: 'uba', nibssCode: '033' },
  { code: '030', name: 'Heritage Bank', alias: 'heritage', nibssCode: '030' },
  { code: '032', name: 'Union Bank of Nigeria', alias: 'unionbank', nibssCode: '032' },
  { code: '050', name: 'Zenith Bank', alias: 'zenith', nibssCode: '050' },
  { code: '035', name: 'Wema Bank', alias: 'wema', nibssCode: '035' },
  { code: '053', name: 'Stanbic IBTC', alias: 'stanbic', nibssCode: '053' },
  { code: '016', name: 'Polaris Bank', alias: 'polaris', nibssCode: '016' },
  { code: '039', name: 'Sterling Bank', alias: 'sterling', nibssCode: '039' },
  { code: '070', name: 'Fidelity Bank', alias: 'fidelity', nibssCode: '070' },
  { code: '214', name: 'Unity Bank', alias: 'unity', nibssCode: '214' },
];

const paymentLinks = new Map<string, NIBSSPaymentLink>();
const paymentStatuses = new Map<string, NIBSSPaymentStatus>();

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NIBSS-${timestamp}-${random}`;
}

function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `RCP-NIBSS-${year}${month}-${seq}`;
}

function lookupBank(input: string): BankInfo | undefined {
  const normalized = input.toLowerCase().trim();
  return SUPPORTED_BANKS.find(
    (b) => b.code === normalized || b.alias === normalized || b.name.toLowerCase() === normalized
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
}

export function getBankDetails(bank: string): BankInfo | undefined {
  return lookupBank(bank);
}

export function getSupportedBanks(): BankInfo[] {
  return [...SUPPORTED_BANKS];
}

export function generatePaymentLink(
  amount: number,
  bank: string,
  accountNumber: string,
  customerName: string
): NIBSSPaymentLink {
  const bankInfo = lookupBank(bank);
  if (!bankInfo) {
    throw new Error(`Bank "${bank}" not supported. Use getSupportedBanks() for available options.`);
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error('Account number must be exactly 10 digits.');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const reference = generateReference();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const link: NIBSSPaymentLink = {
    reference,
    amount,
    bank: bankInfo.name,
    accountNumber,
    customerName,
    expiresAt,
    url: `https://nibss.ng/pay/${reference}`,
    status: 'active',
  };

  paymentLinks.set(reference, link);

  paymentStatuses.set(reference, {
    status: 'pending',
    reference,
    amount,
    message: 'Awaiting payment confirmation',
  });

  return link;
}

export function generateBankTransferDetails(
  amount: number,
  bank: string,
  accountNumber: string,
  beneficiaryName: string,
  narration?: string
): NIBSSBankTransferDetails {
  const bankInfo = lookupBank(bank);
  if (!bankInfo) {
    throw new Error(`Bank "${bank}" not supported.`);
  }

  const reference = generateReference();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  paymentStatuses.set(reference, {
    status: 'pending',
    reference,
    amount,
    message: 'Awaiting bank transfer confirmation',
  });

  return {
    bankName: bankInfo.name,
    bankCode: bankInfo.code,
    accountNumber,
    accountName: beneficiaryName,
    beneficiaryName,
    narration: narration || `Payment for invoice - ${reference}`,
    amount,
    reference,
    expiresAt,
  };
}

export function verifyPayment(transactionId: string): NIBSSPaymentStatus {
  const status = paymentStatuses.get(transactionId);
  if (!status) {
    return {
      status: 'failed',
      reference: transactionId,
      amount: 0,
      message: 'Transaction not found in NIBSS system',
    };
  }

  if (status.status === 'completed') {
    return { ...status };
  }

  const link = paymentLinks.get(transactionId);
  if (link && new Date(link.expiresAt) < new Date()) {
    status.status = 'expired';
    status.message = 'Payment link has expired';
    paymentStatuses.set(transactionId, status);
  }

  return { ...status };
}

export function getPaymentStatus(invoiceId: string): NIBSSPaymentStatus | undefined {
  for (const status of paymentStatuses.values()) {
    if (status.reference.includes(invoiceId)) {
      return { ...status };
    }
  }

  for (const link of paymentLinks.values()) {
    if (link.reference.includes(invoiceId)) {
      const status = paymentStatuses.get(link.reference);
      return status ? { ...status } : undefined;
    }
  }

  return undefined;
}

export function generateReceipt(payment: {
  invoiceNumber: string;
  payer: string;
  payee: string;
  amount: number;
  bank: string;
  reference: string;
  paidAt?: string;
  narration?: string;
}): NIBSSReceipt {
  return {
    receiptNumber: generateReceiptNumber(),
    invoiceNumber: payment.invoiceNumber,
    payer: payment.payer,
    payee: payment.payee,
    amount: payment.amount,
    bank: payment.bank,
    reference: payment.reference,
    paidAt: payment.paidAt || new Date().toISOString(),
    narration: payment.narration || 'Invoice payment via NIBSS',
  };
}

export function generateReceiptHTML(receipt: NIBSSReceipt): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>NIBSS Payment Receipt - ${receipt.receiptNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: #f8fafc; color: #1e293b; }
    .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.5px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 32px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 14px; }
    .value { font-weight: 600; color: #0f172a; font-size: 14px; }
    .total-row { background: #f0fdfa; margin: 16px -32px; padding: 16px 32px; border-top: 2px solid #14b8a6; border-bottom: 2px solid #14b8a6; }
    .total-row .value { font-size: 24px; color: #0f766e; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .nibss-badge { display: inline-block; background: #14b8a6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>PAYMENT RECEIPT</h1>
      <p>NIBSS Electronic Payment Confirmation</p>
      <div class="nibss-badge">NIBSS VERIFIED</div>
    </div>
    <div class="body">
      <div class="row">
        <span class="label">Receipt Number</span>
        <span class="value">${receipt.receiptNumber}</span>
      </div>
      <div class="row">
        <span class="label">Invoice Number</span>
        <span class="value">${receipt.invoiceNumber}</span>
      </div>
      <div class="row">
        <span class="label">Payer</span>
        <span class="value">${receipt.payer}</span>
      </div>
      <div class="row">
        <span class="label">Payee</span>
        <span class="value">${receipt.payee}</span>
      </div>
      <div class="row">
        <span class="label">Bank</span>
        <span class="value">${receipt.bank}</span>
      </div>
      <div class="row">
        <span class="label">Reference</span>
        <span class="value">${receipt.reference}</span>
      </div>
      <div class="row">
        <span class="label">Paid At</span>
        <span class="value">${new Date(receipt.paidAt).toLocaleString('en-NG')}</span>
      </div>
      <div class="total-row">
        <div class="row">
          <span class="label">Amount Paid</span>
          <span class="value">${formatAmount(receipt.amount)}</span>
        </div>
      </div>
      ${receipt.narration ? `<div class="row"><span class="label">Narration</span><span class="value">${receipt.narration}</span></div>` : ''}
    </div>
    <div class="footer">
      <p>This receipt was generated via NIBSS integration.</p>
      <p>Generated on ${new Date().toLocaleString('en-NG')}</p>
    </div>
  </div>
</body>
</html>`;
}

export function getFormattedBankDetails(bank: string, accountNumber: string): string {
  const bankInfo = lookupBank(bank);
  if (!bankInfo) {
    return 'Bank not found';
  }

  return [
    `Bank: ${bankInfo.name}`,
    `Account Number: ${accountNumber}`,
    `Bank Code: ${bankInfo.code}`,
    `NIBSS Code: ${bankInfo.nibssCode}`,
  ].join('\n');
}

export function isPaymentExpired(reference: string): boolean {
  const link = paymentLinks.get(reference);
  if (!link) return true;
  return new Date(link.expiresAt) < new Date();
}

export function cancelPaymentLink(reference: string): boolean {
  const link = paymentLinks.get(reference);
  if (!link) return false;

  link.status = 'expired';
  paymentLinks.set(reference, link);

  const status = paymentStatuses.get(reference);
  if (status) {
    status.status = 'expired';
    status.message = 'Payment cancelled by merchant';
    paymentStatuses.set(reference, status);
  }

  return true;
}
