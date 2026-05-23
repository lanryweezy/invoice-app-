import { useState, useEffect } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../services/firebase';
import { onSnapshot } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';

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

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email Login failed", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email Signup failed", error);
      throw error;
    }
  };

  const login = loginWithGoogle; // keep as default for backward compatibility where used

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const upgradeToPro = async (planType: 'monthly' | 'yearly' = 'monthly'): Promise<boolean> => {
    if (!user) {
      await login();
      return false;
    }

    trackEvent('upgrade_initiated', { plan_type: planType, user_email: user.email });

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !(window as any).PaystackPop) {
        console.error("Paystack not loaded");
        resolve(false);
        return;
      }

      const amount = planType === 'yearly' ? 48000 : 5000;

      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_dummy_key_for_dev_change_me',
        email: user.email || 'user@example.com',
        amount: amount * 100, // Amount in kobo
        currency: 'NGN',
        ref: 'NI_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: async function(response: any) {
          try {
            trackEvent('payment_success', {
                plan_type: planType,
                ref: response.reference,
                email: user.email
            });
            // Security Fix: Insecure client-side plan updates are removed.
            // In a production environment, this should be handled by a secure
            // backend webhook triggered by Paystack.
            console.log("Payment successful. Account upgrade is being processed via backend.");
            resolve(true);
          } catch (error) {
            trackEvent('payment_error_callback', { error: String(error), plan_type: planType });
            console.error("Failed after payment", error);
            resolve(false);
          }
        },
        onClose: function() {
          trackEvent('payment_cancelled', { plan_type: planType });
          resolve(false);
        }
      });
      handler.openIframe();
    });
  };

  return { user, isPro, loading, login, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, upgradeToPro };
};
