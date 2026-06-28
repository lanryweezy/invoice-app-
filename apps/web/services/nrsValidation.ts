import type { Invoice } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

const TIN_REGEX = /^\d{11}$/;
const CAC_REGEX = /^[A-Z]{2,3}-\d{6,8}$/i;
const INVOICE_NUMBER_REGEX = /^(INV|PRO|QTE|RCP)-\d{4}-\d{3,6}$/i;

const REQUIRED_FIELDS: (keyof Invoice)[] = [
  'invoiceNumber',
  'issueDate',
  'dueDate',
  'currency',
  'status',
];

const REQUIRED_CLIENT_FIELDS: (keyof Invoice['client'])[] = [
  'name',
  'email',
];

export function validateTIN(tin: string): ValidationError | null {
  const cleaned = tin.replace(/\s/g, '');

  if (!cleaned) {
    return {
      field: 'tin',
      message: 'TIN is empty',
      suggestion: 'Enter an 11-digit Tax Identification Number',
      severity: 'error',
    };
  }

  if (!TIN_REGEX.test(cleaned)) {
    return {
      field: 'tin',
      message: `Invalid TIN format: "${cleaned}". Expected 11 digits`,
      suggestion: 'TIN must be exactly 11 digits (e.g., 12345678901)',
      severity: 'error',
    };
  }

  return null;
}

export function validateCAC(cac: string): ValidationError | null {
  const cleaned = cac.replace(/\s/g, '').toUpperCase();

  if (!cleaned) {
    return {
      field: 'cacNumber',
      message: 'CAC number is empty',
      suggestion: 'Enter a valid Corporate Affairs Commission number',
      severity: 'warning',
    };
  }

  if (!CAC_REGEX.test(cleaned)) {
    return {
      field: 'cacNumber',
      message: `Invalid CAC number format: "${cleaned}"`,
      suggestion: 'CAC number should be in format XX-123456 (e.g., RC-123456)',
      severity: 'error',
    };
  }

  return null;
}

export function validateInvoiceNumber(number: string): ValidationError | null {
  if (!number) {
    return {
      field: 'invoiceNumber',
      message: 'Invoice number is empty',
      suggestion: 'Generate an invoice number (e.g., INV-2026-001)',
      severity: 'error',
    };
  }

  if (!INVOICE_NUMBER_REGEX.test(number)) {
    return {
      field: 'invoiceNumber',
      message: `Invalid invoice number format: "${number}"`,
      suggestion: 'Invoice number should follow format: TYPE-YYYY-NNN (e.g., INV-2026-001)',
      severity: 'warning',
    };
  }

  return null;
}

export function validateBankDetails(bank: {
  bankName?: string;
  accountNumber?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!bank.bankName) {
    errors.push({
      field: 'bankName',
      message: 'Bank name is required',
      suggestion: 'Enter the business bank name',
      severity: 'warning',
    });
  }

  if (!bank.accountNumber) {
    errors.push({
      field: 'accountNumber',
      message: 'Account number is required',
      suggestion: 'Enter a valid 10-digit bank account number',
      severity: 'warning',
    });
  } else if (!/^\d{10}$/.test(bank.accountNumber)) {
    errors.push({
      field: 'accountNumber',
      message: `Invalid account number format: "${bank.accountNumber}"`,
      suggestion: 'Nigerian bank account numbers are 10 digits',
      severity: 'error',
    });
  }

  return errors;
}

