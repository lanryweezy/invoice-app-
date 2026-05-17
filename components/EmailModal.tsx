import React, { useState, useEffect } from 'react';
import { ClipboardIcon } from './Icons';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailContent: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, emailContent }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subject = emailContent.match(/Subject: (.*)/)?.[1] || 'Your Invoice';
  const body = emailContent.substring(emailContent.indexOf('\n\n') + 2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={onClose}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>

        <div className="flex min-h-full items-center justify-center p-4">
            <div 
                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Generated Email</h3>
                            <p className="text-sm text-slate-500">Ready to send to your client</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
                            <p className="text-slate-900 font-semibold select-all">{subject}</p>
                        </div>
                        
                        <div className="relative group">
                            <textarea
                                readOnly
                                value={body}
                                className="block w-full rounded-xl border-slate-300 bg-white text-slate-700 leading-relaxed resize-none h-64 p-4 focus:border-teal-500 focus:ring-teal-500 sm:text-sm shadow-inner"
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all"
                        onClick={() => { handleCopy(); setTimeout(onClose, 500); }}
                    >
                        <ClipboardIcon className="w-4 h-4"/> Copy & Close
                    </button>
                    <button
                        type="button"
                        className="inline-flex w-full sm:w-auto justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};