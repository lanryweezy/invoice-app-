import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  checkCompliance,
  getComplianceScore,
  getComplianceIssues,
  ComplianceIssue,
  suggestFixes
} from './complianceTracker';
import type { Invoice } from '../types';

describe('complianceTracker', () => {
  beforeAll(() => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => arr.fill(0),
      randomUUID: () => '1234-5678'
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-10T10:00:00.000Z'));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const createValidInvoice = (): Invoice => ({
    user: {
      name: 'Supplier Corp',
      email: 'supplier@example.com',
      address: '123 Supplier St',
      tin: '1234567890',
      cacNumber: 'RC123456',
      bankName: 'Test Bank',
      accountNumber: '0000000000'
    },
    client: {
      name: 'Client LLC',
      email: 'client@example.com',
      address: '456 Client Rd',
      tin: '0987654321',
      cacNumber: 'RC654321',
    },
    invoiceNumber: 'INV-1001',
    issueDate: '2023-10-10',
    dueDate: '2023-10-20',
    currency: 'NGN',
    lineItems: [
      {
        id: '1',
        description: 'Consulting Services',
        quantity: 1,
        price: 10000,
        taxCategory: 'Standard',
      }
    ],
    taxRate: 7.5,
    tax: 750,
    whtRate: 5,
    whtAmount: 500,
    subtotal: 10000,
    total: 10250,
    notes: '',
    terms: '',
    discountRate: 0,
    discountType: 'percentage',
    shippingAmount: 0,
    status: 'Draft'
  });

  it('returns a perfect score (100) for a fully compliant invoice', () => {
    const invoice = createValidInvoice();
    const result = checkCompliance(invoice);

    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
    expect(result.passedChecks).toBe(result.totalChecks);
    expect(result.categoryScores['TIN']).toBe(100);
  });

  it('identifies missing supplier TIN and invalid TIN format', () => {
    const invoice = createValidInvoice();
    delete invoice.user.tin;

    let result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'TIN',
        field: 'supplier.tin',
        severity: 'error',
        message: 'Supplier TIN is missing'
      })
    );

    invoice.user.tin = '123'; // Invalid format (needs 10-14 digits)
    result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'TIN',
        field: 'supplier.tin',
        severity: 'error',
        message: 'Supplier TIN format is invalid (must be 10-14 digits)'
      })
    );
  });

  it('identifies missing customer TIN', () => {
    const invoice = createValidInvoice();
    delete invoice.client.tin;

    const result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'TIN',
        field: 'customer.tin',
        severity: 'error',
        message: 'Customer TIN is missing'
      })
    );
  });

  it('identifies VAT issues: missing rate, incorrect rate, and missing amount for standard items', () => {
    const invoice = createValidInvoice();

    // Incorrect rate
    invoice.taxRate = 5;
    let result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'VAT',
        field: 'taxRate',
        message: 'VAT rate is 5% instead of standard 7.5%'
      })
    );

    // Missing rate
    // @ts-ignore
    invoice.taxRate = undefined;
    result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'VAT',
        field: 'taxRate',
        message: 'VAT rate not set'
      })
    );

    // Missing tax amount but has standard items
    invoice.taxRate = 7.5;
    invoice.tax = 0;
    result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'VAT',
        field: 'tax',
        message: 'VAT amount is zero but invoice has standard-rated items'
      })
    );
  });

  it('identifies line item issues: no items, missing descriptions, invalid price/qty', () => {
    const invoice = createValidInvoice();

    // No line items
    invoice.lineItems = [];
    let result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'LineItems',
        field: 'lineItems',
        message: 'Invoice has no line items'
      })
    );

    // Missing descriptions, invalid qty and price
    invoice.lineItems = [
      {
        id: '1',
        description: '',
        quantity: 0,
        price: 0,
      }
    ];
    result = checkCompliance(invoice);

    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'LineItems', field: 'lineItems.description' })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'LineItems', field: 'lineItems.quantity' })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'LineItems', field: 'lineItems.price' })
    );
  });

  it('identifies zero or negative total', () => {
    const invoice = createValidInvoice();
    invoice.total = 0;

    const result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'Totals',
        field: 'total',
        message: 'Invoice total is zero or negative'
      })
    );
  });

  it('identifies missing or invalid dates', () => {
    const invoice = createValidInvoice();
    // @ts-ignore
    delete invoice.issueDate;
    // @ts-ignore
    delete invoice.dueDate;

    let result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'Dates', field: 'issueDate' })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'Dates', field: 'dueDate' })
    );

    invoice.issueDate = '2023-10-20';
    invoice.dueDate = '2023-10-10'; // due before issue
    result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'Dates', field: 'dueDate', severity: 'warning' })
    );
  });

  it('identifies missing basic invoice info', () => {
    const invoice = createValidInvoice();
    // @ts-ignore
    delete invoice.invoiceNumber;
    invoice.client.name = '';
    // @ts-ignore
    delete invoice.currency;

    const result = checkCompliance(invoice);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'General', field: 'invoiceNumber' })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'General', field: 'client.name' })
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'General', field: 'currency' })
    );
  });

  describe('helper functions', () => {
    it('getComplianceScore returns only the score', () => {
      const invoice = createValidInvoice();
      expect(getComplianceScore(invoice)).toBe(100);

      delete invoice.user.tin;
      expect(getComplianceScore(invoice)).toBeLessThan(100);
    });

    it('getComplianceIssues returns only the array of issues', () => {
      const invoice = createValidInvoice();
      expect(getComplianceIssues(invoice)).toHaveLength(0);

      delete invoice.user.tin;
      const issues = getComplianceIssues(invoice);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('TIN');
    });
  });
  const validInvoice: Invoice = {
    invoiceNumber: 'INV-001',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    currency: 'NGN',
    total: 161250,
    status: 'Draft',
    taxRate: 7.5,
    tax: 11250,
    whtRate: 5,
    whtAmount: 7500, // Added WHT amount to fix the last issue
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      tin: '1234567890',
      bankName: 'GTB',
      accountNumber: '1234567890',
      cacNumber: 'RC123456',
    },
    client: {
      name: 'Acme Corp',
      email: 'billing@acme.com',
      address: '456 Market St',
      tin: '0987654321',
      cacNumber: 'RC654321',
    },
    lineItems: [
      { id: '1', description: 'Service', quantity: 1, price: 150000 },
    ],
    notes: '',
    terms: '',
    discountRate: 0,
    discountType: 'percentage',
    shippingAmount: 0,
  };

  describe('checkCompliance', () => {
    it('returns a 100% score for a fully compliant invoice', () => {
      const result = checkCompliance(validInvoice);
      expect(result.issues).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('identifies missing user TIN', () => {
      const invalidInvoice = { ...validInvoice, user: { ...validInvoice.user, tin: '' } };
      const result = checkCompliance(invalidInvoice);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(i => i.field === 'supplier.tin')).toBe(true);
    });
  });

  describe('suggestFixes', () => {
    it('includes default suggestions and strategy suggestions for TIN', () => {
      const issue: ComplianceIssue = {
        id: '123',
        category: 'TIN',
        field: 'customer.tin',
        severity: 'error',
        message: 'Missing TIN',
        suggestion: 'Request customer TIN',
        autoFixable: false,
        fixed: false,
      };
      const suggestions = suggestFixes(issue);
      expect(suggestions).toContain('Request customer TIN');
      expect(suggestions).toContain('TIN can be verified on FIRS portal: https://taxpromax.firs.gov.ng');
      expect(suggestions).toContain('Request customer TIN before issuing invoice');
    });
  });
});
