/**
 * Firebase client SDK initialization.
 *
 * SETUP:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Email/Password + Google provider)
 * 3. Copy your web app config below
 * 4. In dev, if config is missing, the app falls back to "dev mode"
 *    (uses a local pseudo-user so the rest of the app still works)
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isConfigured = !!firebaseConfig.apiKey;

let app = null;
let auth = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { app, auth, isConfigured };
export const googleProvider = new GoogleAuthProvider();

/**
 * Get a Firebase ID token (or dev-mode token) for backend authentication.
 * The token is sent in the Authorization header to FastAPI.
 */
export async function getIdToken() {
  if (!auth || !auth.currentUser) {
    // Dev mode — return a pseudo-token
    let devUser = localStorage.getItem('cipherops_dev_user');
    if (!devUser) {
      devUser = 'dev_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('cipherops_dev_user', devUser);
    }
    return 'dev:' + devUser;
  }
  return await auth.currentUser.getIdToken();
}

/**
 * Sign in (or auto-create dev user).
 */
export async function signInDev() {
  if (!isConfigured) {
    let devUser = localStorage.getItem('cipherops_dev_user');
    if (!devUser) {
      devUser = 'dev_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('cipherops_dev_user', devUser);
    }
    return { uid: devUser, email: `${devUser}@dev.local`, name: devUser, isDev: true };
  }
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || auth.currentUser.email,
      isDev: false,
    };
  }
  // Real Firebase sign-in
  const result = await signInAnonymously(auth);
  return {
    uid: result.user.uid,
    email: result.user.email,
    name: result.user.displayName || 'Anonymous',
    isDev: false,
  };
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return {
    uid: result.user.uid,
    email: result.user.email,
    name: result.user.displayName,
    isDev: false,
  };
}

export async function signOutUser() {
  if (auth) await auth.signOut();
  localStorage.removeItem('cipherops_dev_user');
  localStorage.removeItem('cipherops_user_id');
}