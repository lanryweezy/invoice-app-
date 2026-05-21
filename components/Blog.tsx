import React from 'react';
import { Helmet } from 'react-helmet-async';
import { mockPosts } from '../data/blogPosts';

interface BlogProps {
  onPostClick: (slug: string) => void;
}

export const Blog: React.FC<BlogProps> = ({ onPostClick }) => {
  return (
    <div className="w-full bg-slate-50 min-h-full">
      <Helmet>
        <title>Small Business & Freelancer Blog | InvoiceApp</title>
        <meta name="description" content="Get the best insights, guides, and tips on invoicing, accounting, and growing your small business or freelance career in Nigeria." />
        <link rel="canonical" href="https://www.invoiceapp.ng/blog" />
        <meta property="og:title" content="Small Business & Freelancer Blog | InvoiceApp" />
        <meta property="og:description" content="Discover expert advice on managing finances, acquiring clients, and scaling your business in Nigeria." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center border-b border-slate-800">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">InvoiceApp Blog</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Insights, guides, and tips for Nigerian freelancers and small businesses to thrive, get paid faster, and grow.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Latest Articles</h2>

            {/* Simple Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                {['All', 'Guides', 'Small Business', 'Finance', 'AI & Tech'].map((cat, i) => (
                    <button
                        key={cat}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${i === 0 ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.map((post) => (
            <article key={post.id} onClick={() => post.title && onPostClick(post.title)} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer group">
              <div className="h-48 overflow-hidden bg-slate-100 relative">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-teal-700 shadow-sm">
                    {post.category}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-100">
                    <span className="text-teal-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Article <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-teal-50 rounded-2xl border border-teal-100 p-8 sm:p-12 text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Get Business Insights in Your Inbox</h3>
            <p className="text-slate-600 max-w-xl mx-auto mb-6">
                Join thousands of Nigerian freelancers and business owners who receive our weekly tips on invoicing, accounting, and growth.
            </p>
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                />
                <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                    Subscribe
                </button>
            </form>
            <p className="text-xs text-slate-400 mt-4">We respect your privacy. No spam, ever.</p>
        </div>
      </div>
    </div>
  );
};
