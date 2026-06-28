/**
 * React Hook for Rev360 Portal
 */

import { useState, useCallback } from 'react';
import { rev360Api } from '../services/rev360Api';

export function useRev360() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const authenticate = useCallback(async (credentials: { clientId: string; clientSecret: string; tin: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rev360Api.authenticate(credentials);
      if (result.success) {
        setAuthenticated(true);
      } else {
        setError(result.message || 'Authentication failed');
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const registerInvoice = useCallback(async (invoice: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rev360Api.registerInvoice(invoice);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fileVatReturn = useCallback(async (vatReturn: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rev360Api.fileVATReturn(vatReturn);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateWhtCert = useCallback(async (invoice: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rev360Api.generateWHTCertificate(invoice);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCompliance = useCallback(async (tin: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rev360Api.checkCompliance(tin);
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
    authenticate,
    registerInvoice,
    fileVatReturn,
    generateWhtCert,
    checkCompliance,
    authenticated,
    loading,
    error,
    clearError,
  };
}
