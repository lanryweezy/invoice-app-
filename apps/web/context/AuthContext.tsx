import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, 
  onAuthStateChanged, doc, setDoc, getDoc, User, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from '../services/firebase';
import { onSnapshot, runTransaction } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';
import { generateSecureId } from '../utils/crypto';

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
            // 💾 Vault: Use runTransaction to prevent silent data destruction from concurrent
            // offline sync flushes when a user document is initialized.
            // A non-atomic read-then-write sequence here allows offline data accumulated
            // before the check to be overwritten if it syncs in between the get and set.
            await runTransaction(db, async (transaction) => {
              const userSnap = await transaction.get(userRef);
              if (!userSnap.exists()) {
                transaction.set(userRef, { plan: 'free' }, { merge: true });
              }
            });
          } catch (error) {
            console.error("Error checking/creating user record:", error);
            try { trackEvent('auth_user_record_error', { user_id: currentUser.uid, error: String(error) }); } catch {}
          }
        };
        
        // 🌱 Flora: Catch floating promise rejections to prevent silent failures
        checkUserRecord().catch(console.error);

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
      try { trackEvent('auth_login_error', { provider: 'google', error: String(error) }); } catch {}
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email Login failed", error);
      try { trackEvent('auth_login_error', { provider: 'email', error: String(error) }); } catch {}
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email Signup failed", error);
      try { trackEvent('auth_signup_error', { provider: 'email', error: String(error) }); } catch {}
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
      return false;
    }

    try { trackEvent('upgrade_initiated', { plan_type: planType, user_id: user.uid }); } catch {}

    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const openPaystack = () => {
        if (!(window as any).PaystackPop) {
          console.error("Paystack not loaded — check VITE_PAYSTACK_PUBLIC_KEY");
          resolve(false);
          return;
        }

        const amount = planType === 'yearly' ? 48000 : 5000;

        try {
          const handler = (window as any).PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email || 'user@example.com',
            amount: amount * 100,
            currency: 'NGN',
            // Security Fix: Use cryptographically secure random numbers for references
            ref: (() => {
              return 'INV-' + Date.now() + '-' + generateSecureId(3);
            })(),
            metadata: {
              custom_fields: [
                { display_name: "User ID", variable_name: "user_id", value: user.uid },
                { display_name: "Plan", variable_name: "plan", value: planType },
              ]
            },
            callback: function(response: any) {
              try { trackEvent('payment_success', { plan_type: planType, ref: response.reference, user_id: user.uid }); } catch {}
              // 💾 Vault: Only save non-privileged metadata on the client.
              // The `plan` field is securely updated by the Paystack webhook backend
              // and locked by Firestore rules to prevent arbitrary client-side upgrades.
              setDoc(doc(db, 'users', user.uid), {
                planType,
                upgradedAt: new Date().toISOString(),
                paystackRef: response.reference,
              }, { merge: true }).then(() => {
                resolve(true);
              }).catch((error) => {
                try { trackEvent('payment_upgrade_save_failed', { plan_type: planType, user_id: user.uid, error: String(error) }); } catch {}
                console.error("Failed to save upgrade", error);
                try {
                  trackEvent('payment_upgrade_save_failed', {
                    plan_type: planType,
                    ref: response.reference,
                    user_id: user.uid,
                    error: error instanceof Error ? error.message : String(error)
                  });
                } catch {}
                resolve(false);
              });
            },
            onClose: function() {
              try { trackEvent('payment_cancelled', { plan_type: planType, user_id: user.uid }); } catch {}
              resolve(false);
            }
          });
          handler.openIframe();
        } catch (err) {
          try { trackEvent('payment_error_callback', { plan_type: planType, user_id: user.uid, error: String(err) }); } catch {}
          console.error("Paystack setup error:", err);
          resolve(false);
        }
      };

      openPaystack();
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
