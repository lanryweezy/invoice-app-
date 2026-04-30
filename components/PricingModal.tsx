import React from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onLogin: () => void;
  user: any;
  title?: string;
  message?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, onLogin, user, title = "Upgrade to Pro", message = "Unlock advanced features to supercharge your business." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 md:p-8 text-center border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500">{message}</p>
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Free Tier */}
          <div className="flex-1 p-6 md:p-8 bg-slate-50">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Free</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">₦0<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <p className="text-xs text-slate-500">Perfect for getting started</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Unlimited Invoices
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Basic Templates
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Save up to 2 Clients
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Multiple Branches
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Accounting Activities
              </li>
            </ul>
            <div className="text-center text-sm font-medium text-slate-500 py-2">
              Current Plan
            </div>
          </div>

          {/* Pro Tier */}
          <div className="flex-1 p-6 md:p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-teal-600 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">₦5,000<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <p className="text-xs text-slate-500">For growing businesses</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Unlimited Saved Clients
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Manage Multiple Branches
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Advanced Accounting Activities
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Cloud Sync
              </li>
            </ul>
            <button
              onClick={user ? onUpgrade : onLogin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-teal-600/30"
            >
              {user ? 'Upgrade Now' : 'Login to Upgrade'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
