
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
  {
    slug: 'solar-installation-invoice-template-lagos',
    industry: 'Solar Installation',
    location: 'Lagos',
    title: 'Free Solar Installation Invoice Template Lagos | NRS Compliant',
    description: 'Professional solar installation invoice template for Lagos EPC contractors. Fully NRS compliant with TIN and VAT support for Nigerian businesses.',
    h1: 'Solar EPC Invoice Template for Lagos Projects',
    defaultLineItems: [
      { description: '5KVA Solar System Installation (Complete)', quantity: 1, price: 3500000 },
      { description: 'Monocrystalline Solar Panels (450W)', quantity: 10, price: 120000 }
    ]
  },
  {
    slug: 'freelance-bookkeeping-invoice-template-abuja',
    industry: 'Freelance Bookkeeping',
    location: 'Abuja',
    title: 'Free Freelance Bookkeeping Invoice Template Abuja | NRS & TIN Ready',
    description: 'Generate NRS compliant invoices for freelance bookkeeping services in Abuja. Professional templates with automated tax calculations and TIN support.',
    h1: 'Bookkeeping Service Invoice Template Abuja',
    defaultLineItems: [
      { description: 'Monthly Financial Statement Preparation', quantity: 1, price: 75000 },
      { description: 'Tax Filing & Compliance Audit', quantity: 1, price: 50000 }
    ]
  },
  {
    slug: 'software-development-ai-strategy-invoice-lagos',
    industry: 'Software Development',
    location: 'Lagos',
    title: 'AI Strategy & Software Development Invoice Template Lagos | Professional',
    description: 'Custom invoice template for AI strategy and software development firms in Lagos. Compliant with Nigerian tax laws and NRS requirements.',
    h1: 'AI & Software Development Invoice Template Lagos',
    defaultLineItems: [
      { description: 'AI Readiness Assessment & Strategy', quantity: 1, price: 1500000 },
      { description: 'Custom Software Module Development', quantity: 1, price: 2500000 }
    ]
  },
  {
    slug: 'graphic-design-invoice-template-port-harcourt',
    industry: 'Graphic Design',
    location: 'Port Harcourt',
    title: 'Free Graphic Design Invoice Template Port Harcourt | NRS Compliant',
    description: 'Professional graphic design invoice template for Port Harcourt creatives. Get paid faster with NRS compliant templates including TIN/VAT.',
    h1: 'Graphic Design Service Invoice Template Port Harcourt',
    defaultLineItems: [
      { description: 'Corporate Brand Identity Design', quantity: 1, price: 150000 },
      { description: 'Social Media Content Pack (15 designs)', quantity: 1, price: 45000 }
    ]
  },
  {
    slug: 'digital-marketing-agency-invoice-lagos',
    industry: 'Digital Marketing',
    location: 'Lagos',
    title: 'Free Digital Marketing Agency Invoice Template Lagos | NRS Ready',
    description: 'Professional invoice templates for digital marketing agencies in Lagos. Includes fields for VAT, TIN, and NRS compliance.',
    h1: 'Digital Marketing Invoice Template Lagos',
    defaultLineItems: [
      { description: 'Monthly SEO & Content Marketing Management', quantity: 1, price: 300000 },
      { description: 'PPC Campaign Setup & Optimization', quantity: 1, price: 100000 }
    ]
  },
  {
    slug: 'makeup-artist-wedding-beauty-invoice-abuja',
    industry: 'Makeup & Beauty',
    location: 'Abuja',
    title: 'Free Makeup Artist Invoice Template Abuja | Wedding Beauty Services',
    description: 'Beautiful invoice templates for makeup artists and wedding beauty services in Abuja. Professional and NRS compliant for your business.',
    h1: 'Makeup Artist & Beauty Invoice Template Abuja',
    defaultLineItems: [
      { description: 'Bridal Makeup & Hair Styling Package', quantity: 1, price: 150000 },
      { description: 'Bridesmaids/Guest Makeup (Per Person)', quantity: 3, price: 25000 }
    ]
  },
  {
    slug: 'logistics-delivery-service-invoice-ibadan',
    industry: 'Logistics & Delivery',
    location: 'Ibadan',
    title: 'Free Logistics & Delivery Invoice Template Ibadan | NRS Compliant',
    description: 'Reliable logistics and delivery service invoice templates for Ibadan businesses. Track your shipments and get paid on time with NRS compliant invoices.',
    h1: 'Logistics Service Invoice Template Ibadan',
    defaultLineItems: [
      { description: 'Inter-State Delivery Service (Ibadan to Lagos)', quantity: 10, price: 15000 },
      { description: 'Warehouse Storage Fee (Per Month)', quantity: 1, price: 50000 }
    ]
  },
  {
    slug: 'fashion-design-tailoring-invoice-lagos',
    industry: 'Fashion & Tailoring',
    location: 'Lagos',
    title: 'Free Fashion Design Invoice Template Lagos | Bespoke Tailoring',
    description: 'Professional fashion design and bespoke tailoring invoice templates for Lagos designers. NRS compliant with automated VAT calculations.',
    h1: 'Fashion Design & Tailoring Invoice Template Lagos',
    defaultLineItems: [
      { description: 'Bespoke Traditional Attire (Agbada/Senator)', quantity: 1, price: 85000 },
      { description: 'Fabric Sourcing & Embellishment', quantity: 1, price: 35000 }
    ]
  },
  {
    slug: 'real-estate-agent-invoice-template-abuja',
    industry: 'Real Estate',
    location: 'Abuja',
    title: 'Free Real Estate Agent Invoice Template Abuja | NRS & VAT Ready',
    description: 'Professional real estate agency invoice templates for Abuja. Handle agency fees and commissions with NRS compliant invoicing.',
    h1: 'Real Estate Agency Invoice Template Abuja',
    defaultLineItems: [
      { description: 'Agency Fee (Professional Services)', quantity: 1, price: 500000 },
      { description: 'Legal & Agreement Documentation Fee', quantity: 1, price: 250000 }
    ]
  },
  {
    slug: 'event-planning-decoration-invoice-lagos',
    industry: 'Event Planning',
    location: 'Lagos',
    title: 'Free Event Planning Invoice Template Lagos | Decoration & Management',
    description: 'Comprehensive event planning and decoration invoice templates for Lagos events. Professional, NRS compliant, and easy to use.',
    h1: 'Event Planning & Decoration Invoice Template Lagos',
    defaultLineItems: [
      { description: 'Event Venue Decoration & Floral Styling', quantity: 1, price: 1200000 },
      { description: 'Full Event Management & Coordination Fee', quantity: 1, price: 500000 }
    ]
  },
  {
    slug: 'private-tutoring-invoice-template-lagos',
    industry: 'Education',
    location: 'Lagos',
    title: 'Free Private Tutoring Invoice Template Lagos | Academic Services',
    description: 'Professional tutoring invoice templates for private teachers in Lagos. Track lessons and get paid faster with NRS compliant templates.',
    h1: 'Private Tutoring Service Invoice Template Lagos',
    defaultLineItems: [
      { description: 'Mathematics & Science Home Tutoring (Monthly)', quantity: 1, price: 60000 },
      { description: 'JAMB/WAEC Exam Prep Intensive Session', quantity: 1, price: 40000 }
    ]
  },
  {
    slug: 'catering-services-invoice-port-harcourt',
    industry: 'Catering',
    location: 'Port Harcourt',
    title: 'Free Catering Services Invoice Template Port Harcourt | NRS Compliant',
    description: 'Deliciously professional catering invoice templates for Port Harcourt businesses. NRS compliant for corporate and private events.',
    h1: 'Catering Service Invoice Template Port Harcourt',
    defaultLineItems: [
      { description: 'Corporate Lunch Catering (Per Plate)', quantity: 50, price: 3500 },
      { description: 'Full Buffet Service for Private Event', quantity: 1, price: 450000 }
    ]
  },
  {
    slug: 'content-writing-copywriting-invoice-abuja',
    industry: 'Content Creation',
    location: 'Abuja',
    title: 'Free Content Writing Invoice Template Abuja | Copywriting Services',
    description: 'Professional content writing and copywriting invoice templates for Abuja freelancers. NRS compliant with TIN/VAT support.',
    h1: 'Content Writing & Copywriting Invoice Template Abuja',
    defaultLineItems: [
      { description: 'Website Copywriting (5 Main Pages)', quantity: 1, price: 150000 },
      { description: 'Monthly Blog Post Package (4 Articles)', quantity: 1, price: 80000 }
    ]
  },
  {
    slug: 'short-let-apartment-management-lagos',
    industry: 'Hospitality',
    location: 'Lagos',
    title: 'Free Short-let Management Invoice Template Lagos | NRS Ready',
    description: 'Efficient short-let apartment management invoice templates for Lagos properties. Professional, NRS compliant, and easy to manage.',
    h1: 'Short-let Management Invoice Template Lagos',
    defaultLineItems: [
      { description: 'Monthly Property Management Fee (Short-let)', quantity: 1, price: 120000 },
      { description: 'Cleaning & Professional Maintenance Service', quantity: 4, price: 15000 }
    ]
  },
  {
    slug: 'solar-system-maintenance-invoice-ibadan',
    industry: 'Solar Maintenance',
    location: 'Ibadan',
    title: 'Free Solar Maintenance Invoice Template Ibadan | NRS Compliant',
    description: 'Keep the power flowing with solar system maintenance invoice templates for Ibadan. Professional, NRS compliant, and detailed.',
    h1: 'Solar Maintenance Service Invoice Template Ibadan',
    defaultLineItems: [
      { description: 'Quarterly Solar Panel Cleaning & Inspection', quantity: 1, price: 45000 },
      { description: 'Inverter & Battery Health Check/Service', quantity: 1, price: 35000 }
    ]
  }
];

export const getSEOTemplate = (slug: string) => {
  return seoTemplates.find(t => t.slug === slug);
};
