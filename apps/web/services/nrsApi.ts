/**
 * NRS API Client
 */

import { apiRequest, getApiConfig } from './apiConfig';

export interface TINValidationResult {
  valid: boolean;
  tin: string;
  businessName?: string;
  status?: string;
  message?: string;
}

export interface InvoiceSubmission {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  businessTIN: string;
  clientTIN?: string;
  lineItems: any[];
  subtotal: number;
  vat: number;
  total: number;
}

export interface InvoiceSubmissionResult {
  success: boolean;
  nrsInvoiceId?: string;
  status?: string;
  message?: string;
}

export interface QRCodeResult {
  qrCodeUrl: string;
  verificationUrl: string;
  invoiceId: string;
}

export async function validateTIN(tin: string): Promise<TINValidationResult> {
  try {
    const result = await apiRequest<{ tin: string }, any>('/v1/tin/validate', 'POST', { tin });
    return {
      valid: result.valid || false,
      tin,
      businessName: result.business_name,
      status: result.status,
      message: result.message,
    };
  } catch (error) {
    console.error('TIN validation failed:', error);
    return {
      valid: false,
      tin,
      message: 'Validation failed. Please try again.',
    };
  }
}

export async function submitInvoice(invoice: InvoiceSubmission): Promise<InvoiceSubmissionResult> {
  try {
    const result = await apiRequest<InvoiceSubmission, any>('/v1/e-invoice/submit', 'POST', invoice);
    return {
      success: true,
      nrsInvoiceId: result.invoice_id,
      status: result.status,
      message: result.message,
    };
  } catch (error) {
    console.error('Invoice submission failed:', error);
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

export async function checkInvoiceStatus(nrsInvoiceId: string): Promise<any> {
  try {
    return await apiRequest(`/v1/e-invoice/status/${nrsInvoiceId}`);
  } catch (error) {
    console.error('Status check failed:', error);
    return { status: 'unknown', message: 'Status check failed' };
  }
}

export async function generateQRCode(invoiceId: string): Promise<QRCodeResult> {
  try {
    const result = await apiRequest<{ invoice_id: string }, any>('/v1/qr/generate', 'POST', { invoice_id: invoiceId });
    return {
      qrCodeUrl: result.qr_code_url,
      verificationUrl: result.verification_url,
      invoiceId,
    };
  } catch (error) {
    console.error('QR generation failed:', error);
    return {
      qrCodeUrl: '',
      verificationUrl: '',
      invoiceId,
    };
  }
}

export async function reportVAT(data: {
  period: string;
  totalSales: number;
  totalVAT: number;
  tin: string;
}): Promise<any> {
  try {
    return await apiRequest('/v1/vat/report', 'POST', data);
  } catch (error) {
    console.error('VAT report failed:', error);
    throw error;
  }
}

export async function reportWHT(data: {
  period: string;
  totalWHT: number;
  tin: string;
}): Promise<any> {
  try {
    return await apiRequest('/v1/wht/report', 'POST', data);
  } catch (error) {
    console.error('WHT report failed:', error);
    throw error;
  }
}
