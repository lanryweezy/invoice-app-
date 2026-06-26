import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:0000:web:0000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const googleProvider = new GoogleAuthProvider();

export { auth, db, analytics, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword };
export type { User };
