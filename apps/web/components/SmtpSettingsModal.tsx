import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface SmtpSettings {
  host: string;
  port: string;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isPro: boolean;
  onSmtpSaved: (settings: SmtpSettings | null) => void;
  onUpgrade: () => void;
}

interface Preset {
  name: string;
  icon: string;
  host: string;
  port: string;
  helpUrl: string;
  instructions: string[];
}

const PRESETS: Preset[] = [
  {
    name: 'Gmail',
    icon: '✉️',
    host: 'smtp.gmail.com',
    port: '587',
    helpUrl: 'https://myaccount.google.com/apppasswords',
    instructions: [
      'Go to myaccount.google.com → Security',
      'Enable 2-Step Verification (required)',
      'Search "App Passwords" → Generate one for "Mail"',
      'Copy the 16-character password below',
    ],
  },
  {
    name: 'Outlook / 365',
    icon: '📨',
    host: 'smtp.office365.com',
    port: '587',
    helpUrl: 'https://support.microsoft.com/en-us/office',
    instructions: [
      'Use your regular Outlook email and password',
      'If 2FA is enabled, generate an App Password',
      'Go to account.microsoft.com → Security → App Passwords',
    ],
  },
  {
    name: 'Yahoo',
    icon: '📬',
    host: 'smtp.mail.yahoo.com',
    port: '587',
    helpUrl: 'https://help.yahoo.com/kb/generate-manage-app-passwords-sln15241.html',
    instructions: [
      'Go to Account Security → App Passwords',
      'Generate a new app password for "Mail"',
      'Copy and paste it below (not your regular password)',
    ],
  },
  {
    name: 'Zoho',
    icon: '📮',
    host: 'smtp.zoho.com',
    port: '587',
    helpUrl: 'https://www.zoho.com/mail/help/smtp-authentication.html',
    instructions: [
      'Go to Zoho Mail → Settings → Mail Accounts',
      'Enable SMTP Access',
      'Use your Zoho email and a dedicated SMTP password',
    ],
  },
  {
    name: 'Custom',
    icon: '⚙️',
    host: '',
    port: '587',
    helpUrl: '',
    instructions: [
      'Enter your hosting provider\'s SMTP details',
      'Common ports: 587 (TLS) or 465 (SSL)',
      'Ask your hosting provider if unsure',
    ],
  },
];

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({ isOpen, onClose, user, isPro, onSmtpSaved, onUpgrade }) => {
  const [smtp, setSmtp] = useState<SmtpSettings>({ host: '', port: '587', user: '', pass: '', fromEmail: '', fromName: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [step, setStep] = useState<'choose' | 'setup'>('choose');

  useEffect(() => {
    if (!isOpen || !user) return;
    const loadSmtp = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().smtpSettings) {
          const s = docSnap.data().smtpSettings;
          setSmtp({ host: s.host || '', port: s.port || '587', user: s.user || '', pass: s.pass || '', fromEmail: s.fromEmail || '', fromName: s.fromName || '' });
          setHasExisting(true);
          const matched = PRESETS.find(p => p.host === s.host);
          setSelectedPreset(matched || PRESETS[PRESETS.length - 1]);
          setStep('setup');
        } else {
          setSmtp({ host: '', port: '587', user: '', pass: '', fromEmail: user.email || '', fromName: '' });
          setHasExisting(false);
          setSelectedPreset(null);
          setStep('choose');
        }
      } catch {
        setSmtp({ host: '', port: '587', user: '', pass: '', fromEmail: user.email || '', fromName: '' });
        setStep('choose');
      }
    };
    loadSmtp();
    setMessage(null);
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setSmtp(s => ({ ...s, host: preset.host, port: preset.port }));
    setStep('setup');
  };

  const handleSave = async () => {
    if (!user || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), { smtpSettings: smtp });
      onSmtpSaved(smtp);
      setHasExisting(true);
      setMessage({ type: 'success', text: 'Email settings saved!' });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      setMessage({ type: 'error', text: 'Fill in all fields first.' });
      return;
    }
    setTesting(true);
    setMessage(null);

    // 🌱 Flora: Wraps native fetch with AbortController to prevent indefinite UI hangs if the external SMTP server is unresponsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smtp.fromEmail || smtp.user,
          subject: 'InvoiceApp — Test Email',
          text: 'Your email is configured correctly! You can now send invoices directly from InvoiceApp.',
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Test email sent! Check your inbox (and spam folder).' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Test failed. Check your credentials.' });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Request timed out. The SMTP server took too long to respond.' });
      } else {
        setMessage({ type: 'error', text: err.message || 'Network error.' });
      }
    } finally {
      clearTimeout(timeoutId);
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { smtpSettings: null });
      setSmtp({ host: '', port: '587', user: '', pass: '', fromEmail: '', fromName: '' });
      setHasExisting(false);
      setSelectedPreset(null);
      setStep('choose');
      onSmtpSaved(null);
      setMessage({ type: 'success', text: 'Email disconnected.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="smtp-modal-title" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h3 id="smtp-modal-title" className="text-xl font-bold text-slate-900">
                {step === 'choose' ? 'Connect Your Email' : `Setup ${selectedPreset?.name || 'Custom'}`}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {step === 'choose' ? 'Send invoices from your own email address' : 'Follow the steps below'}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close modal" title="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded-full transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6">
            {!isPro ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Direct Email Sending</h4>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  Send invoices straight from your inbox to your client — no copy-pasting needed. A Pro feature.
                </p>
                <button onClick={onUpgrade}
                  className="bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            ) : step === 'choose' ? (
              <div>
                <p className="text-sm text-slate-600 mb-4">Choose your email provider to get started:</p>
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map(p => (
                    <button key={p.name} onClick={() => handleSelectPreset(p)}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-left group">
                      <span className="text-2xl">{p.icon}</span>
                      <span className="font-semibold text-slate-800 group-hover:text-teal-700">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Instructions */}
                {selectedPreset && selectedPreset.instructions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">How to get your password:</p>
                    <ol className="space-y-1.5">
                      {selectedPreset.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-2 text-sm text-blue-800">
                          <span className="font-bold text-blue-500 flex-shrink-0">{i + 1}.</span>
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ol>
                    {selectedPreset.helpUrl && (
                      <a href={selectedPreset.helpUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline">
                        Open help page →
                      </a>
                    )}
                  </div>
                )}

                {/* Form */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">SMTP Server</label>
                    <input type="text" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))}
                      placeholder="smtp.gmail.com" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Port</label>
                    <input type="text" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))}
                      placeholder="587" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                  <input type="email" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))}
                    placeholder="you@gmail.com" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp(s => ({ ...s, pass: e.target.value }))}
                      placeholder="App password (not your regular password)" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500 pr-16" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 rounded">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Your Name</label>
                    <input type="text" value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))}
                      placeholder="Your Business Name" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">From Email</label>
                    <input type="email" value={smtp.fromEmail} onChange={e => setSmtp(s => ({ ...s, fromEmail: e.target.value }))}
                      placeholder="you@gmail.com" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                  </div>
                </div>

                <button onClick={() => { setStep('choose'); setSelectedPreset(null); }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700">
                  ← Choose a different provider
                </button>

                {message && (
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {isPro && step === 'setup' && (
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex flex-wrap gap-3">
              <button onClick={handleTest} disabled={testing}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50">
                {testing ? 'Sending...' : '📧 Send Test'}
              </button>
              <div className="flex-1" />
              {hasExisting && (
                <button onClick={handleDisconnect} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                  Disconnect
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Saving...' : hasExisting ? 'Update' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
