/**
 * React Hook for NIBSS Payment API
 */

import { getErrorMessage } from '../utils/error';
import { useState, useCallback } from 'react';
import { initiatePayment, checkPaymentStatus, verifyBank, getAccountName } from '../services/nibssApi';
import { getErrorMessage } from '../utils/error';

export function useNibss() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePaymentHook = useCallback(async (payment: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    description: string;
    invoiceId: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await initiatePayment(payment);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkPaymentStatus(transactionId);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyBankHook = useCallback(async (bankCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyBank(bankCode);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountNameHook = useCallback(async (accountNumber: string, bankCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAccountName(accountNumber, bankCode);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    initiatePayment: initiatePaymentHook,
    checkStatus,
    verifyBank: verifyBankHook,
    getAccountName: getAccountNameHook,
    loading,
    error,
    clearError,
  };
}
