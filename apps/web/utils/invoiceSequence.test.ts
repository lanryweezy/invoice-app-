import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSequentialInvoiceNumber, getInvoiceSequencePreview } from './invoiceSequence';

describe('invoiceSequence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('generateSequentialInvoiceNumber', () => {
    it('generates the first sequence when no storage exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const invoiceNumber = generateSequentialInvoiceNumber();

      expect(invoiceNumber).toBe('INV-2024-05-0001');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'invoiceapp_invoice_sequence',
        JSON.stringify({ month: '2024-05', sequence: 1 })
      );
    });

    it('generates the next sequence when storage exists for the same month', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({ month: '2024-05', sequence: 5 })
      );

      const invoiceNumber = generateSequentialInvoiceNumber('CUST');

      expect(invoiceNumber).toBe('CUST-2024-05-0006');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'invoiceapp_invoice_sequence',
        JSON.stringify({ month: '2024-05', sequence: 6 })
      );
    });

    it('resets sequence to 1 when a new month begins', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({ month: '2024-04', sequence: 10 })
      );

      const invoiceNumber = generateSequentialInvoiceNumber();

      expect(invoiceNumber).toBe('INV-2024-05-0001');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'invoiceapp_invoice_sequence',
        JSON.stringify({ month: '2024-05', sequence: 1 })
      );
    });

    it('handles localStorage errors gracefully and starts at 1', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('Access denied'); });

      const invoiceNumber = generateSequentialInvoiceNumber();

      expect(invoiceNumber).toBe('INV-2024-05-0001');
    });

    it('handles invalid JSON in localStorage gracefully and starts at 1', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{ invalid json }');

      const invoiceNumber = generateSequentialInvoiceNumber();

      expect(invoiceNumber).toBe('INV-2024-05-0001');
    });
  });

  describe('getInvoiceSequencePreview', () => {
    it('returns the preview for the first sequence when no storage exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const preview = getInvoiceSequencePreview();

      expect(preview).toBe('INV-2024-05-0001');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns the preview for the next sequence when storage exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({ month: '2024-05', sequence: 8 })
      );

      const preview = getInvoiceSequencePreview();

      expect(preview).toBe('INV-2024-05-0009');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns the preview for sequence 1 when a new month begins', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({ month: '2024-04', sequence: 8 })
      );

      const preview = getInvoiceSequencePreview();

      expect(preview).toBe('INV-2024-05-0001');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
