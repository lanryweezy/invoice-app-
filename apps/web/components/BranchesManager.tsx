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
      {!isPro && branches.length >= 1 && (
          <div className="absolute bottom-8 right-8 z-20">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl max-w-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="font-bold text-teal-400 text-sm mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      Premium Feature
                  </h4>
                  <p className="text-slate-400 text-xs mb-4">Multi-location management is for Pro users. Add unlimited branches and track location-specific revenue.</p>
                  <button onClick={onUpgrade} className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-widest">
                      Upgrade to Pro
                  </button>
              </div>
          </div>
      )}

      <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Branches Manager</h2>
      <p className="text-slate-500 mb-8">Manage your business branches across different locations and set default addresses.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className={!isPro && branches.length >= 1 ? 'opacity-50 pointer-events-none' : ''}>
          <form onSubmit={handleAdd} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
             <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs">Add New Branch</h3>
             <div>
                <label htmlFor="branch-name" className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Branch Name</label>
                <input id="branch-name" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm font-semibold" placeholder="e.g. Abuja Office" required />
             </div>
             <div>
                <label htmlFor="branch-address" className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Address</label>
                <textarea id="branch-address" rows={3} value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm font-semibold resize-none" placeholder="Full address..." required />
             </div>
             <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg">Save Location</button>
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
                        onClick={() => setBranches(branches.filter(b => b.id !== branch.id))}
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
                 <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                         <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <p className="text-xs font-bold text-slate-400">Upgrade to add more branches</p>
                 </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
