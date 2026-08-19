import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
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

  describe('history and stats', () => {
    let mockGetItem: any;
    let mockSetItem: any;

    beforeAll(() => {
      mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
    });

    beforeEach(() => {
      mockGetItem.mockClear();
      mockSetItem.mockClear();
    });

    afterAll(() => {
      mockGetItem.mockRestore();
      mockSetItem.mockRestore();
    });

    it('returns an empty array when history is not found in localStorage', async () => {
      mockGetItem.mockReturnValue(null);
      const { getComplianceHistory } = await import('./complianceTracker');
      const history = getComplianceHistory('INV-999');
      expect(history).toEqual([]);
      expect(mockGetItem).toHaveBeenCalledWith('compliance_history_INV-999');
    });

    it('returns parsed history array when history exists in localStorage', async () => {
      const storedData = [{ invoiceId: 'INV-999', score: 100, checkedAt: '2023-10-10T10:00:00.000Z', issueCount: 0 }];
      mockGetItem.mockReturnValue(JSON.stringify(storedData));
      const { getComplianceHistory } = await import('./complianceTracker');
      const history = getComplianceHistory('INV-999');
      expect(history).toEqual(storedData);
    });

    it('returns an empty array when history in localStorage is invalid JSON', async () => {
      mockGetItem.mockReturnValue('invalid-json');
      const { getComplianceHistory } = await import('./complianceTracker');
      const history = getComplianceHistory('INV-999');
      expect(history).toEqual([]);
    });

    it('saves compliance check result to localStorage when called', async () => {
      mockGetItem.mockReturnValue(null);
      const { saveComplianceCheck } = await import('./complianceTracker');
      saveComplianceCheck({
        invoiceId: 'INV-999',
        score: 90,
        issues: [{ id: '1' } as any],
        checkedAt: '2023-10-10T10:00:00.000Z',
        categoryScores: {} as any,
        totalChecks: 10,
        passedChecks: 9
      });
      expect(mockSetItem).toHaveBeenCalledWith(
        'compliance_history_INV-999',
        JSON.stringify([{ invoiceId: 'INV-999', score: 90, checkedAt: '2023-10-10T10:00:00.000Z', issueCount: 1 }])
      );
    });

    it('caps compliance history at 50 entries when saving a new check', async () => {
      const oldHistory = Array.from({ length: 50 }).map((_, i) => ({
        invoiceId: 'INV-999', score: 100, checkedAt: `2023-10-01T10:00:${i.toString().padStart(2, '0')}.000Z`, issueCount: 0
      }));
      mockGetItem.mockReturnValue(JSON.stringify(oldHistory));
      const { saveComplianceCheck } = await import('./complianceTracker');

      saveComplianceCheck({
        invoiceId: 'INV-999',
        score: 80,
        issues: [{ id: '1' } as any, { id: '2' } as any],
        checkedAt: '2023-10-10T10:00:00.000Z',
        categoryScores: {} as any,
        totalChecks: 10,
        passedChecks: 8
      });

      expect(mockSetItem).toHaveBeenCalled();
      const savedCallArgs = mockSetItem.mock.calls[0];
      expect(savedCallArgs[0]).toBe('compliance_history_INV-999');
      const parsedSaved = JSON.parse(savedCallArgs[1]);

      expect(parsedSaved.length).toBe(50);
      expect(parsedSaved[49].score).toBe(80);
      expect(parsedSaved[49].issueCount).toBe(2);
      expect(parsedSaved[0].checkedAt).toBe('2023-10-01T10:00:01.000Z'); // The oldest one (00) was removed
    });

    it('calculates correct stats when given an empty results array', async () => {
      const { calculateStatsFromResults } = await import('./complianceTracker');
      const stats = calculateStatsFromResults([]);
      expect(stats.averageScore).toBe(0);
      expect(stats.totalIssues).toBe(0);
      expect(stats.compliantCount).toBe(0);
      expect(stats.nonCompliantCount).toBe(0);
    });

    it('calculates correct stats when given multiple compliance results', async () => {
      const { calculateStatsFromResults } = await import('./complianceTracker');
      const results = [
        { invoiceId: '1', score: 100, issues: [], checkedAt: '', categoryScores: {} as any, totalChecks: 10, passedChecks: 10 },
        { invoiceId: '2', score: 50, issues: [{ id: '1' } as any], checkedAt: '', categoryScores: {} as any, totalChecks: 10, passedChecks: 5 },
        { invoiceId: '3', score: 100, issues: [], checkedAt: '', categoryScores: {} as any, totalChecks: 10, passedChecks: 10 },
      ];

      const stats = calculateStatsFromResults(results);

      expect(stats.averageScore).toBe(83); // (100+50+100) / 3 = 250 / 3 = 83.33 -> 83
      expect(stats.totalIssues).toBe(1);
      expect(stats.compliantCount).toBe(2);
      expect(stats.nonCompliantCount).toBe(1);
    });

    it('exports compliance report as CSV string when given invoices', async () => {
      const { exportComplianceReport } = await import('./complianceTracker');
      const report = exportComplianceReport([validInvoice]);
      expect(report).toContain('Invoice Compliance Report');
      expect(report).toContain('Total Invoices: 1');
      expect(report).toContain('Average Score: 100%');
      expect(report).toContain('Compliant: 1');
      expect(report).toContain('Non-Compliant: 0');
      expect(report).toContain('INV-001,100%,0');
    });

    it('exports compliance report as JSON string when given invoices', async () => {
      const { exportComplianceReportJSON } = await import('./complianceTracker');
      const jsonReport = exportComplianceReportJSON([validInvoice]);
      const parsed = JSON.parse(jsonReport);

      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed.summary.averageScore).toBe(100);
      expect(parsed.summary.compliantCount).toBe(1);
      expect(parsed.invoices).toHaveLength(1);
      expect(parsed.invoices[0].invoiceNumber).toBe('INV-001');
      expect(parsed.invoices[0].score).toBe(100);
    });
  });
});


