/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLearnerProfile, Domain } from '../store/learnerProfile';
import { cn } from '@/src/lib/utils';

interface DomainCard {
  id: Domain;
  title: string;
  description: string;
}

const DOMAINS: DomainCard[] = [
  {
    id: 'web',
    title: 'Web Security',
    description: 'SQL injection, XSS, auth bypass',
  },
  {
    id: 'network',
    title: 'Network Defence',
    description: 'Packet analysis, MITM, firewall rules',
  },
  {
    id: 'malware',
    title: 'Malware Analysis',
    description: 'Reverse engineering, IOCs, sandboxing',
  },
  {
    id: 'social_engineering',
    title: 'Social Engineering',
    description: 'Phishing, pretexting, OSINT',
  },
];

interface DomainSelectionProps {
  onComplete: () => void;
}

const DomainSelection: React.FC<DomainSelectionProps> = ({ onComplete }) => {
  const { dispatch } = useLearnerProfile();
  const [lockedIn, setLockedIn] = useState<string | null>(null);

  const handleSelect = async (domainId: Domain) => {
    if (lockedIn) return;

    // 1. Dispatch SET_DOMAIN
    dispatch({ type: 'SET_DOMAIN', payload: domainId });

    // 2. Set internal state for animation
    setLockedIn(domainId);

    // 3. Play animation (simulated by delay) then call onComplete
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full font-mono relative overflow-hidden">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4 italic">
          SELECT YOUR DOMAIN
        </h1>
        <p className="text-accent text-sm italic font-bold">
          "Every operative has a specialty. What's yours?" — AXIOM
        </p>
      </motion.div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10">
        {DOMAINS.map((domain) => (
          <motion.button
            key={domain.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleSelect(domain.id!)}
            disabled={!!lockedIn}
            className={cn(
              "p-8 bg-black/40 border border-white/10 rounded-2xl text-left transition-all relative group overflow-hidden",
              lockedIn === domain.id 
                ? "border-accent shadow-[0_0_30px_rgba(0,255,157,0.2)] bg-accent/5" 
                : "hover:border-accent/40 hover:shadow-[0_0_20px_rgba(0,255,157,0.1)]"
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-black text-white uppercase tracking-wide group-hover:text-accent transition-colors">
                  {domain.title}
                </span>
                {lockedIn === domain.id && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] bg-accent text-black px-2 py-0.5 font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(0,255,157,0.4)]"
                  >
                    Locked
                  </motion.span>
                )}
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed group-hover:text-gray-400 transition-colors uppercase tracking-wider">
                {domain.description}
              </p>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Terminal Flash on Selection */}
            {lockedIn === domain.id && (
              <motion.div
                initial={{ opacity: 0, x: '-100%' }}
                animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 bg-accent/20 pointer-events-none"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Terminal Lock Animation Overlay */}
      <AnimatePresence>
        {lockedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/90 backdrop-blur-md border-y border-accent w-full py-8 flex items-center justify-center shadow-[0_0_100px_rgba(0,255,157,0.1)]">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-2xl font-black text-accent tracking-[0.5em] uppercase italic">
                  DOMAIN LOCKED IN
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="w-2 h-2 bg-accent rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DomainSelection;
