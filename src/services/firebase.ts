import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configured = Object.values(firebaseConfig).every(Boolean);
const app = configured ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!firebaseAuth) throw new Error('Firebase authentication is not configured.');
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user;
}

export async function signOutFirebase() {
  if (firebaseAuth) await signOut(firebaseAuth);
}

export function watchFirebaseAuth(callback: (user: FirebaseUser | null) => void) {
  if (!firebaseAuth) { callback(null); return () => undefined; }
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function getFirebaseIdToken(): Promise<string | null> {
  return firebaseAuth?.currentUser ? firebaseAuth.currentUser.getIdToken() : null;
}
