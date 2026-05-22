import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Terminal, Globe, Shield, Zap, Search as SearchIcon, Database, Lock, Cpu, Activity, Briefcase } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Tool {
  name: string;
  exec: string;
  category: string;
}

const CATEGORIES = [
  { id: 'recon', name: '01 - Reconnaissance', icon: <SearchIcon size={14} />, tools: ['nmap', 'dnsenum', 'theHarvester', 'amass'] },
  { id: 'vuln', name: '02 - Vulnerability Analysis', icon: <Shield size={14} />, tools: ['nikto', 'unix-privesc-check', 'legion'] },
  { id: 'web', name: '03 - Web Application Analysis', icon: <Globe size={14} />, tools: ['burpsuite', 'sqlmap', 'commix', 'wpscan'] },
  { id: 'db', name: '04 - Database Assessment', icon: <Database size={14} />, tools: ['sqlmap', 'sqlitebrowser'] },
  { id: 'pass', name: '05 - Password Attacks', icon: <Lock size={14} />, tools: ['john', 'hashcat', 'hydra', 'medusa'] },
  { id: 'wireless', name: '06 - Wireless Attacks', icon: <Zap size={14} />, tools: ['aircrack-ng', 'wifite', 'kismet'] },
  { id: 'reverse', name: '07 - Reverse Engineering', icon: <Cpu size={14} />, tools: ['ghidra', 'radare2', 'gdb'] },
  { id: 'exploit', name: '08 - Exploitation Tools', icon: <Briefcase size={14} />, tools: ['msfconsole', 'searchsploit', 'social-engineering-toolkit'] },
  { id: 'sniff', name: '09 - Sniffing & Spoofing', icon: <Activity size={14} />, tools: ['wireshark', 'bettercap', 'ettercap'] },
  { id: 'post', name: '10 - Post Exploitation', icon: <Terminal size={14} />, tools: ['powersploit', 'mimikatz'] },
];

interface KaliMenuProps {
  onLaunch: (command: string) => void;
  onClose: () => void;
}

export const KaliMenu: React.FC<KaliMenuProps> = ({ onLaunch, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    tools: cat.tools.filter(t => t.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.tools.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-12 left-4 w-[500px] h-[600px] bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-[100] font-mono"
    >
      {/* Header / Search */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent transition-colors" size={16} />
          <input
            autoFocus
            type="text"
            placeholder="Search Kali tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent/40 transition-all placeholder:text-gray-700"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-56 border-r border-white/5 overflow-y-auto custom-scrollbar bg-black/20">
          <div className="p-3">
             <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4 px-3">Categories</div>
             {filteredCategories.map(cat => (
               <button
                 key={cat.id}
                 onMouseEnter={() => setActiveCategory(cat.id)}
                 className={cn(
                   "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-0.5",
                   activeCategory === cat.id ? "bg-accent/10 text-accent border border-accent/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                 )}
               >
                 {cat.icon}
                 <span className="text-[10px] font-bold truncate">{cat.name.split(' - ')[1]}</span>
                 {activeCategory === cat.id && <ChevronRight size={12} className="ml-auto opacity-50" />}
               </button>
             ))}
          </div>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4 px-3">
            {CATEGORIES.find(c => c.id === activeCategory)?.name || 'Applications'}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {filteredCategories.find(c => c.id === activeCategory)?.tools.map(tool => (
              <button
                key={tool}
                onClick={() => {
                  onLaunch(tool);
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent/5 hover:border-accent/20 border border-transparent transition-all group text-left"
              >
                <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-accent group-hover:border-accent/30 transition-all">
                  <Terminal size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-200 group-hover:text-white">{tool}</span>
                  <span className="text-[9px] text-gray-600 group-hover:text-accent/60 italic">Launch from Kali repository</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-black flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
               <Cpu size={12} className="text-taskbar" />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">CipherOS Toolchain v1.0</span>
         </div>
         <button 
           onClick={onClose}
           className="text-[9px] font-black text-gray-700 hover:text-white uppercase tracking-widest transition-colors"
         >
           [Close Menu]
         </button>
      </div>
    </motion.div>
  );
};
