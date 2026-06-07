import React, { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planType: 'monthly' | 'yearly') => void;
  onLogin: () => void;
  user: any;
  title?: string;
  message?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, onLogin, user, title = "Upgrade to Pro", message = "Unlock advanced features to supercharge your business." }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await onUpgrade(billingCycle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-6 md:p-8 text-center border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 mb-6">{message}</p>

          <div className="flex justify-center items-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              role="switch"
              aria-checked={billingCycle === 'yearly'}
              aria-label="Toggle yearly billing"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                20% off
              </span>
            </span>
          </div>
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
            {!user ? (
              <button
                onClick={onLogin}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Create Free Account
              </button>
            ) : (
              <div className="text-center text-sm font-medium text-slate-500 py-2">
                Current Plan
              </div>
            )}
          </div>

          {/* Pro Tier */}
          <div className="flex-1 p-6 md:p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-teal-600 mb-1">Pro</h3>
              <div className="flex justify-center items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-slate-900">
                  {billingCycle === 'yearly' ? '₦48,000' : '₦5,000'}
                </span>
                <span className="text-sm font-normal text-slate-500">
                  /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-green-600 font-medium mb-1">
                  (₦4,000/mo)
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">For growing businesses</p>
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
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Add Paystack Payment Links
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Remove Branding Watermark
              </li>
            </ul>
            <button
              onClick={user ? handleUpgrade : onLogin}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-teal-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {user ? (loading ? 'Processing...' : 'Upgrade Now') : 'Login to Upgrade'}
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
