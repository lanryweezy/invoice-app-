import type { Invoice, User, Client, LineItem } from '../types';
import { computeInvoiceHash } from '../utils/crypto';

export interface NRSValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface NRSValidationResult {
  compliant: boolean;
  errors: NRSValidationError[];
  warnings: NRSValidationError[];
  invoiceHash: string;
  timestamp: string;
}

export interface NRSInvoiceJSON {
  version: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  invoiceType: string;
  currency: string;
  supplier: {
    name: string;
    tin: string;
    cacNumber: string;
    address: string;
    email: string;
    phoneNumber: string;
  };
  customer: {
    name: string;
    tin: string;
    cacNumber: string;
    address: string;
    email: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxCategory: string;
    unitOfMeasure: string;
    lineTotal: number;
  }[];
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    whtAmount: number;
    shippingAmount: number;
    totalAmount: number;
  };
  taxDetails: {
    vatRate: number;
    vatAmount: number;
    whtRate: number;
    whtAmount: number;
  };
  metadata: {
    generatedAt: string;
    generatorVersion: string;
    invoiceHash: string;
  };
}

export interface NRSSubmissionPayload {
  invoice: NRSInvoiceJSON;
  signature: string;
  submissionTimestamp: string;
  callbackUrl?: string;
}

export interface NRSSubmissionResult {
  success: boolean;
  referenceId?: string;
  submissionId?: string;
  message: string;
  timestamp: string;
}

const VAT_RATE = 0.075;
const NRS_VERSION = '1.0.0';
const GENERATOR_VERSION = '1.0.0';

function calculateVATAmount(subtotal: number, lineItems: LineItem[]): number {
  const vatable = lineItems
    .filter((item) => (item.taxCategory ?? 'Standard') === 'Standard')
    .reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + qty * price;
    }, 0);
  return Math.round(vatable * VAT_RATE * 100) / 100;
}

function getUnitTotal(item: LineItem): number {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  return Math.round(qty * price * 100) / 100;
}

function formatLineItems(items: LineItem[]) {
  return items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.price) || 0,
    taxCategory: item.taxCategory ?? 'Standard',
    unitOfMeasure: item.unitOfMeasure ?? 'PCS',
    lineTotal: getUnitTotal(item),
  }));
}

