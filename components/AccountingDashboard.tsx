import React from 'react';

export const AccountingDashboard: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Accounting Overview</h2>
      <p className="text-slate-500 mb-6">Track your revenue, pending payments, and tax liabilities in one place.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-2">Total Revenue</h3>
          <div className="text-3xl font-bold text-teal-900">₦0.00</div>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2">Pending Invoices</h3>
          <div className="text-3xl font-bold text-amber-900">₦0.00</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Estimated VAT</h3>
          <div className="text-3xl font-bold text-slate-900">₦0.00</div>
        </div>
      </div>

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
         <p className="text-sm text-slate-500">More advanced reporting features coming soon...</p>
      </div>
    </div>
  );
};
