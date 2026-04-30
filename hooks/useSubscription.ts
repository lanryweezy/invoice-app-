import { useState, useEffect } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, User } from '../services/firebase';

export interface SubscriptionData {
  plan: 'free' | 'pro';
}

export const useSubscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user subscription from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as SubscriptionData;
          setIsPro(data.plan === 'pro');
        } else {
          // Create a new user with free plan
          await setDoc(userRef, { plan: 'free' });
          setIsPro(false);
        }
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  const upgradeToPro = async () => {
    if (!user) {
      await login();
      // After login, they would have to click upgrade again in a real flow,
      // but let's make it simple.
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { plan: 'pro' }, { merge: true });
      setIsPro(true);
      return true;
    } catch (error) {
      console.error("Upgrade failed", error);
      return false;
    }
  };

  return { user, isPro, loading, login, logout, upgradeToPro };
};
