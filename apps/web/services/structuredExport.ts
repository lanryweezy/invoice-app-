import type { Invoice, LineItem } from '../types';

export interface ExportMetadata {
  exportDate: string;
  version: string;
  format: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number | undefined;
  currency: string;
}

export interface NRSInvoicePayload {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  documentType: string;
  issuer: {
    name: string;
    tin?: string;
    cacNumber?: string;
    address: string;
    email: string;
  };
  recipient: {
    name: string;
    tin?: string;
    cacNumber?: string;
    address: string;
    email: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxCategory: string;
    unitOfMeasure: string;
    total: number;
  }[];
  summary: {
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    whtRate: number;
    whtAmount: number;
    shipping: number;
    total: number;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
  payment?: {
    status: string;
    paymentLink?: string;
  };
}

export function getExportMetadata(invoice: Invoice): ExportMetadata {
  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    format: 'NRS',
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    totalAmount: invoice.total,
    currency: invoice.currency,
  };
}

function buildLineItemTotal(item: LineItem): number {
  if (typeof item.price !== 'number') return 0;
  return Math.round(item.price * item.quantity * 100) / 100;
}

function buildNRSPayload(invoice: Invoice): NRSInvoicePayload {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + buildLineItemTotal(item), 0);
  const discountAmount = invoice.discountType === 'percentage'
    ? Math.round(subtotal * Number(invoice.discountRate) / 100 * 100) / 100
    : Number(invoice.discountRate);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * invoice.taxRate / 100 * 100) / 100;
  const whtAmount = invoice.whtRate
    ? Math.round(subtotal * invoice.whtRate / 100 * 100) / 100
    : 0;
  const shipping = Number(invoice.shippingAmount) || 0;
  const total = taxableAmount + taxAmount - whtAmount + shipping;

  return {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    currency: invoice.currency,
    documentType: invoice.documentType ?? 'Tax Invoice',
    issuer: {
      name: invoice.user.name,
      tin: invoice.user.tin,
      cacNumber: invoice.user.cacNumber,
      address: invoice.user.address,
      email: invoice.user.email,
    },
    recipient: {
      name: invoice.client.name,
      tin: invoice.client.tin,
      cacNumber: invoice.client.cacNumber,
      address: invoice.client.address,
      email: invoice.client.email,
    },
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: typeof item.price === 'number' ? item.price : 0,
      taxCategory: item.taxCategory ?? 'Standard',
      unitOfMeasure: item.unitOfMeasure ?? 'PCS',
      total: buildLineItemTotal(item),
    })),
    summary: {
      subtotal,
      discountAmount,
      taxRate: invoice.taxRate,
      taxAmount,
      whtRate: invoice.whtRate,
      whtAmount,
      shipping,
      total,
    },
    bankDetails: invoice.user.bankName
      ? { bankName: invoice.user.bankName, accountNumber: invoice.user.accountNumber }
      : undefined,
    payment: {
      status: invoice.status === 'Paid' ? 'completed' : 'pending',
      paymentLink: invoice.user.paymentLink,
    },
  };
}

