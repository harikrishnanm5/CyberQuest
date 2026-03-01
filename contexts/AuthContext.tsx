import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../services/firebase';
import { createUserDocument } from '../services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw err;
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<void> => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, { displayName: username });
      await createUserDocument(result.user.uid, email, username);
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError('Failed to log out');
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      // Create user document but don't fail login if Firestore write fails
      try {
        await createUserDocument(
          result.user.uid,
          result.user.email || '',
          result.user.displayName || 'Agent'
        );
      } catch (docErr) {
        console.warn('Could not create user document (Firestore rules may need updating):', docErr);
      }
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw err;
    }
  };

  const loginWithGithub = async (): Promise<void> => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, githubProvider);
      // Create user document but don't fail login if Firestore write fails
      try {
        await createUserDocument(
          result.user.uid,
          result.user.email || '',
          result.user.displayName || 'Agent'
        );
      } catch (docErr) {
        console.warn('Could not create user document (Firestore rules may need updating):', docErr);
      }
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGithub,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'An error occurred. Please try again.';
  }
}
