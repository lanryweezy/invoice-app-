import React from 'react';

export const BranchesManager: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Branches Manager</h2>
      <p className="text-slate-500 mb-6">Manage your business branches across different locations. Create separate invoices and track revenue per branch.</p>

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
        <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-lg font-bold text-slate-700 mb-1">No branches added yet</h3>
        <p className="text-sm text-slate-500 mb-4">Click below to add your first branch.</p>
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Add New Branch
        </button>
      </div>
    </div>
  );
};
