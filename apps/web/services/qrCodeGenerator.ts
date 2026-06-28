import type { Invoice } from '../types';

export interface QRCodeOptions {
  size?: number;
  foreground?: string;
  background?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface PaymentQRData {
  type: 'payment';
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  description: string;
}

export interface InvoiceQRData {
  type: 'invoice';
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuer: string;
  issueDate: string;
  dueDate: string;
  hash: string;
}

export interface VerificationQRData {
  type: 'verification';
  invoiceId: string;
  hash: string;
  timestamp: string;
  verificationUrl: string;
}

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  size: 256,
  foreground: '#000000',
  background: '#FFFFFF',
  errorCorrectionLevel: 'M',
  margin: 4,
};

function computeHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateQRMatrix(data: string, size: number): boolean[][] {
  const moduleCount = Math.max(21, Math.min(size, 77));
  const matrix: boolean[][] = Array.from({ length: moduleCount }, () =>
    new Array(moduleCount).fill(false)
  );

  const binary = dataToBinary(data);
  const bits = binaryToBitArray(binary);

  let bitIndex = 0;
  for (let row = moduleCount - 1; row >= 0; row -= 2) {
    if (row === 6) row--;
    for (let col = 0; col < moduleCount; col++) {
      for (let r = 0; r < 2; r++) {
        const currentRow = row - r;
        if (currentRow < 0 || currentRow >= moduleCount) continue;
        if (isReserved(currentRow, col, moduleCount)) continue;
        matrix[currentRow][col] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        bitIndex++;
      }
    }
  }

  addFinderPatterns(matrix, moduleCount);
  addTimingPatterns(matrix, moduleCount);

  return matrix;
}

function dataToBinary(data: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(2).padStart(8, '0');
  }
  return result;
}

function binaryToBitArray(binary: string): number[] {
  return Array.from(binary, (c) => parseInt(c, 10));
}

function isReserved(row: number, col: number, size: number): boolean {
  if (row < 8 && col < 8) return true;
  if (row < 8 && col >= size - 8) return true;
  if (row >= size - 8 && col < 8) return true;
  if (row === 6 || col === 6) return true;
  return false;
}

function addFinderPatterns(matrix: boolean[][], size: number): void {
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ];

  const positions = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  for (const [startRow, startCol] of positions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (startRow + r < size && startCol + c < size) {
          matrix[startRow + r][startCol + c] = pattern[r][c] === 1;
        }
      }
    }
  }
}

function addTimingPatterns(matrix: boolean[][], size: number): void {
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
}

function matrixToSVG(
  matrix: boolean[][],
  options: Required<QRCodeOptions>
): string {
  const moduleCount = matrix.length;
  const moduleSize = Math.floor(options.size / (moduleCount + options.margin * 2));
  const totalSize = moduleCount * moduleSize + options.margin * 2 * moduleSize;

  const modules: string[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        const x = (col + options.margin) * moduleSize;
        const y = (row + options.margin) * moduleSize;
        modules.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${options.foreground}"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">` +
    `<rect width="100%" height="100%" fill="${options.background}"/>` +
    modules.join('') +
    `</svg>`;
}

function generateQRDataURL(data: string, options?: QRCodeOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const matrix = generateQRMatrix(data, opts.size);
  const svg = matrixToSVG(matrix, opts);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function generatePaymentQR(
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string,
  options?: QRCodeOptions
): string {
  const paymentData: PaymentQRData = {
    type: 'payment',
    amount,
    currency: 'NGN',
    bankName,
    accountNumber,
    accountName,
    reference: `INV-${Date.now()}`,
    description: `Payment of NGN ${amount.toLocaleString()}`,
  };

  const encoded = JSON.stringify(paymentData);
  return generateQRDataURL(encoded, options);
}

export function generateInvoiceQR(
  invoice: Invoice,
  options?: QRCodeOptions
): string {
  const qrData: InvoiceQRData = {
    type: 'invoice',
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total ?? 0,
    currency: invoice.currency,
    issuer: invoice.user.name,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    hash: computeHash(invoice.invoiceNumber + invoice.total),
  };

  const encoded = JSON.stringify(qrData);
  return generateQRDataURL(encoded, options);
}

export function generateVerificationQR(
  invoiceId: string,
  options?: QRCodeOptions
): string {
  const verificationData: VerificationQRData = {
    type: 'verification',
    invoiceId,
    hash: computeHash(invoiceId + Date.now()),
    timestamp: new Date().toISOString(),
    verificationUrl: `https://invoice.app/verify/${invoiceId}`,
  };

  const encoded = JSON.stringify(verificationData);
  return generateQRDataURL(encoded, options);
}

export function getQRCodeImage(
  qrData: string,
  options?: QRCodeOptions
): string {
  return generateQRDataURL(qrData, options);
}

export function generateInvoiceQRWithLogo(
  invoice: Invoice,
  logoBase64?: string,
  options?: QRCodeOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const matrix = generateQRMatrix(
    JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      hash: computeHash(invoice.invoiceNumber),
    }),
    opts.size
  );

  const moduleCount = matrix.length;
  const moduleSize = Math.floor(opts.size / (moduleCount + opts.margin * 2));
  const totalSize = moduleCount * moduleSize + opts.margin * 2 * moduleSize;

  const modules: string[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        const x = (col + opts.margin) * moduleSize;
        const y = (row + opts.margin) * moduleSize;
        modules.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${opts.foreground}"/>`);
      }
    }
  }

  let logoTag = '';
  if (logoBase64) {
    const logoSize = totalSize * 0.2;
    const logoPos = (totalSize - logoSize) / 2;
    logoTag = `<rect x="${logoPos - 4}" y="${logoPos - 4}" width="${logoSize + 8}" height="${logoSize + 8}" fill="${opts.background}" rx="4"/>` +
      `<image x="${logoPos}" y="${logoPos}" width="${logoSize}" height="${logoSize}" href="${logoBase64}" preserveAspectRatio="xMidYMid slice"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">` +
    `<rect width="100%" height="100%" fill="${opts.background}"/>` +
    modules.join('') +
    logoTag +
    `</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
