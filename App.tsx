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
import { trackEvent, collectSessionDetails } from './utils/analytics';

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

  // Comprehensive Analytics - Session Start
  useEffect(() => {
    // We wrap this in a timeout to ensure GA script has likely loaded
    const timer = setTimeout(() => {
        const sessionDetails = collectSessionDetails();
        trackEvent('app_session_detailed_start', sessionDetails);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const totals = useMemo(() => calculateTotals(), [invoice.lineItems, invoice.taxRate, invoice.discountRate, invoice.shippingAmount, calculateTotals]);

  const handleGenerateEmail = useCallback(() => {
    const fullInvoice: Invoice = { ...invoice, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, discountAmount: totals.discountAmount, shipping: totals.shipping };
    const emailContent = generateEmailTemplate(fullInvoice);
    setGeneratedEmail(emailContent);
    setIsEmailModalOpen(true);
    trackEvent('generate_email', { invoice_id: invoice.invoiceNumber });
  }, [invoice, totals]);

  const handleSaveClient = (client: Client) => {
      if (saveClient(client)) {
          showToast('Client saved to list');
          trackEvent('save_client', { client_name: client.name });
      } else {
          showToast('Client name is required', 'error');
      }
  };

  const handleDownloadPdf = async () => {
    // Determine the source element
    let sourceElement = document.getElementById('invoice-preview-container');

    // If on mobile and in edit mode, the preview might not be rendered or updated.
    // We switch to preview tab briefly if needed, but the Clone strategy below 
    // is robust enough to handle the element as long as it exists in the DOM.
    if (!sourceElement && activeMobileTab === 'edit' && window.innerWidth < 768) {
         showToast('Switching to preview to generate PDF...', 'success');
         setActiveMobileTab('preview');
         // Small delay to allow render
         await new Promise(resolve => setTimeout(resolve, 500));
         sourceElement = document.getElementById('invoice-preview-container');
    }

    if (sourceElement) {
      showToast('Generating PDF...', 'success');
      trackEvent('download_pdf_start', { invoice_id: invoice.invoiceNumber });
      
      try {
          // --- CLONE STRATEGY ---
          // 1. Create a container that forces A4 dimensions, off-screen
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.top = '-10000px';
          container.style.left = '0';
          container.style.width = '210mm'; // Force A4 width
          container.style.minHeight = '297mm'; // Force A4 height
          container.style.zIndex = '-1';
          container.style.backgroundColor = '#ffffff';
          document.body.appendChild(container);

          // 2. Clone the invoice element
          const clone = sourceElement.cloneNode(true) as HTMLElement;
          
          // 3. Clean up the clone's styles to ensure it flows correctly in the A4 container
          // Remove any mobile-specific transforms or constraints
          clone.style.transform = 'none';
          clone.style.margin = '0';
          clone.style.boxShadow = 'none';
          clone.style.width = '100%';
          clone.style.height = 'auto';
          
          container.appendChild(clone);

          // 4. Generate Canvas from the CLONE (which is full size)
          const canvas = await html2canvas(container, {
            scale: 2, // High quality scale
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200, // FORCE DESKTOP WIDTH: Critical for fixing mobile layout issues
          });

          // 5. Clean up DOM
          document.body.removeChild(container);
          
          // 6. Generate PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
          showToast('PDF Downloaded!');
          trackEvent('download_pdf_success', { invoice_id: invoice.invoiceNumber });

      } catch (e) {
          console.error(e);
          showToast('Failed to generate PDF', 'error');
          trackEvent('download_pdf_error', { error: String(e) });
      }
    } else {
        showToast('Preview not available. Please switch to Preview tab.', 'error');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-teal-100 selection:text-teal-900">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        type={toast.type}
      />

      {/* Main Header - Fixed height, Dark Theme */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 z-50 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-white p-2 rounded-xl shadow-lg shadow-teal-900/50 ring-1 ring-white/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none tracking-tight">Naija Invoice</h1>
              <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold leading-none mt-1">Generator</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <div className="text-xs font-medium text-slate-400 border-r border-slate-700 pr-4">
                Fast & Professional
             </div>
             <div className="text-xs font-bold text-slate-300">v1.1</div>
          </div>
        </div>
      </header>

      {/* COMMAND BAR (Sub-Nav) - Fixed height below header */}
      <div className="flex-none z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto">
            
            {/* Desktop Command Bar Content */}
            <div className="hidden md:flex items-center justify-between px-6 py-3">
                 {/* Left: Status */}
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${invoice.status === 'Paid' ? 'bg-teal-100 text-teal-800 border-teal-200' : 
                          invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-800 border-slate-200'}`}>
                        {invoice.status}
                    </span>
                    <span className="text-sm text-slate-400 font-mono">#{invoice.invoiceNumber}</span>
                </div>

                {/* Center: Template Selector */}
                <div className="flex-1 flex justify-center">
                    <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                </div>

                {/* Right: Actions */}
                <ActionButtons 
                    onGenerateEmail={handleGenerateEmail} 
                    onDownloadPdf={handleDownloadPdf}
                    isMobile={false}
                />
            </div>

            {/* Mobile Command Bar Content */}
            <div className="md:hidden">
                {/* Row 1: Switcher & Actions */}
                <div className="flex items-center justify-between px-4 py-2 gap-4">
                    {/* Segmented Control */}
                    <div className="flex bg-slate-100 p-1 rounded-lg flex-1 max-w-[200px]">
                        <button
                            onClick={() => setActiveMobileTab('edit')}
                            className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-md transition-all ${activeMobileTab === 'edit' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            <EditIcon className="w-3.5 h-3.5" /> Editor
                        </button>
                        <button
                            onClick={() => setActiveMobileTab('preview')}
                            className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-md transition-all ${activeMobileTab === 'preview' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            <EyeIcon className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>

                    {/* Compact Actions */}
                    <div className="flex items-center">
                        <ActionButtons 
                            onGenerateEmail={handleGenerateEmail} 
                            onDownloadPdf={handleDownloadPdf}
                            isMobile={true}
                        />
                    </div>
                </div>

                {/* Row 2: Templates (Only visible in Preview) */}
                {activeMobileTab === 'preview' && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 overflow-x-auto">
                         <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Main Layout - Flex-1 fills remaining space */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row h-full">
          
          {/* LEFT COLUMN: Editor Form - Independent Scroll */}
          <div className={`w-full md:w-[45%] lg:w-[40%] bg-white md:border-r border-slate-200 h-full overflow-y-auto custom-scrollbar flex flex-col ${activeMobileTab === 'edit' ? 'block' : 'hidden md:flex'}`}>
            <div className="p-4 sm:p-6 lg:p-8 flex-1">
              <div className="max-w-xl mx-auto pb-8">
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
            {/* Footer */}
            <div className="px-8 py-8 border-t border-slate-100 bg-slate-50/50">
               <div className="max-w-xl mx-auto space-y-5">
                   {/* Trust Badge */}
                   <div className="flex items-center justify-center gap-3 mb-2">
                       <div className="h-px bg-slate-200 w-12"></div>
                       <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1">
                           <svg className="w-3 h-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                           Secure & Local
                       </span>
                       <div className="h-px bg-slate-200 w-12"></div>
                   </div>
                   
                   <p className="text-xs text-slate-500 text-center leading-relaxed">
                       Built for Nigerian freelancers & SMEs. Your data stays in your browser and is never stored on our servers.
                   </p>

                   {/* Links */}
                   <div className="flex justify-center gap-6 text-xs font-bold text-slate-600">
                       <button onClick={() => showToast('Privacy Policy coming soon', 'success')} className="hover:text-teal-600 transition-colors">Privacy</button>
                       <span className="text-slate-300">•</span>
                       <button onClick={() => showToast('Terms coming soon', 'success')} className="hover:text-teal-600 transition-colors">Terms</button>
                       <span className="text-slate-300">•</span>
                       <button onClick={() => showToast('Contact: hello@naijainvoice.ng', 'success')} className="hover:text-teal-600 transition-colors">Contact</button>
                   </div>

                   {/* Copyright */}
                   <div className="pt-4 border-t border-slate-200/50 text-center">
                       <p className="text-[11px] text-slate-400 font-medium">
                          © {new Date().getFullYear()} Naija Invoice Generator.
                       </p>
                       <p className="text-[11px] font-bold text-slate-600 mt-1 flex items-center justify-center gap-1">
                           Made with <span className="text-red-500">❤️</span> in Lagos 🇳🇬
                       </p>
                   </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Preview - Independent Scroll */}
          {/* Added overflow-x-auto to allow horizontal scrolling on mobile when scaled invoice exceeds width */}
          <div className={`w-full md:w-[55%] lg:w-[60%] bg-slate-100/50 h-full overflow-y-auto overflow-x-auto custom-scrollbar flex flex-col ${activeMobileTab === 'preview' ? 'block' : 'hidden md:flex'}`}>
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            {/* Removed overflow-hidden to prevent clipping, added padding bottom for scroll space */}
            <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col items-center relative z-10 pt-8">
              
              {/* A4 Paper Preview */}
              {/* Increased mobile scale to 0.6 for better readability, relying on parent overflow-x-auto for width */}
              <div className="relative w-[210mm] transition-all duration-500 ease-in-out pb-32 md:pb-0 transform scale-[0.6] sm:scale-[0.7] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 origin-top">
                 <div id="invoice-preview-container" className="bg-white text-slate-900 shadow-2xl shadow-slate-400/30 rounded-sm min-h-[297mm] w-[210mm] origin-top border border-slate-200/60">
                    <div className="p-8 md:p-12 h-full flex flex-col relative">
                        <Suspense fallback={<div className="flex items-center justify-center h-96 text-slate-400">Loading Preview...</div>}>
                            <InvoicePreview invoice={invoice} totals={totals} template={template} />
                        </Suspense>
                    </div>
                 </div>
              </div>

              {/* Spacer */}
              <div className="h-12"></div>
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