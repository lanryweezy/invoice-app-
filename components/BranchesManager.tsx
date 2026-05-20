import React, { useState } from 'react';

export const BranchesManager: React.FC = () => {
  const [branches, setBranches] = useState([
    { id: 1, name: 'Lagos HQ', address: '123 Victoria Island' },
    { id: 2, name: 'Abuja Office', address: '45 Maitama Way' }
  ]);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranch.name && newBranch.address) {
      setBranches([...branches, { id: Date.now(), ...newBranch }]);
      setNewBranch({ name: '', address: '' });
    }
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Branches Manager</h2>
      <p className="text-slate-500 mb-6">Manage your business branches across different locations.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleAdd} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
             <h3 className="font-bold text-slate-900 mb-2">Add New Branch</h3>
             <div>
                <label htmlFor="branch-name" className="block text-xs font-bold text-slate-500 mb-1 cursor-pointer">Branch Name</label>
                <input id="branch-name" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" placeholder="e.g. Kano Branch" required />
             </div>
             <div>
                <label htmlFor="branch-address" className="block text-xs font-bold text-slate-500 mb-1 cursor-pointer">Address</label>
                <input id="branch-address" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" placeholder="e.g. 10 Zoo Road" required />
             </div>
             <button type="submit" className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Save Branch</button>
          </form>
        </div>

        <div>
           <h3 className="font-bold text-slate-900 mb-4">Active Branches</h3>
           <div className="space-y-3">
             {branches.map(branch => (
               <div key={branch.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex justify-between items-center">
                 <div>
                   <h4 className="font-bold text-teal-800">{branch.name}</h4>
                   <p className="text-sm text-slate-500">{branch.address}</p>
                 </div>
                 <button
                    onClick={() => setBranches(branches.filter(b => b.id !== branch.id))}
                    aria-label={`Delete ${branch.name} branch`}
                    title={`Delete ${branch.name} branch`}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
