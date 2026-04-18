import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  WifiOff, 
  Zap, 
  Database, 
  Activity, 
  AlertTriangle,
  Skull,
  Globe,
  Radio,
  Brain,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { useLearnerProfile } from '../store/learnerProfile';

interface Threat {
  id: string;
  source: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'MITIGATED' | 'RESEARCHING';
}

export const ActiveThreats: React.FC = () => {
  const { state: learnerProfile } = useLearnerProfile();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const [axiomMessages, setAxiomMessages] = useState<{role: 'axiom' | 'player', text: string}[]>([
    { role: 'axiom', text: "Analyzing global telemetry... Look at those packet headers in Mission 01. What does the mismatch in the SMTP 'From' field suggest about the relay's trust level?" }
  ]);
  const [playerInput, setPlayerInput] = useState("");
  const [isAxiomThinking, setIsAxiomThinking] = useState(false);

  const handlePlayerMessage = async () => {
    if (!playerInput.trim() || isAxiomThinking) return;
    const msg = playerInput;
    setPlayerInput("");
    setAxiomMessages(prev => [...prev, { role: 'player', text: msg }]);
    setIsAxiomThinking(true);

    try {
      const response = await aiService.complete({
        agent: 'mentor',
        systemPrompt: SYSTEM_PROMPTS.mentor(learnerProfile),
        userMessage: msg,
        learnerProfile
      });

      setAxiomMessages(prev => [...prev, { role: 'axiom', text: response }]);
    } catch (err: any) {
      setAxiomMessages(prev => [...prev, { role: 'axiom', text: `[SYSTEM ERROR] ${err.message}` }]);
    } finally {
      setIsAxiomThinking(false);
    }
  };

  return (
    <aside className="h-full bg-transparent flex flex-col overflow-hidden border-l border-white/5">
      {/* Top Section: Mentor Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          AX
        </div>
        <div className="flex flex-col">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-white">AXIOM — SOC Senior Analyst</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-bold text-blue-400/80 uppercase tracking-tighter">online · watching your session</span>
          </div>
        </div>
      </div>

      {/* Middle: Chat Bubbles */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black/10">
        {axiomMessages.map((msg, i) => (
          <div 
            key={i} 
            className={cn(
              "flex flex-col gap-1.5 max-w-[85%]",
              msg.role === 'player' ? 'ml-auto items-end' : 'items-start'
            )}
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">
              {msg.role === 'axiom' ? 'MENTOR' : 'YOU'}
            </span>
            <div className={cn(
              "p-3 rounded-2xl text-[11px] leading-relaxed shadow-xl border backdrop-blur-sm",
              msg.role === 'axiom' 
                ? "bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tl-none" 
                : "bg-accent/10 border-accent/20 text-accent rounded-tr-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isAxiomThinking && (
          <div className="flex items-center gap-2 animate-pulse text-blue-400">
            <Brain size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Axiom is thinking...</span>
          </div>
        )}
      </div>

      {/* Bottom Input */}
      <div className="p-4 bg-white/[0.01] border-t border-white/5">
        <div className="relative group">
          <input 
            type="text"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlayerMessage()}
            placeholder="Ask AXIOM anything..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 shadow-inner"
          />
          <button 
            onClick={handlePlayerMessage}
            disabled={isAxiomThinking || !playerInput.trim()}
            className="absolute right-2 top-1.5 p-1 text-gray-500 hover:text-blue-400 disabled:opacity-0 transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, color, onClick }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'executed'>('idle');

  const handleClick = () => {
    if (state !== 'idle') return;
    setState('loading');
    onClick();
    setTimeout(() => {
      setState('executed');
    }, 1500);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded border border-white/5 transition-all active:scale-95 group relative overflow-hidden min-h-[54px]",
        state === 'executed' ? 'bg-accent/20 border-accent/40' : color
      )}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="text-white mb-1 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-300">{label}</span>
          </motion.div>
        )}
        {state === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center"
          >
            <Loader2 size={20} className="text-white animate-spin" />
          </motion.div>
        )}
        {state === 'executed' && (
          <motion.div 
            key="executed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1"
          >
            <CheckCircle2 size={14} className="text-accent" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-accent">Executed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
