import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCV-8kFcoKyH0Et3LnWMNT4eQubV-dcAYc",
  authDomain: "cyberquest-6fe82.firebaseapp.com",
  projectId: "cyberquest-6fe82",
  storageBucket: "cyberquest-6fe82.firebasestorage.app",
  messagingSenderId: "131360866961",
  appId: "1:131360866961:web:fab2ce86078001a98d7530"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
