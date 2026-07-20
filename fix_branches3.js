const fs = require('fs');
let branches = fs.readFileSync('apps/web/components/BranchesManager.tsx', 'utf8');

const searchBlock1 = `      {!isPro && branches.length >= 1 && (
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
      )}`;

const searchBlock2 = `<div className={!isPro && branches.length >= 1 ? 'opacity-50 pointer-events-none' : ''}>`;
const replaceBlock2 = `<div className={!isPro && branches.length >= 1 ? 'opacity-80' : ''}>`;

const searchBlock3 = `             {!isPro && (
                 <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                         <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <p className="text-xs font-bold text-slate-400">Upgrade to add more branches</p>
                 </div>
             )}`;

const replaceBlock3 = `             {!isPro && (
                 <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col items-center justify-center text-center mt-4">
                     <p className="text-sm font-medium text-teal-800 mb-3">Growing fast? Add unlimited branches.</p>
                     <button onClick={onUpgrade} className="px-4 py-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold rounded-lg text-xs transition-colors">
                        Unlock Multiple Locations
                     </button>
                 </div>
             )}`;

if (branches.includes(searchBlock1)) {
    branches = branches.replace(searchBlock1, '');
} else { console.log('Block 1 not found') }

if (branches.includes(searchBlock2)) {
    branches = branches.replace(searchBlock2, replaceBlock2);
} else { console.log('Block 2 not found') }

if (branches.includes(searchBlock3)) {
    branches = branches.replace(searchBlock3, replaceBlock3);
} else { console.log('Block 3 not found') }

fs.writeFileSync('apps/web/components/BranchesManager.tsx', branches);
console.log('BranchesManager.tsx updated again');
