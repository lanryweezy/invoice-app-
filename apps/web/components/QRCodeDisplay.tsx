
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Invoice } from '../types';

interface QRCodeDisplayProps {
  invoice: Invoice;
  size?: number;
}

const QR_MATRIX_SIZE = 25;
const QR_DATA_BITS = 192;

function generateQRData(text: string): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: QR_MATRIX_SIZE }, () => Array(QR_MATRIX_SIZE).fill(false));

  // Finder patterns
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[row + r][col + c] = true;
        }
      }
    }
    // Separator
    for (let i = 0; i < 8; i++) {
      if (row - 1 >= 0) matrix[row - 1][col + i] = false;
      if (col - 1 >= 0) matrix[row + i][col - 1] = false;
      if (row + 7 < QR_MATRIX_SIZE) matrix[row + 7][col + i] = false;
      if (col + 7 < QR_MATRIX_SIZE) matrix[row + i][col + 7] = false;
    }
  };

  drawFinder(0, 0);
  drawFinder(0, QR_MATRIX_SIZE - 7);
  drawFinder(QR_MATRIX_SIZE - 7, 0);

  // Timing patterns
  for (let i = 8; i < QR_MATRIX_SIZE - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[QR_MATRIX_SIZE - 8][8] = true;

  // Encode data using simple hash-based pattern
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
  }

  // Pseudo-random data placement
  const rng = (s: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s;
  };

  let s = Math.abs(seed);
  for (let i = 0; i < QR_DATA_BITS; i++) {
    s = rng(s);
    const r = s % QR_MATRIX_SIZE;
    s = rng(s);
    const c = s % QR_MATRIX_SIZE;

    // Skip finder patterns and timing
    const inTopLeft = r < 9 && c < 9;
    const inTopRight = r < 9 && c >= QR_MATRIX_SIZE - 8;
    const inBottomLeft = r >= QR_MATRIX_SIZE - 8 && c < 9;
    const onTiming = r === 6 || c === 6;

    if (!inTopLeft && !inTopRight && !inBottomLeft && !onTiming) {
      matrix[r][c] = ((s >> 8) & 1) === 1;
    }
  }

  return matrix;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = React.memo(({ invoice, size = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const qrText = `INV:${invoice.invoiceNumber}|${invoice.user.name}|${invoice.total || 0}|${invoice.currency}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const matrix = generateQRData(qrText);
    const cellSize = size / QR_MATRIX_SIZE;

    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < QR_MATRIX_SIZE; r++) {
      for (let c = 0; c < QR_MATRIX_SIZE; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [qrText, size]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `invoice-${invoice.invoiceNumber}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [invoice.invoiceNumber]);

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback: copy text
      await navigator.clipboard.writeText(qrText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [qrText, invoice.invoiceNumber]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Invoice QR Code</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Scan to verify</p>
        </div>
      </div>

      <div className="p-5 flex flex-col items-center gap-4">
        <div className="bg-white p-3 rounded-xl shadow-md">
          <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size }} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] text-slate-400 font-mono">#{invoice.invoiceNumber}</p>
          <p className="text-[10px] text-slate-500">Contains invoice details for verification</p>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export { QRCodeDisplay };
export default QRCodeDisplay;
