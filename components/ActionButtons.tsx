
import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DownloadIcon, MailIcon } from './Icons';

interface ActionButtonsProps {
  onGenerateEmail: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onGenerateEmail }) => {
  const handleDownloadPdf = () => {
    const input = document.getElementById('invoice-preview-container');
    if (input) {
      const originalStyle = input.style.cssText;
      
      // Force exact dimensions for cleaner PDF
      input.style.width = '210mm';
      input.style.minHeight = '297mm';
      
      html2canvas(input, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('naija-invoice.pdf');
        
        // Reset style
        input.style.cssText = originalStyle;
      });
    }
  };

  return (
    <div className="flex gap-2 w-full lg:w-auto">
      <button
        onClick={onGenerateEmail}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
      >
        <MailIcon className="w-4 h-4 mr-2 text-teal-500" />
        View Email
      </button>
      <button
        onClick={handleDownloadPdf}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-md shadow-teal-200 text-white bg-teal-600 hover:bg-teal-700 hover:shadow-lg transition-all"
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        Download PDF
      </button>
    </div>
  );
};
