import React, { useMemo } from 'react';

interface FeatureGateProps {
  featureName: string;
  headline: string;
  subhead: string;
  bullets: string[];
  onUpgrade: () => void;
  onDismiss: () => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ featureName, headline, subhead, bullets, onUpgrade, onDismiss }) => {
  // Generate a beautiful abstract graphic based on the feature name
  const Graphic = useMemo(() => {
    if (featureName === 'Accounting') {
      return (
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-8 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          {/* Background glowing orbs */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

          {/* Glassmorphic Dashboard Card */}
          <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-2">
                <div className="h-2 w-12 bg-white/30 rounded-full"></div>
                <div className="h-5 w-24 bg-white/80 rounded-full"></div>
              </div>
              <div className="h-10 w-10 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/30">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
            </div>
            {/* Mock Chart */}
            <div className="flex items-end gap-3 h-40 mb-8 border-b border-white/10 pb-2">
              {[40, 70, 45, 90, 65, 100].map((h, i) => (
                <div key={i} className="relative flex-1 group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded">+{h}%</div>
                    <div className="w-full bg-gradient-to-t from-teal-500/80 to-teal-400/20 rounded-t-sm transition-all duration-500 hover:opacity-80" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white/10"></div>
                   <div className="space-y-1.5 flex-1">
                       <div className="h-2 w-full bg-white/20 rounded-full"></div>
                       <div className="h-2 w-2/3 bg-white/10 rounded-full"></div>
                   </div>
               </div>
               <div className="flex items-center gap-3 opacity-60">
                   <div className="w-8 h-8 rounded-full bg-white/10"></div>
                   <div className="space-y-1.5 flex-1">
                       <div className="h-2 w-5/6 bg-white/20 rounded-full"></div>
                       <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                   </div>
               </div>
            </div>
          </div>
        </div>
      );
    } else if (featureName === 'Branches') {
      return (
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-8 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
           {/* Background glowing orbs */}
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>

          {/* Glassmorphic Map/Nodes Card */}
          <div className="relative z-10 w-full max-w-sm aspect-square bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center justify-center group">
             <div className="relative w-full h-full animate-[spin_60s_linear_infinite]">
                <div className="absolute top-4 left-1/4 w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-110">
                   <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute bottom-1/4 right-4 w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-110 delay-75">
                   <div className="w-5 h-5 bg-teal-400 rounded-full"></div>
                </div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-110 delay-150">
                   <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                </div>
                <div className="absolute top-1/2 right-1/4 w-10 h-10 bg-white/5 rounded-full border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md">
                   <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full text-white/20 -z-10" viewBox="0 0 100 100">
                  <path d="M 35 25 L 85 60 L 25 80 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M 35 25 L 65 45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" className="text-white/10" />
                </svg>
             </div>

             {/* Center Hub */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-slate-900 border-4 border-slate-800 rounded-2xl flex items-center justify-center z-20 shadow-2xl">
                 <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
             </div>
          </div>
        </div>
      );
    }

    // Default graphic
    return (
      <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 w-40 h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500">
            <svg className="w-16 h-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
      </div>
    );
  }, [featureName]);

  return (
    <div className="min-h-[70vh] flex flex-col lg:flex-row items-center gap-12 lg:gap-24 py-12 px-4 sm:px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Content Side */}
      <div className="flex-1 w-full max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-widest mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          InvoiceApp Pro
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">{headline}</h2>
        <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed">{subhead}</p>

        <div className="mb-12 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">What you get with {featureName}</h3>
          {bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-4 group">
              <div className="mt-1 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium text-lg">{bullet}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onUpgrade}
            className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] text-lg flex justify-center items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            Unlock {featureName}
            <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 font-bold rounded-xl transition-all border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            Maybe later
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Cancel anytime. No lock-in.
        </p>
      </div>

      {/* Visual Side */}
      <div className="flex-1 w-full max-w-xl hidden lg:block perspective-1000">
        <div className="transition-transform duration-700 hover:rotate-y-6 hover:rotate-x-6">
            {Graphic}
        </div>
      </div>
    </div>
  );
};
