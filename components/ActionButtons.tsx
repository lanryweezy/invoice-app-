
import React from 'react';
import { DownloadIcon, MailIcon, WhatsAppIcon, XIcon, ShareIcon } from './Icons';
import { trackEvent } from '../utils/analytics';

interface ActionButtonsProps {
  onGenerateEmail: () => void;
  onDownloadPdf: () => void;
  isMobile?: boolean;
  invoiceNumber?: string;
  totalAmount?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onGenerateEmail,
    onDownloadPdf,
    isMobile = false,
    invoiceNumber = '',
    totalAmount = ''
}) => {
    const shareText = `Hi, here is the invoice #${invoiceNumber} for ${totalAmount}. Built with InvoiceApp.`;
    const shareUrl = 'https://www.invoiceapp.ng/';

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
            <button
                onClick={onGenerateEmail}
                className="p-1.5 text-slate-600 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-lg transition-colors"
                title="Email Invoice"
                aria-label="Email Invoice"
            >
                <MailIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleWhatsAppShare}
                className="p-1.5 text-slate-600 hover:text-green-600 bg-slate-100 hover:bg-green-50 rounded-lg transition-colors"
                title="Share via WhatsApp"
                aria-label="Share via WhatsApp"
            >
                <WhatsAppIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleNativeShare}
                className="p-1.5 text-slate-600 hover:text-blue-500 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share"
                aria-label="Share Invoice"
            >
                <ShareIcon className="w-4 h-4" />
            </button>
            <button
                onClick={onDownloadPdf}
                className="p-1.5 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-200 transition-colors"
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
