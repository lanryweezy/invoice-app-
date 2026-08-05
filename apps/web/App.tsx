import { getDecodedPathname } from "./utils/routing";
import React, { useState, useCallback, useMemo, useEffect, Suspense, useRef } from 'react';

import { InvoiceForm } from './components/InvoiceForm';
import { ActionButtons } from './components/ActionButtons';
import { EmailModal } from './components/EmailModal';
import { useInvoice } from './hooks/useInvoice';
import { generateEmailTemplate, type EmailTemplateType } from './utils/emailGenerator';
import { generateSequentialInvoiceNumber } from './utils/invoiceSequence';
import type { Invoice, TemplateId, Client } from './types';
import { TemplateSelector } from './components/TemplateSelector';
import { EditIcon, EyeIcon } from './components/Icons';
import { Toast } from './components/Toast';
import { trackEvent, collectSessionDetails } from './utils/analytics';
import { Helmet } from 'react-helmet-async';
import { useSubscription } from './hooks/useSubscription';
import { PricingModal } from './components/PricingModal';
import { SettingsModal } from './components/SettingsModal';
import { BranchesManager } from './components/BranchesManager';
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
import { flushQueue, getQueueCount } from './utils/offlineSync';

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
      setToast({ message, isVisible: true, type });
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
    const handleOnline = async () => {
      setIsOffline(false);
      showToast('Back online! Syncing data...', 'success');
      const success = await flushQueue();
      if (success) {
        setPendingSyncCount(0);
        showToast('All changes synced to cloud.', 'success');
      } else {
        showToast('Some changes could not be synced. Will retry later.', 'error');
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      showToast('You are offline. Changes will be saved locally.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically check queue count if offline
    let interval: any;
    if (isOffline) {
       interval = setInterval(async () => {
           const count = await getQueueCount();
           setPendingSyncCount(count);
       }, 2000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [isOffline]);

  // Initial Sync on Startup
  useEffect(() => {
    const startupSync = async () => {
      if (navigator.onLine) {
         const count = await getQueueCount();
         if (count > 0) {
            showToast('Syncing pending changes from previous session...', 'success');
            const success = await flushQueue();
            if (success) {
               setPendingSyncCount(0);
               showToast('Startup sync complete.', 'success');
            }
         }
      }
    };
    startupSync();
  }, [showToast]);

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
  const [activeView, setActiveView] = useState<'editor' | 'branches' | 'accounting' | 'recurring' | 'receipts' | 'integrations' | 'cli' | 'blog' | 'blogPost' | 'publicProfile' | 'templatePage' | 'privacy' | 'terms' | 'support'>(() => {
      let path = getDecodedPathname();

      if (path === '/privacy') return 'privacy';
      if (path === '/terms') return 'terms';
      if (path === '/support') return 'support';
      if (path.startsWith('/p/')) return 'publicProfile';
      if (path.startsWith('/templates/')) return 'templatePage';
            if (path === '/branches') return 'branches';
      if (path === '/accounting') return 'accounting';
      if (path === '/recurring') return 'recurring';
      if (path === '/receipts') return 'receipts';
      if (path === '/integrations') return 'integrations';
      if (path === '/cli') return 'cli';

      // Handle legacy /blog/:id routes by redirecting them or showing blogPost view
      if (path !== '/' && path !== '/editor' && path !== '/branches' && path !== '/accounting' && path !== '/recurring' && path !== '/receipts' && path !== '/integrations' && path !== '/cli' && path !== '/privacy' && path !== '/terms' && path !== '/support' && !path.startsWith('/p/') && !path.startsWith('/templates/')) {
          return 'blogPost';
      }
      return 'editor';
  });

  const [publicUsername, setPublicUsername] = useState<string | null>(() => {
      let path = getDecodedPathname();
      if (path.startsWith('/p/')) return path.split('/')[2] || null;
      return null;
  });

  const [activeTemplateSlug, setActiveTemplateSlug] = useState<string | null>(() => {
      let path = getDecodedPathname();
      if (path.startsWith('/templates/')) {
          return path.split('/')[2] || null;
      }
      return null;
  });

  const [activeBlogPostSlug, setActiveBlogPostSlug] = useState<string | null>(() => {
      let path = getDecodedPathname();

      // Support legacy paths
      if (path.startsWith('/blog/')) {
          return path.substring(6);
      }

      if (path !== '/' && path !== '/blog' && !path.startsWith('/p/') && !path.startsWith('/templates/') && path !== '/editor' && path !== '/branches' && path !== '/accounting' && path !== '/recurring' && path !== '/receipts') {
          return path.substring(1); // Remove leading slash
      }
      return null;
  });

  // Handle URL updates when state changes
  useEffect(() => {
      let path = '/';
      if (activeView === 'blog') path = '/blog';
      else if (activeView === 'integrations') path = '/integrations';
      else if (activeView === 'cli') path = '/cli';
      else if (activeView === 'blogPost' && activeBlogPostSlug !== null) path = `/${encodeURIComponent(activeBlogPostSlug)}`;
      else if (activeView === 'publicProfile' && publicUsername !== null) path = `/p/${publicUsername}`;
      else if (activeView === 'templatePage' && activeTemplateSlug !== null) path = `/templates/${encodeURIComponent(activeTemplateSlug)}`;

      // Update the URL without reloading the page
      let currentDecodedPath = getDecodedPathname();

      let targetDecodedPath = getDecodedPathname(path);

      if (currentDecodedPath !== targetDecodedPath) {
          window.history.pushState(null, '', path);
      }
  }, [activeView, activeBlogPostSlug, publicUsername]);

  // Handle browser back/forward buttons
  useEffect(() => {
      const handlePopState = () => {
          let path = getDecodedPathname();
          if (path === '/blog') {
              window.location.href = '/blog';
          } else if (path === '/integrations') {
              setActiveView('integrations');
          } else if (path === '/cli') {
              setActiveView('cli');
          } else if (path === '/branches') {
              setActiveView('branches');
          } else if (path === '/accounting') {
              setActiveView('accounting');
          } else if (path === '/recurring') {
              setActiveView('recurring');
          } else if (path === '/receipts') {
              setActiveView('receipts');
          } else if (path === '/privacy') {
              setActiveView('privacy');
          } else if (path === '/terms') {
              setActiveView('terms');
          } else if (path === '/support') {
              setActiveView('support');
          } else if (path.startsWith('/p/')) {
              setPublicUsername(path.split('/')[2] || null);
              setActiveView('publicProfile');
          } else if (path.startsWith('/templates/')) {
              setActiveTemplateSlug(path.split('/')[2] || null);
              setActiveView('templatePage');
          } else if (path !== '/' && path !== '/editor' && path !== '/branches' && path !== '/accounting' && path !== '/recurring' && path !== '/receipts' && path !== '/integrations' && path !== '/cli' && path !== '/privacy' && path !== '/terms' && path !== '/support') {
              setActiveBlogPostSlug(path.substring(1));
              setActiveView('blogPost');
          } else {
              setActiveView('editor');
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 'edit' vs 'preview' for mobile tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.offsetWidth;
      // A4 width ≈ 794px at 96dpi
      const a4Width = 794;

      const availableWidth = containerWidth - 32;
      const newScale = Math.min(availableWidth / a4Width, 1);
      setPreviewScale(newScale);
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 50); // ⚡ Bolt: Debounce resize event to prevent rapid re-renders
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

  // ⚡ Bolt: Memoize updateInvoice handler to prevent InvoiceForm from re-rendering on every App state change
  const handleUpdateInvoice = useCallback((key: keyof Invoice, value: any) => {
      if (key === 'status' && value === 'Paid' && invoice.status !== 'Paid') {
          setIsPaymentModalOpen(true);
      }
      updateInvoice(key, value);
  }, [invoice.status, updateInvoice]);

  // ⚡ Bolt: Memoize saveBusinessProfile handler to prevent InvoiceForm from re-rendering on every App state change
  const handleSaveBusinessProfile = useCallback((profile: any) => {
      saveBusinessProfile(profile);
      showToast('Business profile saved!');
  }, [saveBusinessProfile, showToast]);

  const handleProFeatureClick = useCallback((featureName: 'Branches' | 'Accounting' | 'Recurring' | 'Receipts' | 'Integrations') => {
      if (!isPro) {
          setGatedFeature(featureName);
      } else {
          setActiveView(featureName.toLowerCase() as 'branches' | 'accounting' | 'recurring' | 'receipts' | 'integrations');
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
         await new Promise(resolve => setTimeout(resolve, 500));
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

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-10000px';
      container.style.left = '0';
      container.style.width = '210mm';
      container.style.minHeight = '297mm';
      container.style.zIndex = '-1';
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      const clone = sourceElement.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      container.appendChild(clone);

      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
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
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-teal-100 selection:text-teal-900">
      <CommandPaletteProvider
        onNavigate={(view) => {
          if (view === 'blog') {
            window.location.href = '/blog';
          } else if (view === 'editor') {
            setActiveView('editor');
          } else {
            handleProFeatureClick(view.charAt(0).toUpperCase() + view.slice(1));
          }
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

        {/* Dynamic Open Graph */}
        <meta property="og:title" content={invoice.invoiceNumber ? `Invoice #${invoice.invoiceNumber} | InvoiceApp` : 'Free Invoice Generator for Nigeria'} />
        <meta property="og:description" content={invoice.user.name ? `Professional invoice created by ${invoice.user.name} via InvoiceApp.` : 'Create and share professional invoices for free.'} />
        <meta property="og:image" content="https://www.invoiceapp.ng/og-image.jpg" />

        {/* Dynamic Twitter */}
        <meta name="twitter:title" content={invoice.invoiceNumber ? `Invoice #${invoice.invoiceNumber} | InvoiceApp` : 'Free Invoice Generator for Nigeria'} />
        <meta name="twitter:description" content={invoice.user.name ? `Check out this invoice created by ${invoice.user.name} using #InvoiceApp.` : 'The best way to generate invoices in Nigeria.'} />
        <meta name="twitter:image" content="https://www.invoiceapp.ng/og-image.jpg" />
      </Helmet>

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
              <h1 className="text-lg font-bold text-white leading-none tracking-tight">InvoiceApp</h1>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold leading-none">.ng {isPro && <span className="bg-gradient-to-r from-teal-400 to-teal-300 text-slate-900 px-1.5 py-0.5 rounded text-[9px] ml-1">PRO</span>}</p>
                  {isOffline && (
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30" title="Changes will sync when reconnected">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-3-3m0 0l-3 3m3-3v8" /></svg>
                          Offline {pendingSyncCount > 0 ? `(${pendingSyncCount} pending)` : ''}
                      </span>
                  )}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <button onClick={() => setActiveView('editor')} className={`text-xs font-medium transition-colors ${activeView === 'editor' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Invoice Editor</button>
             <button onClick={() => user ? setActiveView('branches') : handleProFeatureClick('Branches')} className={`text-xs font-medium transition-colors ${activeView === 'branches' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Branches</button>
             <button onClick={() => user ? setActiveView('accounting') : handleProFeatureClick('Accounting')} className={`text-xs font-medium transition-colors ${activeView === 'accounting' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Accounting</button>
             <button onClick={() => user ? setActiveView('recurring') : handleProFeatureClick('Recurring')} className={`text-xs font-medium transition-colors ${activeView === 'recurring' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Recurring</button>
             <button onClick={() => user ? setActiveView('receipts') : handleProFeatureClick('Receipts')} className={`text-xs font-medium transition-colors ${activeView === 'receipts' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Receipts</button>
             <button onClick={() => user ? setActiveView('integrations') : handleProFeatureClick('Integrations')} className={`text-xs font-medium transition-colors ${activeView === 'integrations' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Integrations</button>
                 <a href="/blog" className={`text-xs font-medium transition-colors ${activeView === 'blog' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Blog</a>
             <div className="w-px h-4 bg-slate-700"></div>
             {!loading && (
                 user ? (
                     <div className="flex items-center gap-3">
                         <button onClick={() => setIsSettingsModalOpen(true)} className="text-xs text-slate-400 hover:text-white transition-colors" title={user.email || ''}>{user.displayName || 'Settings'}</button>
                         {!isPro && (
                             <button onClick={() => { setPricingModalContent({ title: 'Upgrade to Pro', message: 'Unlock advanced features to supercharge your business.' }); setIsPricingModalOpen(true); }} className="text-xs font-bold bg-teal-500 hover:bg-teal-400 text-white px-3 py-1.5 rounded-lg transition-colors">
                                 Upgrade
                             </button>
                         )}
                     </div>
                 ) : (
                     <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold text-slate-300 hover:text-white transition-colors">Login</button>
                 )
             )}
          </div>
        </div>
      </header>

      {/* COMMAND BAR (Sub-Nav) - Fixed height below header - ONLY SHOW IN EDITOR VIEW */}
      {activeView === 'editor' && (
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
                <div className="flex items-center gap-2">
                    <ActionButtons
                        onGenerateEmail={handleGenerateEmail}
                        onDownloadPdf={handleDownloadPdf}
                        isMobile={false}
                        invoiceNumber={invoice.invoiceNumber}
                        totalAmount={`${invoice.currency} ${numberFormatter.format(totals.total)}`}
                        documentType={invoice.documentType}
                        onConvertToInvoice={handleConvertToInvoice}
                        invoice={invoice}
                        isGeneratingPdf={isGeneratingPdf}
                        onNewInvoice={resetInvoice}
                    />
                </div>
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
                            invoiceNumber={invoice.invoiceNumber}
                            totalAmount={`${invoice.currency} ${numberFormatter.format(totals.total)}`}
                            documentType={invoice.documentType}
                            onConvertToInvoice={handleConvertToInvoice}
                            invoice={invoice}
                            isGeneratingPdf={isGeneratingPdf}
                        onNewInvoice={resetInvoice}
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
      )}

      {/* Main Layout - Flex-1 fills remaining space */}
      {isPaymentModalOpen && (
          <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              invoice={invoice}
              totalAmount={totals.total}
              onSubmit={(paymentDetails) => {
                  addReceipt({
                      invoiceNumber: invoice.invoiceNumber,
                      ...paymentDetails,
                      invoice: invoice
                  });
                  setIsPaymentModalOpen(false);
                  showToast('Receipt generated successfully');
                  setActiveView('receipts');
              }}
          />
      )}

      {viewingReceipt && (
          <ReceiptPreview
              receipt={viewingReceipt}
              template={template}
              onClose={() => setViewingReceipt(null)}
          />
      )}

      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto overflow-y-auto">

        {gatedFeature ? (
          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            <FeatureGate
              featureName={gatedFeature}
              headline={
                gatedFeature === 'Accounting' ? "You've done the hard work. Let's show you the numbers." :
                gatedFeature === 'Branches' ? "Grow beyond one location." :
                "Unlock more power for your business."
              }
              subhead={
                gatedFeature === 'Accounting' ? "See profit, track who owes you, and be ready for tax season – all from InvoiceApp." :
                gatedFeature === 'Branches' ? "Manage multiple offices, track location-specific revenue, and organize your teams." :
                `Upgrade to unlock ${gatedFeature} and streamline your workflow.`
              }
              bullets={
                gatedFeature === 'Accounting' ? ["See who hasn't paid", "Know your monthly profit", "Export for your accountant"] :
                gatedFeature === 'Branches' ? ["Add unlimited locations", "Set location-specific addresses", "Filter reports by branch"] :
                ["Unlimited clients and invoices", "Cloud sync across devices", "Priority support"]
              }
              onUpgrade={() => {
                  setPricingModalContent({ title: `Unlock ${gatedFeature}`, message: `Upgrade to Pro to unlock ${gatedFeature} and much more.` });
                  setIsPricingModalOpen(true);
              }}
              onDismiss={() => {
                  setGatedFeature(null);
                  setActiveView('editor');
              }}
            />
          </div>
        ) : activeView === 'branches' ? (
            <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                <BranchesManager
                    isPro={isPro}
                    onUpgrade={() => {
                        setPricingModalContent({ title: 'Multi-Location Management', message: 'Upgrade to Pro to manage branches across Nigeria and track location-specific revenue.' });
                        setIsPricingModalOpen(true);
                    }}
                />
            </div>
        ) : activeView === 'accounting' ? (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto">
                <AccountingDashboard
                    invoices={savedInvoices}
                    expenses={expenses}
                    onAddExpense={addExpense}
                    onRemoveExpense={removeExpense}
                    isPro={isPro}
                    onUpgrade={() => {
                        setPricingModalContent({ title: 'Unlock Full Financial History', message: 'Upgrade to Pro to see your full transaction history, download detailed audit logs, and export for NRS bulk filing.' });
                        setIsPricingModalOpen(true);
                    }}
                />
            </div>
        ) : activeView === 'recurring' ? (
            <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                <RecurringManager
                    recurringInvoices={recurringInvoices}
                    onGenerateNext={(inv) => {
                        setInvoice({
                            ...inv,
                            issueDate: new Date().toISOString().split('T')[0],
                            invoiceNumber: generateSequentialInvoiceNumber()
                        });
                        setActiveView('editor');
                        showToast('Recurring template loaded into editor', 'success');
                    }}
                    onRemove={removeRecurringInvoice}
                    onToggleActive={toggleRecurringActive}
                />
            </div>
        ) : activeView === 'receipts' ? (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto">
                <ReceiptsManager
                    receipts={receipts}
                    onViewReceipt={setViewingReceipt}
                    onRemoveReceipt={(id) => {
                        removeReceipt(id);
                        showToast('Receipt deleted');
                    }}
                />
            </div>
        ) : activeView === 'integrations' ? (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto">
                <IntegrationsView
                    onUpgrade={() => {
                        setPricingModalContent({ title: 'Unlock Integrations', message: 'Upgrade to Pro to connect payment gateways, accounting software, and more.' });
                        setIsPricingModalOpen(true);
                    }}
                />
            </div>
        ) : activeView === 'cli' ? (
            <div className="p-4 sm:p-8">
                <CLIAccessView />
            </div>
        ) : activeView === 'privacy' ? (
            <PrivacyPage />
        ) : activeView === 'terms' ? (
            <TermsPage />
        ) : activeView === 'support' ? (
            <SupportPage />
        ) : activeView === 'publicProfile' && publicUsername !== null ? (
            <PublicProfile username={publicUsername} />
        ) : activeView === 'templatePage' && activeTemplateSlug !== null ? (
            <TemplatePage slug={activeTemplateSlug} onGoHome={() => setActiveView('editor')} />
        ) : activeView === 'blog' || activeView === 'blogPost' ? (
            <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading blog...</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 text-xs text-teal-600 hover:text-teal-700 font-bold underline"
                    >
                        Click here if it doesn't load
                    </button>
                </div>
            </div>
        ) : (
        <div className="flex flex-col md:flex-row h-full">

          {/* LEFT COLUMN: Editor Form - Independent Scroll */}
          <div className={`w-full md:w-[45%] lg:w-[40%] bg-white md:border-r border-slate-200 h-full overflow-y-auto custom-scrollbar flex flex-col ${activeMobileTab === 'edit' ? 'block' : 'hidden md:flex'}`}>
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
                        Built for Nigerian freelancers & SMEs. Free plan stores data locally. Pro plan adds optional cloud sync.
                    </p>

                   {/* Links */}
                   <div className="flex justify-center gap-6 text-xs font-bold text-slate-600">
                       <a href="/privacy" onClick={(e) => { e.preventDefault(); setActiveView('privacy'); }} className="hover:text-teal-600 transition-colors">Privacy</a>
                       <span className="text-slate-300">•</span>
                       <a href="/terms" onClick={(e) => { e.preventDefault(); setActiveView('terms'); }} className="hover:text-teal-600 transition-colors">Terms</a>
                       <span className="text-slate-300">•</span>
                       <a href="/blog" className="hover:text-teal-600 transition-colors">Blog</a>
                       <span className="text-slate-300">•</span>
                       <a href="/support" onClick={(e) => { e.preventDefault(); setActiveView('support'); }} className="hover:text-teal-600 transition-colors">Support</a>
                   </div>

                   {/* Copyright */}
                   <div className="pt-4 border-t border-slate-200/50 text-center">
                       <p className="text-[11px] text-slate-400 font-medium">
                          © {new Date().getFullYear()} InvoiceApp.
                       </p>
                   </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Preview - Independent Scroll */}
          {/* Responsive container for dynamic scaling */}
          <div
            ref={previewContainerRef}
            className={`w-full md:w-[55%] lg:w-[60%] bg-slate-100/50 h-full overflow-y-auto overflow-x-auto custom-scrollbar flex flex-col ${activeMobileTab === 'preview' ? 'block' : 'hidden md:flex'}`}
          >
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Removed overflow-hidden to prevent clipping, added padding bottom for scroll space */}
            <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col items-center relative z-10 pt-8">

              {/* Responsive scaling wrapper */}
              <div
                className="origin-top-left transition-transform duration-200 ease-in-out pb-32 md:pb-0"
                style={{
                  transform: `scale(${previewScale})`,
                  width: `${210 * previewScale}mm`,
                  height: `${297 * previewScale}mm`,
                }}
              >
                 {/* True A4 Paper Preview */}
                 <div id="invoice-preview-container" className="bg-white text-slate-900 shadow-2xl shadow-slate-400/30 rounded-sm min-h-[297mm] w-[210mm] origin-top-left border border-slate-200/60">
                    <div className="p-8 md:p-12 h-full flex flex-col relative">
                        <Suspense fallback={
                            <div className="animate-pulse space-y-8 w-full h-full p-4">
                                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
                                    <div className="flex items-start gap-6">
                                        <div className="h-20 w-20 bg-slate-100 rounded-lg"></div>
                                        <div className="space-y-3">
                                            <div className="h-8 w-48 bg-slate-200 rounded"></div>
                                            <div className="h-4 w-64 bg-slate-100 rounded"></div>
                                            <div className="h-4 w-40 bg-slate-100 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex flex-col items-end">
                                        <div className="h-10 w-32 bg-slate-200 rounded"></div>
                                        <div className="h-6 w-24 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-12 pt-8">
                                    <div className="space-y-3">
                                        <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                        <div className="h-4 w-40 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="flex justify-center gap-12">
                                        <div className="space-y-3">
                                            <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                            <div className="h-5 w-24 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                            <div className="h-5 w-24 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-12 space-y-4">
                                    <div className="h-8 w-full bg-slate-50 rounded"></div>
                                    <div className="h-12 w-full bg-slate-100 rounded"></div>
                                    <div className="h-12 w-full bg-slate-100 rounded"></div>
                                    <div className="h-12 w-full bg-slate-100 rounded"></div>
                                </div>
                                <div className="mt-auto pt-12 flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-4 w-20 bg-slate-100 rounded"></div></div>
                                        <div className="flex justify-between"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-4 w-20 bg-slate-100 rounded"></div></div>
                                        <div className="h-16 w-full bg-slate-900/5 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        }>
                            <InvoicePreview invoice={invoice} totals={totals} template={template} isPro={isPro} />
                        </Suspense>
                    </div>
                 </div>
              </div>

              {/* Spacer */}
              <div className="h-12"></div>
            </div>
          </div>

        </div>
        )}
      </main>

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        emailContent={generatedEmail}
        onTemplateChange={(type) => handleGenerateEmail(type)}
        activeTemplate={emailTemplate}
        recipientEmail={invoice.client.email}
        smtpSettings={smtpSettings}
        onOpenSmtpSettings={() => { setIsEmailModalOpen(false); setIsSmtpModalOpen(true); }}
      />

      <SmtpSettingsModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
        user={user}
        isPro={isPro}
        onSmtpSaved={(settings) => setSmtpSettings(settings)}
        onUpgrade={() => {
          setIsSmtpModalOpen(false);
          setPricingModalContent({ title: 'Unlock Direct Email', message: 'Send invoices straight from your inbox to your clients — no copy-pasting needed.' });
          setIsPricingModalOpen(true);
        }}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onUpgrade={async (planType) => {
            const success = await upgradeToPro(planType);
            return success;
        }}
        onLogin={() => {
            setIsAuthModalOpen(true);
        }}
        user={user}
        title={pricingModalContent.title}
        message={pricingModalContent.message}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginWithGoogle={loginWithGoogle}
        onLoginWithEmail={loginWithEmail}
        onSignUpWithEmail={signUpWithEmail}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        isPro={isPro}
        logout={() => {
            logout();
            setActiveView('editor');
        }}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* NRS Compliance Modals */}
      {isComplianceOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsComplianceOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setIsComplianceOpen(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <ComplianceDashboard
              invoice={invoice}
              onClose={() => setIsComplianceOpen(false)}
            />
          </div>
        </div>
      )}

      {isQRCodeOpen && invoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsQRCodeOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setIsQRCodeOpen(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <QRCodeDisplay invoice={invoice} />
          </div>
        </div>
      )}

      {isPaymentDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsPaymentDetailsOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setIsPaymentDetailsOpen(false)}>
          <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <PaymentDetails
              invoice={invoice}
              updateInvoice={handleUpdateInvoice}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
