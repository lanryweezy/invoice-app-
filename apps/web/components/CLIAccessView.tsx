import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { generateSecureId } from '../utils/crypto';

function generateToken(): string {
  // UUID provides 32 hex chars when dashes are removed
  return generateSecureId(32).toLowerCase();
}

const CLI_COMMANDS = [
  { command: 'npm install -g invoiceapp-cli', description: 'Install the CLI globally', highlight: true },
  { command: 'invoiceapp init', description: 'Initialize your config (creates ~/.invoiceapp/config.json)' },
  { command: 'invoiceapp auth login --token <token>', description: 'Authenticate with your CLI token' },
  { command: 'invoiceapp create', description: 'Create a new invoice interactively' },
  { command: 'invoiceapp create --help', description: 'Show all create options and flags' },
  { command: 'invoiceapp list', description: 'List your saved invoices' },
  { command: 'invoiceapp export <invoice-id>', description: 'Export an invoice as PDF' },
  { command: 'invoiceapp status', description: 'Check your account and sync status' },
];

const QUICK_START = `# Install InvoiceApp CLI
npm install -g invoicecli

# Initialize (first time only)
invoiceapp init

# Create your first invoice
invoiceapp create --client "Acme Corp" --amount 250000 --description "Web Development"

# List all invoices
invoiceapp list

# Export as PDF
invoiceapp export <invoice-id>`;

const API_EXAMPLE = `# Using InvoiceApp CLI in scripts
#!/bin/bash

# Create invoice from a script
invoiceapp create \\
  --client "Client Name" \\
  --amount 150000 \\
  --description "Design Services" \\
  --due-date "2026-08-15" \\
  --currency NGN

# Check status
invoiceapp status`;

interface CLIAccessViewProps {
  isPro?: boolean;
}

export const CLIAccessView: React.FC<CLIAccessViewProps> = ({ isPro }) => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showTokenSection, setShowTokenSection] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateToken = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const newToken = generateToken();
      const tokenRef = doc(db, 'users', user.uid, 'cliToken', 'current');
      await setDoc(tokenRef, {
        token: newToken,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      });
      setToken(newToken);
    } catch (error) {
      console.error('Error generating token:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadToken = async () => {
    if (!user) return;
    try {
      const tokenRef = doc(db, 'users', user.uid, 'cliToken', 'current');
      const snap = await getDoc(tokenRef);
      if (snap.exists()) {
        setToken(snap.data().token);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">InvoiceApp CLI</h1>
            <p className="text-slate-500 text-sm">Create invoices from your terminal. No sign-in required to get started.</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick Start</h2>
          <button
            onClick={() => handleCopy(QUICK_START, 'quickstart')}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            {copied === 'quickstart' ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy all
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm relative group">
          <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-1.5 rounded-t-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-slate-400 font-sans ml-2">terminal</span>
          </div>
          <pre className="pt-6 text-slate-300 overflow-x-auto whitespace-pre-wrap">{QUICK_START}</pre>
        </div>
      </div>

      {/* Commands Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Commands</h2>
        <div className="space-y-3">
          {CLI_COMMANDS.map((cmd, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${cmd.highlight ? 'bg-teal-50 border border-teal-200' : 'bg-slate-50'}`}>
              <div>
                <code className="text-sm font-mono text-slate-900">{cmd.command}</code>
                <p className="text-xs text-slate-500 mt-1">{cmd.description}</p>
              </div>
              <button
                onClick={() => handleCopy(cmd.command, `cmd-${i}`)}
                className="text-xs text-slate-400 hover:text-teal-600 transition-colors"
              >
                {copied === `cmd-${i}` ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Example */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Use in Scripts</h2>
          <button
            onClick={() => handleCopy(API_EXAMPLE, 'api')}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            {copied === 'api' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm">
          <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">{API_EXAMPLE}</pre>
        </div>
      </div>

      {/* Token Section (Optional - for signed-in users) */}
      {user && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your CLI Token</h2>
              <p className="text-sm text-slate-500">Generate a token to sync invoices with your account.</p>
            </div>
            <button
              onClick={() => {
                setShowTokenSection(!showTokenSection);
                if (!token && !showTokenSection) handleLoadToken();
              }}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              {showTokenSection ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTokenSection && (
            <div>
              {token ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-slate-700 truncate">{token}</code>
                  <button
                    onClick={() => handleCopy(token, 'token')}
                    className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    {copied === 'token' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateToken}
                  disabled={generating}
                  className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Token'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
