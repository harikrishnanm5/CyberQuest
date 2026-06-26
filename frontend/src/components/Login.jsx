import React, { useState } from 'react';
import { Shield, Lock, LogIn, AlertCircle, ChevronRight, Fingerprint } from 'lucide-react';
import { signInDev, signInWithGoogle, isConfigured } from '../firebase';
import { apiGet } from '../api';

const Login = ({ onLoggedIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bootSequence, setBootSequence] = useState([]);

  const appendBootLine = (line) => {
    setBootSequence(prev => [...prev.slice(-5), line]);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    setBootSequence([]);
    appendBootLine('> Generating ephemeral identity...');
    try {
      await new Promise(r => setTimeout(r, 300));
      const user = await signInDev();
      appendBootLine(`> Identity: ${user.uid}`);
      await new Promise(r => setTimeout(r, 200));
      appendBootLine('> Authenticating with CipherOps mainframe...');
      const profile = await apiGet('/api/user/me');
      appendBootLine(`> Rank verified: ${profile.tier || 'Recruit'}`);
      await new Promise(r => setTimeout(r, 300));
      onLoggedIn({ ...user, profile });
    } catch (e) {
      setError(e.message);
      appendBootLine(`> ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setBootSequence([]);
    appendBootLine('> Opening Google OAuth...');
    try {
      const user = await signInWithGoogle();
      appendBootLine(`> Identity: ${user.email}`);
      const profile = await apiGet('/api/user/me');
      appendBootLine(`> Rank verified: ${profile.tier || 'Recruit'}`);
      onLoggedIn({ ...user, profile });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-cipher-bg font-mono relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(233,69,96,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(233,69,96,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}></div>

      {/* Radial glow */}
      <div className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(233,69,96,0.15) 0%, transparent 60%)',
        }}></div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)',
        }}></div>

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Main card */}
        <div className="bg-black/80 border-2 border-cipher-accent rounded-lg shadow-[0_0_60px_rgba(233,69,96,0.4)] backdrop-blur-sm overflow-hidden">

          {/* Header bar */}
          <div className="bg-gradient-to-r from-cipher-accent to-red-800 px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <Shield size={14} />
              <span>CIPHER_OPS // SECURE_AUTH_v3.1</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/80"></div>
              <div className="w-2 h-2 rounded-full bg-white/60"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
            </div>
          </div>

          <div className="p-8">
            {/* Logo block */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cipher-accent blur-2xl opacity-50"></div>
                <div className="relative w-20 h-20 border-2 border-cipher-accent rounded-lg flex items-center justify-center bg-black shadow-[0_0_30px_rgba(233,69,96,0.6)]">
                  <Lock className="text-cipher-accent" size={36} />
                </div>
              </div>
              <h1 className="text-3xl text-cipher-accent font-black tracking-[0.3em] mt-4">
                CIPHER_OPS
              </h1>
              <div className="text-[10px] text-gray-500 tracking-widest mt-1">
                CYBER OPERATIONS PLATFORM
              </div>
            </div>

            {/* Status line */}
            <div className="border-l-2 border-cipher-green bg-cipher-green/5 px-3 py-2 mb-6 text-xs">
              <div className="text-cipher-green font-bold mb-1">SYSTEM_STATUS: ONLINE</div>
              <div className="text-gray-400">
                Authentication required. Choose your ingress method.
              </div>
            </div>

            {/* Warning banner if no Firebase */}
            {!isConfigured && (
              <div className="border-l-2 border-yellow-500 bg-yellow-500/10 px-3 py-2 mb-4 text-xs text-yellow-300 flex gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold">DEV_MODE_ACTIVE</div>
                  <div className="text-yellow-300/70">
                    Firebase not configured. Using ephemeral identity.
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="border-l-2 border-red-500 bg-red-500/10 px-3 py-2 mb-4 text-xs text-red-400">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> AUTH_FAILURE
                </div>
                <div className="text-red-400/80 mt-1 break-words">{error}</div>
              </div>
            )}

            {/* Boot sequence display */}
            {bootSequence.length > 0 && (
              <div className="bg-black border border-cipher-green/30 rounded px-3 py-2 mb-4 text-[10px] text-cipher-green font-mono">
                {bootSequence.map((line, i) => (
                  <div key={i} className="opacity-80">{line}</div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading || !isConfigured}
                className="group w-full bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 px-5 py-3 rounded font-bold transition-all flex items-center justify-between border border-gray-300"
              >
                <span className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  GOOGLE_AUTH
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="group w-full bg-cipher-accent hover:bg-red-600 disabled:bg-gray-700 text-white px-5 py-3 rounded font-bold transition-all flex items-center justify-between shadow-[0_0_20px_rgba(233,69,96,0.4)]"
              >
                <span className="flex items-center gap-3">
                  <Fingerprint size={18} />
                  {loading ? 'AUTHENTICATING...' : (isConfigured ? 'ANONYMOUS_INFILTRATION' : 'DEV_MODE_INGRESS')}
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Footer info */}
            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between text-[10px] text-gray-500">
              <span>NODE: cipherops-prod-01</span>
              <span>UPLINK: ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Bottom warning */}
        <div className="mt-4 text-center text-[10px] text-gray-600">
          UNAUTHORIZED ACCESS IS LOGGED AND PROSECUTED
        </div>
      </div>
    </div>
  );
};

export default Login;
