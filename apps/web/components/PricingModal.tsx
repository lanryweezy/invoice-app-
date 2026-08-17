import React, { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../utils/analytics';
import { getErrorMessage } from '../utils/error';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planType: 'monthly' | 'yearly') => Promise<boolean>;
  onLogin: () => void;
  user: any;
  title?: string;
  message?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, onLogin, user, title = "Upgrade to Pro", message = "Unlock advanced features to supercharge your business." }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!user) {
      onLogin();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onUpgrade(billingCycle);
      if (result) {
        setSuccess(true);
      }
    } catch (e) {
      console.error('Upgrade error:', e);
      const msg = getErrorMessage(e);
      if (msg.includes('Paystack') || msg.includes('paystack')) {
        setError('Payment system failed to load. Please refresh and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const price = billingCycle === 'yearly' ? 48000 : 5000;
  const monthlyEquiv = billingCycle === 'yearly' ? 4000 : 5000;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
          <div className="p-8">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Welcome to Pro!</h2>
            <p className="text-sm text-slate-500 mb-1">Your account has been upgraded successfully.</p>
            <p className="text-xs text-slate-400 mb-6">
              Unlimited clients, branches, accounting, cloud sync, and more.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] text-white font-bold rounded-xl transition-colors"
            >
              Start Using Pro Features
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="pricing-modal-title">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 py-4 text-center border-b border-slate-100">
          <h2 id="pricing-modal-title" className="text-lg font-bold text-slate-900 mb-1">{title}</h2>
          <p className="text-sm text-slate-500 mb-4">{message}</p>

          <div className="flex justify-center items-center gap-3">
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              role="switch"
              aria-checked={billingCycle === 'yearly'}
              aria-label="Toggle yearly billing"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
              Yearly
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Free */}
          <div className="flex-1 p-5">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-slate-900 mb-1">Free</h3>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">₦0<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <p className="text-[11px] text-slate-500">Perfect for getting started</p>
            </div>
            <ul className="space-y-2 mb-5">
              <Feature text="Unlimited Invoices" included />
              <Feature text="Basic Templates" included />
              <Feature text="Save up to 2 Clients" included />
              <Feature text="Multiple Branches" />
              <Feature text="Accounting Activities" />
            </ul>
            {!user ? (
              <button onClick={onLogin} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer">
                Create Free Account
              </button>
            ) : (
              <div className="text-center text-xs font-medium text-slate-400 py-2">Current Plan</div>
            )}
          </div>

          {/* Pro */}
          <div className="flex-1 p-5">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-teal-600 mb-1">Pro</h3>
              <div className="flex justify-center items-baseline gap-1 mb-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  ₦{price.toLocaleString()}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-xs text-green-600 font-medium mb-0.5">
                  (₦{monthlyEquiv.toLocaleString()}/mo)
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1">For growing businesses</p>
            </div>
            <ul className="space-y-2 mb-5">
              <Feature text="Everything in Free" included bold />
              <Feature text="Unlimited Saved Clients" included bold />
              <Feature text="Manage Multiple Branches" included bold />
              <Feature text="Advanced Accounting" included bold />
              <Feature text="Cloud Sync" included bold />
              <Feature text="Paystack Payment Links" included bold />
              <Feature text="Remove Branding Watermark" included bold />
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-teal-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              )}
              {loading ? 'Processing Payment...' : user ? `Pay ₦${price.toLocaleString()}` : 'Sign in to Upgrade'}
            </button>
            {!user && (
              <p className="text-center text-xs text-slate-400 mt-3">
                You'll be prompted to sign in, then the payment page opens automatically.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {error && (
            <p className="text-sm text-red-600 text-center mb-3">{error}</p>
          )}
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">Secure payment powered by Paystack</p>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Feature({ text, included = false, bold = false }: { text: string; included?: boolean; bold?: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${included ? 'text-slate-700' : 'text-slate-400'} ${bold ? 'font-medium' : ''}`}>
      {included ? (
        <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {text}
    </li>
  );
}

