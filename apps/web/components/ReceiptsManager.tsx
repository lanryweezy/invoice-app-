import React, { useState, useMemo } from 'react';
import type { Receipt, TemplateId } from '../types';
import { DownloadIcon, EyeIcon } from './Icons';

// ⚡ Bolt: Cache Intl.NumberFormat instance globally to avoid ~0.6ms overhead per instantiation inside render loop.
const numberFormatter = new Intl.NumberFormat();

interface ReceiptsManagerProps {
    receipts: Receipt[];
    onViewReceipt: (receipt: Receipt) => void;
    onRemoveReceipt: (id: string) => void;
}

export const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({ receipts, onViewReceipt, onRemoveReceipt }) => {


    return (
        <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Receipts</h2>
            <p className="text-slate-500 mb-6">Manage your generated payment receipts. Receipts are automatically created when you mark an invoice as Paid.</p>

            {receipts.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No receipts yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Mark an invoice as Paid to generate a receipt.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {receipts.map((receipt) => (
                        <div key={receipt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-900">{receipt.id}</h3>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">Paid</span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Invoice: {receipt.invoiceNumber} • Client: {receipt.invoice?.client?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {receipt.paymentDate} • {receipt.paymentMethod} • {receipt.invoice?.currency} {numberFormatter.format(receipt.amountPaid)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                <button
                                    onClick={() => onViewReceipt(receipt)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors text-sm font-semibold"
                                >
                                    <EyeIcon className="w-4 h-4" /> View
                                </button>
                                <button
                                    onClick={() => {
                                      if (confirm('Delete this receipt? This cannot be undone.')) {
                                        onRemoveReceipt(receipt.id);
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                    title="Delete receipt"
                                    aria-label="Delete receipt"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
