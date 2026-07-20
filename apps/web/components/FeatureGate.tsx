import React from 'react';

interface FeatureGateProps {
  featureName: string;
  headline: string;
  subhead: string;
  bullets: string[];
  onUpgrade: () => void;
  onDismiss: () => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ featureName, headline, subhead, bullets, onUpgrade, onDismiss }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full overflow-hidden">
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
            <svg className="w-8 h-8 text-teal-600 transform rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{headline}</h2>
          <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">{subhead}</p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left inline-block w-full max-w-md mx-auto border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">{featureName} Unlocks:</h3>
            <ul className="space-y-3">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onUpgrade}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/30 active:scale-[0.98]"
            >
              Unlock {featureName}
            </button>
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
            >
              Continue without {featureName}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-6">You'll still be able to send invoices for free if you're not ready to upgrade.</p>
        </div>
      </div>
    </div>
  );
};
