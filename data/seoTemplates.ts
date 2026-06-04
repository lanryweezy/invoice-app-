
export interface SEOTemplate {
  slug: string;
  industry: string;
  location: string;
  title: string;
  description: string;
  h1: string;
  defaultLineItems: Array<{ description: string; quantity: number; price: number }>;
}

export const seoTemplates: SEOTemplate[] = [
  {
    slug: 'freelance-photographer-invoice-lagos',
    industry: 'Photography',
    location: 'Lagos',
    title: 'Free Invoice Template for Photographers in Lagos | InvoiceApp.ng',
    description: 'Download or generate a professional invoice template specifically designed for freelance photographers in Lagos, Nigeria. Get paid faster with integrated Paystack.',
    h1: 'Professional Invoice Template for Lagos Photographers',
    defaultLineItems: [
      { description: 'Full Day Wedding Coverage (Lagos Mainland)', quantity: 1, price: 250000 },
      { description: 'Photo Editing & Retouching (50 images)', quantity: 1, price: 50000 }
    ]
  },
  {
    slug: 'software-engineer-invoice-nairobi',
    industry: 'Software Engineering',
    location: 'Nairobi',
    title: 'Free Invoice Template for Software Engineers in Nairobi | InvoiceApp.ng',
    description: 'Professional invoice template for Kenyan software developers and engineers. Includes M-Pesa integration and automated reminders.',
    h1: 'Automated Invoice Template for Nairobi Developers',
    defaultLineItems: [
      { description: 'Frontend Development (React/Vite)', quantity: 40, price: 5000 },
      { description: 'Backend API Integration (Node.js)', quantity: 20, price: 6000 }
    ]
  },
  // We can scale this array to 500+ templates programmatically
];

export const getSEOTemplate = (slug: string) => {
  return seoTemplates.find(t => t.slug === slug);
};
