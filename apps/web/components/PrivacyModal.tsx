import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="prose prose-slate prose-sm max-w-none space-y-4 text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900">Last Updated: October 2024</p>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h3>
              <p>InvoiceApp is designed as a privacy-first tool. By default, your data is stored locally in your browser's IndexedDB and localStorage. If you choose to create an account (Pro tier), we sync your data (business profiles, client lists, and invoice metadata) to our secure cloud storage (Firebase) to enable cross-device access.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Your Information</h3>
              <p>We use the information you provide strictly to provide the service of generating and managing invoices. We do not sell, trade, or share your business data with third parties for marketing purposes.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Data Security</h3>
              <p>We implement robust security measures via Google Firebase to protect your data. However, remember that no method of transmission over the internet or electronic storage is 100% secure. You are responsible for maintaining the confidentiality of your login credentials.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">4. Third-Party Services</h3>
              <p>We use Paystack for payment processing and Google Analytics for usage tracking. These services have their own privacy policies which we recommend you review.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">5. Your Rights</h3>
              <p>You have the right to access, correct, or delete your data at any time. For guest users, clearing your browser cache will remove your local data. For Pro users, you can manage your data via the settings dashboard.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">6. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us at hello@invoiceapp.ng</p>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                I Understand
            </button>
        </div>
      </div>
    </div>
  );
};
