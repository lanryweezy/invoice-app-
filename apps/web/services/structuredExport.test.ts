import { describe, it, expect } from 'vitest';
import { exportBatch, registerBatchExportStrategy, BatchExportStrategy } from './structuredExport';
import type { Invoice } from '../types';

describe('structuredExport', () => {
  const mockInvoice = {
    id: '1',
    invoiceNumber: 'INV-123',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    status: 'draft',
    currency: 'NGN',
    total: 1000,
    taxRate: 7.5,
    discountRate: 0,
    shippingAmount: 0,
    whtRate: 0,
    user: {
      name: 'Issuer Name',
      address: 'Issuer Address',
      email: 'issuer@example.com'
    },
    client: {
      name: 'Recipient Name',
      address: 'Recipient Address',
      email: 'recipient@example.com'
    },
    lineItems: [
      {
        id: '1',
        description: 'Line Item 1',
        quantity: 1,
        price: 1000
      }
    ]
  } as unknown as Invoice;

  it('exports batch as JSON using built-in strategy', async () => {
    const result = await exportBatch([mockInvoice], 'json');
    expect(result).toContain('INV-123');
    expect(result).toContain('Issuer Name');
  });

  it('exports batch as CSV using built-in strategy', async () => {
    const result = await exportBatch([mockInvoice], 'csv');
    expect(result).toContain('InvoiceNumber,IssueDate,DueDate');
    expect(result).toContain('INV-123');
  });

  it('allows registering and using a custom export strategy', async () => {
    const mockStrategy: BatchExportStrategy = {
      format: 'mock-pdf',
      export: (invoices: Invoice[]) => {
        return `MOCK PDF DATA: ${invoices.length} invoices`;
      }
    };

    registerBatchExportStrategy(mockStrategy);

    const result = await exportBatch([mockInvoice], 'mock-pdf');
    expect(result).toBe('MOCK PDF DATA: 1 invoices');
  });

  it('throws an error for unsupported format', async () => {
    await expect(exportBatch([mockInvoice], 'unknown')).rejects.toThrow('Unsupported export format: unknown');
  });
});
