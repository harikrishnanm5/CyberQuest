import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Terminal, Mail, Network, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface TaskbarProps {
  activeTab: 'terminal' | 'mail' | 'network' | 'logs';
  onTabChange: (tab: 'terminal' | 'mail' | 'network' | 'logs') => void;
}

import { KaliMenu } from './KaliMenu';

interface TaskbarProps {
  activeTab: 'terminal' | 'mail' | 'network' | 'logs';
  onTabChange: (tab: 'terminal' | 'mail' | 'network' | 'logs') => void;
  onLaunchTool: (cmd: string) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ activeTab, onTabChange, onLaunchTool }) => {
  const [time, setTime] = useState(new Date());
  const [isKaliMenuOpen, setIsKaliMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-10 bg-taskbar border-b border-white/5 flex items-center px-4 justify-between select-none z-[100] relative">
      <div className="flex items-center gap-6">
        {/* Kali Logo & Hostname */}
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setIsKaliMenuOpen(!isKaliMenuOpen)}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              isKaliMenuOpen ? "bg-accent shadow-[0_0_20px_rgba(29,158,117,0.5)]" : "bg-accent/20 hover:bg-accent/40"
            )}
          >
            <Cpu className={cn("w-4 h-4", isKaliMenuOpen ? "text-taskbar" : "text-accent")} strokeWidth={3} />
          </button>
          
          <AnimatePresence>
            {isKaliMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setIsKaliMenuOpen(false)} 
                />
                <KaliMenu 
                  onLaunch={onLaunchTool} 
                  onClose={() => setIsKaliMenuOpen(false)} 
                />
              </>
            )}
          </AnimatePresence>

          <span className="text-[10px] font-black text-accent tracking-[0.2em] uppercase">
            user@soc
          </span>
        </div>

        {/* App Pills */}
        <nav className="flex items-center gap-1 ml-4">
          <AppPill 
            icon={<Terminal size={14} />} 
            label="Terminal" 
            active={activeTab === 'terminal'} 
            onClick={() => onTabChange('terminal')} 
          />
          <AppPill 
            icon={<Mail size={14} />} 
            label="Mail" 
            active={activeTab === 'mail'} 
            onClick={() => onTabChange('mail')} 
          />
          <AppPill 
            icon={<Network size={14} />} 
            label="Network" 
            active={activeTab === 'network'} 
            onClick={() => onTabChange('network')} 
          />
          <AppPill 
            icon={<Activity size={14} />} 
            label="Logs" 
            active={activeTab === 'logs'} 
            onClick={() => onTabChange('logs')} 
          />
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Threat Badge */}
        <div className="flex items-center gap-2 bg-threat/10 px-2 py-0.5 rounded border border-threat/20 animate-pulse">
          <ShieldAlert size={14} className="text-threat" />
          <span className="text-[10px] font-bold text-threat tracking-tighter uppercase whitespace-nowrap">
            Threat Active
          </span>
        </div>

        {/* System Clock */}
        <div className="text-[11px] font-mono text-gray-400 tabular-nums">
          {format(time, "HH:mm:ss 'UTC'")}
        </div>
      </div>
    </header>
  );
};

interface AppPillProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const AppPill: React.FC<AppPillProps> = ({ icon, label, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded transition-all cursor-pointer",
        active 
          ? "bg-accent/10 text-accent border border-accent/20" 
          : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
      )}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-accent" />}
    </div>
  );
};
