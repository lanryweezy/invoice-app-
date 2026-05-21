import React, { useState } from 'react';
import type { Invoice } from '../types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (paymentDetails: { paymentMethod: string; transactionReference: string; paymentDate: string; amountPaid: number }) => void;
    invoice: Invoice;
    totalAmount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSubmit, invoice, totalAmount }) => {
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [transactionReference, setTransactionReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [amountPaid, setAmountPaid] = useState(totalAmount);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ paymentMethod, transactionReference, paymentDate, amountPaid: Number(amountPaid) });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
                    <button onClick={onClose} aria-label="Close payment modal" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label htmlFor="amountPaid" className="block text-sm font-semibold text-slate-700 mb-2">Amount Paid ({invoice.currency})</label>
                        <input
                            id="amountPaid"
                            type="number"
                            step="0.01"
                            required
                            value={amountPaid}
                            onChange={e => setAmountPaid(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-semibold text-slate-700 mb-2">Payment Date</label>
                        <input
                            id="paymentDate"
                            type="date"
                            required
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="Paystack">Paystack</option>
                            <option value="Card">Card</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="transactionReference" className="block text-sm font-semibold text-slate-700 mb-2">Transaction Reference (Optional)</label>
                        <input
                            id="transactionReference"
                            type="text"
                            placeholder="e.g. TXN-123456"
                            value={transactionReference}
                            onChange={e => setTransactionReference(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 text-white font-semibold bg-teal-500 hover:bg-teal-600 rounded-xl shadow-sm shadow-teal-500/20 transition-all"
                        >
                            Save & Generate Receipt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
