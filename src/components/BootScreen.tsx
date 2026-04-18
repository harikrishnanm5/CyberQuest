import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Terminal as TerminalIcon, Cpu, Zap } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

const bootLogs = [
  "[ OK ] Mounting security partitions...",
  "[ OK ] Loading AES-256 encryption modules...",
  "[ OK ] Initializing AI Threat Registry...",
  "[ OK ] Establishing encrypted satellite link...",
  "[ WARN ] Unauthorized access attempt blocked at 192.168.1.45",
  "[ OK ] Starting SOC Desktop Environment...",
  "[ OK ] Neural sync established.",
  "READY FOR OPERATOR DEPLOYMENT."
];

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing CipherOS Kernel...');

  useEffect(() => {
    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        setLogs(prev => [...prev, bootLogs[currentLogIndex]]);
        currentLogIndex++;
        setProgress((currentLogIndex / bootLogs.length) * 100);
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          setStatus('CIPHER-OS ACTIVE');
          setTimeout(onComplete, 1000);
        }, 500);
      }
    }, 400);

    return () => clearInterval(logInterval);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-8 font-mono overflow-hidden"
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(29,158,117,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(29,158,117,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="max-w-2xl w-full space-y-8 relative">
        {/* Header Area */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="p-4 rounded-full border border-accent/30 bg-accent/5"
          >
            <Shield className="text-accent" size={48} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
              Cipher<span className="text-accent underline decoration-2 underline-offset-4">OS</span>
            </h1>
            <p className="text-xs text-accent font-bold tracking-[0.3em] uppercase opacity-60">Strategic Operations Command</p>
          </div>
        </div>

        {/* Boot Logs */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-6 h-64 flex flex-col gap-2 overflow-hidden shadow-2xl backdrop-blur-md">
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs flex gap-3 text-gray-400"
            >
              <span className="text-accent/50">[{new Date().toLocaleTimeString()}]</span>
              <span className={(log || '').includes('WARN') ? 'text-threat' : 'text-gray-300'}>{log}</span>
            </motion.div>
          ))}
          {logs.length < bootLogs.length && (
            <div className="flex items-center gap-2 text-accent mt-2">
              <span className="animate-pulse">_</span>
            </div>
          )}
        </div>

        {/* Status & Progress */}
        <div className="space-y-4">
          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
            <span className="text-white flex items-center gap-2">
              <Cpu size={12} className="text-accent animate-pulse" />
              {status}
            </span>
            <span className="text-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-accent shadow-[0_0_10px_#1D9E75]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Tech Accents */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="flex flex-col gap-1 items-center">
            <Lock size={14} className="text-accent/40" />
            <span className="text-[8px] text-gray-500 uppercase">Secure Link</span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Zap size={14} className="text-accent/40" />
            <span className="text-[8px] text-gray-500 uppercase">Power Sync</span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <TerminalIcon size={14} className="text-accent/40" />
            <span className="text-[8px] text-gray-500 uppercase">AI Init</span>
          </div>
        </div>
      </div>

      {/* Retro scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
    </motion.div>
  );
};
