const fs = require('fs');

// 1. AccountingDashboard
let accounting = fs.readFileSync('apps/web/components/AccountingDashboard.tsx', 'utf8');

// Remove the strict transaction history lock
accounting = accounting.replace(
  /\{!isPro && filteredInvoices\.length > 3 && \([\s\S]*?\}\)/m,
  `{!isPro && filteredInvoices.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-32 pb-8 rounded-b-2xl">
              <div className="text-center max-w-sm px-4">
                <p className="text-slate-600 font-medium mb-4">You have {filteredInvoices.length - 3} more older transactions.</p>
                <button onClick={onUpgrade} className="px-6 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mx-auto">
                  <span>Unlock full history</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          )}`
);

fs.writeFileSync('apps/web/components/AccountingDashboard.tsx', accounting);
console.log('AccountingDashboard.tsx updated');

// 2. BranchesManager
let branches = fs.readFileSync('apps/web/components/BranchesManager.tsx', 'utf8');

// Remove the absolute bottom-right block
branches = branches.replace(
  /\{!isPro && branches\.length >= 1 && \([\s\S]*?\}\)/m,
  ``
);

// Soften the disabled form
branches = branches.replace(
  /className=\{!isPro && branches\.length >= 1 \? 'opacity-50 pointer-events-none' : ''\}/m,
  `className={!isPro && branches.length >= 1 ? 'opacity-80' : ''}`
);

// Soften the upgrade prompt in the active locations list
branches = branches.replace(
  /\{!isPro && \([\s\S]*?<p className="text-xs font-bold text-slate-400">Upgrade to add more branches<\/p>[\s\S]*?\}\)/m,
  `{!isPro && (
                 <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-medium text-teal-800 mb-3">Growing fast? Add unlimited branches.</p>
                     <button onClick={onUpgrade} className="px-4 py-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold rounded-lg text-xs transition-colors">
                        Unlock Multiple Locations
                     </button>
                 </div>
             )}`
);

fs.writeFileSync('apps/web/components/BranchesManager.tsx', branches);
console.log('BranchesManager.tsx updated');
