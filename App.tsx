
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { ActionButtons } from './components/ActionButtons';
import { EmailModal } from './components/EmailModal';
import { useInvoice } from './hooks/useInvoice';
import { generateEmailTemplate } from './utils/emailGenerator';
import type { Invoice, TemplateId } from './types';
import { TemplateSelector } from './components/TemplateSelector';
import { EditIcon, EyeIcon } from './components/Icons';

const App: React.FC = () => {
  const { invoice, updateInvoice, addLineItem, removeLineItem, updateLineItem, calculateTotals } = useInvoice();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  
  // 'edit' vs 'preview' for mobile tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  
  const [template, setTemplate] = useState<TemplateId>(() => {
    return (localStorage.getItem('invoiceTemplate') as TemplateId) || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('invoiceTemplate', template);
  }, [template]);

  const totals = useMemo(() => calculateTotals(), [invoice.lineItems, invoice.taxRate, calculateTotals]);

  const handleGenerateEmail = useCallback(() => {
    const fullInvoice: Invoice = { ...invoice, subtotal: totals.subtotal, tax: totals.tax, total: totals.total };
    const emailContent = generateEmailTemplate(fullInvoice);
    setGeneratedEmail(emailContent);
    setIsEmailModalOpen(true);
  }, [invoice, totals]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white p-2 rounded-xl shadow-md shadow-teal-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Naija Invoice</h1>
              <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold">Professional Generator</p>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
             {/* Placeholders for future nav items if needed */}
          </div>
        </div>
      </header>

      {/* Mobile View Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="grid grid-cols-2 p-1">
          <button
            onClick={() => setActiveMobileTab('edit')}
            className={`py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-all ${activeMobileTab === 'edit' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <EditIcon className="w-4 h-4" /> Editor
          </button>
          <button
            onClick={() => setActiveMobileTab('preview')}
            className={`py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-all ${activeMobileTab === 'preview' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto md:h-[calc(100vh-4rem)] md:overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          
          {/* LEFT COLUMN: Editor Form */}
          <div className={`w-full md:w-[45%] lg:w-[40%] bg-white md:border-r border-slate-200 md:overflow-y-auto custom-scrollbar ${activeMobileTab === 'edit' ? 'block' : 'hidden md:block'}`}>
            <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
              <div className="max-w-xl mx-auto">
                <InvoiceForm
                  invoice={invoice}
                  updateInvoice={updateInvoice}
                  addLineItem={addLineItem}
                  removeLineItem={removeLineItem}
                  updateLineItem={updateLineItem}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Preview & Actions */}
          <div className={`w-full md:w-[55%] lg:w-[60%] bg-slate-50/50 md:bg-slate-100 md:overflow-y-auto custom-scrollbar flex flex-col ${activeMobileTab === 'preview' ? 'block' : 'hidden md:flex'}`}>
            <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col items-center">
              
              {/* Sticky Toolbar for Desktop */}
              <div className="w-full max-w-[210mm] mb-8 sticky top-0 z-20">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg shadow-slate-200/50 p-4 rounded-2xl">
                     <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                        <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                        <ActionButtons onGenerateEmail={handleGenerateEmail} />
                     </div>
                  </div>
              </div>

              {/* A4 Paper Preview */}
              <div className="relative w-full max-w-[210mm] transition-all duration-500 ease-in-out">
                 <div id="invoice-preview-container" className="bg-white text-slate-900 shadow-2xl shadow-slate-300/60 rounded-sm min-h-[297mm] w-full origin-top transform transition-transform">
                    <div className="p-8 md:p-12 h-full flex flex-col relative">
                        <InvoicePreview invoice={invoice} totals={totals} template={template} />
                        
                        <div className="mt-auto pt-12 text-center opacity-40 hover:opacity-100 transition-opacity print:hidden">
                           <p className="text-[10px] text-slate-400 font-medium">Generated with Naija Invoice</p>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="h-12"></div> {/* Spacer */}
            </div>
          </div>

        </div>
      </main>

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        emailContent={generatedEmail}
      />
    </div>
  );
};

export default App;
