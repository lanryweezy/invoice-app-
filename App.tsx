
import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { InvoiceForm } from './components/InvoiceForm';
import { ActionButtons } from './components/ActionButtons';
import { EmailModal } from './components/EmailModal';
import { useInvoice } from './hooks/useInvoice';
import { generateEmailTemplate } from './utils/emailGenerator';
import type { Invoice, TemplateId, Client } from './types';
import { TemplateSelector } from './components/TemplateSelector';
import { EditIcon, EyeIcon } from './components/Icons';
import { Toast } from './components/Toast';

// Lazy load heavy preview component
const InvoicePreview = React.lazy(() => import('./components/InvoicePreview').then(module => ({ default: module.InvoicePreview })));

const App: React.FC = () => {
  const { invoice, updateInvoice, addLineItem, removeLineItem, updateLineItem, calculateTotals, savedClients, saveClient } = useInvoice();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  
  // 'edit' vs 'preview' for mobile tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  
  const [template, setTemplate] = useState<TemplateId>(() => {
    return (localStorage.getItem('invoiceTemplate') as TemplateId) || 'classic';
  });

  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type?: 'success' | 'error' }>({
    message: '',
    isVisible: false
  });

  useEffect(() => {
    localStorage.setItem('invoiceTemplate', template);
  }, [template]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, isVisible: true, type });
  };

  const totals = useMemo(() => calculateTotals(), [invoice.lineItems, invoice.taxRate, calculateTotals]);

  const handleGenerateEmail = useCallback(() => {
    const fullInvoice: Invoice = { ...invoice, subtotal: totals.subtotal, tax: totals.tax, total: totals.total };
    const emailContent = generateEmailTemplate(fullInvoice);
    setGeneratedEmail(emailContent);
    setIsEmailModalOpen(true);
  }, [invoice, totals]);

  const handleSaveDraft = () => {
      // Logic handled by useInvoice internal debounced localstorage, but we trigger a visual feedback here
      showToast('Draft saved successfully');
  };

  const handleSaveClient = (client: Client) => {
      if (saveClient(client)) {
          showToast('Client saved to list');
      } else {
          showToast('Client name is required', 'error');
      }
  };

  const handleDownloadPdf = async () => {
    if (activeMobileTab === 'edit' && window.innerWidth < 768) {
        showToast('Switching to preview...', 'success');
        setActiveMobileTab('preview');
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const input = document.getElementById('invoice-preview-container');
    if (input) {
      showToast('Generating PDF...', 'success');
      const originalStyle = input.style.cssText;
      
      // Force exact dimensions for cleaner PDF
      input.style.width = '210mm';
      input.style.minHeight = '297mm';
      
      try {
          const canvas = await html2canvas(input, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
          showToast('PDF Downloaded!');
      } catch (e) {
          console.error(e);
          showToast('Failed to generate PDF', 'error');
      } finally {
          // Reset style
          input.style.cssText = originalStyle;
      }
    } else {
        showToast('Preview not available', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        type={toast.type}
      />

      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white p-2 rounded-xl shadow-md shadow-teal-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Naija Invoice</h1>
              <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold">Generator</p>
            </div>
          </div>
          
          {/* Header Actions Removed as requested */}
          <div className="text-xs font-medium text-slate-400">
             Fast & Professional
          </div>
        </div>
      </header>

      {/* Mobile View Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="grid grid-cols-2 p-1 gap-1">
          <button
            onClick={() => setActiveMobileTab('edit')}
            className={`py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeMobileTab === 'edit' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <EditIcon className="w-4 h-4" /> Editor
          </button>
          <button
            onClick={() => setActiveMobileTab('preview')}
            className={`py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeMobileTab === 'preview' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
            <div className="p-4 sm:p-6 lg:p-8 pb-32 md:pb-8">
              <div className="max-w-xl mx-auto">
                <InvoiceForm
                  invoice={invoice}
                  updateInvoice={updateInvoice}
                  addLineItem={addLineItem}
                  removeLineItem={removeLineItem}
                  updateLineItem={updateLineItem}
                  savedClients={savedClients}
                  onSaveClient={handleSaveClient}
                />
              </div>
            </div>
            {/* Desktop Footer in Sidebar */}
            <div className="hidden md:block px-8 py-6 border-t border-slate-100 bg-slate-50/50">
               <p className="text-xs text-slate-400 text-center font-medium">
                  © {new Date().getFullYear()} Naija Invoice Generator. Built for Nigerian Businesses.
               </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Preview & Actions */}
          <div className={`w-full md:w-[55%] lg:w-[60%] bg-slate-100/50 md:overflow-y-auto custom-scrollbar flex flex-col ${activeMobileTab === 'preview' ? 'block' : 'hidden md:flex'}`}>
            {/* Subtle background pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col items-center relative z-10">
              
              {/* Sticky Toolbar for Desktop */}
              <div className="w-full max-w-[210mm] mb-8 sticky top-0 z-20 hidden md:block">
                  <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg shadow-slate-200/50 p-4 rounded-2xl transition-all hover:bg-white">
                     <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                        <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                        <ActionButtons 
                            onSaveDraft={handleSaveDraft}
                            onGenerateEmail={handleGenerateEmail} 
                            onDownloadPdf={handleDownloadPdf} 
                        />
                     </div>
                  </div>
              </div>

              {/* Mobile Preview Toolbar */}
              <div className="md:hidden w-full mb-6 sticky top-0 z-20">
                 <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm p-3 -mx-4 -mt-4 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <ActionButtons 
                            onSaveDraft={handleSaveDraft}
                            onGenerateEmail={handleGenerateEmail} 
                            onDownloadPdf={handleDownloadPdf}
                            isMobile={true}
                        />
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                        <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                    </div>
                 </div>
              </div>

              {/* A4 Paper Preview */}
              <div className="relative w-full max-w-[210mm] transition-all duration-500 ease-in-out pb-20 md:pb-0">
                 <div id="invoice-preview-container" className="bg-white text-slate-900 shadow-2xl shadow-slate-300/60 rounded-sm min-h-[297mm] w-full origin-top transform transition-transform border border-slate-200">
                    <div className="p-8 md:p-12 h-full flex flex-col relative">
                        <Suspense fallback={<div className="flex items-center justify-center h-96 text-slate-400">Loading Preview...</div>}>
                            <InvoicePreview invoice={invoice} totals={totals} template={template} />
                        </Suspense>
                    </div>
                 </div>
              </div>

              {/* Mobile Footer */}
               <div className="md:hidden py-8 mt-auto">
                 <p className="text-xs text-slate-400 text-center font-medium">
                  © {new Date().getFullYear()} Naija Invoice Generator.
               </p>
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
