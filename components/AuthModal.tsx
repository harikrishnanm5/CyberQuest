import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Github, Terminal, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, loginWithGoogle, loginWithGithub, error, clearError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [strength, setStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setUsername('');
    setStrength(0);
    setLocalError(null);
    clearError();
  }, [isLogin, isOpen]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 5) score++;
    if (pass.length > 9) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(calculateStrength(val));
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Invalid email format');
      return false;
    }
    if (!password) {
      setLocalError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    if (!isLogin && !username.trim()) {
      setLocalError('Username is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, username);
      }
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await loginWithGithub();
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = (s: number) => {
    if (s === 0) return 'bg-gray-700';
    if (s <= 1) return 'bg-red-500';
    if (s === 2) return 'bg-yellow-500';
    if (s === 3) return 'bg-blue-400';
    return 'bg-green-500';
  };

  const getStrengthLabel = (s: number) => {
    if (s === 0) return '';
    if (s <= 1) return 'WEAK';
    if (s === 2) return 'MODERATE';
    if (s === 3) return 'STRONG';
    return 'UNBREAKABLE';
  };

  const displayError = localError || error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/80 dark:bg-cyber-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-cyber-dark border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,255,157,0.15)] p-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyber-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 mb-4 text-cyber-primary border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-[0_0_15px_rgba(0,255,157,0.2)]">
            <Terminal size={24} />
          </div>
          <h2 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mb-2 tracking-tight">
            {isLogin ? 'SYSTEM ACCESS' : 'NEW REGISTRATION'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Enter credentials to access the mainframe.' : 'Initialize your hacker profile.'}
          </p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-cyber-primary ml-1">USERNAME</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-secondary transition-colors" size={16} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-all placeholder-gray-400 dark:placeholder-gray-700"
                  placeholder="Enter username"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-cyber-primary ml-1">EMAIL_ADDRESS</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-secondary transition-colors" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-all placeholder-gray-400 dark:placeholder-gray-700"
                placeholder="name@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-cyber-primary ml-1">PASSPHRASE</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-secondary transition-colors" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={handlePasswordChange}
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-all placeholder-gray-400 dark:placeholder-gray-700"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
            
            {!isLogin && password && (
              <div className="pt-2 px-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">STRENGTH_ANALYSIS</span>
                  <span className={`text-[10px] font-bold font-mono transition-colors duration-300 ${
                    strength <= 1 ? 'text-red-500' : 
                    strength === 2 ? 'text-yellow-500' : 
                    strength === 3 ? 'text-blue-400' : 'text-green-500'
                  }`}>
                    {getStrengthLabel(strength)}
                  </span>
                </div>
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        level <= strength ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button className="w-full mt-6" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {isLogin ? 'AUTHENTICATING...' : 'INITIALIZING...'}
              </span>
            ) : (
              isLogin ? 'AUTHENTICATE' : 'INITIALIZE'
            )}
          </Button>

          {isLogin && (
            <div className="mt-4 text-center">
              <button type="button" className="text-xs font-mono text-gray-500 hover:text-cyber-primary transition-colors hover:underline">
                FORGOT_PASSWORD?
              </button>
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-cyber-dark px-2 text-gray-500 font-mono">OR CONNECT WITH</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={handleGithubLogin}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-white transition-all hover:border-gray-300 dark:hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github size={16} /> GitHub
            </button>
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-white transition-all hover:border-gray-300 dark:hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-bold text-lg leading-none">G</span> Google
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 font-mono">
            {isLogin ? "NO_ID_FOUND? " : "ALREADY_REGISTERED? "}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
              className="text-cyber-secondary hover:text-cyber-primary hover:underline transition-colors disabled:opacity-50"
            >
              {isLogin ? 'CREATE_ACCOUNT' : 'LOG_IN'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
