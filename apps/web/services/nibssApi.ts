import { getErrorMessage } from '../utils/error';
/**
 * NIBSS Payment API Client
 */

import { apiRequest } from './apiConfig';
import { trackEvent } from '../utils/analytics';

export interface PaymentRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  description: string;
  invoiceId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  status?: string;
  message?: string;
}

export interface Bank {
  code: string;
  name: string;
  slug: string;
}

export interface AccountName {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

const NIGERIAN_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank', slug: 'access' },
  { code: '063', name: 'Diamond Bank', slug: 'diamond' },
  { code: '050', name: 'Ecobank', slug: 'ecobank' },
  { code: '070', name: 'Fidelity Bank', slug: 'fidelity' },
  { code: '011', name: 'First Bank', slug: 'firstbank' },
  { code: '214', name: 'FCMB', slug: 'fcmb' },
  { code: '058', name: 'GTBank', slug: 'gtbank' },
  { code: '082', name: 'Heritage Bank', slug: 'heritage' },
  { code: '090', name: 'Keystone Bank', slug: 'keystone' },
  { code: '076', name: 'Polaris Bank', slug: 'polaris' },
  { code: '039', name: 'Stanbic IBTC', slug: 'stanbic' },
  { code: '032', name: 'Sterling Bank', slug: 'sterling' },
  { code: '033', name: 'UBA', slug: 'uba' },
  { code: '035', name: 'Wema Bank', slug: 'wema' },
  { code: '057', name: 'Zenith Bank', slug: 'zenith' },
];

export async function initiatePayment(payment: PaymentRequest): Promise<PaymentResult> {
  try {
    const result = await apiRequest<PaymentRequest, any>('/v1/payment/initiate', 'POST', payment);
    return {
      success: true,
      transactionId: result.transaction_id,
      paymentUrl: result.payment_url,
      status: 'pending',
    };
  } catch (error) {
    console.error('Payment initiation failed', {
      event: 'payment.initiation.failed',
      invoiceId: payment.invoiceId,
      bankCode: payment.bankCode,
      error: getErrorMessage(error)
    });
    try {
      trackEvent('payment_initiation_failed', {
        invoice_id: payment.invoiceId,
        bank_code: payment.bankCode,
        error: getErrorMessage(error)
      });
    } catch {}
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

export async function checkPaymentStatus(transactionId: string): Promise<any> {
  try {
    return await apiRequest(`/v1/payment/status/${transactionId}`);
  } catch (error) {
    console.error('Payment status check failed', {
      event: 'payment.status.check.failed',
      transactionId,
      error: getErrorMessage(error)
    });
    try {
      trackEvent('payment_status_check_failed', {
        transaction_id: transactionId,
        error: getErrorMessage(error)
      });
    } catch {}
    return { status: 'unknown', message: 'Status check failed' };
  }
}

export async function verifyBank(bankCode: string): Promise<boolean> {
  try {
    const result = await apiRequest<undefined, any>(`/v1/bank/verify/${bankCode}`);
    return result.valid || false;
  } catch (error) {
    return false;
  }
}

export async function getAccountName(accountNumber: string, bankCode: string): Promise<AccountName | null> {
  try {
    const result = await apiRequest<{ account_number: string, bank_code: string }, any>('/v1/account/name', 'POST', {
      account_number: accountNumber,
      bank_code: bankCode,
    });
    return {
      accountNumber,
      accountName: result.account_name,
      bankCode,
      bankName: result.bank_name,
    };
  } catch (error) {
    console.error('Account name lookup failed:', error);
    return null;
  }
}

export function getBanks(): Bank[] {
  return NIGERIAN_BANKS;
}

export function getBankByCode(code: string): Bank | undefined {
  return NIGERIAN_BANKS.find(b => b.code === code);
}

export function generatePaymentLink(amount: number, bankCode: string, accountNumber: string): string {
  const bank = getBankByCode(bankCode);
  if (!bank) return '';
  
  return `https://pay.nibss.ng/pay/${bank.slug}?account=${accountNumber}&amount=${amount}`;
}

export function generateBankTransferDetails(
  bankCode: string,
  accountNumber: string,
  amount: number,
  description: string
): string {
  const bank = getBankByCode(bankCode);
  const bankName = bank?.name || 'Unknown Bank';
  
  return `
Bank Transfer Details:
---------------------
Bank: ${bankName}
Account Number: ${accountNumber}
Account Name: [Business Name]
Amount: ₦${amount.toLocaleString()}
Description: ${description}
Date: ${new Date().toLocaleDateString('en-NG')}
---------------------
Please use your invoice number as reference.
  `.trim();
}

