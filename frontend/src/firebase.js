/**
 * Firebase client SDK initialization.
 *
 * Config is read from Vite env vars (VITE_FIREBASE_*).
 * DO NOT hardcode these — they're restricted to your domain in Google Cloud Console.
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Fill in VITE_FIREBASE_* values
 * 3. NEVER commit .env to git
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app = null;
let auth = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.error('Firebase init failed:', e);
  }
}

export { app, auth, isConfigured };
export const googleProvider = new GoogleAuthProvider();

/**
 * Get a Firebase ID token (or dev-mode token) for backend authentication.
 *
 * If we're in dev mode (no backend service account) we ALWAYS return dev tokens,
 * even if Firebase is configured — this prevents the broken "real Firebase auth
 * with no backend verifier" state.
 */
export async function getIdToken() {
  // Always prefer dev mode token if backend is in dev mode
  // (detected by checking a localStorage flag set at login)
  const forceDev = localStorage.getItem('cipherops_force_dev') === 'true';

  if (forceDev || !auth || !auth.currentUser) {
    let devUser = localStorage.getItem('cipherops_dev_user');
    if (!devUser) {
      devUser = 'dev_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('cipherops_dev_user', devUser);
    }
    return 'dev:' + devUser;
  }
  return await auth.currentUser.getIdToken();
}

export async function signInDev() {
  // Always force dev mode for this login flow
  localStorage.setItem('cipherops_force_dev', 'true');

  let devUser = localStorage.getItem('cipherops_dev_user');
  if (!devUser) {
    devUser = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('cipherops_dev_user', devUser);
  }
  return { uid: devUser, email: `${devUser}@dev.local`, name: devUser, isDev: true };
}

export async function signInWithGoogle() {
  localStorage.removeItem('cipherops_force_dev');
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
