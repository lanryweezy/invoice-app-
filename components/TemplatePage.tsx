
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getSEOTemplate } from '../data/seoTemplates';

interface Props {
  slug: string;
  onGoHome: () => void;
}

export const TemplatePage: React.FC<Props> = ({ slug, onGoHome }) => {
  const templateData = getSEOTemplate(slug) || null;

  if (!templateData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <button onClick={onGoHome} className="text-indigo-600 hover:text-indigo-800">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Generate JSON-LD Schemas
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InvoiceApp.ng",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "NGN"
    },
    "description": "Frictionless financial operating system for African SMEs."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Why do ${templateData.industry} professionals in ${templateData.location} need this invoice?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To standardize their billing, look professional to corporate clients, and get paid significantly faster using embedded payment links."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Helmet>
        <title>{templateData.title}</title>
        <meta name="description" content={templateData.description} />
        <script type="application/ld+json">
          {JSON.stringify(softwareSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto pt-16 px-4 sm:px-6 lg:px-8">
        <button onClick={onGoHome} className="text-indigo-600 hover:text-indigo-800 mb-8 font-medium">
          &larr; Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">{templateData.h1}</h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            {templateData.description} Start billing your clients today with zero friction.
          </p>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-10">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Sample Items Included:</h3>
            <ul className="space-y-3">
              {templateData.defaultLineItems.map((item, idx) => (
                <li key={idx} className="flex justify-between text-slate-700">
                  <span>{item.description} (Qty: {item.quantity})</span>
                  <span className="font-medium">{item.price.toLocaleString()} NGN</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={onGoHome} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            Use This Template Now
          </button>
        </div>
      </div>
    </div>
  );
};
