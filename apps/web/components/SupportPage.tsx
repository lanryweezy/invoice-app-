import React, { useState } from 'react';

export const SupportPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:hello@invoiceapp.ng?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    setSubmitted(true);
  };

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support</h1>
          <p className="text-slate-500">We're here to help. Get in touch with our team.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h2>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
                <p className="text-slate-600 text-sm mb-2">For general inquiries and support:</p>
                <a href="mailto:hello@invoiceapp.ng" className="text-teal-600 hover:underline font-medium">
                  hello@invoiceapp.ng
                </a>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">WhatsApp</h3>
                <p className="text-slate-600 text-sm mb-2">Quick support via WhatsApp:</p>
                <a
                  href="https://wa.me/2348000000000?text=Hi%20InvoiceApp%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline font-medium"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Response Time</h3>
                <p className="text-slate-600 text-sm">
                  We typically respond within 24 hours during business days (Mon-Fri, 9AM-6PM WAT).
                </p>
              </div>
            </div>

            <div className="mt-6 bg-teal-50 rounded-xl p-5 border border-teal-200">
              <h3 className="font-bold text-teal-900 mb-2">Frequently Asked Questions</h3>
              <ul className="space-y-2 text-sm text-teal-800">
                <li><strong>Q: Is InvoiceApp really free?</strong></li>
                <li className="ml-4">A: Yes! The core invoicing features are completely free. Pro features are optional.</li>
                <li><strong>Q: Is my data secure?</strong></li>
                <li className="ml-4">A: Yes. Free plan data stays on your device. Pro plan data is encrypted in transit and at rest.</li>
                <li><strong>Q: Can I use it offline?</strong></li>
                <li className="ml-4">A: Yes! InvoiceApp works offline. Data is stored locally in your browser.</li>
                <li><strong>Q: How do I export invoices?</strong></li>
                <li className="ml-4">A: Click the PDF button on any invoice to download it instantly.</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-lg font-bold text-green-900 mb-2">Message Sent!</h3>
                <p className="text-green-700 text-sm">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-teal-600 hover:underline text-sm font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1 cursor-pointer">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1 cursor-pointer">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1 cursor-pointer">Subject</label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1 cursor-pointer">Message</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent h-32 resize-none"
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors active:scale-[0.98]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
