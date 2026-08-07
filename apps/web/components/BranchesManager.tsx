import React, { useState } from 'react';

interface BranchesManagerProps {
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const BranchesManager: React.FC<BranchesManagerProps> = ({ isPro = false, onUpgrade }) => {
  const [branches, setBranches] = useState([
    { id: 1, name: 'Lagos HQ', address: '123 Victoria Island' }
  ]);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro && branches.length >= 1) {
        onUpgrade?.();
        return;
    }
    if (newBranch.name && newBranch.address) {
      setBranches([...branches, { id: Date.now(), ...newBranch }]);
      setNewBranch({ name: '', address: '' });
    }
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">


      <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Branches Manager</h2>
      <p className="text-slate-500 mb-8">Manage your business branches across different locations and set default addresses.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className={!isPro && branches.length >= 1 ? 'opacity-80' : ''}>
          <form onSubmit={handleAdd} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
             <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs">Add New Branch</h3>
             <div>
                <label htmlFor="branch-name" className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider cursor-pointer">Branch Name</label>
                <input id="branch-name" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm font-semibold" placeholder="e.g. Abuja Office" required />
             </div>
             <div>
                <label htmlFor="branch-address" className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider cursor-pointer">Address</label>
                <textarea id="branch-address" rows={3} value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm font-semibold resize-none" placeholder="Full address..." required />
             </div>
             <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">Save Location</button>
          </form>
        </div>

        <div>
           <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
               Active Locations
               <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">{branches.length}</span>
           </h3>
           <div className="space-y-4">
             {branches.map(branch => (
               <div key={branch.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center group hover:border-teal-500 transition-colors">
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg leading-tight">{branch.name}</h4>
                   <p className="text-xs text-slate-500 mt-1">{branch.address}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    {branch.id === 1 && <span className="bg-teal-50 text-teal-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-teal-100">HQ</span>}
                    <button
                        onClick={() => {
                          if (confirm(`Delete "${branch.name}" branch? This cannot be undone.`)) {
                            setBranches(branches.filter(b => b.id !== branch.id));
                          }
                        }}
                        aria-label={`Delete ${branch.name} branch`}
                        title={`Delete ${branch.name} branch`}
                        className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
               </div>
             ))}
             {!isPro && (
                 <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col items-center justify-center text-center mt-4">
                     <p className="text-sm font-medium text-teal-800 mb-3">Growing fast? Add unlimited branches.</p>
                     <button onClick={onUpgrade} className="px-4 py-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold rounded-lg text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]">
                        Unlock Multiple Locations
                     </button>
                 </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
