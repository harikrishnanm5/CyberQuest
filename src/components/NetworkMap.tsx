import React from 'react';
import { motion } from 'motion/react';
import { Globe, Server, Shield, Database, Wifi, Zap, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Node {
  id: string;
  ip: string;
  type: 'server' | 'database' | 'firewall' | 'gateway' | 'target';
  status: 'active' | 'compromised' | 'locked';
  label: string;
  x: number;
  y: number;
}

const NODES: Node[] = [
  { id: '1', ip: '192.168.56.1', type: 'gateway', status: 'active', label: 'Local Gateway', x: 10, y: 50 },
  { id: '2', ip: '192.168.56.101', type: 'target', status: 'active', label: 'Kali VM', x: 30, y: 30 },
  { id: '3', ip: '10.0.0.5', type: 'server', status: 'locked', label: 'Auth Server', x: 50, y: 20 },
  { id: '4', ip: '10.0.0.12', type: 'database', status: 'locked', label: 'User Data', x: 70, y: 40 },
  { id: '5', ip: '10.0.0.1', type: 'firewall', status: 'active', label: 'Main Firewall', x: 50, y: 60 },
];

export const NetworkMap: React.FC = () => {
  return (
    <div className="flex-1 bg-black/40 backdrop-blur-xl relative overflow-hidden font-mono p-8">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(29,158,117,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(29,158,117,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Discovered Network Topology</h2>
            <p className="text-xs text-accent font-bold tracking-[0.2em] opacity-60">Scanning Subnets: 192.168.56.x, 10.0.0.x</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[9px] font-black text-gray-400 uppercase">Secure</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black text-red-400 uppercase">Suspected Threat</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative border border-white/5 bg-black/20 rounded-xl">
          {/* Connections (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <line x1="10%" y1="50%" x2="30%" y2="30%" stroke="rgba(29, 158, 117, 0.2)" strokeWidth="1" strokeDasharray="4" />
             <line x1="30%" y1="30%" x2="50%" y2="60%" stroke="rgba(29, 158, 117, 0.2)" strokeWidth="1" strokeDasharray="4" />
             <line x1="50%" y1="60%" x2="50%" y2="20%" stroke="rgba(29, 158, 117, 0.1)" strokeWidth="1" strokeDasharray="4" />
             <line x1="50%" y1="20%" x2="70%" y2="40%" stroke="rgba(29, 158, 117, 0.1)" strokeWidth="1" strokeDasharray="4" />
          </svg>

          {NODES.map((node) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-crosshair"
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center border transition-all shadow-2xl relative z-10",
                node.status === 'active' ? "bg-accent/10 border-accent/40 text-accent group-hover:bg-accent/20" : "bg-white/5 border-white/10 text-gray-500"
              )}>
                {node.type === 'gateway' && <Wifi size={24} />}
                {node.type === 'target' && <Zap size={24} />}
                {node.type === 'server' && <Server size={24} />}
                {node.type === 'database' && <Database size={24} />}
                {node.type === 'firewall' && <Shield size={24} />}
                
                {node.status === 'locked' && (
                  <div className="absolute -top-1 -right-1 bg-black rounded-full p-1 border border-white/10">
                    <Lock size={8} className="text-gray-500" />
                  </div>
                )}
              </div>

              {/* Node Info Card (Hover) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-black/90 border border-white/10 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-xl">
                 <div className="text-[10px] font-black text-white uppercase mb-1">{node.label}</div>
                 <div className="text-[9px] font-bold text-accent mb-2">{node.ip}</div>
                 <div className="h-px bg-white/5 mb-2" />
                 <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                   <span>Type</span>
                   <span className="text-gray-300">{node.type}</span>
                 </div>
                 <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 mt-1">
                   <span>Status</span>
                   <span className={cn(node.status === 'active' ? "text-accent" : "text-gray-600")}>{node.status}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4">
           <div className="bg-white/5 p-4 rounded-lg border border-white/5">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Nodes</div>
             <div className="text-xl font-black text-white">{NODES.length}</div>
           </div>
           <div className="bg-white/5 p-4 rounded-lg border border-white/5">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Compromised</div>
             <div className="text-xl font-black text-red-500">0</div>
           </div>
           <div className="bg-white/5 p-4 rounded-lg border border-white/5">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Encrypted Tunnels</div>
             <div className="text-xl font-black text-accent">2</div>
           </div>
           <div className="bg-white/5 p-4 rounded-lg border border-white/5">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Uptime</div>
             <div className="text-xl font-black text-white italic">99.99%</div>
           </div>
        </div>
      </div>
    </div>
  );
};
