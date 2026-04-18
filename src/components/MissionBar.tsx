import React from 'react';
import { motion } from 'motion/react';
import { Target } from 'lucide-react';

interface MissionBarProps {
  domain?: string;
}

export const MissionBar: React.FC<MissionBarProps> = ({ domain = "Phishing Forensics" }) => {
  return (
    <div className="h-10 bg-white/[0.02] border-b border-white/5 flex items-center px-4 justify-between select-none">
      <div className="flex items-center gap-3">
        <Target size={14} className="text-accent" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
          Mission 01 — <span className="text-accent">{domain}</span>
        </span>
      </div>
      
      <div className="flex gap-1.5 items-center">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mr-2">Objective Progress</span>
        {[1, 2, 3, 4, 5].map((dot, i) => (
          <motion.div 
            key={dot}
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{ 
              scale: i === 0 ? 1 : 0.8, 
              opacity: i === 0 ? 1 : 0.3,
              backgroundColor: i === 0 ? '#1D9E75' : 'rgba(255,255,255,0.1)'
            }}
            className="w-2 h-2 rounded-full shadow-[0_0_5px_rgba(29,158,117,0.5)]"
          />
        ))}
      </div>
    </div>
  );
};
