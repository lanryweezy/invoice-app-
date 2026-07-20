import React from 'react';

interface PremiumGateProps {
  title: string;
  subhead: string;
  bullets: string[];
  primaryCta: string;
  secondaryCta: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  heroVisual?: React.ReactNode;
  proofText?: string;
  isModal?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  title,
  subhead,
  bullets,
  primaryCta,
  secondaryCta,
  onPrimaryClick,
  onSecondaryClick,
  heroVisual,
  proofText,
  isModal = false,
}) => {
  const content = (
    <div className={`bg-white rounded-3xl ${isModal ? '' : 'border border-slate-200 shadow-sm'} overflow-hidden max-w-2xl mx-auto w-full`}>
      <div className="p-8 sm:p-12 text-center">
        {/* Pro Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-8">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Included in Pro & Team
        </div>

        {/* Hero Copy */}
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
          {subhead}
        </p>

        {/* Optional Hero Visual */}
        {heroVisual && (
          <div className="mb-10 flex justify-center">
            {heroVisual}
          </div>
        )}

        {/* Value Props / Bullets */}
        <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 mb-10 text-left border border-slate-100">
          <ul className="space-y-4">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-700 font-medium">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Optional Proof */}
        {proofText && (
          <p className="text-sm font-medium text-slate-500 mb-8 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {proofText}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onPrimaryClick}
            className="w-full sm:w-auto min-w-[240px] py-4 px-8 bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/20 text-lg"
          >
            {primaryCta}
          </button>

          <button
            onClick={onSecondaryClick}
            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-50"
          >
            {secondaryCta}
          </button>

          <p className="text-xs text-slate-400 mt-2">
            Cancel anytime; your invoices stay safe.
          </p>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-2xl my-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