export function exportToJSON(invoice: Invoice): string {
  return JSON.stringify(buildNRSPayload(invoice), null, 2);
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToXML(invoice: Invoice): string {
  const payload = buildNRSPayload(invoice);

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<NRSInvoice>',
    `  <InvoiceNumber>${escapeXML(payload.invoiceNumber)}</InvoiceNumber>`,
    `  <IssueDate>${escapeXML(payload.issueDate)}</IssueDate>`,
    `  <DueDate>${escapeXML(payload.dueDate)}</DueDate>`,
    `  <Status>${escapeXML(payload.status)}</Status>`,
    `  <Currency>${escapeXML(payload.currency)}</Currency>`,
    `  <DocumentType>${escapeXML(payload.documentType)}</DocumentType>`,
    '  <Issuer>',
    `    <Name>${escapeXML(payload.issuer.name)}</Name>`,
    payload.issuer.tin ? `    <TIN>${escapeXML(payload.issuer.tin)}</TIN>` : '',
    payload.issuer.cacNumber ? `    <CACNumber>${escapeXML(payload.issuer.cacNumber)}</CACNumber>` : '',
    `    <Address>${escapeXML(payload.issuer.address)}</Address>`,
    `    <Email>${escapeXML(payload.issuer.email)}</Email>`,
    '  </Issuer>',
    '  <Recipient>',
    `    <Name>${escapeXML(payload.recipient.name)}</Name>`,
    payload.recipient.tin ? `    <TIN>${escapeXML(payload.recipient.tin)}</TIN>` : '',
    payload.recipient.cacNumber ? `    <CACNumber>${escapeXML(payload.recipient.cacNumber)}</CACNumber>` : '',
    `    <Address>${escapeXML(payload.recipient.address)}</Address>`,
    `    <Email>${escapeXML(payload.recipient.email)}</Email>`,
    '  </Recipient>',
    '  <LineItems>',
    ...payload.lineItems.map((item) => [
      '    <Item>',
      `      <Description>${escapeXML(item.description)}</Description>`,
      `      <Quantity>${item.quantity}</Quantity>`,
      `      <UnitPrice>${item.unitPrice}</UnitPrice>`,
      `      <TaxCategory>${escapeXML(item.taxCategory)}</TaxCategory>`,
      `      <UnitOfMeasure>${escapeXML(item.unitOfMeasure)}</UnitOfMeasure>`,
      `      <Total>${item.total}</Total>`,
      '    </Item>',
    ].join('\n')),
    '  </LineItems>',
    '  <Summary>',
    `    <Subtotal>${payload.summary.subtotal}</Subtotal>`,
    `    <DiscountAmount>${payload.summary.discountAmount}</DiscountAmount>`,
    `    <TaxRate>${payload.summary.taxRate}</TaxRate>`,
    `    <TaxAmount>${payload.summary.taxAmount}</TaxAmount>`,
    `    <WHTRate>${payload.summary.whtRate}</WHTRate>`,
    `    <WHTAmount>${payload.summary.whtAmount}</WHTAmount>`,
    `    <Shipping>${payload.summary.shipping}</Shipping>`,
    `    <Total>${payload.summary.total}</Total>`,
    '  </Summary>',
    payload.bankDetails ? [
      '  <BankDetails>',
      `    <BankName>${escapeXML(payload.bankDetails.bankName)}</BankName>`,
      `    <AccountNumber>${escapeXML(payload.bankDetails.accountNumber)}</AccountNumber>`,
      '  </BankDetails>',
    ].join('\n') : '',
    '  <Payment>',
    `    <Status>${escapeXML(payload.payment?.status ?? 'pending')}</Status>`,
    payload.payment?.paymentLink ? `    <PaymentLink>${escapeXML(payload.payment.paymentLink)}</PaymentLink>` : '',
    '  </Payment>',
    '</NRSInvoice>',
  ];

  return lines.filter(Boolean).join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(invoice: Invoice): string {
  const payload = buildNRSPayload(invoice);

  const headers = [
    'InvoiceNumber', 'IssueDate', 'DueDate', 'Status', 'Currency', 'DocumentType',
    'IssuerName', 'IssuerTIN', 'IssuerCAC', 'IssuerAddress', 'IssuerEmail',
    'RecipientName', 'RecipientTIN', 'RecipientCAC', 'RecipientAddress', 'RecipientEmail',
    'LineDescription', 'Quantity', 'UnitPrice', 'TaxCategory', 'UnitOfMeasure', 'LineTotal',
    'Subtotal', 'DiscountAmount', 'TaxRate', 'TaxAmount', 'WHTRate', 'WHTAmount', 'Shipping', 'Total',
  ];

  const row = [
    escapeCSV(payload.invoiceNumber),
    escapeCSV(payload.issueDate),
    escapeCSV(payload.dueDate),
    escapeCSV(payload.status),
    escapeCSV(payload.currency),
    escapeCSV(payload.documentType),
    escapeCSV(payload.issuer.name),
    escapeCSV(payload.issuer.tin ?? ''),
    escapeCSV(payload.issuer.cacNumber ?? ''),
    escapeCSV(payload.issuer.address),
    escapeCSV(payload.issuer.email),
    escapeCSV(payload.recipient.name),
    escapeCSV(payload.recipient.tin ?? ''),
    escapeCSV(payload.recipient.cacNumber ?? ''),
    escapeCSV(payload.recipient.address),
    escapeCSV(payload.recipient.email),
    payload.lineItems.map((item) => [
      escapeCSV(item.description),
      item.quantity,
      item.unitPrice,
      escapeCSV(item.taxCategory),
      escapeCSV(item.unitOfMeasure),
      item.total,
    ].join('|')).join(';'),
    payload.summary.subtotal,
    payload.summary.discountAmount,
    payload.summary.taxRate,
    payload.summary.taxAmount,
    payload.summary.whtRate,
    payload.summary.whtAmount,
    payload.summary.shipping,
    payload.summary.total,
  ];

  return [headers.join(','), row.join(',')].join('\n');
}

export async function exportBatch(
  invoices: Invoice[],
  format: 'json' | 'csv'
): Promise<string> {
  if (format === 'csv') {
    const headers = [
      'InvoiceNumber', 'IssueDate', 'DueDate', 'Status', 'Currency',
      'RecipientName', 'Subtotal', 'TaxAmount', 'Total',
    ];

    const rows = invoices.map((inv) => {
      const payload = buildNRSPayload(inv);
      return [
        escapeCSV(payload.invoiceNumber),
        escapeCSV(payload.issueDate),
        escapeCSV(payload.dueDate),
        escapeCSV(payload.status),
        escapeCSV(payload.currency),
        escapeCSV(payload.recipient.name),
        payload.summary.subtotal,
        payload.summary.taxAmount,
        payload.summary.total,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  const batch = invoices.map((inv) => buildNRSPayload(inv));
  return JSON.stringify(batch, null, 2);
}
