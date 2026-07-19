import { describe, it, expect } from 'vitest';
import {
  exportBatch,
  registerBatchExportStrategy,
  BatchExportStrategy,
  exportToJSON,
  exportToXML,
  exportToCSV,
  getExportMetadata
} from './structuredExport';
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

  describe('getExportMetadata', () => {
    it('returns the correct metadata structure for an invoice', () => {
      const metadata = getExportMetadata(mockInvoice);
      expect(metadata.format).toBe('NRS');
      expect(metadata.invoiceNumber).toBe('INV-123');
      expect(metadata.status).toBe('draft');
      expect(metadata.totalAmount).toBe(1000);
      expect(metadata.currency).toBe('NGN');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.exportDate).toBeDefined();
    });
  });

  describe('exportToJSON', () => {
    it('creates a valid JSON matching the NRS payload structure', () => {
      const result = exportToJSON(mockInvoice);
      const parsed = JSON.parse(result);

      expect(parsed.invoiceNumber).toBe('INV-123');
      expect(parsed.issuer.name).toBe('Issuer Name');
      expect(parsed.recipient.name).toBe('Recipient Name');
      expect(parsed.lineItems).toHaveLength(1);
      expect(parsed.lineItems[0].description).toBe('Line Item 1');
      expect(parsed.summary.subtotal).toBe(1000);
      expect(parsed.summary.total).toBe(1075); // 1000 + 7.5% tax
    });
  });

  describe('exportToXML', () => {
    it('outputs valid XML tags with correct data', () => {
      const result = exportToXML(mockInvoice);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<NRSInvoice>');
      expect(result).toContain('<InvoiceNumber>INV-123</InvoiceNumber>');
      expect(result).toContain('<Name>Issuer Name</Name>');
      expect(result).toContain('<Description>Line Item 1</Description>');
      expect(result).toContain('<Total>1075</Total>');
      expect(result).toContain('</NRSInvoice>');
    });

    it('escapes XML entities correctly', () => {
      const xmlInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Tom & Jerry <Corp>',
        },
        lineItems: [
          {
            id: '1',
            description: 'Item with "quotes" & \'apostrophes\'',
            quantity: 1,
            price: 100
          }
        ]
      } as unknown as Invoice;

      const result = exportToXML(xmlInvoice);

      expect(result).toContain('<Name>Tom &amp; Jerry &lt;Corp&gt;</Name>');
      expect(result).toContain('<Description>Item with &quot;quotes&quot; &amp; &apos;apostrophes&apos;</Description>');
    });
  });

  describe('exportToCSV', () => {
    it('outputs the correct headers and data', () => {
      const result = exportToCSV(mockInvoice);
      const lines = result.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('InvoiceNumber,IssueDate,DueDate,Status');
      expect(lines[1]).toContain('INV-123');
      expect(lines[1]).toContain('Issuer Name');
      expect(lines[1]).toContain('Line Item 1|1|1000|Standard|PCS|1000');
    });

    it('escapes commas, double-quotes and newlines correctly', () => {
      const csvInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Acme, Inc.',
        },
        lineItems: [
          {
            id: '1',
            description: 'Line 1\nLine 2',
            quantity: 1,
            price: 100
          },
          {
            id: '2',
            description: 'Item "Special"',
            quantity: 1,
            price: 200
          }
        ]
      } as unknown as Invoice;

      const result = exportToCSV(csvInvoice);
      const lines = result.split('\n');
      const dataRow = lines.slice(1).join('\n');

      expect(dataRow).toContain('"Acme, Inc."');
      // The implementation builds the lineItems payload string by escaping each element separately
      // and joining with '|', then joining rows with ';'.
      // So the expected format is: "Line 1\nLine 2"|1|100|Standard|PCS|100;"Item ""Special"""|1|200|Standard|PCS|200
      expect(dataRow).toContain('"Line 1\nLine 2"|1|100|Standard|PCS|100;"Item ""Special"""|1|200|Standard|PCS|200');
    });
  });

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
