import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, 
  onAuthStateChanged, doc, setDoc, getDoc, User, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from '../services/firebase';
import { onSnapshot } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';

export interface SubscriptionData {
  plan: 'free' | 'pro';
}

interface AuthContextType {
  user: User | null;
  isPro: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPro: (planType?: 'monthly' | 'yearly') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        // Separate user creation logic from the listener
        // We do a one-time check/creation when the user first authenticates
        const checkUserRecord = async () => {
          try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              await setDoc(userRef, { plan: 'free' });
            }
          } catch (error) {
            console.error("Error checking/creating user record:", error);
          }
        };
        
        checkUserRecord();

        // The listener is now purely for syncing data
        unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
           if (userSnap.exists()) {
             const data = userSnap.data() as SubscriptionData;
             setIsPro(data.plan === 'pro');
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

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const upgradeToPro = async (planType: 'monthly' | 'yearly' = 'monthly'): Promise<boolean> => {
    if (!user) {
      await loginWithGoogle();
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
        metadata: {
            uid: user.uid
        },
        callback: async function(response: any) {
          try {
            trackEvent('payment_success', {
                plan_type: planType,
                ref: response.reference,
                email: user.email
            });
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

  return (
    <AuthContext.Provider value={{ user, isPro, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, upgradeToPro }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
