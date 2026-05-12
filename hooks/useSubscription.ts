import { useState, useEffect } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, User } from '../services/firebase';
import { onSnapshot } from 'firebase/firestore';

export interface SubscriptionData {
  plan: 'free' | 'pro';
}

export const useSubscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        // Use onSnapshot instead of getDoc to listen for changes across components
        unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
           if (userSnap.exists()) {
             const data = userSnap.data() as SubscriptionData;
             setIsPro(data.plan === 'pro');
           } else {
             // Create a new user with free plan
             setDoc(userRef, { plan: 'free' });
             setIsPro(false);
           }
           setLoading(false);
        });

      } else {
        setIsPro(false);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const upgradeToPro = async (): Promise<boolean> => {
    if (!user) {
      await login();
      return false;
    }

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !(window as any).PaystackPop) {
        console.error("Paystack not loaded");
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { plan: 'pro' }, { merge: true })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_dummy_key_for_dev_change_me',
        email: user.email || 'user@example.com',
        amount: 5000 * 100, // Amount in kobo (₦5,000)
        currency: 'NGN',
        ref: 'NI_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: async function(response: any) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { plan: 'pro' }, { merge: true });
            resolve(true);
          } catch (error) {
            console.error("Failed to update user plan after payment", error);
            resolve(false);
          }
        },
        onClose: function() {
          resolve(false);
        }
      });
      handler.openIframe();
    });
  };

  return { user, isPro, loading, login, logout, upgradeToPro };
};
