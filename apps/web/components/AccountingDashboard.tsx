import React, { useState, useMemo } from 'react';
import type { Expense, Invoice } from '../types';

const numberFormatter = new Intl.NumberFormat();

const EXPENSE_CATEGORIES = [
  'Software', 'Hardware', 'Marketing', 'Travel', 'Rent', 'Utilities',
  'Salaries', 'Professional Services', 'Office Supplies', 'Internet & Phone', 'Other'
];

type DateRange = 'all' | 'month' | 'quarter' | 'year' | 'custom';

interface AccountingDashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

function filterByDateRange<T extends { date?: string; issueDate?: string }>(
  items: T[], range: DateRange, customFrom?: string, customTo?: string
): T[] {
  if (range === 'all') return items;
  const now = new Date();
  const start = new Date();

  if (range === 'month') {
    start.setFullYear(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    start.setFullYear(now.getFullYear(), q * 3, 1);
  } else if (range === 'year') {
    start.setFullYear(now.getFullYear(), 0, 1);
  } else if (range === 'custom' && customFrom && customTo) {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    to.setHours(23, 59, 59);
    return items.filter(item => {
      const d = new Date(item.date || item.issueDate || '');
      return d >= from && d <= to;
    });
  }

  start.setHours(0, 0, 0, 0);
  return items.filter(item => {
    const d = new Date(item.date || item.issueDate || '');
    return d >= start;
  });
}

function getMonthlyData(invoices: Invoice[], expenses: Expense[]) {
  const months: Record<string, { revenue: number; expenses: number; vat: number; wht: number; count: number }> = {};
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = { revenue: 0, expenses: 0, vat: 0, wht: 0, count: 0 };
  }

  invoices.forEach(inv => {
    const key = inv.issueDate?.substring(0, 7);
    if (months[key]) {
      months[key].revenue += inv.total || 0;
      months[key].vat += inv.tax || 0;
      months[key].wht += inv.whtAmount || 0;
      months[key].count++;
    }
  });

  expenses.forEach(exp => {
    const key = exp.date?.substring(0, 7);
    if (months[key]) {
      months[key].expenses += exp.amount;
    }
  });

  return Object.entries(months).map(([key, data]) => ({
    month: key,
    label: new Date(key + '-01').toLocaleDateString('en-NG', { month: 'short' }),
    ...data,
    profit: data.revenue - data.expenses,
  }));
}

function getAgedReceivables(invoices: Invoice[]) {
  const now = new Date();
  const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, over90: 0 };
  const details: { client: string; amount: number; days: number; invoiceNumber: string; dueDate: string }[] = [];

  invoices.forEach(inv => {
    if (inv.status === 'Paid' || inv.status === 'Draft') return;
    const due = new Date(inv.dueDate);
    const days = Math.floor((now.getTime() - due.getTime()) / 86400000);
    const amount = inv.total || 0;

    if (days <= 0) buckets.current += amount;
    else if (days <= 30) buckets.d1_30 += amount;
    else if (days <= 60) buckets.d31_60 += amount;
    else if (days <= 90) buckets.d61_90 += amount;
    else buckets.over90 += amount;

    details.push({ client: inv.client.name, amount, days: Math.max(0, days), invoiceNumber: inv.invoiceNumber, dueDate: inv.dueDate });
  });

  return { buckets, details: details.sort((a, b) => b.days - a.days) };
}

function getPnLData(invoices: Invoice[], expenses: Expense[]) {
  const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const costOfSales = 0;
  const grossProfit = revenue - costOfSales;

  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(exp => {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  });
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const operatingProfit = grossProfit - totalExpenses;

  const vatCollected = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
  const whtSuffered = invoices.reduce((sum, inv) => sum + (inv.whtAmount || 0), 0);
  const netTax = vatCollected - whtSuffered;

  const netProfit = operatingProfit;

  return { revenue, costOfSales, grossProfit, expenseByCategory, totalExpenses, operatingProfit, vatCollected, whtSuffered, netTax, netProfit };
}

