import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PremiumGate } from './PremiumGate';

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const values = new Uint32Array(32);
  crypto.getRandomValues(values);
  for (let i = 0; i < 32; i++) {
    token += chars[values[i] % chars.length];
  }
  return token;
}

interface CLITokenData {
  token: string;
  createdAt: string;
  lastUsed: string;
}

const CLI_COMMANDS = [
  { command: 'invoiceapp auth login --token <token>', description: 'Authenticate with your CLI token' },
  { command: 'invoiceapp config init', description: 'Initialize your CLI configuration' },
  { command: 'invoiceapp create', description: 'Create a new invoice interactively' },
  { command: 'invoiceapp create --help', description: 'Show create options and flags' },
  { command: 'invoiceapp list', description: 'List your saved invoices' },
  { command: 'invoiceapp export <invoice-id>', description: 'Export an invoice as PDF' },
  { command: 'invoiceapp status', description: 'Check your account and sync status' },
];

interface CLIAccessViewProps {
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const CLIAccessView: React.FC<CLIAccessViewProps> = ({ isPro, onUpgrade }) => {
  const { user } = useAuth();
  const [tokenData, setTokenData] = useState<CLITokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchToken = async () => {
      try {
        const tokenRef = doc(db, 'users', user.uid, 'cliToken', 'current');
        const snap = await getDoc(tokenRef);
        if (snap.exists()) {
          setTokenData(snap.data() as CLITokenData);
        }
      } catch (error) {
        console.error('Error fetching CLI token:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [user]);

  const handleGenerateToken = async () => {
    if (!user) return;
    setGenerating(true);
    setMessage('');
    try {
      const newToken = generateToken();
      const tokenRef = doc(db, 'users', user.uid, 'cliToken', 'current');
      const data: CLITokenData = {
        token: newToken,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };
      await setDoc(tokenRef, data);
      setTokenData(data);
      setMessage('New token generated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error generating token:', error);
      setMessage('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (!tokenData) return;
    navigator.clipboard.writeText(tokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">CLI Access</h2>
          <p className="text-slate-600">Please sign in to generate your CLI token.</p>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <PremiumGate
          title="Control InvoiceApp from your terminal."
          subhead="You ship code from your terminal. Now ship invoices from there too. Automate your billing like you automate deployments."
          bullets={[
            "Create invoices from CI or scripts.",
            "Bulk‑update status without touching the UI.",
            "Pipe invoice data into your own tools."
          ]}
          heroVisual={
            <div className="bg-slate-900 rounded-xl p-4 w-full max-w-md text-left shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <div className="text-[10px] text-slate-400 font-mono ml-2">bash</div>
              </div>
              <div className="pt-8 font-mono text-sm">
                <div className="text-teal-400">$ <span className="text-white">invoiceapp create</span></div>
                <div className="text-slate-400 mt-2">✔ Client: <span className="text-teal-300">Acme Corp</span></div>
                <div className="text-slate-400">✔ Amount: <span className="text-teal-300">₦250,000</span></div>
                <div className="text-slate-400">✔ Status: <span className="text-teal-300">Sent 🚀</span></div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText('invoiceapp create --client "Acme Corp" --amount 250000');
                  alert('Command copied to clipboard!');
                }}
                className="absolute right-3 top-11 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity font-sans flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copy sample command
              </button>
            </div>
          }
          primaryCta="Unlock CLI Access"
          secondaryCta="View docs without CLI"
          onPrimaryClick={onUpgrade || (() => {})}
          onSecondaryClick={() => window.open('https://invoiceapp.ng/docs', '_blank')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">CLI Access</h1>
        <p className="text-slate-600">
          Generate a token to authenticate the InvoiceApp CLI and manage invoices from your terminal.
        </p>
      </div>

      {/* Token Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your CLI Token</h2>
        
        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
            <span className="text-sm text-slate-500">Loading token...</span>
          </div>
        ) : tokenData ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <code className="text-sm font-mono text-slate-800 break-all select-all">
                  {tokenData.token}
                </code>
                <button
                  onClick={handleCopyToken}
                  className="flex-shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Token
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Created: {new Date(tokenData.createdAt).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={handleGenerateToken}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Regenerate Token'}
            </button>

            {message && (
              <p className={`text-sm ${message.includes('Failed') ? 'text-red-500' : 'text-teal-600'}`}>
                {message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You don't have a CLI token yet. Generate one to get started.
            </p>
            <button
              onClick={handleGenerateToken}
              disabled={generating}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Setup Instructions</h2>
        <div className="space-y-3">
          {[
            { step: 1, text: 'Install the CLI', code: 'npm install -g @invoiceapp/cli' },
            { step: 2, text: 'Login with your token', code: 'invoiceapp auth login --token <your-token>' },
            { step: 3, text: 'Initialize configuration', code: 'invoiceapp config init' },
            { step: 4, text: 'Create your first invoice', code: 'invoiceapp create --help' },
          ].map(({ step, text, code }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{text}</p>
                <code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded mt-1 inline-block">
                  {code}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLI Commands Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">CLI Commands Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Command</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {CLI_COMMANDS.map((cmd, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 px-3">
                    <code className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {cmd.command}
                    </code>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{cmd.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
