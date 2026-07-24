import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = useInstallPrompt();

  if (isInstalled || !isInstallable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl shadow-2xl shadow-teal-900/30 p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install InvoiceApp</h3>
            <p className="text-teal-100 text-sm mb-3">
              Add to your home screen for offline access, push notifications, and faster invoicing.
            </p>
            <div className="flex gap-2">
              <button
                onClick={promptInstall}
                className="px-5 py-2 bg-white text-teal-700 font-bold rounded-xl text-sm hover:bg-teal-50 transition-colors"
              >
                Install Now
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 text-teal-100 font-medium text-sm hover:text-white transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
