
import React from 'react';
import { DownloadIcon, MailIcon } from './Icons';

interface ActionButtonsProps {
  onGenerateEmail: () => void;
  onDownloadPdf: () => void;
  isMobile?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onGenerateEmail, onDownloadPdf, isMobile = false }) => {
  if (isMobile) {
      return (
        <div className="flex gap-2">
            <button
                onClick={onGenerateEmail}
                className="p-1.5 text-slate-600 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-lg transition-colors"
                title="Email Invoice"
            >
                <MailIcon className="w-4 h-4" />
            </button>
            <button
                onClick={onDownloadPdf}
                className="p-1.5 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-200 transition-colors"
                title="Download PDF"
            >
                <DownloadIcon className="w-4 h-4" />
            </button>
        </div>
      )
  }

  return (
    <div className="flex gap-2 w-full lg:w-auto">
      <button
        onClick={onGenerateEmail}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
      >
        <MailIcon className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
        Email
      </button>
      <button
        onClick={onDownloadPdf}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg shadow-md shadow-teal-200 text-white bg-teal-600 hover:bg-teal-700 hover:shadow-lg transition-all"
      >
        <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
        PDF
      </button>
    </div>
  );
};
