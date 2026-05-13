import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { mockPosts } from './Blog';

interface BlogPostProps {
  postId: number;
  onBack: () => void;
}

export const BlogPost: React.FC<BlogPostProps> = ({ postId, onBack }) => {
  const post = useMemo(() => mockPosts.find(p => p.id === postId), [postId]);

  if (!post) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Post not found</h2>
          <button onClick={onBack} className="text-teal-600 hover:underline">Back to Blog</button>
        </div>
      </div>
    );
  }

  // Structured Data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.imageUrl,
    "datePublished": new Date(post.date).toISOString(),
    "author": {
      "@type": "Organization",
      "name": "InvoiceApp"
    },
    "publisher": {
      "@type": "Organization",
      "name": "InvoiceApp",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.invoiceapp.ng/favicon.svg"
      }
    },
    "description": post.excerpt
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-16">
      <Helmet>
        <title>{post.title} | InvoiceApp Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://www.invoiceapp.ng/blog/${post.id}`} />

        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.imageUrl} />
        <meta property="og:url" content={`https://www.invoiceapp.ng/blog/${post.id}`} />
        <meta property="og:type" content="article" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.imageUrl} />

        {/* JSON-LD for Google/Bing Rich Results */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Header Image & Title Area */}
      <div className="bg-slate-900 text-white pb-8 relative">
        <div className="h-64 sm:h-80 md:h-96 w-full relative">
             <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
             <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-8 max-w-4xl mx-auto w-full">
                <button onClick={onBack} className="self-start mb-6 sm:mb-8 text-slate-300 hover:text-white flex items-center gap-2 font-medium transition-colors bg-slate-900/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to Blog
                </button>
                <div className="flex items-center gap-3 text-sm font-bold mb-4 text-teal-400">
                    <span className="uppercase tracking-wider">{post.category}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                    <span>{post.date}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>{post.readTime}</span>
                </div>
             </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          {/* Simulated Markdown Content */}
          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-teal-600">
             <p className="lead text-xl text-slate-600 mb-8 font-medium">
                 {post.excerpt}
             </p>

             <p>
                 Running a business or freelancing in Nigeria comes with its unique set of challenges. From dealing with inconsistent power supply to navigating complex tax structures like VAT and Withholding Tax (WHT), entrepreneurs have to wear many hats.
             </p>

             <h2>The Importance of Proper Documentation</h2>
             <p>
                 One of the most critical aspects of running a successful enterprise is maintaining proper financial records. This means moving away from informal WhatsApp messages requesting payment and adopting professional invoicing systems.
             </p>

             <ul>
                 <li>Professionalism: A well-designed invoice builds trust with clients.</li>
                 <li>Record Keeping: It's essential for tracking income and preparing for tax season.</li>
                 <li>Faster Payments: Clear payment terms reduce the chances of delayed settlements.</li>
             </ul>

             <blockquote>
                 "The difference between a hobby and a business is an invoice."
             </blockquote>

             <h2>Actionable Steps for Today</h2>
             <p>
                 If you take nothing else away from this article, ensure you start automating your administrative tasks. Use tools that are tailored for the Nigerian market to calculate your totals, apply the correct VAT rates, and send receipts automatically.
             </p>

             <p>
                 <em>Thank you for reading! Make sure to subscribe to our newsletter for more weekly tips.</em>
             </p>
          </div>

          <hr className="my-12 border-slate-200" />

          {/* Call to Action */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Ready to upgrade your business?</h3>
              <p className="text-slate-600 mb-6">Create professional, FIRS-compliant invoices in seconds. It's 100% free.</p>
              <button
                  onClick={() => window.location.href = '/'}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-teal-900/20"
              >
                  Create an Invoice Now
              </button>
          </div>
      </div>
    </div>
  );
};
