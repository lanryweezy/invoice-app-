import { numberFormatter } from "../utils/formatters";
import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (paymentDetails: { paymentMethod: string; transactionReference: string; paymentDate: string; amountPaid: number }) => void;
    invoice: Invoice;
    totalAmount: number;
}

const QUICK_METHODS = [
    { value: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer' },
    { value: 'Paystack', icon: '💳', desc: 'Card / USSD / Bank' },
    { value: 'Flutterwave', icon: '🌊', desc: 'Card / Bank / Mobile' },
    { value: 'Cash', icon: '💵', desc: 'Physical cash' },
    { value: 'OPay', icon: '📱', desc: 'OPay wallet' },
    { value: 'Other', icon: '📋', desc: 'Other method' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSubmit, invoice, totalAmount }) => {
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [transactionReference, setTransactionReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [amountPaid, setAmountPaid] = useState(totalAmount);
    const [showAllMethods, setShowAllMethods] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(totalAmount);
            setPaymentMethod('Bank Transfer');
            setTransactionReference('');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setShowAllMethods(false);
            setLoading(false);
        }
    }, [isOpen, totalAmount]);

    if (!isOpen) return null;

    const isFullPayment = amountPaid >= totalAmount;
    const isPartial = amountPaid > 0 && amountPaid < totalAmount;
    const remaining = Math.max(0, totalAmount - amountPaid);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amountPaid <= 0) return;
        setLoading(true);
        try {
            onSubmit({ paymentMethod, transactionReference, paymentDate, amountPaid: Number(amountPaid) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <h2 id="payment-modal-title" className="text-base font-bold text-slate-900">Record Payment</h2>
                        <button onClick={onClose} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {/* Invoice summary */}
                    <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">#{invoice.invoiceNumber}</p>
                            <p className="text-xs text-slate-600">{invoice.client.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400">Due</p>
                            <p className="text-sm font-black text-slate-900">{invoice.currency} {numberFormatter.format(totalAmount)}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
                    {/* Amount */}
                    <div>
                        <label htmlFor="amountPaid" className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{invoice.currency}</span>
                            <input
                                id="amountPaid"
                                type="number"
                                step="0.01"
                                min="0"
                                max={totalAmount * 1.5}
                                required
                                value={amountPaid}
                                onChange={e => setAmountPaid(Number(e.target.value))}
                                className="w-full pl-14 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                        {/* Payment status indicator */}
                        <div className="flex items-center gap-2 mt-2">
                            {isFullPayment ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Full Payment
                                </span>
                            ) : isPartial ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                    Partial — ₦{numberFormatter.format(remaining)} remaining
                                </span>
                            ) : null}
                            {amountPaid > totalAmount && (
                                <span className="text-xs text-slate-400">Overpayment of ₦{numberFormatter.format(amountPaid - totalAmount)}</span>
                            )}
                        </div>
                    </div>

                    {/* Quick Method Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(showAllMethods ? [
                                ...QUICK_METHODS,
                                { value: 'Flutterwave', icon: '🌊', desc: 'Card / Bank' },
                                { value: 'Monnify', icon: '🔗', desc: 'Bank / Card' },
                                { value: 'Kora', icon: '💳', desc: 'Bank transfer' },
                                { value: 'Squad', icon: '⚡', desc: 'Instant pay' },
                                { value: 'Interswitch', icon: '🔄', desc: 'Card / Bank' },
                                { value: 'Fincra', icon: '💰', desc: 'Business pay' },
                            ] : QUICK_METHODS).map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setPaymentMethod(m.value)}
                                    className={`p-2 rounded-lg border text-left transition-all ${
                                        paymentMethod === m.value
                                            ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/20'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <span className="text-sm">{m.icon}</span>
                                    <p className="text-[10px] font-bold text-slate-900 mt-0.5">{m.value}</p>
                                </button>
                            ))}
                        </div>
                        {!showAllMethods && (
                            <button type="button" onClick={() => setShowAllMethods(true)} className="text-xs text-teal-600 font-bold mt-2 hover:underline">
                                Show more methods
                            </button>
                        )}
                    </div>

                    {/* Date + Reference */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="paymentDate" className="block text-[10px] font-bold text-slate-500 mb-1">Date</label>
                            <input
                                id="paymentDate"
                                type="date"
                                required
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="txnRef" className="block text-[10px] font-bold text-slate-500 mb-1">Ref (optional)</label>
                            <input
                                id="txnRef"
                                type="text"
                                placeholder="TXN-123"
                                value={transactionReference}
                                onChange={e => setTransactionReference(e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 px-3 py-2.5 text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-xs">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || amountPaid <= 0}
                            className="flex-1 px-3 py-2.5 text-white font-bold bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-teal-600/20 transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                            {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>}
                            {isFullPayment ? 'Record Full Payment' : isPartial ? 'Record Partial Payment' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
