import React from 'react';
import { Activity, Terminal, Shield, Cpu, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'command' | 'security' | 'system' | 'ai';
  message: string;
  details?: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: '1', timestamp: '12:00:01', type: 'system', message: 'CipherOS v4.2.0 kernel initialized.' },
  { id: '2', timestamp: '12:00:05', type: 'ai', message: 'Neural Sync Established with AXIOM Intelligence.' },
  { id: '3', timestamp: '12:05:22', type: 'security', message: 'Inbound SSH connection authorized from 192.168.56.101.' },
  { id: '4', timestamp: '12:10:45', type: 'command', message: 'nmap -sV 10.0.0.1 executed by operator.', details: 'Results: 3 ports open.' },
  { id: '5', timestamp: '12:15:10', type: 'security', message: 'Heuristic analysis detected suspicious packet sequence on Node 4.' },
];

export const SystemLogs: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl overflow-hidden font-mono">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Audit Logs</h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">Real-time System Telemetry</p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded">
             <Activity size={12} className="text-accent" />
             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Live Feed</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
        {INITIAL_LOGS.map((log) => (
          <div key={log.id} className="flex gap-6 group">
            <div className="flex flex-col items-center">
              <div className="w-1 h-full bg-white/5 group-last:bg-transparent relative">
                <div className={cn(
                  "absolute top-0 -left-[5px] w-3 h-3 rounded-full border-2 border-bg",
                  log.type === 'security' ? "bg-red-500" : 
                  log.type === 'ai' ? "bg-[#00ffff]" : 
                  log.type === 'command' ? "bg-accent" : "bg-gray-500"
                )} />
              </div>
            </div>
            
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-gray-600">{log.timestamp}</span>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                  log.type === 'security' ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                  log.type === 'ai' ? "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/20" : 
                  log.type === 'command' ? "bg-accent/10 text-accent border border-accent/20" : 
                  "bg-white/5 text-gray-500 border border-white/10"
                )}>
                  {log.type}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-200">{log.message}</div>
              {log.details && (
                <div className="mt-2 text-[11px] text-gray-500 italic bg-white/[0.02] p-2 rounded border border-white/5">
                   {log.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-8">
         <div className="flex items-center gap-2">
           <Terminal size={14} className="text-accent" />
           <span className="text-[10px] font-bold text-gray-400 uppercase">CLI Events: <span className="text-white">142</span></span>
         </div>
         <div className="flex items-center gap-2">
           <Shield size={14} className="text-red-500" />
           <span className="text-[10px] font-bold text-gray-400 uppercase">Sec Violations: <span className="text-white">0</span></span>
         </div>
         <div className="flex items-center gap-2">
           <Cpu size={14} className="text-[#00ffff]" />
           <span className="text-[10px] font-bold text-gray-400 uppercase">AI Processing: <span className="text-white">Optimal</span></span>
         </div>
      </div>
    </div>
  );
};
