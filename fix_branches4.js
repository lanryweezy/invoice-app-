const fs = require('fs');
let branches = fs.readFileSync('apps/web/components/BranchesManager.tsx', 'utf8');

branches = branches.replace(
  /\{!isPro && branches\.length >= 1 && \([\s\S]*?<div className="absolute bottom-8 right-8 z-20">[\s\S]*?\}\)/m,
  ''
);

branches = branches.replace(
  /className=\{!isPro && branches\.length >= 1 \? 'opacity-50 pointer-events-none' : ''\}/m,
  "className={!isPro && branches.length >= 1 ? 'opacity-80' : ''}"
);

branches = branches.replace(
  /\{!isPro && \([\s\S]*?<p className="text-xs font-bold text-slate-400">Upgrade to add more branches<\/p>[\s\S]*?\}\)/m,
  `{!isPro && (
                 <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col items-center justify-center text-center mt-4">
                     <p className="text-sm font-medium text-teal-800 mb-3">Growing fast? Add unlimited branches.</p>
                     <button onClick={onUpgrade} className="px-4 py-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold rounded-lg text-xs transition-colors">
                        Unlock Multiple Locations
                     </button>
                 </div>
             )}`
);

fs.writeFileSync('apps/web/components/BranchesManager.tsx', branches);
console.log('BranchesManager.tsx regex updated');
