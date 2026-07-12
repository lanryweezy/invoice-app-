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
  onSmtpSaved: (settings: SmtpSettings | null) => void;
}

const PRESETS: { name: string; host: string; port: string }[] = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: '587' },
  { name: 'Outlook/365', host: 'smtp.office365.com', port: '587' },
  { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: '587' },
  { name: 'Zoho', host: 'smtp.zoho.com', port: '587' },
  { name: 'Hostinger', host: 'smtp.hostinger.com', port: '465' },
  { name: 'Custom', host: '', port: '587' },
];

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({ isOpen, onClose, user, onSmtpSaved }) => {
  const [smtp, setSmtp] = useState<SmtpSettings>({ host: '', port: '587', user: '', pass: '', fromEmail: '', fromName: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const loadSmtp = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().smtpSettings) {
          const s = docSnap.data().smtpSettings;
          setSmtp({ host: s.host || '', port: s.port || '587', user: s.user || '', pass: s.pass || '', fromEmail: s.fromEmail || '', fromName: s.fromName || '' });
          setHasExisting(true);
        } else {
          setSmtp({ host: '', port: '587', user: '', pass: '', fromEmail: user.email || '', fromName: '' });
          setHasExisting(false);
        }
      } catch { setSmtp({ host: '', port: '587', user: '', pass: '', fromEmail: user.email || '', fromName: '' }); }
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

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setSmtp(s => ({ ...s, host: preset.host, port: preset.port }));
  };

  const handleSave = async () => {
    if (!user || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      setMessage({ type: 'error', text: 'Please fill in all SMTP fields.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), { smtpSettings: smtp });
      onSmtpSaved(smtp);
      setMessage({ type: 'success', text: 'SMTP settings saved!' });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      setMessage({ type: 'error', text: 'Fill in all SMTP fields first.' });
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smtp.fromEmail || smtp.user,
          subject: 'InvoiceApp SMTP Test',
          text: 'Your SMTP settings are configured correctly! You can now send invoices directly from InvoiceApp.',
          smtp,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Test failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
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
      onSmtpSaved(null);
      setMessage({ type: 'success', text: 'SMTP disconnected.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Email (SMTP) Settings</h3>
                <p className="text-sm text-slate-500 mt-1">Send invoices directly from your own email</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Setup</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => handlePreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${smtp.host === p.host ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">SMTP Host</label>
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Username / Email</label>
                <input type="text" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))}
                  placeholder="you@gmail.com" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Password / App Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp(s => ({ ...s, pass: e.target.value }))}
                    placeholder="••••••••" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">For Gmail, use an App Password (not your main password)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">From Name</label>
                  <input type="text" value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))}
                    placeholder="Your Business Name" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">From Email</label>
                  <input type="email" value={smtp.fromEmail} onChange={e => setSmtp(s => ({ ...s, fromEmail: e.target.value }))}
                    placeholder="you@gmail.com" className="w-full rounded-lg border-slate-300 text-sm focus:border-teal-500 focus:ring-teal-500" />
                </div>
              </div>
            </div>

            {message && (
              <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-4 flex flex-wrap gap-3 border-t border-slate-100">
            <button onClick={handleTest} disabled={testing}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {testing ? 'Sending...' : 'Send Test Email'}
            </button>
            <div className="flex-1" />
            {hasExisting && (
              <button onClick={handleDisconnect} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                Disconnect
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
