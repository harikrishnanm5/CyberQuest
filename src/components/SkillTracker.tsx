import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Skill {
  name: string;
  progress: number;
  xp: string;
  color: string;
}

const skills: Skill[] = [
  { name: "Phishing analysis", progress: 65, xp: "+1,240 XP", color: "bg-accent" },
  { name: "Header forensics", progress: 42, xp: "+820 XP", color: "bg-blue-500" },
  { name: "CVE identification", progress: 88, xp: "+3,100 XP", color: "bg-orange-500" },
];

interface SkillTrackerProps {
  level?: string;
}

export const SkillTracker: React.FC<SkillTrackerProps> = ({ level = "Tier 2 Candidate" }) => {
  return (
    <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Analyst Proficiency</h3>
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
          <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
          <span className="text-[8px] font-black text-accent uppercase">
            {level === 'ROOKIE' ? 'Tier 1 Rookie' : level === 'SPECIALIST' ? 'Tier 3 Specialist' : 'Tier 2 Analyst'}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight leading-none mb-1">{skill.name}</span>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest leading-none">Sub-Module 0{skills.indexOf(skill) + 1}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("text-[9px] font-black font-mono leading-none mb-1", skill.color.replace('bg-', 'text-'))}>{skill.progress}%</span>
                <span className="text-[8px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-black text-gray-400 tabular-nums">{skill.xp}</span>
              </div>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${skill.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", skill.color)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
