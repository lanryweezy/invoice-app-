import React, { ReactNode } from 'react';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  modalId: string;
  buttonText: string;
  children: ReactNode;
}

export const TextModal: React.FC<TextModalProps> = ({ isOpen, onClose, title, modalId, buttonText, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={modalId}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 id={modalId} className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close modal" title="Close" className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="prose prose-slate prose-sm max-w-none space-y-4 text-slate-600 leading-relaxed">
            {children}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-colors">
                {buttonText}
            </button>
        </div>
      </div>
    </div>
  );
};