function computeTotals(invoice: Invoice) {
  const subtotal = invoice.subtotal ?? invoice.lineItems.reduce((s, i) => s + getUnitTotal(i), 0);
  const discountRate = Number(invoice.discountRate) || 0;
  const discountAmount = invoice.discountType === 'percentage'
    ? Math.round(subtotal * discountRate / 100 * 100) / 100
    : discountRate;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = invoice.tax ?? calculateVATAmount(afterDiscount, invoice.lineItems);
  const whtAmount = invoice.whtAmount ?? Math.round(afterDiscount * (invoice.whtRate / 100) * 100) / 100;
  const shippingAmount = Number(invoice.shippingAmount) || invoice.shipping || 0;
  const totalAmount = Math.round((afterDiscount + taxAmount - whtAmount + shippingAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxAmount,
    whtAmount,
    shippingAmount,
    totalAmount,
  };
}

export function generateNRSJSON(invoice: Invoice): NRSInvoiceJSON {
  const totals = computeTotals(invoice);
  const hash = computeInvoiceHash(invoice, true);

  return {
    version: NRS_VERSION,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    invoiceType: invoice.documentType ?? 'Tax Invoice',
    currency: invoice.currency,
    supplier: {
      name: invoice.user.name,
      tin: invoice.user.tin ?? '',
      cacNumber: invoice.user.cacNumber ?? '',
      address: invoice.user.address,
      email: invoice.user.email,
      phoneNumber: invoice.user.phoneNumber ?? '',
    },
    customer: {
      name: invoice.client.name,
      tin: invoice.client.tin ?? '',
      cacNumber: invoice.client.cacNumber ?? '',
      address: invoice.client.address,
      email: invoice.client.email,
    },
    lineItems: formatLineItems(invoice.lineItems),
    totals,
    taxDetails: {
      vatRate: VAT_RATE,
      vatAmount: totals.taxAmount,
      whtRate: invoice.whtRate,
      whtAmount: totals.whtAmount,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      generatorVersion: GENERATOR_VERSION,
      invoiceHash: hash,
    },
  };
}

export function generateNRSXML(invoice: Invoice): string {
  const json = generateNRSJSON(invoice);
  const esc = (s: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<NRSInvoice version="' + NRS_VERSION + '">',
    '  <InvoiceNumber>' + esc(json.invoiceNumber) + '</InvoiceNumber>',
    '  <IssueDate>' + esc(json.issueDate) + '</IssueDate>',
    '  <DueDate>' + esc(json.dueDate) + '</DueDate>',
    '  <InvoiceType>' + esc(json.invoiceType) + '</InvoiceType>',
    '  <Currency>' + esc(json.currency) + '</Currency>',
    '  <Supplier>',
    '    <Name>' + esc(json.supplier.name) + '</Name>',
    '    <TIN>' + esc(json.supplier.tin) + '</TIN>',
    '    <CACNumber>' + esc(json.supplier.cacNumber) + '</CACNumber>',
    '    <Address>' + esc(json.supplier.address) + '</Address>',
    '    <Email>' + esc(json.supplier.email) + '</Email>',
    '    <PhoneNumber>' + esc(json.supplier.phoneNumber) + '</PhoneNumber>',
    '  </Supplier>',
    '  <Customer>',
    '    <Name>' + esc(json.customer.name) + '</Name>',
    '    <TIN>' + esc(json.customer.tin) + '</TIN>',
    '    <CACNumber>' + esc(json.customer.cacNumber) + '</CACNumber>',
    '    <Address>' + esc(json.customer.address) + '</Address>',
    '    <Email>' + esc(json.customer.email) + '</Email>',
    '  </Customer>',
    '  <LineItems>',
  ];

  for (const item of json.lineItems) {
    lines.push('    <LineItem>');
    lines.push('      <Description>' + esc(item.description) + '</Description>');
    lines.push('      <Quantity>' + item.quantity + '</Quantity>');
    lines.push('      <UnitPrice>' + item.unitPrice + '</UnitPrice>');
    lines.push('      <TaxCategory>' + esc(item.taxCategory) + '</TaxCategory>');
    lines.push('      <UnitOfMeasure>' + esc(item.unitOfMeasure) + '</UnitOfMeasure>');
    lines.push('      <LineTotal>' + item.lineTotal + '</LineTotal>');
    lines.push('    </LineItem>');
  }

  lines.push('  </LineItems>');
  lines.push('  <Totals>');
  lines.push('    <Subtotal>' + json.totals.subtotal + '</Subtotal>');
  lines.push('    <DiscountAmount>' + json.totals.discountAmount + '</DiscountAmount>');
  lines.push('    <TaxAmount>' + json.totals.taxAmount + '</TaxAmount>');
  lines.push('    <WHTAmount>' + json.totals.whtAmount + '</WHTAmount>');
  lines.push('    <ShippingAmount>' + json.totals.shippingAmount + '</ShippingAmount>');
  lines.push('    <TotalAmount>' + json.totals.totalAmount + '</TotalAmount>');
  lines.push('  </Totals>');
  lines.push('  <TaxDetails>');
  lines.push('    <VATRate>' + json.taxDetails.vatRate + '</VATRate>');
  lines.push('    <VATAmount>' + json.taxDetails.vatAmount + '</VATAmount>');
  lines.push('    <WHTRate>' + json.taxDetails.whtRate + '</WHTRate>');
  lines.push('    <WHTAmount>' + json.taxDetails.whtAmount + '</WHTAmount>');
  lines.push('  </TaxDetails>');
  lines.push('  <Metadata>');
  lines.push('    <GeneratedAt>' + esc(json.metadata.generatedAt) + '</GeneratedAt>');
  lines.push('    <GeneratorVersion>' + esc(json.metadata.generatorVersion) + '</GeneratorVersion>');
  lines.push('    <InvoiceHash>' + esc(json.metadata.invoiceHash) + '</InvoiceHash>');
  lines.push('  </Metadata>');
  lines.push('</NRSInvoice>');

  return lines.join('\n');
}

export function validateNRSCompliance(invoice: Invoice): NRSValidationResult {
  const errors: NRSValidationError[] = [];
  const warnings: NRSValidationError[] = [];

  const addError = (field: string, message: string) => errors.push({ field, message, severity: 'error' });
  const addWarning = (field: string, message: string) => warnings.push({ field, message, severity: 'warning' });

  if (!invoice.user.tin) {
    addError('supplier.tin', 'Supplier TIN is required for NRS compliance');
  } else if (!/^\d{10,14}$/.test(invoice.user.tin)) {
    addError('supplier.tin', 'Supplier TIN must be 10-14 digits');
  }

  if (!invoice.user.cacNumber) {
    addWarning('supplier.cacNumber', 'Supplier CAC number recommended for NRS');
  }

  if (!invoice.client.tin) {
    addError('customer.tin', 'Customer TIN is required for NRS compliance');
  } else if (!/^\d{10,14}$/.test(invoice.client.tin)) {
    addError('customer.tin', 'Customer TIN must be 10-14 digits');
  }

  if (!invoice.client.name) {
    addError('customer.name', 'Customer name is required');
  }

  if (!invoice.invoiceNumber) {
    addError('invoiceNumber', 'Invoice number is required');
  }

  if (!invoice.issueDate) {
    addError('issueDate', 'Issue date is required');
  }

  if (!invoice.dueDate) {
    addError('dueDate', 'Due date is required');
  }

  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    addError('lineItems', 'At least one line item is required');
  }

  if (invoice.lineItems) {
    invoice.lineItems.forEach((item, idx) => {
      if (!item.description) {
        addError(`lineItems[${idx}].description`, 'Line item description is required');
      }
      if (!item.quantity || item.quantity <= 0) {
        addError(`lineItems[${idx}].quantity`, 'Line item quantity must be positive');
      }
      if (!item.price || item.price <= 0) {
        addError(`lineItems[${idx}].price`, 'Line item price must be positive');
      }
    });
  }

  const totals = computeTotals(invoice);
  if (totals.totalAmount <= 0) {
    addError('total', 'Invoice total must be greater than zero');
  }

  if (invoice.taxRate !== undefined && invoice.taxRate !== 7.5) {
    addWarning('taxRate', 'VAT rate should be 7.5% per NRS guidelines');
  }

  if (!invoice.user.name) {
    addError('supplier.name', 'Supplier name is required');
  }

  if (!invoice.user.address) {
    addWarning('supplier.address', 'Supplier address recommended');
  }

  const compliant = errors.length === 0;
  const status: NRSComplianceStatus = compliant ? 'Verified' : 'Failed';

  return {
    compliant,
    errors,
    warnings,
    invoiceHash: computeInvoiceHash(invoice, true),
    timestamp: new Date().toISOString(),
  };
}

