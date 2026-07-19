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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={modalId}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 id={modalId} className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" title="Close" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <div className="prose prose-slate prose-base sm:prose-lg max-w-none prose-headings:text-teal-950 prose-headings:font-bold prose-h3:text-xl prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 marker:text-teal-500 space-y-6">
            {children}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/80 backdrop-blur-sm">
            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-all shadow-sm hover:shadow-md">
                {buttonText}
            </button>
        </div>
      </div>
    </div>
  );
};
