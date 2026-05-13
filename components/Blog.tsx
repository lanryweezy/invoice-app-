import React from 'react';
import { Helmet } from 'react-helmet-async';

export const mockPosts = [
  {
    id: 1,
    title: 'How to Write an Invoice in Nigeria (Step-by-Step Guide for Small Businesses and Freelancers)',
    excerpt: 'Most Nigerian freelancers and small business owners have sent this exact "invoice" at some point: "Oga, my account details below... GTBank..." and then the waiting begins.',
    category: 'Guides',
    readTime: '11 Min Read',
    date: 'April 12, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
  },
  {
    id: 2,
    title: 'Best Free AI Tools for Small Businesses in Nigeria (2026 Guide)',
    excerpt: 'Picture this. Amaka sells hand-sewn Ankara bags from her shop in Yaba. She runs her Instagram page, replies to customers on WhatsApp, tracks her orders in a notebook...',
    category: 'AI & Tech',
    readTime: '10 Min Read',
    date: 'April 8, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  {
    id: 3,
    title: 'Best Business Ideas in Nigeria (2026): 11 Profitable Ideas You Can Start Today',
    excerpt: 'If you ask most people why they want to start a business in Nigeria, the answer is usually the same: income is unstable, expenses keep rising, and depending on one source of money no longer feels safe.',
    category: 'Entrepreneurship',
    readTime: '7 Min Read',
    date: 'April 1, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&q=80',
  },
  {
    id: 4,
    title: '7 Ways AI Agents for Businesses in Nigeria Are Reducing Operational Costs',
    excerpt: 'Running a business in Nigeria right now is not for the faint-hearted. Between unstable power supply, rising fuel costs, unpredictable exchange rates...',
    category: 'Small Business',
    readTime: '6 Min Read',
    date: 'March 25, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    id: 5,
    title: 'How to Start a Small Business in Nigeria (2026 Guide)',
    excerpt: 'Starting a business in Nigeria can feel overwhelming at first. There’s so much advice online, and most of it either sounds too complicated or completely out of touch with reality.',
    category: 'Guides',
    readTime: '6 Min Read',
    date: 'March 18, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80',
  },
  {
    id: 6,
    title: 'How Does the New 2026 Tax Reform in Nigeria Affect Small Businesses?',
    excerpt: 'Running a small business in Nigeria is already tough; rising costs, unstable power, customers delaying payments, and now… taxes.',
    category: 'Finance',
    readTime: '6 Min Read',
    date: 'March 10, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
  },
  {
    id: 7,
    title: 'The Ultimate Guide to FIRS Compliant e-Invoicing for Nigerian Businesses',
    excerpt: 'With Nigeria’s gradual move to digital tax systems, understanding e-invoicing is crucial. Learn what it takes to be FIRS compliant and why you need it now.',
    category: 'Finance',
    readTime: '8 Min Read',
    date: 'February 28, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
  },
  {
    id: 8,
    title: 'Top 5 Digital Marketing Strategies for SMEs in Lagos',
    excerpt: 'From WhatsApp marketing to TikTok ads, learn how small businesses in Lagos are reaching more customers without breaking the bank.',
    category: 'Small Business',
    readTime: '5 Min Read',
    date: 'February 15, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  },
  {
    id: 9,
    title: 'How to Deal with Late Paying Clients: A Freelancer’s Playbook',
    excerpt: 'Tired of hearing "I will sort you next week"? Learn professional strategies to secure your payments on time without ruining client relationships.',
    category: 'Guides',
    readTime: '7 Min Read',
    date: 'February 2, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80',
  },
  {
    id: 10,
    title: 'Understanding VAT in Nigeria: What You Need to Know',
    excerpt: 'Value Added Tax can be confusing. We break down the current VAT rates, exemptions, and how to properly include them in your invoices.',
    category: 'Finance',
    readTime: '9 Min Read',
    date: 'January 20, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=800&q=80',
  },
  {
    id: 11,
    title: '10 Software Tools Every Nigerian Remote Worker Needs',
    excerpt: 'Whether you are dealing with power cuts or spotty internet, these tools will keep your productivity high while working from anywhere in Nigeria.',
    category: 'AI & Tech',
    readTime: '6 Min Read',
    date: 'January 10, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
  },
  {
    id: 12,
    title: 'Why Experiential Marketing Is Important For Small Businesses',
    excerpt: 'Creating memorable experiences can turn casual buyers into loyal advocates. Discover low-cost experiential marketing tactics for Nigerian brands.',
    category: 'Small Business',
    readTime: '5 Min Read',
    date: 'January 5, 2026',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
  },
  {
    id: 13,
    title: 'How to Register Your Business with CAC: The 2026 Update',
    excerpt: 'A comprehensive walkthrough on navigating the Corporate Affairs Commission (CAC) portal to legitimize your business name or company.',
    category: 'Guides',
    readTime: '12 Min Read',
    date: 'December 18, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
  },
  {
    id: 14,
    title: 'The Rise of FinTech in Nigeria and What It Means for Your Business',
    excerpt: 'From Paystack to Flutterwave, Nigerian FinTech is booming. Learn how to leverage these platforms for seamless payment collections.',
    category: 'Entrepreneurship',
    readTime: '8 Min Read',
    date: 'December 10, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  },
  {
    id: 15,
    title: '5 Proven Strategies To Win New Customers And Keep Them',
    excerpt: 'Customer acquisition is hard, retention is harder. Learn the secrets top Nigerian businesses use to keep their clients coming back.',
    category: 'Small Business',
    readTime: '7 Min Read',
    date: 'November 25, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
  },
  {
    id: 16,
    title: 'Invoice vs. Receipt: What’s the Difference and Why Does It Matter?',
    excerpt: 'Knowing when to issue an invoice versus a receipt is fundamental bookkeeping. We explain the legal and practical differences.',
    category: 'Finance',
    readTime: '4 Min Read',
    date: 'November 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1627845700812-7065cb75ff1e?w=800&q=80',
  },
  {
    id: 17,
    title: 'How to Price Your Product The Right Way in a Tough Economy',
    excerpt: 'Inflation affects everyone. Learn how to adjust your pricing strategies without scaring off your customer base.',
    category: 'Entrepreneurship',
    readTime: '6 Min Read',
    date: 'November 5, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1580519542036-ed47f3e42109?w=800&q=80',
  },
  {
    id: 18,
    title: 'Beginners Guide To Search Engine Optimization (SEO) for Nigerian Websites',
    excerpt: 'Want your business to show up first on Google? Learn the basics of SEO and how to optimize your local business presence online.',
    category: 'AI & Tech',
    readTime: '10 Min Read',
    date: 'October 28, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
  },
  {
    id: 19,
    title: 'Bookkeeping Essentials: Why You Should Hire a Bookkeeper',
    excerpt: 'You cannot manage what you do not measure. Find out when it is time to stop DIYing your accounts and hire a professional.',
    category: 'Finance',
    readTime: '5 Min Read',
    date: 'October 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1462206092226-f46025ffe607?w=800&q=80',
  },
  {
    id: 20,
    title: 'How to Grow Your Side Hustle into a Successful Business',
    excerpt: 'Transitioning from a 9-to-5 to full-time entrepreneurship is a big step. Read these tips to make the leap successfully in Nigeria.',
    category: 'Entrepreneurship',
    readTime: '8 Min Read',
    date: 'October 1, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
  },
  {
    id: 21,
    title: '5 Customer Service Mistakes that Cost You Clients',
    excerpt: 'Great products aren’t enough if your customer service is lacking. Learn the common pitfalls and how to improve your client relations.',
    category: 'Small Business',
    readTime: '6 Min Read',
    date: 'September 20, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80',
  },
  {
    id: 22,
    title: 'The Best Social Media Platforms for Nigerian B2B Companies',
    excerpt: 'Not sure where to focus your marketing efforts? We analyze the top platforms and show you where your B2B clients are hanging out.',
    category: 'Small Business',
    readTime: '7 Min Read',
    date: 'September 12, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
  },
  {
    id: 23,
    title: 'How to Write a Winning Business Proposal',
    excerpt: 'Tired of your proposals getting ignored? Learn the structure and strategies that turn cold leads into paying clients.',
    category: 'Guides',
    readTime: '10 Min Read',
    date: 'September 5, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  },
  {
    id: 24,
    title: 'Understanding the New CBN Forex Regulations and Your Import Business',
    excerpt: 'Navigating the recent Central Bank of Nigeria foreign exchange rules can be tricky. Here is what importers need to know to stay compliant and profitable.',
    category: 'Finance',
    readTime: '9 Min Read',
    date: 'August 28, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
  },
  {
    id: 25,
    title: 'How to Build a Professional Website on a Budget',
    excerpt: 'You don’t need to spend millions to get a great website. Discover the best budget-friendly tools and platforms for small businesses.',
    category: 'AI & Tech',
    readTime: '8 Min Read',
    date: 'August 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    id: 26,
    title: 'The Importance of a Good Co-Founder in Your Startup',
    excerpt: 'Going it alone is tough. Learn the key traits to look for in a co-founder and how to structure your partnership for success.',
    category: 'Entrepreneurship',
    readTime: '7 Min Read',
    date: 'August 5, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  },
  {
    id: 27,
    title: 'How to Use WhatsApp Business Effectively for Sales',
    excerpt: 'WhatsApp is the most popular messaging app in Nigeria. Are you using its business features to their full potential?',
    category: 'Small Business',
    readTime: '6 Min Read',
    date: 'July 25, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80',
  },
  {
    id: 28,
    title: 'Creating an Effective Remote Work Policy for Your SME',
    excerpt: 'Remote work is here to stay. Here’s how to establish clear guidelines that boost productivity and keep your team happy.',
    category: 'Guides',
    readTime: '8 Min Read',
    date: 'July 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=800&q=80',
  },
  {
    id: 29,
    title: 'Understanding Nigerian Labor Laws for Small Businesses',
    excerpt: 'Don’t get caught out. A plain-English guide to the essential labor laws you need to follow when hiring staff in Nigeria.',
    category: 'Finance',
    readTime: '11 Min Read',
    date: 'July 5, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
  },
  {
    id: 30,
    title: 'The Future of E-commerce in Africa: Trends to Watch',
    excerpt: 'From mobile money to social commerce, explore the major trends shaping the future of online retail across the continent.',
    category: 'Entrepreneurship',
    readTime: '9 Min Read',
    date: 'June 20, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
  }
];

interface BlogProps {
  onPostClick: (postId: number) => void;
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
            <article key={post.id} onClick={() => onPostClick(post.id)} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer group">
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
