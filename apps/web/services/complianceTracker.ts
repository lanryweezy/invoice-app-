import type { Invoice } from '../types';

export type ComplianceCategory = 'TIN' | 'CAC' | 'VAT' | 'WHT' | 'LineItems' | 'Totals' | 'Dates' | 'General';

export interface ComplianceIssue {
  id: string;
  category: ComplianceCategory;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  autoFixable: boolean;
  fixed: boolean;
}

export interface ComplianceCheckResult {
  invoiceId: string;
  score: number;
  issues: ComplianceIssue[];
  checkedAt: string;
  categoryScores: Record<ComplianceCategory, number>;
  totalChecks: number;
  passedChecks: number;
}

export interface ComplianceHistoryEntry {
  invoiceId: string;
  score: number;
  checkedAt: string;
  issueCount: number;
}

interface ComplianceCheck {
  category: ComplianceCategory;
  field: string;
  check: (invoice: Invoice) => ComplianceIssue | null;
}

function generateIssueId(): string {
  return `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function isValidTIN(tin: string | undefined): boolean {
  if (!tin) return false;
  return /^\d{10,14}$/.test(tin);
}

function isValidCAC(cac: string | undefined): boolean {
  if (!cac) return false;
  return /^(RC|RC\s*|BN|BN\s*)?\d{6,}$/i.test(cac.replace(/\s/g, ''));
}

const complianceChecks: ComplianceCheck[] = [
  {
    category: 'TIN',
    field: 'user.tin',
    check: (invoice) => {
      if (!invoice.user.tin) {
        return {
          id: generateIssueId(),
          category: 'TIN',
          field: 'supplier.tin',
          severity: 'error',
          message: 'Supplier TIN is missing',
          suggestion: 'Add your 10-14 digit TIN in business settings',
          autoFixable: false,
          fixed: false,
        };
      }
      if (!isValidTIN(invoice.user.tin)) {
        return {
          id: generateIssueId(),
          category: 'TIN',
          field: 'supplier.tin',
          severity: 'error',
          message: 'Supplier TIN format is invalid (must be 10-14 digits)',
          suggestion: 'Verify your TIN with FIRS and update in settings',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'TIN',
    field: 'client.tin',
    check: (invoice) => {
      if (!invoice.client.tin) {
        return {
          id: generateIssueId(),
          category: 'TIN',
          field: 'customer.tin',
          severity: 'error',
          message: 'Customer TIN is missing',
          suggestion: 'Request customer TIN for NRS compliance',
          autoFixable: false,
          fixed: false,
        };
      }
      if (!isValidTIN(invoice.client.tin)) {
        return {
          id: generateIssueId(),
          category: 'TIN',
          field: 'customer.tin',
          severity: 'error',
          message: 'Customer TIN format is invalid',
          suggestion: 'Verify customer TIN and update invoice',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'CAC',
    field: 'user.cacNumber',
    check: (invoice) => {
      if (!invoice.user.cacNumber) {
        return {
          id: generateIssueId(),
          category: 'CAC',
          field: 'supplier.cacNumber',
          severity: 'warning',
          message: 'Supplier CAC number is missing',
          suggestion: 'Add your CAC registration number for enhanced compliance',
          autoFixable: false,
          fixed: false,
        };
      }
      if (!isValidCAC(invoice.user.cacNumber)) {
        return {
          id: generateIssueId(),
          category: 'CAC',
          field: 'supplier.cacNumber',
          severity: 'warning',
          message: 'Supplier CAC number format appears invalid',
          suggestion: 'CAC numbers typically start with RC or BN followed by digits',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'CAC',
    field: 'client.cacNumber',
    check: (invoice) => {
      if (invoice.client.tin && !invoice.client.cacNumber) {
        return {
          id: generateIssueId(),
          category: 'CAC',
          field: 'customer.cacNumber',
          severity: 'info',
          message: 'Customer CAC number not provided',
          suggestion: 'Consider adding CAC number for corporate clients',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'VAT',
    field: 'taxRate',
    check: (invoice) => {
      if (invoice.taxRate === undefined || invoice.taxRate === null) {
        return {
          id: generateIssueId(),
          category: 'VAT',
          field: 'taxRate',
          severity: 'warning',
          message: 'VAT rate not set',
          suggestion: 'Set VAT rate to 7.5% as per Nigerian tax law',
          autoFixable: true,
          fixed: false,
        };
      }
      if (invoice.taxRate !== 7.5) {
        return {
          id: generateIssueId(),
          category: 'VAT',
          field: 'taxRate',
          severity: 'warning',
          message: `VAT rate is ${invoice.taxRate}% instead of standard 7.5%`,
          suggestion: 'Standard VAT rate in Nigeria is 7.5%',
          autoFixable: true,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'VAT',
    field: 'tax',
    check: (invoice) => {
      if (invoice.tax === undefined || invoice.tax === 0) {
        const hasStandardItems = invoice.lineItems.some(
          (item) => (item.taxCategory ?? 'Standard') === 'Standard'
        );
        if (hasStandardItems) {
          return {
            id: generateIssueId(),
            category: 'VAT',
            field: 'tax',
            severity: 'warning',
            message: 'VAT amount is zero but invoice has standard-rated items',
            suggestion: 'Verify VAT calculation for standard-rated items',
            autoFixable: true,
            fixed: false,
          };
        }
      }
      return null;
    },
  },
  {
    category: 'WHT',
    field: 'whtRate',
    check: (invoice) => {
      if (invoice.whtRate === undefined || invoice.whtRate === null) {
        return {
          id: generateIssueId(),
          category: 'WHT',
          field: 'whtRate',
          severity: 'info',
          message: 'Withholding tax rate not set',
          suggestion: 'Set WHT rate if applicable (typically 5% or 10%)',
          autoFixable: false,
          fixed: false,
        };
      }
      if (![0, 5, 10].includes(invoice.whtRate)) {
        return {
          id: generateIssueId(),
          category: 'WHT',
          field: 'whtRate',
          severity: 'warning',
          message: `WHT rate ${invoice.whtRate}% is non-standard`,
          suggestion: 'Standard WHT rates are 5% or 10% depending on service type',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'WHT',
    field: 'whtAmount',
    check: (invoice) => {
      if (invoice.whtRate && invoice.whtRate > 0 && (!invoice.whtAmount || invoice.whtAmount === 0)) {
        return {
          id: generateIssueId(),
          category: 'WHT',
          field: 'whtAmount',
          severity: 'warning',
          message: 'WHT amount not calculated',
          suggestion: 'WHT should be deducted from the subtotal',
          autoFixable: true,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'LineItems',
    field: 'lineItems',
    check: (invoice) => {
      if (!invoice.lineItems || invoice.lineItems.length === 0) {
        return {
          id: generateIssueId(),
          category: 'LineItems',
          field: 'lineItems',
          severity: 'error',
          message: 'Invoice has no line items',
          suggestion: 'Add at least one line item to the invoice',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'LineItems',
    field: 'lineItems.description',
    check: (invoice) => {
      const missingDesc = invoice.lineItems?.filter((item) => !item.description?.trim());
      if (missingDesc && missingDesc.length > 0) {
        return {
          id: generateIssueId(),
          category: 'LineItems',
          field: 'lineItems.description',
          severity: 'error',
          message: `${missingDesc.length} line item(s) missing description`,
          suggestion: 'All line items must have a description',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'LineItems',
    field: 'lineItems.quantity',
    check: (invoice) => {
      const invalidQty = invoice.lineItems?.filter(
        (item) => !item.quantity || item.quantity <= 0
      );
      if (invalidQty && invalidQty.length > 0) {
        return {
          id: generateIssueId(),
          category: 'LineItems',
          field: 'lineItems.quantity',
          severity: 'error',
          message: `${invalidQty.length} line item(s) have invalid quantity`,
          suggestion: 'Quantity must be greater than zero',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'LineItems',
    field: 'lineItems.price',
    check: (invoice) => {
      const invalidPrice = invoice.lineItems?.filter(
        (item) => !item.price || (typeof item.price === 'number' && item.price <= 0)
      );
      if (invalidPrice && invalidPrice.length > 0) {
        return {
          id: generateIssueId(),
          category: 'LineItems',
          field: 'lineItems.price',
          severity: 'error',
          message: `${invalidPrice.length} line item(s) have invalid price`,
          suggestion: 'Unit price must be greater than zero',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'Totals',
    field: 'total',
    check: (invoice) => {
      if (invoice.total !== undefined && invoice.total <= 0) {
        return {
          id: generateIssueId(),
          category: 'Totals',
          field: 'total',
          severity: 'error',
          message: 'Invoice total is zero or negative',
          suggestion: 'Review line items and calculations',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'Dates',
    field: 'issueDate',
    check: (invoice) => {
      if (!invoice.issueDate) {
        return {
          id: generateIssueId(),
          category: 'Dates',
          field: 'issueDate',
          severity: 'error',
          message: 'Issue date is missing',
          suggestion: 'Set the invoice issue date',
          autoFixable: true,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'Dates',
    field: 'dueDate',
    check: (invoice) => {
      if (!invoice.dueDate) {
        return {
          id: generateIssueId(),
          category: 'Dates',
          field: 'dueDate',
          severity: 'error',
          message: 'Due date is missing',
          suggestion: 'Set the invoice due date',
          autoFixable: true,
          fixed: false,
        };
      }
      if (invoice.issueDate && invoice.dueDate && new Date(invoice.dueDate) < new Date(invoice.issueDate)) {
        return {
          id: generateIssueId(),
          category: 'Dates',
          field: 'dueDate',
          severity: 'warning',
          message: 'Due date is before issue date',
          suggestion: 'Due date should be after or equal to issue date',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'General',
    field: 'invoiceNumber',
    check: (invoice) => {
      if (!invoice.invoiceNumber) {
        return {
          id: generateIssueId(),
          category: 'General',
          field: 'invoiceNumber',
          severity: 'error',
          message: 'Invoice number is missing',
          suggestion: 'Generate a unique invoice number',
          autoFixable: true,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'General',
    field: 'client.name',
    check: (invoice) => {
      if (!invoice.client.name) {
        return {
          id: generateIssueId(),
          category: 'General',
          field: 'client.name',
          severity: 'error',
          message: 'Customer name is missing',
          suggestion: 'Add customer name to the invoice',
          autoFixable: false,
          fixed: false,
        };
      }
      return null;
    },
  },
  {
    category: 'General',
    field: 'currency',
    check: (invoice) => {
      if (!invoice.currency) {
        return {
          id: generateIssueId(),
          category: 'General',
          field: 'currency',
          severity: 'warning',
          message: 'Currency not specified',
          suggestion: 'Set invoice currency (default: NGN)',
          autoFixable: true,
          fixed: false,
        };
      }
      return null;
    },
  },
];

export function checkCompliance(invoice: Invoice): ComplianceCheckResult {
  const issues: ComplianceIssue[] = [];
  const categoryCounts: Record<ComplianceCategory, { total: number; passed: number }> = {
    TIN: { total: 0, passed: 0 },
    CAC: { total: 0, passed: 0 },
    VAT: { total: 0, passed: 0 },
    WHT: { total: 0, passed: 0 },
    LineItems: { total: 0, passed: 0 },
    Totals: { total: 0, passed: 0 },
    Dates: { total: 0, passed: 0 },
    General: { total: 0, passed: 0 },
  };

  for (const checkDef of complianceChecks) {
    categoryCounts[checkDef.category].total++;
    const issue = checkDef.check(invoice);
    if (issue) {
      issues.push(issue);
    } else {
      categoryCounts[checkDef.category].passed++;
    }
  }

  const totalChecks = complianceChecks.length;
  const passedChecks = totalChecks - issues.length;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  const categoryScores: Record<ComplianceCategory, number> = {} as Record<ComplianceCategory, number>;
  for (const cat of Object.keys(categoryCounts) as ComplianceCategory[]) {
    const { total, passed } = categoryCounts[cat];
    categoryScores[cat] = total > 0 ? Math.round((passed / total) * 100) : 100;
  }

  return {
    invoiceId: invoice.invoiceNumber,
    score,
    issues,
    checkedAt: new Date().toISOString(),
    categoryScores,
    totalChecks,
    passedChecks,
  };
}

export function getComplianceScore(invoice: Invoice): number {
  const result = checkCompliance(invoice);
  return result.score;
}

export function getComplianceIssues(invoice: Invoice): ComplianceIssue[] {
  const result = checkCompliance(invoice);
  return result.issues;
}

export function suggestFixes(issue: ComplianceIssue): string[] {
  const suggestions: string[] = [issue.suggestion];

  switch (issue.category) {
    case 'TIN':
      suggestions.push('TIN can be verified on FIRS portal: https://taxpromax.firs.gov.ng');
      if (issue.field === 'customer.tin') {
        suggestions.push('Request customer TIN before issuing invoice');
      }
      break;
    case 'CAC':
      suggestions.push('CAC number can be verified on CAC portal: https://search.cac.gov.ng');
      break;
    case 'VAT':
      suggestions.push('Nigerian standard VAT rate is 7.5%');
      suggestions.push('Some items may be zero-rated or exempt - check FIRS guidelines');
      break;
    case 'WHT':
      suggestions.push('WHT rates: 10% for services, 5% for construction and consultancy');
      suggestions.push('WHT is deducted from payment and remitted to FIRS');
      break;
    case 'LineItems':
      suggestions.push('Each line item needs: description, quantity, and unit price');
      break;
    case 'Dates':
      suggestions.push('Use ISO format: YYYY-MM-DD');
      break;
  }

  return suggestions;
}

export function getComplianceHistory(invoiceId: string): ComplianceHistoryEntry[] {
  const stored = localStorage.getItem(`compliance_history_${invoiceId}`);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as ComplianceHistoryEntry[];
  } catch {
    return [];
  }
}

export function saveComplianceCheck(result: ComplianceCheckResult): void {
  const history = getComplianceHistory(result.invoiceId);
  history.push({
    invoiceId: result.invoiceId,
    score: result.score,
    checkedAt: result.checkedAt,
    issueCount: result.issues.length,
  });

  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }

  localStorage.setItem(
    `compliance_history_${result.invoiceId}`,
    JSON.stringify(history)
  );
}

export function getOverallComplianceStats(invoices: Invoice[]): {
  averageScore: number;
  totalIssues: number;
  compliantCount: number;
  nonCompliantCount: number;
  categoryAverages: Record<ComplianceCategory, number>;
} {
  if (invoices.length === 0) {
    return {
      averageScore: 0,
      totalIssues: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      categoryAverages: {
        TIN: 0,
        CAC: 0,
        VAT: 0,
        WHT: 0,
        LineItems: 0,
        Totals: 0,
        Dates: 0,
        General: 0,
      },
    };
  }

  let totalScore = 0;
  let totalIssues = 0;
  let compliantCount = 0;
  const categorySums: Record<ComplianceCategory, { total: number; count: number }> = {
    TIN: { total: 0, count: 0 },
    CAC: { total: 0, count: 0 },
    VAT: { total: 0, count: 0 },
    WHT: { total: 0, count: 0 },
    LineItems: { total: 0, count: 0 },
    Totals: { total: 0, count: 0 },
    Dates: { total: 0, count: 0 },
    General: { total: 0, count: 0 },
  };

  for (const invoice of invoices) {
    const result = checkCompliance(invoice);
    totalScore += result.score;
    totalIssues += result.issues.length;
    if (result.score >= 80) compliantCount++;

    for (const cat of Object.keys(result.categoryScores) as ComplianceCategory[]) {
      categorySums[cat].total += result.categoryScores[cat];
      categorySums[cat].count++;
    }
  }

  const categoryAverages: Record<ComplianceCategory, number> = {} as Record<ComplianceCategory, number>;
  for (const cat of Object.keys(categorySums) as ComplianceCategory[]) {
    const { total, count } = categorySums[cat];
    categoryAverages[cat] = count > 0 ? Math.round(total / count) : 0;
  }

  return {
    averageScore: Math.round(totalScore / invoices.length),
    totalIssues,
    compliantCount,
    nonCompliantCount: invoices.length - compliantCount,
    categoryAverages,
  };
}

export function exportComplianceReport(invoices: Invoice[]): string {
  const stats = getOverallComplianceStats(invoices);
  const lines: string[] = [
    'Invoice Compliance Report',
    `Generated: ${new Date().toLocaleString('en-NG')}`,
    '',
    '=== Summary ===',
    `Total Invoices: ${invoices.length}`,
    `Average Score: ${stats.averageScore}%`,
    `Compliant: ${stats.compliantCount}`,
    `Non-Compliant: ${stats.nonCompliantCount}`,
    `Total Issues: ${stats.totalIssues}`,
    '',
    '=== Category Scores ===',
  ];

  for (const [cat, score] of Object.entries(stats.categoryAverages)) {
    lines.push(`${cat}: ${score}%`);
  }

  lines.push('');
  lines.push('=== Invoice Details ===');
  lines.push('Invoice Number,Score,Issues');

  for (const invoice of invoices) {
    const result = checkCompliance(invoice);
    lines.push(
      `${invoice.invoiceNumber},${result.score}%,${result.issues.length}`
    );
  }

  return lines.join('\n');
}

export function exportComplianceReportJSON(invoices: Invoice[]): string {
  const stats = getOverallComplianceStats(invoices);
  const details = invoices.map((invoice) => {
    const result = checkCompliance(invoice);
    return {
      invoiceNumber: invoice.invoiceNumber,
      score: result.score,
      issues: result.issues,
      checkedAt: result.checkedAt,
    };
  });

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: stats,
      invoices: details,
    },
    null,
    2
  );
}
