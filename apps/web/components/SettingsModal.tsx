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
              <p className="text-sm text-slate-500">{user?.email}</p>
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