export function exportStructuredData(invoice: Invoice): {
  json: NRSInvoiceJSON;
  xml: string;
  validation: NRSValidationResult;
  exports: { format: string; data: string }[];
} {
  const json = generateNRSJSON(invoice);
  const xml = generateNRSXML(invoice);
  const validation = validateNRSCompliance(invoice);

  return {
    json,
    xml,
    validation,
    exports: [
      { format: 'NRS-JSON', data: JSON.stringify(json, null, 2) },
      { format: 'NRS-XML', data: xml },
      { format: 'CSV', data: convertToCSV(json) },
    ],
  };
}

function convertToCSV(json: NRSInvoiceJSON): string {
  const header = 'Description,Quantity,UnitPrice,TaxCategory,UnitOfMeasure,LineTotal';
  const rows = json.lineItems.map(
    (item) =>
      `"${item.description}",${item.quantity},${item.unitPrice},"${item.taxCategory}","${item.unitOfMeasure}",${item.lineTotal}`
  );
  const totals = `,,,"TOTAL",,${json.totals.totalAmount}`;
  return [header, ...rows, totals].join('\n');
}

export async function submitToNRS(invoice: Invoice, signature?: string): Promise<NRSSubmissionResult> {
  const json = generateNRSJSON(invoice);
  const validation = validateNRSCompliance(invoice);

  if (!validation.compliant) {
    return {
      success: false,
      message: `Invoice failed NRS validation: ${validation.errors.map((e) => e.message).join('; ')}`,
      timestamp: new Date().toISOString(),
    };
  }

  const payload: NRSSubmissionPayload = {
    invoice: json,
    signature: signature ?? invoice.digitalSignature ?? '',
    submissionTimestamp: new Date().toISOString(),
  };

  const submissionId = `NRS-${invoice.invoiceNumber}-${Date.now()}`;

  return {
    success: true,
    referenceId: payload.invoice.metadata.invoiceHash,
    submissionId,
    message: 'Invoice prepared for NRS submission. awaiting server-side transmission.',
    timestamp: payload.submissionTimestamp,
  };
}

export function generateNRSInvoiceData(invoice: Invoice) {
  return {
    nrsJSON: generateNRSJSON(invoice),
    nrsXML: generateNRSXML(invoice),
    validation: validateNRSCompliance(invoice),
    hash: computeInvoiceHash(invoice, true),
    timestamp: new Date().toISOString(),
  };
}

type NRSComplianceStatus = 'None' | 'Pending' | 'Verified' | 'Failed';
