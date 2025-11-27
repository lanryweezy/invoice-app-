
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
                className="p-2 text-slate-600 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-lg transition-colors"
                title="Email Invoice"
            >
                <MailIcon className="w-5 h-5" />
            </button>
            <button
                onClick={onDownloadPdf}
                className="p-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-200 transition-colors"
                title="Download PDF"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
        </div>
      )
  }

  return (
    <div className="flex gap-2 w-full lg:w-auto">
      <button
        onClick={onGenerateEmail}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
      >
        <MailIcon className="w-4 h-4 mr-2 text-teal-500" />
        Email
      </button>
      <button
        onClick={onDownloadPdf}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-md shadow-teal-200 text-white bg-teal-600 hover:bg-teal-700 hover:shadow-lg transition-all"
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        Download PDF
      </button>
    </div>
  );
};
