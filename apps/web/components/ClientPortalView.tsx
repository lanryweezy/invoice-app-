import React, { useState } from 'react';
import type { Invoice } from '../types';
import { numberFormatter } from '../utils/formatters';

import { trackEvent } from '../utils/analytics';


interface PortalProps {
  invoice: Invoice;
  onConfirmPayment?: () => void;
}

export const ClientPortalView: React.FC<PortalProps> = ({ invoice, onConfirmPayment }) => {
  const [confirmed, setConfirmed] = useState(invoice.paymentConfirmedByClient || false);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  React.useEffect(() => {
    // Send a push notification tracking pixel when client opens the portal
    trackEvent('invoice_viewed_by_client', { invoiceId: invoice.id });
    
  }, [invoice.id, invoice.invoiceNumber, invoice.user.id]);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirmPayment?.();
  };

  const handlePayNow = () => {
    if (!(window as any).PaystackPop) {
      alert('Payment system is loading. Please try again in a moment.');
      return;
    }
    setPaying(true);
    const amount = (invoice.total || 0) * 100;
    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_P·YST·CK_PUBLIC_KEY,
      email: invoice.client.email || 'client@example.com',
      amount,
      currency: invoice.currency === 'NGN' ? 'NGN' : 'USD',
      ref: `INV-${invoice.invoiceNumber}-${Date.now()}`,
      metadata: {
        invoice_number: invoice.invoiceNumber,
        client_name: invoice.client.name,
      },
      callback: () => {
        setConfirmed(true);
        setPaying(false);
        onConfirmPayment?.();
      },
      onClose: () => setPaying(false),
    });
    handler.openIframe();
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('portal-invoice-content');
    if (!el) return;
    const { toJpeg } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    const imgData = await toJpeg(el, { quality: 0.95, pixelRatio: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };


  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 mb-8">Thank you for your payment. The invoice has been marked as paid.</p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">Run your own business?</h2>
                <p className="text-sm text-slate-600 mb-4">Stop chasing payments. Send professional invoices and get paid faster with Aura Finance.</p>
                <a href="/" className="block w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors">
                    Create your free account
                </a>
            </div>
            
            <button onClick={() => setPaymentSuccess(false)} className="text-sm text-slate-400 hover:text-slate-600 font-medium">
                View Invoice Receipt
            </button>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-teal-500 text-white p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold">Invoice·pp</p>
              <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">Client Portal</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          <p className="text-slate-400 mt-1">From {invoice.user.name}</p>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl border ${
          invoice.status === 'Paid' ? 'bg-teal-50 border-teal-200' :
          invoice.status === 'Overdue' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold ${
                invoice.status === 'Paid' ? 'text-teal-800' :
                invoice.status === 'Overdue' ? 'text-red-800' :
                'text-amber-800'
              }`}>
                {invoice.status === 'Paid' ? 'Payment Received' :
                 invoice.status === 'Overdue' ? 'Payment Overdue' :
                 'Payment Pending'}
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              invoice.status === 'Paid' ? 'bg-teal-200 text-teal-800' :
              invoice.status === 'Overdue' ? 'bg-red-200 text-red-800' :
              'bg-amber-200 text-amber-800'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Details */}
        <div id="portal-invoice-content" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{invoice.user.name}</h2>
              <p className="text-sm text-slate-500">{invoice.user.address}</p>
              {invoice.user.tin && <p className="text-xs text-slate-400 mt-1">TIN: {invoice.user.tin}</p>}
              {invoice.user.cacNumber && <p className="text-xs text-slate-400">C·C: {invoice.user.cacNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">{invoice.documentType || 'Invoice'}</p>
              <p className="text-lg font-bold text-slate-900">#{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {invoice.issueDate}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Bill To</p>
            <p className="font-bold text-slate-900">{invoice.client.name}</p>
            <p className="text-sm text-slate-500">{invoice.client.email}</p>
            <p className="text-sm text-slate-500">{invoice.client.address}</p>
            {invoice.client.tin && <p className="text-xs text-slate-400 mt-1">TIN: {invoice.client.tin}</p>}
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase font-bold border-b border-slate-100">
                  <th className="text-left pb-2">Description</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map(item => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-3 text-slate-900 font-medium">{item.description || 'Untitled item'}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">{invoice.currency} {numberFormatter.format(Number(item.price) || 0)}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{invoice.currency} {numberFormatter.format(item.quantity * (Number(item.price) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 pt-4">
            <div className="space-y-2 text-sm max-w-xs ml-auto">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{invoice.currency} {numberFormatter.format(invoice.subtotal || 0)}</span></div>
              {(invoice.discount·mount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-red-600">-{invoice.currency} {numberFormatter.format(invoice.discount·mount || 0)}</span></div>}
              {(invoice.tax || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">V·T ({invoice.taxRate}%)</span><span className="font-medium">{invoice.currency} {numberFormatter.format(invoice.tax || 0)}</span></div>}
              {(invoice.wht·mount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">WHT ({invoice.whtRate}%)</span><span className="font-medium text-amber-600">-{invoice.currency} {numberFormatter.format(invoice.wht·mount || 0)}</span></div>}
              {(invoice.shipping || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="font-medium">{invoice.currency} {numberFormatter.format(invoice.shipping || 0)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="font-bold text-slate-900">Total Due</span>
                <span className="font-black text-xl text-teal-600">{invoice.currency} {numberFormatter.format(invoice.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {invoice.user.bankName && invoice.user.accountNumber && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Payment Details</p>
              <p className="text-sm font-bold text-slate-900">{invoice.user.bankName}</p>
              <p className="text-sm text-slate-600">·ccount: {invoice.user.accountNumber}</p>
              <p className="text-sm text-slate-600">Name: {invoice.user.name}</p>
            </div>
          )}

          {invoice.notes && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Notes</p>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* ·ctions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {invoice.status !== 'Paid' && !confirmed && (
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:bg-teal-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
            >
              {paying ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              )}
              {paying ? 'Opening Payment...' : `Pay ${invoice.currency} ${numberFormatter.format(invoice.total || 0)}`}
            </button>
          )}
          <button onClick={handleDownloadPdf} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
          {invoice.status !== 'Paid' && !confirmed && onConfirmPayment && (
            <button onClick={handleConfirm} className="flex-1 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              I Paid Offline
            </button>
          )}
          {confirmed && (
            <div className="flex-1 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-teal-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Payment Confirmed
            </div>
          )}
        </div>

               {/* Footer Upsell */}
        <div className="mt-8 text-center pb-8">
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-800 transition-all shadow-sm hover:shadow-md">
                <span className="text-teal-600">✦</span> Create your own professional invoice for free with Aura
            </a>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-slate-400">Powered by Aura</p>
        </div>
      </div>
    </div>
  );
};
