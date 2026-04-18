import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Terminal, Mail, Network, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Taskbar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-10 bg-taskbar border-b border-white/5 flex items-center px-4 justify-between select-none z-50">
      <div className="flex items-center gap-6">
        {/* OS Logo & Hostname */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center p-1 shadow-[0_0_10px_rgba(29,158,117,0.3)]">
            <Cpu className="text-taskbar w-3 h-3" strokeWidth={3} />
          </div>
          <span className="text-xs font-bold text-accent tracking-widest uppercase">
            user@soc-workstation
          </span>
        </div>

        {/* App Pills */}
        <nav className="flex items-center gap-1 ml-4">
          <AppPill icon={<Terminal size={14} />} label="Terminal" active />
          <AppPill icon={<Mail size={14} />} label="Mail" />
          <AppPill icon={<Network size={14} />} label="Network" />
          <AppPill icon={<Activity size={14} />} label="Logs" />
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
}

const AppPill: React.FC<AppPillProps> = ({ icon, label, active }) => {
  return (
    <div
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
