import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PublicProfileProps {
  username: string;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ username }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      try {
        const docRef = doc(db, 'publicProfiles', username);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().isPublic === false) {
          setError('Profile not found or is not public.');
        } else {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching public profile:", err);
        setError('Error loading profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto"></div>
          <div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-500">{error}</p>
          <a href="/" className="mt-6 inline-block text-teal-600 font-medium hover:underline">Return to InvoiceApp</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600 relative">
             <div className="absolute -bottom-12 left-8">
                 <div className="w-24 h-24 bg-white rounded-2xl p-2 shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-teal-700">
                     {profile.businessName ? profile.businessName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                 </div>
             </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {profile.businessName || 'Verified Business'}
                  <svg className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </h1>
                <p className="text-slate-500 mt-1">@{username}</p>
              </div>
              <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold border border-teal-100">
                Verified Pro Vendor
              </div>
            </div>

            {profile.bio && (
              <div className="mb-8">
                <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                  <span className="font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active on InvoiceApp
                  </span>
               </div>
               {profile.website && (() => {
                  // Basic XSS mitigation for href
                  let safeUrl = profile.website;
                  if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
                      safeUrl = 'https://' + safeUrl; // default to https, ignoring javascript: or other URIs
                  }
                  return (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Website</span>
                        <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline truncate block">
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                  );
               })()}
            </div>

            <div className="border-t border-slate-100 pt-8 text-center">
               <p className="text-sm text-slate-500 mb-4">Interested in working with {profile.businessName || 'this business'}?</p>
               <a href={`mailto:${encodeURIComponent(profile.email || '')}?subject=Request for Quote (via InvoiceApp)`} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-colors shadow-sm w-full sm:w-auto">
                 Request a Quote
               </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
            <a href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Powered by InvoiceApp.ng
            </a>
        </div>
      </div>
    </div>
  );
};
