/**
 * React Hook for NRS API
 */

import { useState, useCallback } from 'react';
import { validateTIN, submitInvoice, generateQRCode, checkInvoiceStatus } from '../services/nrsApi';

export function useNrsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTin = useCallback(async (tin: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateTIN(tin);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitInvoiceToNrs = useCallback(async (invoice: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await submitInvoice(invoice);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getQrCode = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateQRCode(invoiceId);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (nrsInvoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkInvoiceStatus(nrsInvoiceId);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    validateTin,
    submitInvoice: submitInvoiceToNrs,
    getQrCode,
    checkStatus,
    loading,
    error,
    clearError,
  };
}