function BarChart({ data, maxValue }: { data: { label: string; revenue: number; expenses: number }[]; maxValue: number }) {
  const scale = maxValue > 0 ? 100 / maxValue : 0;
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
          <div className="w-full flex flex-col gap-0.5" style={{ height: `${Math.max((d.revenue * scale), 2)}%` }}>
            <div className="w-full bg-teal-500 rounded-t-sm min-h-[2px]" title={`Revenue: ₦${numberFormatter.format(d.revenue)}`} />
            {d.expenses > 0 && (
              <div className="w-full bg-red-400 rounded-b-sm min-h-[2px]" style={{ height: `${Math.min((d.expenses / (d.revenue || 1)) * 100, 100)}%` }} title={`Expenses: ₦${numberFormatter.format(d.expenses)}`} />
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ invoices = [], expenses, onAddExpense, onRemoveExpense, isPro = false, onUpgrade }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software');
  const [vendor, setVendor] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'transactions' | 'receivables' | 'pnl'>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const filteredInvoices = useMemo(() => filterByDateRange(invoices, dateRange, customFrom, customTo), [invoices, dateRange, customFrom, customTo]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, dateRange, customFrom, customTo), [expenses, dateRange, customFrom, customTo]);

  const stats = useMemo(() => {
    let revenue = 0, totalVat = 0, totalWht = 0, compliantCount = 0, paidCount = 0, overdueCount = 0, pendingCount = 0;
    filteredInvoices.forEach(inv => {
      revenue += inv.total || 0;
      totalVat += inv.tax || 0;
      totalWht += inv.whtAmount || 0;
      if (inv.nrsStatus === 'Verified') compliantCount++;
      if (inv.status === 'Paid') paidCount++;
      else if (inv.status === 'Overdue') overdueCount++;
      else pendingCount++;
    });
    return { revenue, totalVat, totalWht, compliantCount, paidCount, overdueCount, pendingCount };
  }, [filteredInvoices]);

  const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0), [filteredExpenses]);
  const monthlyData = useMemo(() => getMonthlyData(filteredInvoices, filteredExpenses), [filteredInvoices, filteredExpenses]);
  const maxMonthly = useMemo(() => Math.max(...monthlyData.map(m => m.revenue), 1), [monthlyData]);

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredExpenses.forEach(exp => { cats[exp.category] = (cats[exp.category] || 0) + exp.amount; });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const receivables = useMemo(() => getAgedReceivables(filteredInvoices), [filteredInvoices]);
  const pnl = useMemo(() => getPnLData(filteredInvoices, filteredExpenses), [filteredInvoices, filteredExpenses]);

  const visibleInvoices = isPro ? filteredInvoices : filteredInvoices.slice(0, 3);
  const visibleExpenses = isPro ? filteredExpenses : filteredExpenses.slice(0, 10);

  const handleExportCSV = (type: 'expenses' | 'invoices') => {
    let csvContent: string[];
    if (type === 'expenses') {
      csvContent = ["Date,Description,Category,Vendor,Amount"];
      filteredExpenses.forEach(exp => {
        csvContent.push(`${exp.date},"${exp.description}",${exp.category},"${exp.vendor || ''}",${exp.amount}`);
      });
    } else {
      csvContent = ["InvoiceNumber,Client,Date,DueDate,Status,Subtotal,VAT,WHT,Total,NRSStatus"];
      filteredInvoices.forEach(inv => {
        csvContent.push(`${inv.invoiceNumber},"${inv.client.name}",${inv.issueDate},${inv.dueDate},${inv.status},${inv.subtotal || 0},${inv.tax || 0},${inv.whtAmount || 0},${inv.total || 0},${inv.nrsStatus || 'Draft'}`);
      });
    }
    const blob = new Blob([csvContent.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoiceapp_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportPnL = () => {
    const lines = [
      'PROFIT & LOSS STATEMENT',
      `Period: ${dateRange === 'all' ? 'All Time' : dateRange === 'month' ? 'This Month' : dateRange === 'quarter' ? 'This Quarter' : 'This Year'}`,
      `Generated: ${new Date().toLocaleDateString('en-NG')}`,
      '',
      'REVENUE',
      `  Total Revenue,₦${pnl.revenue}`,
      '',
      'COST OF SALES',
      `  Cost of Sales,₦${pnl.costOfSales}`,
      '',
      'GROSS PROFIT,₦${pnl.grossProfit}',
      '',
      'OPERATING EXPENSES',
      ...Object.entries(pnl.expenseByCategory).map(([cat, amt]) => `  ${cat},₦${amt}`),
      `  Total Expenses,₦${pnl.totalExpenses}`,
      '',
      'OPERATING PROFIT,₦${pnl.operatingProfit}',
      '',
      'TAX SUMMARY',
      `  VAT Collected (Output),₦${pnl.vatCollected}`,
      `  WHT Suffered (Input Credit),₦${pnl.whtSuffered}`,
      `  Net Tax Position,₦${pnl.netTax}`,
      '',
      'NET PROFIT,₦${pnl.netProfit}',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoiceapp_pnl_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    if (!isPro && expenses.length >= 5) { onUpgrade?.(); return; }
    onAddExpense({ description: desc, amount: Number(amount), date: new Date().toISOString().split('T')[0], category, vendor });
    setDesc(''); setAmount(''); setVendor('');
  };

  const rangeLabel = dateRange === 'all' ? 'All Time' : dateRange === 'month' ? 'This Month' : dateRange === 'quarter' ? 'This Quarter' : dateRange === 'year' ? 'This Year' : 'Custom';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Dashboard</h2>
          <p className="text-slate-500 mt-1">Revenue, expenses, tax summaries, and cash flow at a glance.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExportCSV('invoices')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm transition-colors">
            Export Invoices
          </button>
          <button onClick={() => handleExportCSV('expenses')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm transition-colors">
            Export Expenses
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Period:</span>
        {(['all', 'month', 'quarter', 'year'] as DateRange[]).map(r => (
          <button key={r} onClick={() => setDateRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
              dateRange === r ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {r === 'all' ? 'All Time' : r === 'month' ? 'This Month' : r === 'quarter' ? 'This Quarter' : 'This Year'}
          </button>
        ))}
        <button onClick={() => setDateRange('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            dateRange === 'custom' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
          Custom
        </button>
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:border-teal-500 outline-none" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:border-teal-500 outline-none" />
          </div>
        )}
        <span className="text-[10px] text-slate-400 ml-auto">{rangeLabel} · {filteredInvoices.length} invoices · {filteredExpenses.length} expenses</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
          <p className="text-2xl font-black text-teal-600 mt-1">₦{numberFormatter.format(stats.revenue)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{filteredInvoices.length} invoices</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
          <p className="text-2xl font-black text-red-500 mt-1">₦{numberFormatter.format(totalExpenses)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{filteredExpenses.length} entries</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
          <p className={`text-2xl font-black mt-1 ${stats.revenue - totalExpenses >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            ₦{numberFormatter.format(stats.revenue - totalExpenses)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{stats.revenue > 0 ? Math.round(((stats.revenue - totalExpenses) / stats.revenue) * 100) : 0}% margin</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VAT Collected</p>
          <p className="text-2xl font-black text-blue-600 mt-1">₦{numberFormatter.format(stats.totalVat)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Output VAT</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WHT Suffered</p>
          <p className="text-2xl font-black text-amber-600 mt-1">₦{numberFormatter.format(stats.totalWht)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Tax credit</p>
        </div>
      </div>

      {/* Invoice Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <p className="text-2xl font-black text-teal-900">{stats.paidCount}</p>
            <p className="text-[10px] font-bold text-teal-600 uppercase">Paid</p>
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-900">{stats.pendingCount}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-black text-red-900">{stats.overdueCount}</p>
            <p className="text-[10px] font-bold text-red-600 uppercase">Overdue</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {(['overview', 'expenses', 'transactions', 'receivables', 'pnl'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab === 'pnl' ? 'P&L' : tab === 'receivables' ? 'Receivables' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">12-Month Cash Flow</h3>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-teal-500 rounded-sm" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-sm" /> Expenses</span>
          </div>
          <BarChart data={monthlyData} maxValue={maxMonthly} />
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Recent Expenses</h3>
            {visibleExpenses.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-8 text-center">No expenses logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {visibleExpenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">{exp.category === 'Software' ? '💻' : exp.category === 'Marketing' ? '📢' : exp.category === 'Travel' ? '✈️' : '📋'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{exp.description}</p>
                        <p className="text-[10px] text-slate-500">{exp.date} · {exp.category}{exp.vendor ? ` · ${exp.vendor}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="font-bold text-red-600 text-sm">₦{numberFormatter.format(exp.amount)}</p>
                      <button onClick={() => {
                        if (confirm(`Delete "${exp.description}" expense?`)) {
                          onRemoveExpense(exp.id);
                        }
                      }} className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Log Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input aria-label="Expense description" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" placeholder="Description" required />
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Expense amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" placeholder="Amount" required min="0" />
                  <select aria-label="Expense category" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none cursor-pointer">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <input aria-label="Vendor name (optional)" value={vendor} onChange={e => setVendor(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" placeholder="Vendor (optional)" />
                <button type="submit" className="w-full py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors text-sm">
                  Add Expense
                </button>
              </form>
            </div>

            {categoryBreakdown.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">By Category</h3>
                <div className="space-y-2">
                  {categoryBreakdown.map(([cat, total]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-bold text-slate-900">₦{numberFormatter.format(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 relative">
          {!isPro && filteredInvoices.length > 3 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm">
                <h3 className="text-xl font-bold mb-2">Unlock Full History</h3>
                <p className="text-slate-400 text-sm mb-6">Free accounts show the last 3 invoices. Upgrade for unlimited history.</p>
                <button onClick={onUpgrade} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl uppercase tracking-widest text-xs">
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
          <h3 className="font-bold text-slate-900 mb-4">Invoice History</h3>
          {visibleInvoices.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-8 text-center">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleInvoices.map(inv => (
                <div key={inv.invoiceNumber} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">#{inv.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-500">{inv.client.name} · {inv.issueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-700 text-sm">₦{numberFormatter.format(inv.total || 0)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inv.status === 'Paid' ? 'bg-teal-100 text-teal-700' :
                      inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                      inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'receivables' && (
        <div className="space-y-6">
          {/* Aged Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
              <p className="text-lg font-black text-teal-600 mt-1">₦{numberFormatter.format(receivables.buckets.current)}</p>
              <p className="text-[10px] text-slate-500">Not yet due</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">1–30 Days</p>
              <p className="text-lg font-black text-amber-600 mt-1">₦{numberFormatter.format(receivables.buckets.d1_30)}</p>
              <p className="text-[10px] text-slate-500">Slightly overdue</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-orange-200">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">31–60 Days</p>
              <p className="text-lg font-black text-orange-600 mt-1">₦{numberFormatter.format(receivables.buckets.d31_60)}</p>
              <p className="text-[10px] text-slate-500">Needs follow-up</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-red-200">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">61–90 Days</p>
              <p className="text-lg font-black text-red-600 mt-1">₦{numberFormatter.format(receivables.buckets.d61_90)}</p>
              <p className="text-[10px] text-slate-500">Seriously overdue</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-red-300">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">90+ Days</p>
              <p className="text-lg font-black text-red-800 mt-1">₦{numberFormatter.format(receivables.buckets.over90)}</p>
              <p className="text-[10px] text-slate-500">At risk of bad debt</p>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Outstanding Invoices</h3>
              <p className="text-xs text-slate-500">
                Total: <span className="font-bold text-slate-900">₦{numberFormatter.format(
                  receivables.buckets.current + receivables.buckets.d1_30 + receivables.buckets.d31_60 + receivables.buckets.d61_90 + receivables.buckets.over90
                )}</span>
              </p>
            </div>
            {receivables.details.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-8 text-center">No outstanding invoices — all paid!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 pr-4">Client</th>
                      <th className="pb-2 pr-4">Invoice</th>
                      <th className="pb-2 pr-4">Due Date</th>
                      <th className="pb-2 pr-4 text-right">Days Overdue</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivables.details.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-3 pr-4 font-semibold text-slate-900">{item.client}</td>
                        <td className="py-3 pr-4 text-slate-600">#{item.invoiceNumber}</td>
                        <td className="py-3 pr-4 text-slate-500">{item.dueDate}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.days <= 0 ? 'bg-teal-100 text-teal-700' :
                            item.days <= 30 ? 'bg-amber-100 text-amber-700' :
                            item.days <= 60 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.days <= 0 ? `${Math.abs(item.days)}d early` : `${item.days}d`}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">₦{numberFormatter.format(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Profit & Loss Statement</h3>
                <p className="text-xs text-slate-500 mt-1">{rangeLabel}</p>
              </div>
              <button onClick={handleExportPnL}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm transition-colors">
                Export P&L
              </button>
            </div>

            <div className="space-y-1">
              {/* Revenue */}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Total Revenue</span>
                <span className="text-sm font-bold text-teal-600">₦{numberFormatter.format(pnl.revenue)}</span>
              </div>

              {/* Cost of Sales */}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Cost of Sales</span>
                <span className="text-sm font-bold text-red-500">₦{numberFormatter.format(pnl.costOfSales)}</span>
              </div>

              {/* Gross Profit */}
              <div className="flex justify-between items-center py-3 border-b-2 border-slate-300 bg-slate-50 -mx-3 px-3 rounded-lg">
                <span className="text-sm font-black text-slate-900">Gross Profit</span>
                <span className="text-sm font-black text-slate-900">₦{numberFormatter.format(pnl.grossProfit)}</span>
              </div>

              {/* Expenses */}
              <div className="pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</p>
              </div>
              {Object.entries(pnl.expenseByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between items-center py-2 pl-4">
                  <span className="text-sm text-slate-600">{cat}</span>
                  <span className="text-sm text-slate-700">₦{numberFormatter.format(amt)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Total Expenses</span>
                <span className="text-sm font-bold text-red-500">₦{numberFormatter.format(pnl.totalExpenses)}</span>
              </div>

              {/* Operating Profit */}
              <div className="flex justify-between items-center py-3 border-b-2 border-slate-300 bg-slate-50 -mx-3 px-3 rounded-lg">
                <span className="text-sm font-black text-slate-900">Operating Profit</span>
                <span className={`text-sm font-black ${pnl.operatingProfit >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                  ₦{numberFormatter.format(pnl.operatingProfit)}
                </span>
              </div>

              {/* Tax Summary */}
              <div className="pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Summary</p>
              </div>
              <div className="flex justify-between items-center py-2 pl-4">
                <span className="text-sm text-slate-600">VAT Collected (Output)</span>
                <span className="text-sm text-blue-600">₦{numberFormatter.format(pnl.vatCollected)}</span>
              </div>
              <div className="flex justify-between items-center py-2 pl-4">
                <span className="text-sm text-slate-600">WHT Suffered (Input Credit)</span>
                <span className="text-sm text-amber-600">₦{numberFormatter.format(pnl.whtSuffered)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Net Tax Position</span>
                <span className={`text-sm font-bold ${pnl.netTax >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₦{numberFormatter.format(pnl.netTax)}
                </span>
              </div>

              {/* Net Profit */}
              <div className="flex justify-between items-center py-4 bg-slate-900 text-white -mx-3 px-3 rounded-xl mt-2">
                <span className="text-sm font-black uppercase tracking-wider">Net Profit</span>
                <span className="text-lg font-black">₦{numberFormatter.format(pnl.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
