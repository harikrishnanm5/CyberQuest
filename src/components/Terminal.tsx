import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, Brain, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { useLearnerProfile } from '../store/learnerProfile';

interface TerminalLine {
  type: 'prompt' | 'command' | 'output' | 'warning' | 'error' | 'cipher';
  text: string;
  timestamp: string;
}

export const Terminal: React.FC = () => {
  const { state: learnerProfile } = useLearnerProfile();
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', text: 'CipherOS v4.2.0-secure (x86_64)', timestamp: '08:00:21' },
    { type: 'output', text: 'Initializing security kernel...', timestamp: '08:00:22' },
    { type: 'prompt', text: 'analyst@soc:~$', timestamp: '08:00:23' },
    { type: 'command', text: './mission_control --init', timestamp: '08:00:23' },
    { type: 'output', text: '[*] Neural link established. System state: SENTINEL.', timestamp: '08:00:24' },
    { type: 'warning', text: '[!] Global telemetry shows anomalous traffic in Subnet B-12.', timestamp: '08:00:25' },
    { type: 'cipher', text: '[CIPHER]: You think your walls are thick enough, little ant?', timestamp: '08:00:27' },
    { type: 'error', text: '[ERR] Encryption handshake failed on Node 7. Potential MITM active.', timestamp: '08:00:29' },
    { type: 'output', text: 'Scanning for forensic evidence...', timestamp: '08:00:30' },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const cmd = input;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    setHistory(prev => [
      ...prev,
      { type: 'prompt', text: 'analyst@soc:~$', timestamp },
      { type: 'command', text: cmd, timestamp }
    ]);
    
    setInput('');
    setIsLoading(true);

    try {
      // Use axiom agent for command analysis, with a small chance of cipher interference
      const isCipher = Math.random() > 0.8;
      const agent = isCipher ? 'cipher' : 'axiom';
      
      const response = await aiService.complete({
        agent,
        systemPrompt: isCipher ? SYSTEM_PROMPTS.cipher(learnerProfile) : SYSTEM_PROMPTS.axiom(learnerProfile),
        userMessage: cmd,
        learnerProfile
      });

      setHistory(prev => [
        ...prev, 
        { 
          type: isCipher ? 'cipher' : 'output', 
          text: response, 
          timestamp 
        }
      ]);
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', text: `[FATAL] ${err.message}`, timestamp }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden flex flex-col shadow-2xl group">
      {/* Terminal Header */}
      <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className={cn("text-accent", isLoading && "animate-pulse")} />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">analyst@soc:~/mission_control</span>
        </div>
        <div className="flex gap-1.5 grayscale opacity-30">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
      </div>
      
      {/* Output Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed custom-scrollbar selection:bg-accent selection:text-black whitespace-pre-wrap"
      >
        {history.map((line, i) => (
          <div key={i} className="mb-0.5 flex gap-2">
            <span className="text-white/20 shrink-0">[{line.timestamp}]</span>
            <div className={cn(
              "break-all",
              line.type === 'prompt' && "text-accent font-bold",
              line.type === 'command' && "text-white",
              line.type === 'output' && "text-gray-400 font-medium",
              line.type === 'warning' && "text-yellow-500",
              line.type === 'error' && "text-red-500",
              line.type === 'cipher' && "text-pink-500 font-black italic brightness-125"
            )}>
              {line.type === 'prompt' ? (
                <>
                  <span>{line.text} </span>
                </>
              ) : line.text}
            </div>
          </div>
        ))}
        
        {/* Loading State or Cursor */}
        {isLoading ? (
          <div className="flex items-center gap-2 mt-2 text-accent/50 animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            <span className="text-[9px] uppercase font-bold tracking-widest">Processing request...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-3 bg-accent animate-pulse shadow-[0_0_8px_#1D9E75]" />
          </div>
        )}
      </div>

      {/* Input Row */}
      <form onSubmit={handleCommand} className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
        <span className="text-accent font-black text-[11px] tracking-tight">analyst@soc:~$</span>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-[11px] text-white font-mono placeholder:text-white/10 disabled:opacity-50"
          placeholder={isLoading ? "Kernel busy..." : "Enter command..."}
          autoFocus
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="opacity-0 group-hover:opacity-50 transition-opacity disabled:hidden"
        >
          <Send size={12} className="text-accent" />
        </button>
      </form>
    </div>
  );
};
