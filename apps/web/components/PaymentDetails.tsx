
import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Invoice } from '../types';

interface PaymentDetailsProps {
  invoice: Invoice;
  updateInvoice: (key: keyof Invoice, value: any) => void;
}

const NIGERIAN_BANKS = [
  "Access Bank", "Access Bank (Diamond)", "ALAT by WEMA", "ASO Savings and Loans",
  "Carbon", "CEMCS Microfinance Bank", "Citibank Nigeria", "Ecobank Nigeria",
  "Ekondo Microfinance Bank", "Eyowo", "Fidelity Bank", "First Bank of Nigeria",
  "First City Monument Bank (FCMB)", "FSDH Merchant Bank Limited", "Globus Bank",
  "Guaranty Trust Bank (GTBank)", "Hasal Microfinance Bank", "Heritage Bank",
  "Ibile Microfinance Bank", "Infinity MFB", "Jaiz Bank", "Keystone Bank",
  "Kuda Bank", "Lotus Bank", "Moniepoint MFB", "Nova Merchant Bank",
  "One Finance", "OPay Digital Services Limited (OPay)", "Optimus Bank Limited",
  "Paga", "PalmPay", "Parallex Bank", "Paycom", "Polaris Bank",
  "PremiumTrust Bank", "Providus Bank", "Rand Merchant Bank", "Rubies MFB",
  "Safe Haven MFB", "Signature Bank Limited", "Sparkle Microfinance Bank",
  "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank", "TAJ Bank",
  "TCF MFB", "Titan Bank", "Union Bank of Nigeria", "United Bank for Africa (UBA)",
  "Unity Bank", "VFD Microfinance Bank Limited", "Wema Bank", "Zenith Bank"
];

const PaymentDetails: React.FC<PaymentDetailsProps> = React.memo(({ invoice, updateInvoice }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const paymentDetails = useMemo(() => ({
    bank: invoice.user.bankName || '',
    account: invoice.user.accountNumber || '',
    name: invoice.user.name || '',
    amount: invoice.total || 0,
    currency: invoice.currency,
    invoiceNumber: invoice.invoiceNumber,
    reference: `INV-${invoice.invoiceNumber}-${Date.now()}`,
  }), [invoice]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const generatePaymentLink = useCallback(() => {
    const { bank, account, amount, invoiceNumber } = paymentDetails;
    if (!account) return '';
    const encoded = encodeURIComponent(JSON.stringify({
      bank,
      account,
      amount,
      invoice: invoiceNumber,
    }));
    return `https://pay.invoiceapp.ng/${encoded}`;
  }, [paymentDetails]);

  const fmt = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency,
  }), [invoice.currency]);

  const paymentLink = generatePaymentLink();

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Payment Details</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bank transfer info</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Bank Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Bank Name</label>
          <div className="relative">
            <input
              type="text"
              list="payment-banks"
              value={invoice.user.bankName}
              onChange={(e) => updateInvoice('user', { ...invoice.user, bankName: e.target.value })}
              placeholder="e.g. GTBank"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <datalist id="payment-banks">
              {NIGERIAN_BANKS.map(bank => <option key={bank} value={bank} />)}
            </datalist>
          </div>
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Account Number</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={invoice.user.accountNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateInvoice('user', { ...invoice.user, accountNumber: digits });
              }}
              placeholder="0123456789"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Account Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Account Name</label>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5">
            <span className="text-sm text-slate-300">{invoice.user.name || '—'}</span>
          </div>
        </div>

        {/* Amount to Pay */}
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-xl p-4 border border-teal-500/20">
          <div className="text-[10px] text-teal-300 uppercase tracking-wider font-bold mb-1">Amount to Pay</div>
          <div className="text-2xl font-bold text-white font-mono">{fmt.format(invoice.total || 0)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Invoice #{invoice.invoiceNumber}</div>
        </div>

        {/* Copy Details */}
        <div className="space-y-2">
          <button
            onClick={() => handleCopy(
              `Bank: ${paymentDetails.bank}\nAccount: ${paymentDetails.account}\nName: ${paymentDetails.name}\nAmount: ${fmt.format(paymentDetails.amount)}\nRef: ${paymentDetails.invoiceNumber}`,
              'all'
            )}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            {copiedField === 'all' ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied to Clipboard!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Payment Details
              </>
            )}
          </button>
        </div>

        {/* Payment Link */}
        {paymentLink && (
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Payment Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={paymentLink}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={() => handleCopy(paymentLink, 'link')}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
              >
                {copiedField === 'link' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* QR Code Toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {/* QR Code Section */}
        {showQR && (
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
            <canvas ref={qrCanvasRef} width={120} height={120} className="bg-white rounded-lg" />
            <p className="text-[10px] text-slate-400 text-center">Scan to view payment details</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PaymentDetails;
