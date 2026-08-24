import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRev360 } from './useRev360';
import { rev360Api } from '../services/rev360Api';

vi.mock('../services/rev360Api', () => ({
  rev360Api: {
    authenticate: vi.fn(),
    registerInvoice: vi.fn(),
    fileVATReturn: vi.fn(),
    generateWHTCertificate: vi.fn(),
    checkCompliance: vi.fn(),
  }
}));

describe('useRev360', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles Error instances by extracting their message during authenticate', async () => {
    vi.mocked(rev360Api.authenticate).mockRejectedValueOnce(new Error('AuthError'));
    const { result } = renderHook(() => useRev360());

    await act(async () => {
      await result.current.authenticate({ clientId: 'a', clientSecret: 'b', tin: 'c' });
    });

    expect(result.current.error).toBe('AuthError');
  });

  it('handles Error instances by extracting their message during registerInvoice', async () => {
    vi.mocked(rev360Api.registerInvoice).mockRejectedValueOnce(new Error('RegisterError'));
    const { result } = renderHook(() => useRev360());

    await act(async () => {
      await result.current.registerInvoice({});
    });

    expect(result.current.error).toBe('RegisterError');
  });

  it('handles Error instances by extracting their message during fileVatReturn', async () => {
    vi.mocked(rev360Api.fileVATReturn).mockRejectedValueOnce(new Error('VatError'));
    const { result } = renderHook(() => useRev360());

    await act(async () => {
      await result.current.fileVatReturn({});
    });

    expect(result.current.error).toBe('VatError');
  });

  it('handles Error instances by extracting their message during generateWhtCert', async () => {
    vi.mocked(rev360Api.generateWHTCertificate).mockRejectedValueOnce(new Error('WhtError'));
    const { result } = renderHook(() => useRev360());

    await act(async () => {
      await result.current.generateWhtCert({});
    });

    expect(result.current.error).toBe('WhtError');
  });

  it('handles Error instances by extracting their message during checkCompliance', async () => {
    vi.mocked(rev360Api.checkCompliance).mockRejectedValueOnce(new Error('ComplianceError'));
    const { result } = renderHook(() => useRev360());

    await act(async () => {
      await result.current.checkCompliance('123');
    });

    expect(result.current.error).toBe('ComplianceError');
  });
});