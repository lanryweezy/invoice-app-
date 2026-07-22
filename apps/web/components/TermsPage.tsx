import React from 'react';

export const TermsPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-500">Last Updated: {currentDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing and using InvoiceApp ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            InvoiceApp is a free invoicing platform designed for Nigerian freelancers, creatives, and small businesses. The Service allows users to:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li>Create and manage invoices</li>
            <li>Generate receipts and compliance documents</li>
            <li>Track payments and client information</li>
            <li>Export invoices as PDF</li>
            <li>Share invoices via WhatsApp and email</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
          <p className="text-slate-600 leading-relaxed">
            You may use InvoiceApp without creating an account (free plan with local storage). If you choose to create an account for cloud sync features, you are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
          <p className="text-slate-600 leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated systems to access the Service without permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
          <p className="text-slate-600 leading-relaxed">
            The Service and its original content, features, and functionality are owned by InvoiceApp and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. Payment Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            InvoiceApp offers a free plan with core features. Pro features may require a paid subscription. All payments are processed securely through Paystack. Prices are in Nigerian Naira (₦) and may be updated with notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            InvoiceApp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. The Service is provided "as is" without warranties of any kind.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">8. Changes to Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">9. Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            For questions about these Terms, contact us at <a href="mailto:hello@invoiceapp.ng" className="text-teal-600 hover:underline">hello@invoiceapp.ng</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
