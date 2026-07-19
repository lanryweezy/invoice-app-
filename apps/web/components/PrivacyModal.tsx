import React from 'react';
import { TextModal } from './TextModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const currentDate = "July 19, 2026";

  return (
    <TextModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      modalId="privacy-modal-title"
      buttonText="I Understand"
    >
      <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg mb-8">
        <p className="m-0 font-medium text-teal-900">
          <strong>NDPR Compliance Commitment:</strong> At InvoiceApp.ng, we are fully committed to safeguarding your privacy and personal data in strict adherence to the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable data protection laws.
        </p>
      </div>

      <p className="font-bold text-slate-900 text-sm mb-6 uppercase tracking-wider">Last Updated: {currentDate}</p>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">1</span>
          Lawful and Transparent Processing
        </h3>
        <p>
          We process personal data only for legitimate, explicit, and clearly defined purposes. We collect information primarily to enable you to generate and manage invoices, receipts, and compliance documents effectively. We do not sell, trade, or share your business data with third parties for marketing purposes.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">2</span>
          Data Collection & Consent
        </h3>
        <p>
          InvoiceApp operates as a privacy-first tool. By default, your data is stored locally in your browser (IndexedDB and localStorage). We obtain explicit consent before collecting any personal data.
        </p>
        <p>
          If you choose to create an account, we collect basic profile information (email, business name) and sync your data securely to our cloud infrastructure to enable cross-device access and advanced features. You may withdraw your consent at any time by deleting your account.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">3</span>
          Data Minimization
        </h3>
        <p>
          We adhere to the principle of data minimization, collecting only the information that is strictly necessary for our operations and retaining it only for as long as required to fulfill business or legal obligations.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">4</span>
          Data Storage & Security
        </h3>
        <p>
          We implement appropriate technical and organizational security measures to protect personal data from unauthorized access, alteration, disclosure, or destruction. Cloud data is encrypted both at rest and in transit using industry-standard protocols via Google Firebase.
        </p>
        <p>
          While we strive to use commercially acceptable means to protect your Personal Information, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your login credentials.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">5</span>
          Third-Party Management
        </h3>
        <p>
          We engage trusted third-party processors to facilitate our services (e.g., Paystack for payment processing, Google Analytics for usage tracking). We ensure that all third-party partners comply with NDPR standards and have adequate safeguards in place for any data processing. These services maintain their own privacy policies which we recommend reviewing.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">6</span>
          Your Data Subject Rights
        </h3>
        <p>In accordance with the NDPR, you possess the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Right of Access:</strong> You can request a copy of the personal data we hold about you.</li>
          <li><strong>Right to Correction:</strong> You can update or correct inaccurate data via your dashboard.</li>
          <li><strong>Right to Deletion (Right to be Forgotten):</strong> You can request the deletion of your personal data where legally permissible. (Guest users can clear their browser cache).</li>
          <li><strong>Right to Data Portability:</strong> You can export your data (invoices, receipts, compliance reports) in machine-readable formats (JSON, CSV, PDF).</li>
          <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent previously given for data processing.</li>
        </ul>
        <p className="mt-4">
          We process all data subject requests within 30 days. To exercise these rights, please contact us using the information below.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">7</span>
          Contact Us
        </h3>
        <p>
          If you have any questions about this Privacy Policy, our data practices, or wish to exercise your rights under the NDPR, please contact our Data Protection Officer at:
        </p>
        <div className="bg-slate-50 p-4 rounded-lg mt-4 border border-slate-200">
          <a href="mailto:privacy@invoiceapp.ng" className="text-teal-600 font-medium hover:text-teal-700">privacy@invoiceapp.ng</a>
        </div>
      </section>
    </TextModal>
  );
};