function validateTaxCalculations(invoice: Invoice): ValidationError[] {
  const errors: ValidationError[] = [];

  const calculatedSubtotal = invoice.lineItems.reduce(
    (sum, item) => sum + (typeof item.price === 'number' ? item.price * item.quantity : 0),
    0
  );

  if (invoice.subtotal !== undefined && Math.abs(invoice.subtotal - calculatedSubtotal) > 0.01) {
    errors.push({
      field: 'subtotal',
      message: `Subtotal mismatch: stored ${invoice.subtotal}, calculated ${calculatedSubtotal}`,
      suggestion: 'Recalculate line items or update subtotal',
      severity: 'error',
    });
  }

  if (invoice.taxRate < 0 || invoice.taxRate > 100) {
    errors.push({
      field: 'taxRate',
      message: `Invalid tax rate: ${invoice.taxRate}%`,
      suggestion: 'Tax rate should be between 0 and 100 percent',
      severity: 'error',
    });
  }

  if (invoice.discountRate !== undefined && invoice.discountRate !== '') {
    const discount = Number(invoice.discountRate);
    if (invoice.discountType === 'percentage' && (discount < 0 || discount > 100)) {
      errors.push({
        field: 'discountRate',
        message: `Invalid discount percentage: ${discount}%`,
        suggestion: 'Discount percentage should be between 0 and 100',
        severity: 'error',
      });
    } else if (invoice.discountType === 'fixed' && discount < 0) {
      errors.push({
        field: 'discountRate',
        message: `Invalid fixed discount amount: ${discount}`,
        suggestion: 'Discount amount cannot be negative',
        severity: 'error',
      });
    }
  }

  if (invoice.tax !== undefined && invoice.tax < 0) {
    errors.push({
      field: 'tax',
      message: `Tax amount cannot be negative: ${invoice.tax}`,
      suggestion: 'Recalculate tax based on line items and tax rate',
      severity: 'error',
    });
  }

  if (invoice.total !== undefined && invoice.total < 0) {
    errors.push({
      field: 'total',
      message: `Invoice total cannot be negative: ${invoice.total}`,
      suggestion: 'Check line items and discounts for issues',
      severity: 'error',
    });
  }

  return errors;
}

export function validateInvoice(invoice: Invoice): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = invoice[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `Required field "${field}" is missing or empty`,
        suggestion: `Fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} for the invoice`,
        severity: 'error',
      });
    }
  }

  for (const field of REQUIRED_CLIENT_FIELDS) {
    const value = invoice.client[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: `client.${field}`,
        message: `Client ${field} is required`,
        suggestion: `Enter the client's ${field}`,
        severity: 'error',
      });
    }
  }

  if (invoice.client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.client.email)) {
    errors.push({
      field: 'client.email',
      message: `Invalid client email: "${invoice.client.email}"`,
      suggestion: 'Enter a valid email address (e.g., name@example.com)',
      severity: 'error',
    });
  }

  if (invoice.client.tin) {
    const tinError = validateTIN(invoice.client.tin);
    if (tinError) errors.push(tinError);
  }

  if (invoice.client.cacNumber) {
    const cacError = validateCAC(invoice.client.cacNumber);
    if (cacError) errors.push(cacError);
  }

  const numberError = validateInvoiceNumber(invoice.invoiceNumber);
  if (numberError) errors.push(numberError);

  if (invoice.issueDate && invoice.dueDate && new Date(invoice.issueDate) > new Date(invoice.dueDate)) {
    errors.push({
      field: 'dueDate',
      message: 'Due date is before issue date',
      suggestion: 'Set a due date that is after the issue date',
      severity: 'error',
    });
  }

  if (invoice.lineItems.length === 0) {
    errors.push({
      field: 'lineItems',
      message: 'Invoice has no line items',
      suggestion: 'Add at least one line item to the invoice',
      severity: 'error',
    });
  }

  for (let index = 0; index < invoice.lineItems.length; index++) {
    const item = invoice.lineItems[index];
    if (!item.description) {
      errors.push({
        field: `lineItems[${index}].description`,
        message: `Line item ${index + 1} has no description`,
        suggestion: 'Add a description for this line item',
        severity: 'warning',
      });
    }
    if (typeof item.price === 'number' && item.price < 0) {
      errors.push({
        field: `lineItems[${index}].price`,
        message: `Line item ${index + 1} has a negative price`,
        suggestion: 'Price cannot be negative',
        severity: 'error',
      });
    }
    if (item.quantity <= 0) {
      errors.push({
        field: `lineItems[${index}].quantity`,
        message: `Line item ${index + 1} has invalid quantity: ${item.quantity}`,
        suggestion: 'Quantity must be greater than zero',
        severity: 'error',
      });
    }
  }

  errors.push(...validateTaxCalculations(invoice));

  return errors;
}

export function getValidationErrors(invoice: Invoice): {
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
} {
  const all = validateInvoice(invoice);
  const errors = all.filter((e) => e.severity === 'error');
  const warnings = all.filter((e) => e.severity === 'warning');

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
