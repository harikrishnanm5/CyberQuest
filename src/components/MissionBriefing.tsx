/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MissionBriefingProps {
  missionNumber: number;
  targetOrgType: string;
  attackVector: string;
  objective: string;
  timeLimit: string;
  onAccept: () => void;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({
  missionNumber,
  targetOrgType,
  attackVector,
  objective,
  timeLimit,
  onAccept,
}) => {
  const headerText = `MISSION ${missionNumber} — INCOMING TRANSMISSION`;
  
  // Variants for staggered reveal of data rows
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4, // 400ms stagger
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="fixed inset-0 bg-[#050608] z-[100] flex flex-col items-center justify-center font-mono selection:bg-accent/30 p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-px h-full bg-white/5" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-white/5" />
        <div className="scanline" />
      </div>

      {/* AXIOM Avatar - Top Left */}
      <div className="absolute top-12 left-12 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-accent/40 flex items-center justify-center bg-accent/5 shadow-[0_0_30px_rgba(0,255,157,0.1)]">
          <span className="text-xl font-black text-accent tracking-tighter">AX</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Axiom Intelligence</span>
          <span className="text-[8px] font-bold text-accent uppercase opacity-50">Handshake Verified</span>
        </div>
      </div>

      {/* Threat Active Badge - Top Right */}
      <div className="absolute top-12 right-12">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-500"
        >
          <ShieldAlert size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Threat Active</span>
        </motion.div>
      </div>

      {/* Center Mission Card */}
      <div className="max-w-3xl w-full space-y-12 relative z-10">
        {/* Header with Typewriter Effect */}
        <div className="border-b border-white/5 pb-6">
          <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase flex flex-wrap">
            {headerText.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0 }} // 40ms per char
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 ml-1 bg-accent h-[1em] align-middle"
            />
          </h1>
        </div>

        {/* Data Rows */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <DataRow label="TARGET" value={targetOrgType} variants={itemVariants} />
          <DataRow label="VECTOR" value={attackVector} variants={itemVariants} />
          <DataRow label="OBJECTIVE" value={objective} variants={itemVariants} />
          <DataRow label="TIME LIMIT" value={timeLimit} variants={itemVariants} />
        </motion.div>

        {/* Accept Button - Appears after rows */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5 }} // Revealed after rows (4 * 0.4s + buffer)
          className="pt-12"
        >
          <button
            onClick={onAccept}
            className="group relative px-12 py-5 bg-transparent border-2 border-white/20 hover:border-accent hover:bg-accent/5 transition-all active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-white/10 group-hover:bg-accent/50 transition-colors" />
            <span className="text-sm font-black text-white hover:text-accent uppercase tracking-[0.4em] inline-flex items-center gap-2">
              {'>'} [ACCEPT MISSION]
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string; variants: any }> = ({ label, value, variants }) => (
  <motion.div variants={variants} className="flex gap-4 items-baseline">
    <span className="w-32 text-accent font-black text-xs uppercase tracking-widest shrink-0">{label}:</span>
    <span className="text-white text-lg font-bold tracking-tight uppercase border-l border-white/10 pl-4">{value}</span>
  </motion.div>
);

export default MissionBriefing;
