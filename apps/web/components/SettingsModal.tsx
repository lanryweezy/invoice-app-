import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isPro: boolean;
  logout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, isPro, logout }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Keep track of the original username to handle renames
  const [originalUsername, setOriginalUsername] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && user && isPro) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsername(data.username || '');
            setOriginalUsername(data.username || '');
            setBio(data.bio || '');
            setBusinessName(data.businessName || '');
            setWebsite(data.website || '');
            setIsPublic(data.isPublic || false);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };
      fetchProfile();
    }
  }, [isOpen, user, isPro]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!sanitizedUsername && isPublic) {
         setMessage('Failed: Username cannot be empty if public.');
         setSaving(false);
         return;
      }

      const payload = {
        username: sanitizedUsername,
        bio,
        businessName,
        website,
        isPublic,
        email: user.email,
        uid: user.uid
      };

      await runTransaction(db, async (transaction) => {
        // 1. Pre-flight check: Ensure global uniqueness BEFORE writing to internal state
        if (sanitizedUsername) {
           const publicRef = doc(db, 'publicProfiles', sanitizedUsername);
           const publicSnap = await transaction.get(publicRef);

           if (publicSnap.exists() && publicSnap.data().uid !== user.uid) {
               throw new Error('Username is already taken by another business.');
           }
        }

        // 2. Save to internal users document
        const userDocRef = doc(db, 'users', user.uid);
        transaction.update(userDocRef, payload);

        // 3. Write new public profile and cleanup old one if it changed
        if (sanitizedUsername) {
           const publicRef = doc(db, 'publicProfiles', sanitizedUsername);
           transaction.set(publicRef, payload);
        }

        // Cleanup dangling old profile if username changed and old username existed
        if (originalUsername && originalUsername !== sanitizedUsername) {
            const oldPublicRef = doc(db, 'publicProfiles', originalUsername);
            transaction.delete(oldPublicRef);
        }
      });

      setOriginalUsername(sanitizedUsername); // Sync up after successful save

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.message === 'Username is already taken by another business.') {
          setMessage('Failed: Username is already taken by another business.');
      } else {
          setMessage('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 id="settings-modal-title" className="text-xl font-bold text-slate-900">Account Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{user?.displayName || 'User'}</h3>
              <a href={`mailto:${user?.email}`} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{user?.email}</a>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Current Plan</span>
              <span className={`px-2 py-1 text-xs font-bold rounded ${isPro ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'}`}>
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isPro ? 'Your data is being safely synced to the cloud.' : 'Upgrade to Pro to unlock cloud sync, unlimited clients, and more.'}
            </p>
          </div>

          {isPro && (
            <button
              onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-smtp-settings')); }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg">📧</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">Email (SMTP) Settings</p>
                  <p className="text-xs text-slate-500">Send invoices directly from your email</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-teal-600 transition-colors">→</span>
            </button>
          )}

          {!isPro && (
            <button
              onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-smtp-settings')); }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-lg">🔒</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">Email (SMTP) Settings</p>
                  <p className="text-xs text-slate-500">Pro feature — send invoices from your inbox</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">PRO</span>
            </button>
          )}

          {isPro && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Public "Verified Business" Profile</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Public Username</label>
                  <div className="flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                      invoiceapp.ng/p/
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="mycompany"
                      className="flex-1 block w-full rounded-none rounded-r-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="block w-full rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    placeholder="E.g. Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="block w-full rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    placeholder="We build amazing digital products..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="block w-full rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">Make profile public</span>
                  </label>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
                {message && (
                  <p className={`text-xs mt-2 ${message.includes('Failed') ? 'text-red-500' : 'text-teal-600'}`}>
                    {message}
                  </p>
                )}
                {isPublic && username && (
                   <p className="text-xs text-slate-500 mt-2">
                     Your profile is live at:{' '}
                     <a href={`/p/${username}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                       invoiceapp.ng/p/{username}
                     </a>
                   </p>
                )}
              </div>
            </div>
          )}

          {/* Referral Program */}
          {user && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm font-bold text-teal-800">Refer & Earn</p>
              </div>
              <p className="text-xs text-teal-700 mb-3">
                Share your referral link. When someone signs up, you both get <strong>1 month of Pro free</strong>.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={`invoiceapp.ng/editor?ref=${user.uid}`}
                  className="flex-1 text-xs bg-white border border-teal-200 rounded-lg px-3 py-2 text-slate-600 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://invoiceapp.ng/editor?ref=${user.uid}`);
                    setMessage('Referral link copied!');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`I use InvoiceApp to create professional invoices for my business. It's free and NRS-compliant. Try it: https://invoiceapp.ng/editor?ref=${user.uid}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
