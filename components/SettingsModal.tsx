import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isPro: boolean;
  logout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, isPro, logout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Account Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{user?.displayName || 'User'}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Current Plan</span>
              <span className={`px-2 py-1 text-xs font-bold rounded ${isPro ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'}`}>
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isPro ? 'Your data is being safely synced to the cloud.' : 'Upgrade to Pro to unlock cloud sync, unlimited clients, and more.'}
            </p>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
