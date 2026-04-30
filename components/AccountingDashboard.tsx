import React from 'react';

export const AccountingDashboard: React.FC = () => {

  const handleExportCSV = () => {
    // In a real app, you would fetch all the user's invoices here.
    // For this prototype, we'll create a sample CSV structure to demonstrate the feature.
    const csvContent = [
      ["Invoice Number", "Client Name", "Issue Date", "Due Date", "Status", "Subtotal", "Tax", "WHT", "Total"],
      ["INV-2026-001", "Acme Corp", "2026-04-01", "2026-04-08", "Paid", "150000", "11250", "7500", "153750"],
      ["INV-2026-002", "Globex Inc", "2026-04-15", "2026-04-22", "Sent", "50000", "3750", "2500", "51250"],
      ["INV-2026-003", "Initech", "2026-04-28", "2026-05-05", "Draft", "200000", "15000", "10000", "205000"]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "naija_invoices_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-6">
          <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accounting Overview</h2>
              <p className="text-slate-500">Track your revenue, pending payments, and tax liabilities in one place.</p>
          </div>
          <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors border border-slate-300"
          >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
          </button>
      </div>

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
