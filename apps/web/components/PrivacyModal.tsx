import React from 'react';
import { TextModal } from './TextModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  return (
    <TextModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      modalId="privacy-modal-title"
      buttonText="I Understand"
    >
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
    </TextModal>
  );
};
