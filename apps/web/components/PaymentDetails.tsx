
import React, { useState, useCallback, useMemo } from 'react';
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

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);

const PaymentDetails: React.FC<PaymentDetailsProps> = React.memo(({ invoice, updateInvoice }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const paymentDetails = useMemo(() => ({
    bank: invoice.user.bankName || '',
    account: invoice.user.accountNumber || '',
    name: invoice.user.name || '',
    amount: invoice.total || 0,
    currency: invoice.currency,
    invoiceNumber: invoice.invoiceNumber,
  }), [invoice]);

  const fullText = useMemo(() =>
    `Payment Details\n\nBank: ${paymentDetails.bank}\nAccount: ${paymentDetails.account}\nName: ${paymentDetails.name}\nAmount: ${fmt(paymentDetails.amount, paymentDetails.currency)}\nRef: ${paymentDetails.invoiceNumber}\n\nPay via InvoiceApp.ng`,
    [paymentDetails]
  );

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      window.prompt('Copy this:', text);
    }
  }, []);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `Hi, here are the payment details for invoice ${paymentDetails.invoiceNumber}:\n\n` +
      `Bank: ${paymentDetails.bank}\n` +
      `Account: ${paymentDetails.account}\n` +
      `Name: ${paymentDetails.name}\n` +
      `Amount: ${fmt(paymentDetails.amount, paymentDetails.currency)}\n\n` +
      `Please make payment and share the receipt. Thank you!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [paymentDetails]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Details — Invoice ${paymentDetails.invoiceNumber}`,
          text: fullText,
        });
      } catch {}
    } else {
      handleCopy(fullText, 'all');
    }
  }, [fullText, paymentDetails, handleCopy]);

  if (!invoice.user.bankName && !invoice.user.accountNumber) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-lg p-6 text-center">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">No bank details set</p>
        <p className="text-xs text-slate-500 mt-1">Add your bank account in the invoice form to show payment details here.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Payment Details</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bank transfer info</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Bank Details Display */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Bank</span>
            <span className="text-sm font-bold text-white">{paymentDetails.bank || 'Not set'}</span>
          </div>
          <div className="h-px bg-slate-700" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Account</span>
            <span className="text-sm font-mono font-bold text-white tracking-wider">{paymentDetails.account || 'Not set'}</span>
          </div>
          <div className="h-px bg-slate-700" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Name</span>
            <span className="text-sm text-slate-300">{paymentDetails.name || '—'}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-xl p-4 border border-teal-500/20 text-center">
          <div className="text-[10px] text-teal-300 uppercase tracking-wider font-bold mb-1">Amount to Pay</div>
          <div className="text-2xl font-black text-white">{fmt(paymentDetails.amount, paymentDetails.currency)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Invoice #{paymentDetails.invoiceNumber}</div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCopy(fullText, 'all')}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors"
          >
            {copiedField === 'all' ? (
              <><svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy</>
            )}
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-xs font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors col-span-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share Payment Details
          </button>
        </div>

        {/* Bank Edit Inputs */}
        <div className="space-y-3 pt-2 border-t border-slate-700">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Edit Bank Details</p>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Bank Name</label>
            <input type="text" list="payment-banks" value={invoice.user.bankName}
              onChange={(e) => updateInvoice('user', { ...invoice.user, bankName: e.target.value })}
              placeholder="e.g. GTBank"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <datalist id="payment-banks">{NIGERIAN_BANKS.map(b => <option key={b} value={b} />)}</datalist>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Account Number</label>
            <input type="text" inputMode="numeric" maxLength={10} value={invoice.user.accountNumber}
              onChange={(e) => updateInvoice('user', { ...invoice.user, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="0123456789"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* QR Toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullText)}`} alt="Payment QR Code" className="w-[120px] h-[120px]" />
            </div>
            <p className="text-[10px] text-slate-400 text-center">Scan to view payment details</p>
          </div>
        )}
      </div>
    </div>
  );
});

export { PaymentDetails };
export default PaymentDetails;
