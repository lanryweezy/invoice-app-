import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Terms of Service</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="prose prose-slate prose-sm max-w-none space-y-4 text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900">Last Updated: October 2024</p>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Agreement to Terms</h3>
              <p>By accessing InvoiceApp.ng, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Use of the Service</h3>
              <p>You agree to use the service only for lawful purposes related to business invoicing. You are solely responsible for the accuracy of the information you input into your invoices.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Subscription and Payments</h3>
              <p>Basic use of InvoiceApp is free. Pro features require a subscription. All payments are processed via third-party gateways (Paystack). Subscriptions are billed in advance and are non-refundable except where required by law.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">4. Intellectual Property</h3>
              <p>The platform, its code, design, and branding are the intellectual property of InvoiceApp. The data you input (logos, client info) remains yours.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">5. Limitation of Liability</h3>
              <p>InvoiceApp is provided "as is" without warranty of any kind. We are not responsible for any financial losses, tax penalties, or disputes between you and your clients resulting from the use of our generated documents.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">6. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes signifies your acceptance of the new terms.</p>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                I Accept
            </button>
        </div>
      </div>
    </div>
  );
};
