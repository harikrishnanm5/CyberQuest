import React, { useState, useEffect, useRef } from 'react';
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

  const [axiomMessages, setAxiomMessages] = useState<{role: 'axiom' | 'player'; text: string; flash?: boolean}[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [isAxiomThinking, setIsAxiomThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [axiomMessages, isAxiomThinking]);

  const sendToAxiom = async (question: string) => {
    if (isAxiomThinking) return;
    setIsAxiomThinking(true);
    try {
      const response = await aiService.complete({
        agent: 'mentor',
        systemPrompt: SYSTEM_PROMPTS.mentor(learnerProfile),
        userMessage: question,
        learnerProfile
      });
      setAxiomMessages(prev => [...prev, { role: 'axiom', text: response, flash: true }]);
      // Remove flash flag after animation
      setTimeout(() => {
        setAxiomMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, flash: false } : m));
      }, 800);
    } catch (err: any) {
      setAxiomMessages(prev => [...prev, { role: 'axiom', text: `[SYSTEM ERROR] ${err.message}` }]);
    } finally {
      setIsAxiomThinking(false);
    }
  };

  // Opening observation on mission start
  useEffect(() => {
    const openingMsg = `Mission started. Domain: ${learnerProfile.domain}. Level: ${learnerProfile.actualLevel}. Open with a single Socratic observation to orient the analyst.`;
    sendToAxiom(openingMsg);
  }, []);

  // Window event listener for terminal-triggered AXIOM requests
  useEffect(() => {
    const handler = (e: Event) => {
      const { question, isHint } = (e as CustomEvent).detail;
      if (!question) return;
      if (!isHint) {
        // Direct question — echo it as a player message
        setAxiomMessages(prev => [...prev, { role: 'player', text: question }]);
      }
      sendToAxiom(question);
    };
    window.addEventListener('axiom-request', handler);
    return () => window.removeEventListener('axiom-request', handler);
  }, [learnerProfile, isAxiomThinking]);

  const handlePlayerMessage = async () => {
    if (!playerInput.trim() || isAxiomThinking) return;
    const msg = playerInput.trim();
    setPlayerInput("");
    setAxiomMessages(prev => [...prev, { role: 'player', text: msg }]);
    await sendToAxiom(msg);
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col gap-1.5 max-w-[85%]",
              msg.role === 'player' ? 'ml-auto items-end' : 'items-start'
            )}
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">
              {msg.role === 'axiom' ? 'MENTOR' : 'YOU'}
            </span>
            <motion.div
              animate={msg.flash ? { boxShadow: ['0 0 0px rgba(0,255,157,0)', '0 0 16px rgba(0,255,157,0.4)', '0 0 0px rgba(0,255,157,0)'] } : {}}
              transition={{ duration: 0.7 }}
              className={cn(
                "p-3 rounded-2xl text-[11px] leading-relaxed shadow-xl border backdrop-blur-sm",
                msg.role === 'axiom'
                  ? "bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tl-none"
                  : "bg-accent/10 border-accent/20 text-accent rounded-tr-none"
              )}
            >
              {msg.text}
            </motion.div>
          </motion.div>
        ))}

        {/* AXIOM IS ANALYSING... pulsing dots */}
        <AnimatePresence>
          {isAxiomThinking && (
            <motion.div
              key="analysing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-accent"
            >
              <Brain size={12} className="shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-widest">AXIOM IS ANALYSING</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-accent inline-block"
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input */}
      <div className="p-4 bg-white/[0.01] border-t border-white/5">
        <div className="text-[8px] text-gray-600 font-mono mb-2 uppercase tracking-widest">
          Or type <span className="text-accent">AXIOM [question]</span> in the terminal
        </div>
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
