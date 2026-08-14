/**
 * NRS API Client
 */

import { apiRequest, getApiConfig } from './apiConfig';
import { trackEvent } from '../utils/analytics';

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
    const maskedTin = tin ? `***${tin.slice(-4)}` : 'unknown';
    console.error('TIN validation failed:', {
      event: 'nrs.tin.validation.failed',
      tin: maskedTin,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_tin_validation_failed', { tin: maskedTin, error: getErrorMessage(error) }); } catch {}
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
    console.error('Invoice submission failed:', {
      event: 'nrs.invoice.submission.failed',
      invoiceNumber: invoice.invoiceNumber,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_invoice_submission_failed', { invoice_number: invoice.invoiceNumber, error: getErrorMessage(error) }); } catch {}
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
    console.error('Status check failed:', {
      event: 'nrs.status.check.failed',
      nrsInvoiceId,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_status_check_failed', { nrs_invoice_id: nrsInvoiceId, error: getErrorMessage(error) }); } catch {}
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
    console.error('QR generation failed:', {
      event: 'nrs.qr.generation.failed',
      invoiceId,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_qr_generation_failed', { invoice_id: invoiceId, error: getErrorMessage(error) }); } catch {}
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
    console.error('VAT report failed:', {
      event: 'nrs.vat.report.failed',
      period: data.period,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_vat_report_failed', { period: data.period, error: getErrorMessage(error) }); } catch {}
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
    console.error('WHT report failed:', {
      event: 'nrs.wht.report.failed',
      period: data.period,
      error: getErrorMessage(error)
    });
    try { trackEvent('nrs_wht_report_failed', { period: data.period, error: getErrorMessage(error) }); } catch {}
    throw error;
  }
}
