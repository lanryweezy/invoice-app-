import React, { useState, useMemo } from 'react';
import type { Expense } from '../types';

// ⚡ Bolt: Cache Intl.NumberFormat instance globally to avoid ~0.6ms overhead per instantiation inside render loop.
const numberFormatter = new Intl.NumberFormat();

interface AccountingDashboardProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ expenses, onAddExpense, onRemoveExpense }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software');
  const [revenueMock] = useState(205000);

  const handleExportCSV = () => {
    // Generate CSV from actual expenses
    let csvContent = ["ID,Description,Date,Category,Amount"];
    expenses.forEach(exp => {
        csvContent.push(`${exp.id},"${exp.description}",${exp.date},${exp.category},${exp.amount}`);
    });

    const blob = new Blob([csvContent.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "invoiceapp_expenses_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!desc || !amount) return;
      onAddExpense({
          description: desc,
          amount: Number(amount),
          date: new Date().toISOString().split('T')[0],
          category
      });
      setDesc('');
      setAmount('');
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-6">
          <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accounting & Expenses</h2>
              <p className="text-slate-500">Track your revenue and log your business expenses.</p>
          </div>
          <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-slate-300"
          >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export Expenses CSV
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-2">Total Revenue (Mocked)</h3>
          <div className="text-3xl font-bold text-teal-900">₦{numberFormatter.format(revenueMock)}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-2">Total Expenses</h3>
          <div className="text-3xl font-bold text-red-900">₦{numberFormatter.format(totalExpenses)}</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Net Profit</h3>
          <div className="text-3xl font-bold text-slate-900">₦{numberFormatter.format(revenueMock - totalExpenses)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
              <h3 className="font-bold text-slate-900 mb-4">Log New Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                      <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 outline-none" placeholder="e.g. Server hosting" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Amount</label>
                          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 outline-none" required min="0" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 outline-none">
                              <option>Software</option>
                              <option>Hardware</option>
                              <option>Marketing</option>
                              <option>Travel</option>
                              <option>Other</option>
                          </select>
                      </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Add Expense</button>
              </form>
          </div>
          <div>
              <h3 className="font-bold text-slate-900 mb-4">Recent Expenses</h3>
              {expenses.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No expenses logged yet.</p>
              ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {expenses.map(exp => (
                          <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div>
                                  <p className="font-bold text-slate-900 text-sm">{exp.description}</p>
                                  <p className="text-xs text-slate-500">{exp.date} • {exp.category}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                  <p className="font-bold text-red-600">₦{numberFormatter.format(exp.amount)}</p>
                                  <button
                                      onClick={() => onRemoveExpense(exp.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors"
                                      aria-label={`Remove ${exp.description} expense`}
                                      title="Remove expense"
                                  >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
