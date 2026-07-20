const fs = require('fs');

// 1. AccountingDashboard
let accounting = fs.readFileSync('apps/web/components/AccountingDashboard.tsx', 'utf8');

const searchBlock = `          {!isPro && filteredInvoices.length > 3 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm">
                <h3 className="text-xl font-bold mb-2">Unlock Full History</h3>
                <p className="text-slate-400 text-sm mb-6">Free accounts show the last 3 invoices. Upgrade for unlimited history.</p>
                <button onClick={onUpgrade} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl uppercase tracking-widest text-xs">
                  Upgrade Now
                </button>
              </div>
            </div>
          )}`;

const replaceBlock = `          {!isPro && filteredInvoices.length > 3 && (
            <div className="mt-6 flex flex-col items-center justify-center p-6 bg-teal-50/50 rounded-2xl border border-teal-100">
              <p className="text-teal-800 font-medium mb-3">You have {filteredInvoices.length - 3} more older transactions.</p>
              <button onClick={onUpgrade} className="px-6 py-2.5 bg-teal-600 text-white hover:bg-teal-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                <span>Unlock full history</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          )}`;

if (accounting.includes(searchBlock)) {
    accounting = accounting.replace(searchBlock, replaceBlock);
    fs.writeFileSync('apps/web/components/AccountingDashboard.tsx', accounting);
    console.log('AccountingDashboard.tsx updated');
} else {
    console.log('AccountingDashboard.tsx string not found');
}
