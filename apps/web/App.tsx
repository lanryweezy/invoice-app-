import { getDecodedPathname } from "./utils/routing";
import { toast } from 'sonner';
import { IdleLockScreen } from './components/IdleLockScreen';
import { useLocation, useNavigate, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import React, { useState, useCallback, useMemo, useEffect, Suspense, useRef } from 'react';

import { InvoiceForm } from './components/InvoiceForm';
import { ActionButtons } from './components/ActionButtons';
import { EmailModal } from './components/EmailModal';
import { useInvoice } from './hooks/useInvoice';
import { getTodayISODate } from './utils/date';
import { generateEmailTemplate, type EmailTemplateType } from './utils/emailGenerator';
import { generateSequentialInvoiceNumber } from './utils/invoiceSequence';
import type { Invoice, TemplateId, Client } from './types';
import { TemplateSelector } from './components/TemplateSelector';
import { EditIcon, EyeIcon } from './components/Icons';

import { trackEvent, collectSessionDetails } from './utils/analytics';
import { Helmet } from 'react-helmet-async';
import { useSubscription } from './hooks/useSubscription';
import { PricingModal } from './components/PricingModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountingDashboard } from './components/AccountingDashboard';
import { RecurringManager } from './components/RecurringManager';
import { useExpenses } from './hooks/useExpenses';
import { AuthModal } from './components/AuthModal';
import { useReceipts } from './hooks/useReceipts';
import { ReceiptsManager } from './components/ReceiptsManager';
import { ReceiptPreview } from './components/ReceiptPreview';
import { FeatureGate } from './components/FeatureGate';
import { PaymentModal } from './components/PaymentModal';
import { PublicProfile } from './components/PublicProfile';
import { TemplatePage } from './components/TemplatePage';
import { PrivacyModal } from './components/PrivacyModal';
import { CommandPaletteProvider } from './components/CommandPaletteProvider';
import { TermsModal } from './components/TermsModal';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { SupportPage } from './components/SupportPage';
import { IntegrationsView } from './components/IntegrationsView';
import { CLIAccessView } from './components/CLIAccessView';
import { SmtpSettingsModal } from './components/SmtpSettingsModal';
import { SidePanel } from './components/SidePanel';
import { getProFeatureContent } from './services/proFeatureRegistry';

// NRS Compliance Components
import { ComplianceDashboard } from './components/ComplianceDashboard';
import NRSTaxPanel from './components/NRSTaxPanel';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import TINValidator from './components/TINValidator';
import { PaymentDetails } from './components/PaymentDetails';

// NRS Compliance Services
import { calculateVAT, calculateWHT, calculateStampDuty } from './services/taxCalculator';
import { generateNRSJSON, validateNRSCompliance } from './services/eInvoicing';
import { generatePaymentQR } from './services/qrCodeGenerator';
import { checkCompliance, getComplianceScore } from './services/complianceTracker';
import { logAction, getAuditTrail } from './services/auditTrail';

// Lazy load heavy preview component
const InvoicePreview = React.lazy(() => import('./components/InvoicePreview').then(module => ({ default: module.InvoicePreview })));

import { numberFormatter } from './utils/formatters';

const App: React.FC = () => {
  const {
    invoice,
    setInvoice,
    updateInvoice,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotals,
    savedInvoices,
    saveInvoice,
    savedClients,
    saveClient,
    businessProfiles,
    saveBusinessProfile,
    recurringInvoices,
    saveRecurringInvoice,
    removeRecurringInvoice,
    toggleRecurringActive,
    resetInvoice
  } = useInvoice();
  const { expenses, addExpense, removeExpense } = useExpenses();
  const { receipts, addReceipt, removeReceipt } = useReceipts();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplateType>('formal');
  const [smtpSettings, setSmtpSettings] = useState<{ host: string; port: string; user: string; pass: string; fromEmail: string; fromName: string } | null>(null);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  // Subscription hooks
  const { user, isPro, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, upgradeToPro } = useSubscription();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [pricingModalContent, setPricingModalContent] = useState({ title: 'Upgrade to Pro', message: 'Unlock advanced features to supercharge your business.' });

  // NRS Compliance State
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);
  const [complianceScore, setComplianceScore] = useState(0);

  // Toast State
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type?: 'success' | 'error' }>({
    message: '',
    isVisible: false
  });

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      if (type === 'error') {
          toast.error(message);
      } else {
          toast.success(message);
      }
  }, []);

  // Offline Sync State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Check for auth query param on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === '1') {
      setIsAuthModalOpen(true);

      // Clean up the URL by removing the query param
      const newUrl = getDecodedPathname();
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Load SMTP settings from Firestore
  useEffect(() => {
    if (!user) { setSmtpSettings(null); return; }
    const loadSmtp = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./services/firebase');
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().smtpSettings) {
          setSmtpSettings(snap.data().smtpSettings);
        }
      } catch (error) {
        console.warn('[App] Failed to load SMTP settings:', error);
        try {
          trackEvent('smtp_settings_load_failed', { user_id: user.uid, error: String(error) });
        } catch (analyticsError) {
          console.error('[App] Failed to track SMTP load failure:', analyticsError);
        }
      }
    };
    loadSmtp();
  }, [user]);

  // Listen for SMTP settings open event from SettingsModal
  useEffect(() => {
    const handler = () => setIsSmtpModalOpen(true);
    window.addEventListener('open-smtp-settings', handler);
    return () => window.removeEventListener('open-smtp-settings', handler);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Back online! Syncing data...', 'success');
    };

    const handleOffline = () => {
      setIsOffline(true);
      showToast('You are offline. Changes will be saved locally.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const handleConvertToInvoice = useCallback(() => {
    if (!invoice || (invoice.documentType !== 'Pro-forma' && invoice.documentType !== 'Quote')) return;
    const newInvoiceNumber = generateSequentialInvoiceNumber();
    setInvoice(prev => ({
      ...prev,
      documentType: 'Tax Invoice' as const,
      status: 'Draft' as const,
      invoiceNumber: newInvoiceNumber,
      convertedFromProforma: true,
      proformaId: prev.invoiceNumber,
    }));
    showToast(`Converted to Invoice #${newInvoiceNumber}`, 'success');
  }, [invoice, setInvoice, showToast]);

  // Calculate NRS Tax
  const nrsTax = useMemo(() => {
    if (!invoice) return null;
    const subtotal = invoice.subtotal || 0;
    const vat = calculateVAT(subtotal);
    const wht = calculateWHT(subtotal, 'professional');
    const stamp = calculateStampDuty(subtotal);
    return { vat, wht, stamp, total: vat + wht + stamp };
  }, [invoice]);

  // Main view state
  const [gatedFeature, setGatedFeature] = useState<'Branches' | 'Accounting' | 'Recurring' | 'Receipts' | 'Integrations' | null>(null);
  


  // 'edit' vs 'preview' for mobile tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.offsetWidth;
      // A4 width ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  794px at 96dpi
      const a4Width = 794;

      const availableWidth = containerWidth - 32;
      const newScale = Math.min(availableWidth / a4Width, 1);
      setPreviewScale(newScale);
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 50); // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Bolt: Debounce resize event to prevent rapid re-renders
    };

    timeoutId = setTimeout(updateScale, 10);
    window.addEventListener("resize", handleResize);

    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("resize", handleResize);
    };
  }, [activeMobileTab]);

  const [template, setTemplate] = useState<TemplateId>(() => {
    return (localStorage.getItem('invoiceTemplate') as TemplateId) || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('invoiceTemplate', template);
  }, [template]);

  // Comprehensive Analytics - Session Start
  useEffect(() => {
    // We wrap this in a timeout to ensure GA script has likely loaded
    const timer = setTimeout(() => {
        const sessionDetails = collectSessionDetails();
        trackEvent('app_session_detailed_start', sessionDetails);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const totals = useMemo(() => calculateTotals(), [invoice.lineItems, invoice.taxRate, invoice.discountRate, invoice.shippingAmount, invoice.whtRate, invoice.discountType, calculateTotals]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl/Cmd + P: Preview/Download PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            handleDownloadPdf();
        }
        // Ctrl/Cmd + E: Generate Email
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            handleGenerateEmail();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, totals, activeMobileTab]);

  const handleGenerateEmail = useCallback((templateType?: EmailTemplateType) => {
    const type = templateType || emailTemplate;
    const fullInvoice: Invoice = { ...invoice, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, discountAmount: totals.discountAmount, shipping: totals.shipping };
    const emailContent = generateEmailTemplate(fullInvoice, type);
    setGeneratedEmail(emailContent);
    setEmailTemplate(type);
    setIsEmailModalOpen(true);
    saveInvoice(fullInvoice);
    trackEvent('generate_email', { invoice_id: invoice.invoiceNumber, template: type });

    // Usage-based upgrade nudge: after 5 invoices on free plan
    if (!isPro && savedInvoices.length >= 4) {
      setTimeout(() => {
        setPricingModalContent({
          title: "You're on a roll!",
          message: `You've created ${savedInvoices.length + 1} invoices. Upgrade to Pro for unlimited clients, cloud sync, and NRS compliance tools.`
        });
        setIsPricingModalOpen(true);
      }, 1500);
    }
  }, [invoice, totals, saveInvoice, emailTemplate, isPro, savedInvoices.length]);

  const handleSaveClient = useCallback((client: Client) => {
      // Free tier restriction: max 2 clients
      if (!isPro && savedClients.length >= 2 && !savedClients.some(c => c.name.toLowerCase() === client.name.trim().toLowerCase())) {
          setPricingModalContent({
              title: "Client Limit Reached",
              message: "Free accounts can only save up to 2 clients. Upgrade to Pro for unlimited clients."
          });
          setIsPricingModalOpen(true);
          return;
      }

      if (saveClient(client)) {
          showToast('Client saved to list');
          trackEvent('save_client');
      } else {
          showToast('Client name is required', 'error');
      }
  }, [isPro, savedClients, saveClient]);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Bolt: Memoize updateInvoice handler to prevent InvoiceForm from re-rendering on every App state change
  const handleUpdateInvoice = useCallback((key: keyof Invoice, value: any) => {
      if (key === 'status' && value === 'Paid' && invoice.status !== 'Paid') {
          setIsPaymentModalOpen(true);
      }
      updateInvoice(key, value);
  }, [invoice.status, updateInvoice]);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Bolt: Memoize saveBusinessProfile handler to prevent InvoiceForm from re-rendering on every App state change
  const handleSaveBusinessProfile = useCallback((profile: any) => {
      saveBusinessProfile(profile);
      showToast('Business profile saved!');
  }, [saveBusinessProfile, showToast]);

  const handleProFeatureClick = useCallback((featureName: 'Branches' | 'Accounting' | 'Recurring' | 'Receipts' | 'Integrations') => {
      if (!isPro) {
          setGatedFeature(featureName);
      } else {
          window.location.href='/receipts';
      }
  }, [isPro]);

  const handleProFeatureRecurring = useCallback(() => {
      handleProFeatureClick('Recurring');
  }, [handleProFeatureClick]);

  const handleSaveRecurringWrapper = useCallback((inv: Invoice) => {
      if (!isPro) {
          setPricingModalContent({ title: 'Recurring Invoices', message: 'Upgrade to Pro to save and auto-generate recurring invoices.' });
          setIsPricingModalOpen(true);
          return;
      }
      if (saveRecurringInvoice) {
          saveRecurringInvoice(inv);
          showToast('Saved as recurring template!', 'success');
      }
  }, [saveRecurringInvoice, isPro]);

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    // Determine the source element
    let sourceElement = document.getElementById('invoice-preview-container');

    if (!sourceElement && activeMobileTab === 'edit' && window.innerWidth < 768) {
         showToast('Switching to preview to generate PDF...', 'success');
         setActiveMobileTab('preview');
         // Wait for React to render the DOM changes and layout to complete
         await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
         sourceElement = document.getElementById('invoice-preview-container');
    }

    if (!sourceElement) {
        showToast('Preview not available. Please switch to Preview tab.', 'error');
        setIsGeneratingPdf(false);
        return;
    }

    try {
      showToast('Generating PDF...', 'success');
      trackEvent('download_pdf_start', { invoice_id: invoice.invoiceNumber });

      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const imgData = await toJpeg(sourceElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      saveInvoice({ ...invoice, ...totals });
      showToast('PDF Downloaded!');
      trackEvent('download_pdf_success', { invoice_id: invoice.invoiceNumber });

      if (!user) {
          setTimeout(() => {
              setPricingModalContent({
                  title: "Don't Lose Your Invoices!",
                  message: "Sign up for a free account to save your clients and sync your invoices across all your devices."
              });
              setIsPricingModalOpen(true);
          }, 1000);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF', 'error');
      trackEvent('download_pdf_error', { error: String(e) });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <IdleLockScreen timeoutMinutes={15}>
      <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-teal-100 selection:text-teal-900">
        <CommandPaletteProvider
          onNavigate={(view) => {
            if (view === 'blog') window.location.href = '/blog';
            else window.location.href = `/${view}`;
          }}
          onAction={(action) => {
            if (action === 'settings') setIsSettingsModalOpen(true);
            if (action === 'upgrade') {
              setPricingModalContent({ title: 'Upgrade to Pro', message: 'Unlock advanced features to supercharge your business.' });
              setIsPricingModalOpen(true);
            }
          }}
        />
        <Helmet>
          <title>{invoice.invoiceNumber ? `Invoice #${invoice.invoiceNumber} | InvoiceApp` : 'Free Invoice Generator for Nigeria | InvoiceApp'}</title>
          <meta name="description" content={invoice.user.name ? `Invoice generated by ${invoice.user.name} for ${invoice.client.name || 'a client'} using InvoiceApp.` : "Create professional invoices in seconds. The #1 free invoice generator tailored for Nigerian freelancers and businesses."} />
          <link rel="canonical" href="https://www.invoiceapp.ng/" />
        </Helmet>

        {/* Main Header */}
        <header className="flex-none bg-slate-900 border-b border-slate-800 z-50 text-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3" onClick={() => window.location.href = '/'} style={{cursor: 'pointer'}}>
              <div className="bg-teal-500 text-white p-2 rounded-xl shadow-lg shadow-teal-900/50 ring-1 ring-white/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none tracking-tight">InvoiceApp</h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold leading-none">.ng {isPro && <span className="bg-gradient-to-r from-teal-400 to-teal-300 text-slate-900 px-1.5 py-0.5 rounded text-[9px] ml-1">PRO</span>}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
               {isOffline && (
                   <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium border border-amber-500/20">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       Offline Mode {pendingSyncCount > 0 && `(${pendingSyncCount} pending)`}
                   </div>
               )}
               {!user ? (
                 <div className="flex items-center gap-2">
                   <button onClick={() => setIsAuthModalOpen(true)} className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors">Sign In</button>
                   <button onClick={() => setIsAuthModalOpen(true)} className="text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 px-4 py-1.5 rounded-full transition-colors shadow-sm">Get Started</button>
                 </div>
               ) : (
                 <div className="flex items-center gap-3">
                   {!isPro && (
                     <button onClick={() => setIsPricingModalOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-400 to-teal-500 text-slate-900 font-bold text-xs rounded-full hover:shadow-lg hover:shadow-teal-500/20 transition-all hover:-translate-y-0.5">
                       Upgrade to Pro
                     </button>
                   )}
                   <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                       <button onClick={() => window.location.href='/settings'} className="text-xs text-slate-400 hover:text-white transition-colors" title={user.email || ''}>{user.displayName || 'Settings'}</button>
                       <button onClick={logout} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Sign Out</button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </header>

        {/* ROUTES CONTAINER */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col h-full w-full">
                {/* Editor Specific Command Bar */}
                <div className="flex-none z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-800 border-slate-200">{invoice.status}</span>
                        <span className="text-sm text-slate-400 font-mono">#{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
                    </div>
                    <div className="flex items-center gap-2">
                        <ActionButtons
                            onGenerateEmail={handleGenerateEmail}
                            onDownloadPdf={handleDownloadPdf}
                            isMobile={false}
                            invoiceNumber={invoice.invoiceNumber}
                            totalAmount={`\${invoice.currency} \${numberFormatter.format(totals.total)}`}
                            documentType={invoice.documentType}
                            onConvertToInvoice={handleConvertToInvoice}
                            invoice={invoice}
                            isGeneratingPdf={isGeneratingPdf}
                            onNewInvoice={resetInvoice}
                        />
                    </div>
                </div>
                
                {/* Editor Split View */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-[45%] lg:w-[40%] bg-white md:border-r border-slate-200 h-full overflow-y-auto custom-scrollbar flex flex-col block">
                    <div className="p-4 sm:p-6 lg:p-8 flex-1">
                      <div className="max-w-xl mx-auto pb-8">
                        <InvoiceForm
                          invoice={invoice}
                          updateInvoice={handleUpdateInvoice}
                          addLineItem={addLineItem}
                          removeLineItem={removeLineItem}
                          updateLineItem={updateLineItem}
                          savedClients={savedClients}
                          onSaveClient={handleSaveClient}
                          businessProfiles={businessProfiles}
                          onSaveBusinessProfile={handleSaveBusinessProfile}
                          onSaveRecurring={handleSaveRecurringWrapper}
                          onSaveInvoice={saveInvoice}
                          isPro={isPro}
                          onProFeatureClick={handleProFeatureRecurring}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Panel */}
                  <div className="hidden md:block md:w-[55%] lg:w-[60%] bg-slate-100 h-full overflow-y-auto relative custom-scrollbar">
                    <div className="absolute inset-0 p-8 flex flex-col items-center min-h-max" ref={previewContainerRef}>
                        <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out', paddingBottom: '4rem', width: '210mm' }}>
                          <Suspense fallback={<div className="w-[210mm] min-h-[297mm] bg-white shadow-xl animate-pulse flex items-center justify-center text-slate-400">Loading preview...</div>}>
                            <InvoicePreview invoice={invoice} template={template}  />
                          </Suspense>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/accounting" element={<AccountingDashboard expenses={expenses} addExpense={addExpense} removeExpense={removeExpense} invoiceTotals={totals.total} onBack={() => window.location.href='/'} />} />
            <Route path="/recurring" element={<RecurringManager recurringInvoices={recurringInvoices} onEdit={(inv) => { setInvoice(inv); window.location.href='/'; }} onDelete={removeRecurringInvoice} onToggleActive={toggleRecurringActive} onBack={() => window.location.href='/'} />} />
            <Route path="/receipts" element={<ReceiptsManager receipts={receipts} savedInvoices={savedInvoices} onAddReceipt={addReceipt} onDeleteReceipt={removeReceipt} onBack={() => window.location.href='/'} onViewReceipt={setViewingReceipt} />} />
            <Route path="/integrations" element={<IntegrationsView />} />
            <Route path="/cli" element={<CLIAccessView />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/p/:username" element={<PublicProfile username={''} />} />
            <Route path="/templates/:slug" element={<TemplatePage slug={''} onGoHome={() => window.location.href='/'} />} />
            <Route path="/settings" element={<div className="p-8 w-full h-full overflow-y-auto"><SettingsModal isOpen={true} onClose={() => window.location.href='/'} user={user} isPro={isPro} logout={logout} /></div>} />
          </Routes>
        </div>

        {/* Global Modals */}
        <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} onSend={async () => {}} generatedEmail={generatedEmail} emailTemplate={emailTemplate} onTemplateChange={setEmailTemplate} invoiceNumber={invoice.invoiceNumber} clientName={invoice.client.name} amount={`\${invoice.currency} \${numberFormatter.format(totals.total)}`} documentType={invoice.documentType} smtpSettings={smtpSettings} onOpenSmtpSettings={() => setIsSmtpModalOpen(true)} isPro={isPro} onProFeatureClick={() => handleProFeatureClick('Email Delivery')} />
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onUpgrade={upgradeToPro} user={user} loading={loading} content={pricingModalContent} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onGoogleLogin={loginWithGoogle} onEmailLogin={loginWithEmail} onEmailSignUp={signUpWithEmail} loading={loading} />
        <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        <SmtpSettingsModal isOpen={isSmtpModalOpen} onClose={() => setIsSmtpModalOpen(false)} onSmtpSaved={setSmtpSettings} />
        
        {viewingReceipt && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                    <button onClick={() => setViewingReceipt(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"><svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <ReceiptPreview receipt={viewingReceipt} invoice={savedInvoices.find(i => i.id === viewingReceipt.invoiceId)}  />
                </div>
            </div>
        )}
      </div>
    </IdleLockScreen>
  );
};

export default App;
