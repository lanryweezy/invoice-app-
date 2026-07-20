const fs = require('fs');
let branches = fs.readFileSync('apps/web/components/BranchesManager.tsx', 'utf8');

// Replace absolute positioned paywall
const paywallRegex = /\{\s*!isPro && branches\.length >= 1 && \(\s*<div className="absolute bottom-8 right-8 z-20">[\s\S]*?<\/div>\s*\)\s*\}/m;
branches = branches.replace(paywallRegex, '');

// Soften disabled form
const disabledFormRegex = /className=\{!isPro && branches\.length >= 1 \? 'opacity-50 pointer-events-none' : ''\}/g;
branches = branches.replace(disabledFormRegex, "className={!isPro && branches.length >= 1 ? 'opacity-80' : ''}");

// Replace inline prompt
const inlinePromptRegex = /\{\s*!isPro && \(\s*<div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">[\s\S]*?<\/div>\s*\)\s*\}/m;
const newInlinePrompt = `{!isPro && (
                 <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col items-center justify-center text-center mt-4">
                     <p className="text-sm font-medium text-teal-800 mb-3">Growing fast? Add unlimited branches.</p>
                     <button onClick={onUpgrade} className="px-4 py-2 bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 font-bold rounded-lg text-xs transition-colors">
                        Unlock Multiple Locations
                     </button>
                 </div>
             )}`;

if (branches.includes('text-center opacity-60')) {
    branches = branches.replace(inlinePromptRegex, newInlinePrompt);
}

fs.writeFileSync('apps/web/components/BranchesManager.tsx', branches);
console.log('BranchesManager.tsx fixed correctly');
