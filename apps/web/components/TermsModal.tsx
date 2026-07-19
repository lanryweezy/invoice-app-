import React from 'react';
import { TextModal } from './TextModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const currentDate = "July 19, 2026";

  return (
    <TextModal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Service"
      modalId="terms-modal-title"
      buttonText="I Accept"
    >
      <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg mb-8">
        <p className="m-0 font-medium text-teal-900">
          <strong>Welcome to InvoiceApp.ng.</strong> Please read these terms carefully before using our platform. By accessing or using our services, you agree to be bound by these Terms of Service.
        </p>
      </div>

      <p className="font-bold text-slate-900 text-sm mb-6 uppercase tracking-wider">Last Updated: {currentDate}</p>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">1</span>
          Agreement to Terms
        </h3>
        <p>By accessing InvoiceApp.ng, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our platform.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">2</span>
          Use of the Service
        </h3>
        <p>You agree to use the service strictly for lawful purposes related to business invoicing and financial management. You are solely responsible for the accuracy, legality, and compliance of the information you input into your invoices and receipts.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">3</span>
          Subscription and Payments
        </h3>
        <p>Basic use of InvoiceApp is free. Access to Pro features requires a paid subscription. All payments are securely processed via authorized third-party gateways (such as Paystack). Subscriptions are billed in advance and are non-refundable except where required by Nigerian law.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">4</span>
          Intellectual Property
        </h3>
        <p>The platform, including its original code, design, branding, and features, is the intellectual property of InvoiceApp. The business data you input (such as logos, client information, and invoice details) remains your exclusive property.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">5</span>
          Limitation of Liability
        </h3>
        <p>InvoiceApp is provided on an "as is" and "as available" basis without any warranties. We shall not be held liable for any direct, indirect, incidental, or consequential financial losses, tax penalties, or business disputes arising from the use or inability to use our generated documents.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">6</span>
          Governing Law
        </h3>
        <p>These terms shall be governed and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts of Nigeria.</p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">7</span>
          Changes to Terms
        </h3>
        <p>We reserve the right to modify these terms at any time. We will notify users of any significant changes. Continued use of the platform after such changes signifies your acceptance of the revised terms.</p>
      </section>
    </TextModal>
  );
};
