import React, { useState, useMemo } from 'react';
import type { Expense, Invoice } from '../types';

// ⚡ Bolt: Cache Intl.NumberFormat instance globally to avoid ~0.6ms overhead per instantiation inside render loop.
const numberFormatter = new Intl.NumberFormat();

interface AccountingDashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

// ⚡ Bolt: Memoize ExpenseRow to prevent re-rendering all rows when one is added or removed
const ExpenseRow = React.memo(({ exp, numberFormatter, onRemove }: { exp: Expense, numberFormatter: Intl.NumberFormat, onRemove: (id: string) => void }) => {
    return (
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
                <p className="font-bold text-slate-900 text-sm">{exp.description}</p>
                <p className="text-xs text-slate-500">{exp.date} • {exp.category}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="font-bold text-red-600">₦{numberFormatter.format(exp.amount)}</p>
                <button
                    onClick={() => onRemove(exp.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors"
                    aria-label={`Remove ${exp.description} expense`}
                    title="Remove expense"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    );
});

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ invoices = [], expenses, onAddExpense, onRemoveExpense, isPro = false, onUpgrade }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software');

  const stats = useMemo(() => {
    let revenue = 0;
    let totalVat = 0;
    let totalWht = 0;
    let compliantCount = 0;

    invoices.forEach(inv => {
        revenue += inv.total || 0;
        totalVat += inv.tax || 0;
        totalWht += inv.whtAmount || 0;
        if (inv.nrsStatus === 'Verified') compliantCount++;
    });

    return { revenue, totalVat, totalWht, compliantCount };
  }, [invoices]);

  const visibleInvoices = useMemo(() => {
    if (isPro) return invoices;
    return invoices.slice(0, 3); // Free users only see last 3
  }, [invoices, isPro]);

  const handleExportNRS = () => {
    if (!isPro) {
        onUpgrade?.();
        return;
    }
    // Generate CSV specifically for NRS MBS Bulk Upload
    let csvContent = ["InvoiceNumber,IssueDate,SellerTIN,BuyerTIN,Subtotal,VAT,WHT,Total,ComplianceStatus"];
    invoices.forEach(inv => {
        csvContent.push(`${inv.invoiceNumber},${inv.issueDate},${inv.user.tin || ''},${inv.client.tin || ''},${inv.subtotal || 0},${inv.tax || 0},${inv.whtAmount || 0},${inv.total || 0},${inv.nrsStatus || 'Pending'}`);
    });

    const blob = new Blob([csvContent.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NRS_MBS_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      // Limit expenses for free users
      if (!isPro && expenses.length >= 5) {
          onUpgrade?.();
          return;
      }

      onAddExpense({
          description: desc,
          amount: Number(amount),
          date: new Date().toISOString().split('T')[0],
          category
      });
      setDesc('');
      setAmount('');
  };

  const totalExpenses = useMemo(() => expenses.reduce((acc, exp) => acc + exp.amount, 0), [expenses]);

  return (
    <div className="space-y-8">
      {/* NRS Compliance Overview Card */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                          <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          NRS Compliance Report
                      </h2>
                      <p className="text-slate-400 text-sm">Aggregated tax data for July 2026 reporting cycle.</p>
                  </div>
                  <button
                      onClick={handleExportNRS}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-teal-900/40 flex items-center gap-2 text-sm border border-teal-400/20"
                  >
                      {!isPro && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export for NRS MBS Portal
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Output VAT</p>
                      <p className="text-2xl font-bold text-white">₦{numberFormatter.format(stats.totalVat)}</p>
                      <p className="text-[10px] text-teal-400 mt-1 font-bold">Collectable</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total WHT Suffered</p>
                      <p className="text-2xl font-bold text-white">₦{numberFormatter.format(stats.totalWht)}</p>
                      <p className="text-[10px] text-amber-400 mt-1 font-bold">Tax Credit</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compliance Rate</p>
                      <p className="text-2xl font-bold text-white">{invoices.length > 0 ? Math.round((stats.compliantCount / invoices.length) * 100) : 0}%</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">{stats.compliantCount} of {invoices.length} Verified</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MBS Transmission</p>
                      <p className="text-2xl font-bold text-teal-400 italic font-mono">{isPro ? 'ENCRYPTED' : 'UNLOCKED'}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">{isPro ? 'Real-time Active' : 'Upgrade to sync'}</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        {!isPro && invoices.length > 3 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] pt-[400px]">
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm border border-slate-800 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Unlock Full Ledger</h3>
                    <p className="text-slate-400 text-sm mb-6">Free accounts only show the last 3 invoices. Upgrade to Pro for an unlimited, audit-proof history.</p>
                    <button onClick={onUpgrade} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-900/40 uppercase tracking-widest text-xs">
                        Upgrade Now
                    </button>
                </div>
            </div>
        )}

        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Overview</h2>
                <p className="text-slate-500">Track your real revenue from issued invoices and log your business expenses.</p>
            </div>
            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-slate-300 text-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
            <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-2">Real Total Revenue</h3>
            <div className="text-3xl font-bold text-teal-900">₦{numberFormatter.format(stats.revenue)}</div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-2">Total Expenses</h3>
            <div className="text-3xl font-bold text-red-900">₦{numberFormatter.format(totalExpenses)}</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Net Profit</h3>
            <div className="text-3xl font-bold text-slate-900">₦{numberFormatter.format(stats.revenue - totalExpenses)}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-bold text-slate-900 mb-4">Log New Expense</h3>
                <form onSubmit={handleAddExpense} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div>
                        <label htmlFor="expense-desc" className="block text-xs font-bold text-slate-500 mb-1 cursor-pointer">Description</label>
                        <input id="expense-desc" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" placeholder="e.g. Server hosting" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expense-amount" className="block text-xs font-bold text-slate-500 mb-1 cursor-pointer">Amount</label>
                            <input id="expense-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" required min="0" />
                        </div>
                        <div>
                            <label htmlFor="expense-category" className="block text-xs font-bold text-slate-500 mb-1 cursor-pointer">Category</label>
                            <select id="expense-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all cursor-pointer text-sm">
                                <option>Software</option>
                                <option>Hardware</option>
                                <option>Marketing</option>
                                <option>Travel</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center justify-center gap-2">
                        {!isPro && expenses.length >= 5 && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                        Add Expense
                    </button>
                </form>
            </div>
            <div className={!isPro && invoices.length > 3 ? 'blur-[2px] pointer-events-none' : ''}>
                <h3 className="font-bold text-slate-900 mb-4">Historical Transactions</h3>
                {visibleInvoices.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No invoices recorded yet.</p>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {visibleInvoices.map(inv => (
                            <div key={inv.invoiceNumber} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">#{inv.invoiceNumber}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{inv.client.name} • {inv.issueDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-teal-700 text-sm">₦{numberFormatter.format(inv.total || 0)}</p>
                                    <span className={`text-[9px] font-black uppercase ${inv.nrsStatus === 'Verified' ? 'text-teal-500' : 'text-slate-400'}`}>
                                        {inv.nrsStatus || 'Draft'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
