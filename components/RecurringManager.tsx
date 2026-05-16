import React from 'react';
import type { Invoice } from '../types';

// ⚡ Bolt: Cache Intl.NumberFormat instance globally to avoid ~0.6ms overhead per instantiation inside render loop.
const numberFormatter = new Intl.NumberFormat();

interface RecurringManagerProps {
  recurringInvoices: Invoice[];
  onGenerateNext: (invoice: Invoice) => void;
  onRemove: (index: number) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringInvoices, onGenerateNext, onRemove }) => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Recurring Invoices</h2>
      <p className="text-slate-500 mb-6">Manage your automated billing templates. Click "Generate Next" to quickly load the template with updated dates.</p>

      {recurringInvoices.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No recurring templates yet</h3>
          <p className="text-sm text-slate-500 mb-4">Set up a recurring schedule in the invoice editor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recurringInvoices.map((inv, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <h3 className="font-bold text-slate-900">{inv.client.name || 'Unnamed Client'}</h3>
                <p className="text-sm text-slate-500 capitalize">Repeats: {inv.recurringFrequency}</p>
                <p className="text-xs text-slate-400 mt-1">Amount: {inv.currency} {inv.total != null ? numberFormatter.format(inv.total) : '---'}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => onGenerateNext(inv)}
                  className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Generate Next
                </button>
                <button
                  onClick={() => onRemove(idx)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Template"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
