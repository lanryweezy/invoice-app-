import React from 'react';

export const PrivacyPage: React.FC = () => {
  const currentDate = "July 19, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => window.history.back()}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium mb-4 flex items-center gap-1"
          >
            ← Back to InvoiceApp
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500">Last Updated: {currentDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg mb-8">
          <p className="m-0 font-medium text-teal-900">
            <strong>NDPR Compliance Commitment:</strong> At InvoiceApp.ng, we are fully committed to safeguarding your privacy and personal data in strict adherence to the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable data protection laws.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">1</span>
            Lawful and Transparent Processing
          </h2>
          <p className="text-slate-600 leading-relaxed">
            We process personal data only for legitimate, explicit, and clearly defined purposes. We collect information primarily to enable you to generate and manage invoices, receipts, and compliance documents effectively. We do not sell, trade, or share your business data with third parties for marketing purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">2</span>
            Data Collection & Consent
          </h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            InvoiceApp operates as a privacy-first tool. By default, your data is stored locally in your browser (IndexedDB and localStorage). We obtain explicit consent before collecting any personal data.
          </p>
          <p className="text-slate-600 leading-relaxed">
            If you choose to create an account, we collect basic profile information (email, business name) and sync your data securely to our cloud infrastructure to enable cross-device access and advanced features. You may withdraw your consent at any time by deleting your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">3</span>
            Data Storage and Security
          </h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Your data is stored securely using industry-standard encryption. For local storage, we use IndexedDB and localStorage within your browser. For cloud-synced accounts, data is encrypted in transit and at rest.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">4</span>
            Data Retention
          </h2>
          <p className="text-slate-600 leading-relaxed">
            We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected. If you delete your account, all associated data will be permanently removed from our servers within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">5</span>
            Your Rights
          </h2>
          <p className="text-slate-600 leading-relaxed mb-3">Under NDPR, you have the right to:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Rectify inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full inline-flex items-center justify-center text-sm">6</span>
            Contact Us
          </h2>
          <p className="text-slate-600 leading-relaxed">
            If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at <a href="mailto:hello@invoiceapp.ng" className="text-teal-600 hover:underline">hello@invoiceapp.ng</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
