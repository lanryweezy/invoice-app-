import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nibssApi from './nibssApi';

describe('nibssApi', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ transaction_id: '123', payment_url: 'url', valid: true, account_name: 'Test', bank_name: 'Bank', status: 'ok' })
    } as any);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('tests NIBSS API client functions', async () => {
    const pay = await nibssApi.initiatePayment({ amount: 100, bankCode: '044', accountNumber: '123', accountName: 'T', description: 'D', invoiceId: 'I' });
    expect(pay.success).toBe(true);
    expect(await nibssApi.checkPaymentStatus('123')).toEqual({ transaction_id: '123', payment_url: 'url', valid: true, account_name: 'Test', bank_name: 'Bank', status: 'ok' });
    expect(await nibssApi.verifyBank('044')).toBe(true);
    expect(await nibssApi.getAccountName('123', '044')).toMatchObject({ accountName: 'Test', bankName: 'Bank' });
    expect(nibssApi.getBanks().length).toBeGreaterThan(0);
    expect(nibssApi.getBankByCode('044')?.slug).toBe('access');
    expect(nibssApi.generatePaymentLink(100, '044', '123')).toContain('amount=100');
    expect(nibssApi.generateBankTransferDetails('044', '123', 100, 'D')).toContain('Access Bank');
  });
});
