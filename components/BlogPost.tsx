import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { getBlogPost, mockPostsMap } from '../data/blogPosts';

interface BlogPostProps {
  postSlug: string;
  onBack: () => void;
}

export const BlogPost: React.FC<BlogPostProps> = ({ postId, onBack }) => {
  // ⚡ Bolt: Use O(1) Map lookup instead of O(N) Array.find for better rendering performance
  const meta = useMemo(() => mockPostsMap.get(postId), [postId]);
  const post = useMemo(() => getBlogPost(postId), [postId]);

  // Merge meta from Blog list with the full htmlContent
  const fullPost = meta && post ? { ...meta, htmlContent: post.htmlContent } : post;

  if (!fullPost) {
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
    "headline": fullPost.title,
    "image": fullPost.imageUrl,
    "datePublished": new Date(fullPost.date).toISOString(),
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
    "description": fullPost.excerpt
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-16">
      <Helmet>
        <title>{fullPost.title} | InvoiceApp Blog</title>
        <meta name="description" content={fullPost.excerpt} />
        <link rel="canonical" href={`https://www.invoiceapp.ng/${encodeURIComponent(fullPost.title)}`} />

        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content={fullPost.title} />
        <meta property="og:description" content={fullPost.excerpt} />
        <meta property="og:image" content={fullPost.imageUrl} />
        <meta property="og:url" content={`https://www.invoiceapp.ng/${encodeURIComponent(fullPost.title)}`} />
        <meta property="og:type" content="article" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullPost.title} />
        <meta name="twitter:description" content={fullPost.excerpt} />
        <meta name="twitter:image" content={fullPost.imageUrl} />

        {/* JSON-LD for Google/Bing Rich Results */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Header Image & Title Area */}
      <div className="bg-slate-900 text-white pb-8 relative">
        <div className="h-64 sm:h-80 md:h-96 w-full relative">
             <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
             <img src={fullPost.imageUrl} alt={fullPost.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-8 max-w-4xl mx-auto w-full">
                <button onClick={onBack} className="self-start mb-6 sm:mb-8 text-slate-300 hover:text-white flex items-center gap-2 font-medium transition-colors bg-slate-900/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to Blog
                </button>
                <div className="flex items-center gap-3 text-sm font-bold mb-4 text-teal-400">
                    <span className="uppercase tracking-wider">{fullPost.category}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{fullPost.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                    <span>{fullPost.date}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>{fullPost.readTime}</span>
                </div>
             </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-teal-600">
             <p className="lead text-xl text-slate-600 mb-8 font-medium">
                 {fullPost.excerpt}
             </p>

             {/* Render Dynamic HTML Content */}
             <div dangerouslySetInnerHTML={{ __html: fullPost.htmlContent }} />
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
