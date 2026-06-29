
import React, { useState } from 'react';
import { DownloadIcon, MailIcon, WhatsAppIcon, XIcon, ShareIcon } from './Icons';
import { trackEvent } from '../utils/analytics';
import { createPortalLink } from '../utils/portalLinks';
import type { Invoice } from '../types';

interface ActionButtonsProps {
  onGenerateEmail: () => void;
  onDownloadPdf: () => void;
  isMobile?: boolean;
  invoiceNumber?: string;
  totalAmount?: string;
  documentType?: string;
  onConvertToInvoice?: () => void;
  invoice?: Invoice;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onGenerateEmail,
    onDownloadPdf,
    isMobile = false,
    invoiceNumber = '',
    totalAmount = '',
    documentType,
    onConvertToInvoice,
    invoice,
}) => {
    const [linkCopied, setLinkCopied] = useState(false);
    const shareText = `Hi, here is the invoice #${invoiceNumber} for ${totalAmount}. Built with InvoiceApp.`;
    const shareUrl = 'https://www.invoiceapp.ng/';
    const isProforma = documentType === 'Pro-forma';

    const handleShareLink = async () => {
        if (!invoice) return;
        const link = createPortalLink(invoice);
        try {
            await navigator.clipboard.writeText(link);
            setLinkCopied(true);
            trackEvent('share_link', { invoice_number: invoiceNumber });
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            window.prompt('Copy this link:', link);
        }
    };

    const handleWhatsAppShare = () => {
        trackEvent('share_whatsapp', { invoice_number: invoiceNumber });
        const text = encodeURIComponent(`${shareText} ${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleXShare = () => {
        trackEvent('share_x', { invoice_number: invoiceNumber });
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=InvoiceApp,Nigeria,Freelance`, '_blank');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice #${invoiceNumber} | InvoiceApp`,
                    text: shareText,
                    url: shareUrl,
                });
                trackEvent('share_native_success', { invoice_number: invoiceNumber });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            handleXShare();
        }
    };

  if (isMobile) {
      return (
        <div className="flex gap-2">
            {isProforma && onConvertToInvoice && (
              <button
                onClick={onConvertToInvoice}
                className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                title="Convert to Invoice"
                aria-label="Convert to Invoice"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
            {invoice && (
              <button
                onClick={handleShareLink}
                className="p-1.5 text-slate-600 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-lg transition-colors"
                title={linkCopied ? 'Link copied!' : 'Copy shareable link'}
              >
                {linkCopied ? (
                  <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                )}
              </button>
            )}
            <button
                onClick={onGenerateEmail}
                className="p-1.5 text-slate-600 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                title="Email Invoice"
                aria-label="Email Invoice"
            >
                <MailIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleWhatsAppShare}
                className="p-1.5 text-slate-600 hover:text-green-600 bg-slate-100 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                title="Share via WhatsApp"
                aria-label="Share via WhatsApp"
            >
                <WhatsAppIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleNativeShare}
                className="p-1.5 text-slate-600 hover:text-blue-500 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Share"
                aria-label="Share Invoice"
            >
                <ShareIcon className="w-4 h-4" />
            </button>
            <button
                onClick={onDownloadPdf}
                className="p-1.5 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1"
                title="Download PDF"
                aria-label="Download PDF"
            >
                <DownloadIcon className="w-4 h-4" />
            </button>
        </div>
      )
  }

  return (
    <div className="flex gap-2 w-full lg:w-auto">
      {isProforma && onConvertToInvoice && (
        <button
          onClick={onConvertToInvoice}
          className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-amber-300 text-xs font-bold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-sm"
          aria-label="Convert to Invoice"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          Convert to Invoice
        </button>
      )}
      {invoice && (
        <button
          onClick={handleShareLink}
          className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
          title={linkCopied ? 'Link copied!' : 'Copy shareable link'}
        >
          {linkCopied ? (
            <svg className="w-3.5 h-3.5 mr-1.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          )}
          {linkCopied ? 'Copied!' : 'Link'}
        </button>
      )}
      <button
        onClick={onGenerateEmail}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
      >
        <MailIcon className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
        Email
      </button>
      <button
        onClick={handleWhatsAppShare}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
        aria-label="Share via WhatsApp"
      >
        <WhatsAppIcon className="w-3.5 h-3.5 mr-1.5 text-green-500" />
        WA
      </button>
      <button
        onClick={handleXShare}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-black hover:border-slate-300 transition-all shadow-sm"
        aria-label="Share on X"
      >
        <XIcon className="w-3.5 h-3.5 mr-1.5 text-slate-900" />
        X
      </button>
      <button
        onClick={onDownloadPdf}
        className="flex-1 lg:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg shadow-md shadow-teal-200 text-white bg-teal-600 hover:bg-teal-700 hover:shadow-lg transition-all"
        aria-label="Download PDF"
      >
        <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
        PDF
      </button>
    </div>
  );
};
