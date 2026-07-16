import React from 'react';
import { TextModal } from './TextModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  return (
    <TextModal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Service"
      modalId="terms-modal-title"
      buttonText="I Accept"
    >
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
    </TextModal>
  );
};
