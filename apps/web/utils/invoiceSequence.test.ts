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

    it('resets sequence to 1 when simulating an older cached month using vi.setSystemTime', () => {
      let storage: string | null = null;
      vi.mocked(localStorage.getItem).mockImplementation(() => storage);
      vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
        storage = value;
      });

      // Advance to December 2023 and generate
      vi.setSystemTime(new Date('2023-12-15T12:00:00Z'));
      const invoiceDec = generateSequentialInvoiceNumber();
      expect(invoiceDec).toBe('INV-2023-12-0001');

      const invoiceDec2 = generateSequentialInvoiceNumber();
      expect(invoiceDec2).toBe('INV-2023-12-0002');

      // Advance to January 2024 and generate
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
      const invoiceJan = generateSequentialInvoiceNumber();

      // Sequence must reset to 1
      expect(invoiceJan).toBe('INV-2024-01-0001');
      expect(storage).toBe(JSON.stringify({ month: '2024-01', sequence: 1 }));
    });

    it('resets sequence to 1 when crossing over to a new month during runtime', () => {
      // Setup initial state using memory-backed mock for localStorage
      let storage: string | null = null;
      vi.mocked(localStorage.getItem).mockImplementation(() => storage);
      vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
        storage = value;
      });

      // 1. Generate an invoice in the current month (May)
      const invoice1 = generateSequentialInvoiceNumber();
      expect(invoice1).toBe('INV-2024-05-0001');

      const invoice2 = generateSequentialInvoiceNumber();
      expect(invoice2).toBe('INV-2024-05-0002');

      // 2. Advance time to next month (June)
      vi.setSystemTime(new Date('2024-06-01T00:00:00Z'));

      // 3. Generate a new invoice, it should reset to 1
      const invoice3 = generateSequentialInvoiceNumber();
      expect(invoice3).toBe('INV-2024-06-0001');

      const invoice4 = generateSequentialInvoiceNumber();
      expect(invoice4).toBe('INV-2024-06-0002');
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
