
import React, { useRef, useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import type { Invoice } from '../types';

interface QRCodeDisplayProps {
  invoice: Invoice;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ invoice, size = 256 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    const data = JSON.stringify({
      type: 'invoice',
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      currency: invoice.currency,
      issuer: invoice.user.name,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
    });

    try {
      const url = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }, [invoice, size]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${invoice.invoiceNumber}.png`;
    link.click();
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR-${invoice.invoiceNumber}.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
      <h3 className="font-bold text-slate-900 mb-4">Invoice QR Code</h3>
      <div className="flex justify-center mb-4">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR for invoice ${invoice.invoiceNumber}`} className="rounded-xl border border-slate-100" style={{ width: size, height: size }} />
        ) : (
          <div className="bg-slate-100 rounded-xl animate-pulse" style={{ width: size, height: size }} />
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4">Scan to verify invoice #{invoice.invoiceNumber}</p>
      <div className="flex gap-2 justify-center">
        <button onClick={handleDownload} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-sm hover:bg-teal-700 transition-colors">
          Download
        </button>
        <button onClick={handleCopy} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
