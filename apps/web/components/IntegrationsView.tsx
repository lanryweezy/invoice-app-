import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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
    icon: '💳',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pan-African payment gateway. Multi-currency support.',
    category: 'payment',
    icon: '🌍',
  },
  {
    id: 'moniepoint',
    name: 'Moniepoint',
    description: 'Business banking & POS. Auto-match payments.',
    category: 'payment',
    icon: '🏦',
  },
  {
    id: 'opay',
    name: 'OPay',
    description: 'Mobile money & transfers. Huge user base.',
    category: 'payment',
    icon: '📱',
  },
  // Payment - Global
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Global payment processing. Cards & wallets.',
    category: 'payment',
    icon: '💰',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payments. Buyer protection included.',
    category: 'payment',
    icon: '🅿️',
  },
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices & payments automatically.',
    category: 'accounting',
    icon: '📊',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting. Real-time financial data.',
    category: 'accounting',
    icon: '📈',
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Free accounting software. Perfect for startups.',
    category: 'accounting',
    icon: '🌊',
  },
  // E-Commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Auto-create invoices from store orders.',
    category: 'ecommerce',
    icon: '🛒',
    ComingSoon: true,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce integration.',
    category: 'ecommerce',
    icon: '🛍️',
    ComingSoon: true,
  },
  // Productivity
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 1000+ apps. Automate workflows.',
    category: 'productivity',
    icon: '⚡',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Sync contacts, drive, and calendar.',
    category: 'productivity',
    icon: '📎',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get invoice notifications in your workspace.',
    category: 'productivity',
    icon: '💬',
  },
];

export const IntegrationsView: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const { user, isPro } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
      onUpgrade();
      return;
    }

    if (!user) return;

    setConnectingId(integration.id);

    // Simulate connection flow - in production, this would open OAuth
    setTimeout(async () => {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        integrations: arrayUnion(integration.id),
      });
      setConnectingId(null);
    }, 1500);
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!user) return;

    setConnectingId(integration.id);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      integrations: arrayRemove(integration.id),
    });
    setConnectingId(null);
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Integrations</h1>
        <p className="text-slate-600">
          Connect your favorite tools to streamline your invoicing workflow.
        </p>
      </div>

      {/* Pro Badge */}
      {!isPro && (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Unlock All Integrations</h3>
              <p className="text-teal-100 text-sm">
                Upgrade to Pro to connect payment gateways, accounting software, and more.
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="bg-white text-teal-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-teal-50 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

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
                      : 'bg-teal-600 text-white hover:bg-teal-700'
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
          Request Integration →
        </button>
      </div>
    </div>
  );
};
