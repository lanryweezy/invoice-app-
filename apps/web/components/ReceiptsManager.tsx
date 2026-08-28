import React, { useState, useMemo } from 'react';
import type { Receipt, TemplateId } from '../types';
import { DownloadIcon, EyeIcon } from './Icons';
import { numberFormatter } from '../utils/formatters';

interface ReceiptsManagerProps {
    receipts: Receipt[];
    onViewReceipt: (receipt: Receipt) => void;
    onRemoveReceipt: (id: string) => void;
}

export const ReceiptsManager: React.FC<ReceiptsManagerProps & { isPro?: boolean; onUpgrade?: () => void }> = ({ receipts, onViewReceipt, onRemoveReceipt, isPro, onUpgrade }) => {


    return (
        <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden ">
           {!isPro && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/40 backdrop-blur-[2px] rounded-2xl">
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-100 text-center max-w-sm mx-auto">
                    <p className="text-lg font-bold text-slate-900 mb-2">Professional Receipts</p>
                    <p className="text-sm text-slate-500 mb-4">Automatically generate and send receipts when an invoice is marked as paid.</p>
                    <button onClick={onUpgrade} type="button" className="px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold w-full hover:bg-teal-700 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">Unlock Pro</button>
                 </div>
              </div>
           )}
           <div className={` ${!isPro ? 'pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Receipts</h2>
            <p className="text-slate-500 mb-6">Manage your generated payment receipts. Receipts are automatically created when you mark an invoice as Paid.</p>

            {receipts.length === 0 ? (
                <div className="bg-gradient-to-b from-slate-50 to-white border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-20"></div>
                        <svg className="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                             <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">No receipts generated yet</h3>
                    <p className="text-slate-500 mb-8 max-w-sm text-center leading-relaxed">
                        Receipts provide proof of payment for your clients. They are automatically generated when you mark an invoice as Paid.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 flex items-center gap-2"
                    >
                        Create your first receipt
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
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
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
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
    </div>
  );
};

