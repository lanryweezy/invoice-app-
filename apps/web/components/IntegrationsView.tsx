import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { PremiumGate } from './PremiumGate';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'payment' | 'accounting' | 'ecommerce' | 'productivity';
  icon: string;
  connected: boolean;
  ComingSoon?: boolean;
}

const AVAILABLE_INTEGRATIONS: Omit<Integration, 'connected'>[] = [
  // Payment Gateways - Nigeria
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Accept card & bank transfers. Most popular in Nigeria.',
    category: 'payment',
    icon: 'ðŸ’³',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pan-African payment gateway. Multi-currency support.',
    category: 'payment',
    icon: 'ðŸŒ',
  },
  {
    id: 'remita',
    name: 'Remita',
    description: 'Trusted by government and enterprises in Nigeria.',
    category: 'payment',
    icon: 'ðŸ›ï¸',
  },
  {
    id: 'moniepoint',
    name: 'Moniepoint',
    description: 'Business banking & POS. Auto-match payments.',
    category: 'payment',
    icon: 'ðŸ¦',
  },
  {
    id: 'opay',
    name: 'OPay',
    description: 'Mobile money & transfers. Huge user base.',
    category: 'payment',
    icon: 'ðŸ“±',
  },
  // Payment - Global
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Global payment processing. Cards & wallets.',
    category: 'payment',
    icon: 'ðŸ’°',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payments. Buyer protection included.',
    category: 'payment',
    icon: 'ðŸ…¿ï¸',
  },
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices & payments automatically.',
    category: 'accounting',
    icon: 'ðŸ“Š',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting. Real-time financial data.',
    category: 'accounting',
    icon: 'ðŸ“ˆ',
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Free accounting software. Perfect for startups.',
    category: 'accounting',
    icon: 'ðŸŒŠ',
  },
  // E-Commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Auto-create invoices from store orders.',
    category: 'ecommerce',
    icon: 'ðŸ›’',
    ComingSoon: true,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce integration.',
    category: 'ecommerce',
    icon: 'ðŸ›ï¸',
    ComingSoon: true,
  },
  // Productivity
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 1000+ apps. Automate workflows.',
    category: 'productivity',
    icon: 'âš¡',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Sync contacts, drive, and calendar.',
    category: 'productivity',
    icon: 'ðŸ“Ž',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get invoice notifications in your workspace.',
    category: 'productivity',
    icon: 'ðŸ’¬',
  },
];

export const IntegrationsView: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const { user, isPro } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (!user) {
      setIntegrations(AVAILABLE_INTEGRATIONS.map(i => ({ ...i, connected: false })));
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      const connectedIds = data?.integrations || [];
      
      setIntegrations(
        AVAILABLE_INTEGRATIONS.map(i => ({
          ...i,
          connected: connectedIds.includes(i.id),
        }))
      );
    });

    return () => unsubscribe();
  }, [user]);

  const handleConnect = async (integration: Integration) => {
    if (!isPro) {
      setShowGate(true);
      return;
    }

    if (!user) return;

    setConnectingId(integration.id);

    // Simulate connection flow - in production, this would open OAuth
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          integrations: arrayUnion(integration.id),
        });
      } catch (err) {
        console.error('Failed to connect integration', err);
      } finally {
        setConnectingId(null);
      }
    }, 1500);
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!user) return;

    setConnectingId(integration.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        integrations: arrayRemove(integration.id),
      });
    } catch (err) {
      console.error('Failed to disconnect integration', err);
    } finally {
      setConnectingId(null);
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'payment', label: 'Payment' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'ecommerce', label: 'E-Commerce' },
    { id: 'productivity', label: 'Productivity' },
  ];

  const filteredIntegrations = activeCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto relative ">
           {!isPro && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/40 backdrop-blur-[2px] rounded-2xl">
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-100 text-center max-w-sm mx-auto">
                    <p className="text-lg font-bold text-slate-900 mb-2">Connect InvoiceApp to the tools you already use</p>
                    <p className="text-sm text-slate-500 mb-4">Your invoices shouldn’t live alone. Plug into your accounting, CRM, and payment tools so everything updates itself.</p>
                    <button onClick={onUpgrade} type="button" className="px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold w-full hover:bg-teal-700 shadow-md mb-3">Unlock Integrations</button>
                 </div>
              </div>
           )}
           <div className={` ${!isPro ? 'pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Integrations</h1>
        <p className="text-slate-600">
          Connect your favorite tools to streamline your invoicing workflow.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-teal-100 text-teal-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(integration => (
          <div
            key={integration.id}
            className={`bg-white rounded-xl border p-5 transition-all ${
              integration.connected
                ? 'border-teal-200 bg-teal-50/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                  {integration.ComingSoon && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
              {integration.connected && (
                <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                  Connected
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
            
            <div className="flex gap-2">
              {integration.connected ? (
                <button
                  onClick={() => handleDisconnect(integration)}
                  disabled={connectingId === integration.id}
                  className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {connectingId === integration.id ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(integration)}
                  disabled={connectingId === integration.id || integration.ComingSoon}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    !isPro
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]'
                  }`}
                >
                  {connectingId === integration.id
                    ? 'Connecting...'
                    : !isPro
                    ? 'Upgrade to Connect'
                    : integration.ComingSoon
                    ? 'Coming Soon'
                    : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No integrations in this category yet.</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Need a specific integration?</h3>
        <p className="text-sm text-slate-600 mb-4">
          We're constantly adding new integrations. Let us know what you need and we'll prioritize it.
        </p>
        <button className="text-sm font-medium text-teal-600 hover:text-teal-700">
          Request Integration â†’
        </button>
      </div>

      {showGate && (
        <PremiumGate
          isModal
          title="Connect InvoiceApp to the tools you already use."
          subhead="Your invoices shouldnâ€™t live alone. Plug into your accounting, CRM, and payment tools so everything updates itself."
          bullets={[
            "Sync paid invoices to your accounting tool.",
            "Log payments in your CRM automatically.",
            "Send receipts via your chat app or email tool."
          ]}
          proofText="Teams using integrations save 4+ hours per week on admin."
          primaryCta="Unlock Integrations"
          secondaryCta="Not now"
          onPrimaryClick={() => {
            setShowGate(false);
            onUpgrade();
          }}
          onSecondaryClick={() => setShowGate(false)}
        />
      )}
      </div>
    </div>
  );
};

