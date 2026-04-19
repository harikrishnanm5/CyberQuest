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

interface TerminalProps {
  title?: string;
  expectedCommands?: string[];
  /** Called when student submits a correct command. Parent decides when to advance to debrief. */
  onMissionEnd?: (commandsUsed: string[]) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ 
  title = "analyst@soc:~/mission_control",
  expectedCommands = [],
  onMissionEnd,
}) => {
  const { state: learnerProfile, dispatch } = useLearnerProfile();
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', text: 'CipherOS v4.2.0-secure (x86_64)', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) },
    { type: 'output', text: 'Initializing security kernel...', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) },
    { type: 'output', text: '[*] Neural link established. System state: SENTINEL.', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCipherThinking, setIsCipherThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tauntTimer = useRef<NodeJS.Timeout | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const correctCommandsRef = useRef<string[]>([]); // track commands used for debrief

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading, isCipherThinking]);

  // Skill mapping for progress advancement
  const getRelevantSkill = (domain: string): keyof typeof learnerProfile.skillMap => {
    switch (domain) {
      case 'network': return 'network_analysis';
      case 'social_engineering': return 'phishing_analysis';
      case 'web':
      case 'malware':
      default: return 'cve_identification';
    }
  };

  const addLine = (line: Omit<TerminalLine, 'timestamp'>) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setHistory(prev => [...prev, { ...line, timestamp }]);
  };

  // 8-second inactivity hint — only fires if >= 3 chars and CIPHER isn't active
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (input.trim().length >= 3 && !isCipherThinking) {
      debounceTimer.current = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('axiom-request', {
          detail: { question: `Student is typing: "${input}" — give a proactive hint without revealing the answer.`, context: learnerProfile, isHint: true }
        }));
      }, 8000);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [input]);

  const triggerCipherResponse = async (userMsg: string, isTaunt = false) => {
    setIsCipherThinking(true);
    try {
      const response = await aiService.complete({
        agent: 'cipher',
        systemPrompt: SYSTEM_PROMPTS.cipher(learnerProfile),
        userMessage: isTaunt 
          ? "Send a mid-mission taunt or escalation message." 
          : `Student entered: "${userMsg}". Mock them.`,
        learnerProfile
      });
      addLine({ type: 'cipher', text: `[CIPHER]: ${response}` });
    } catch (err: any) {
      console.error("Cipher failure:", err);
    } finally {
      setIsCipherThinking(false);
    }
  };

  // Initial Attack Narrative & Taunt Scheduler
  useEffect(() => {
    const initCipher = async () => {
      setIsCipherThinking(true);
      try {
        const response = await aiService.complete({
          agent: 'cipher',
          systemPrompt: SYSTEM_PROMPTS.cipher(learnerProfile),
          userMessage: "Initialize the attack. Tell the student you've breached their perimeter and taunt their specialty.",
          learnerProfile
        });
        addLine({ type: 'cipher', text: `[CIPHER]: ${response}` });
      } finally {
        setIsCipherThinking(false);
      }
    };

    const scheduleNextTaunt = () => {
      const delay = 75000 + Math.random() * 45000; // 75–120s jitter
      tauntTimer.current = setTimeout(async () => {
        await triggerCipherResponse("", true);
        scheduleNextTaunt();
      }, delay);
    };

    initCipher();
    scheduleNextTaunt();

    return () => {
      if (tauntTimer.current) clearTimeout(tauntTimer.current);
    };
  }, []); // Run once on mount

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCipherThinking) return;

    // Clear any pending AXIOM debounce on explicit submit
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const cmd = input.trim();
    const lower = cmd.toLowerCase();

    // AXIOM direct question — detect prefix "axiom " (with trailing space)
    if (lower.startsWith('axiom ')) {
      const question = cmd.slice(6).trim();
      if (question.length > 0) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        setHistory(prev => [
          ...prev,
          { type: 'prompt', text: 'analyst@soc:~$', timestamp },
          { type: 'command', text: cmd, timestamp },
        ]);
        setInput('');
        window.dispatchEvent(new CustomEvent('axiom-request', {
          detail: { question, context: learnerProfile, isHint: false }
        }));
      } else {
        setInput('');
      }
      return; // skip standard command processing
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    setHistory(prev => [
      ...prev,
      { type: 'prompt', text: 'analyst@soc:~$', timestamp },
      { type: 'command', text: cmd, timestamp }
    ]);
    
    setInput('');

    // Keyword matching logic
    const isCorrect = expectedCommands.some(expected => 
      cmd.toLowerCase().includes(expected.toLowerCase())
    );

    if (isCorrect) {
      setIsLoading(true);
      // Track this correct command
      correctCommandsRef.current = [...correctCommandsRef.current, cmd];
      const correctCount = correctCommandsRef.current.length;

      setTimeout(() => {
        addLine({ type: 'output', text: `[SUCCESS] Command accepted. Node ${Math.floor(Math.random() * 20)} secured. (${correctCount}/3)` });

        // Progress advancement
        dispatch({ type: 'ADD_XP', payload: 50 });
        const skillKey = getRelevantSkill(learnerProfile.domain || 'web');
        dispatch({ type: 'UPDATE_SKILL', payload: { skill: skillKey, delta: 10 } });

        // After 3 correct commands, mission is complete → hand off to debrief
        if (correctCount >= 3 && onMissionEnd) {
          addLine({ type: 'output', text: '[MISSION COMPLETE] Threat neutralized. Initiating post-mortem...' });
          setTimeout(() => onMissionEnd(correctCommandsRef.current), 1500);
        }

        setIsLoading(false);
      }, 800);
    } else {
      // Failure → CIPHER mocks the student
      await triggerCipherResponse(cmd);
    }
  };

  return (
    <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden flex flex-col shadow-2xl group">
      {/* Terminal Header */}
      <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className={cn("text-accent", (isLoading || isCipherThinking) && "animate-pulse")} />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{title}</span>
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
              line.type === 'cipher' && "text-red-500 font-black italic brightness-125"
            )}>
              {line.type === 'cipher' ? line.text : (line.type === 'prompt' ? line.text : line.text)}
            </div>
          </div>
        ))}
        
        {/* Loading State or Cursor */}
        {isCipherThinking ? (
          <div className="flex items-center gap-2 mt-2 text-red-500 animate-pulse">
            <Brain size={10} className="animate-bounce" />
            <span className="text-[9px] uppercase font-bold tracking-widest">CIPHER IS THINKING...</span>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 mt-2 text-accent/50 animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            <span className="text-[9px] uppercase font-bold tracking-widest">Processing command...</span>
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
          disabled={isLoading || isCipherThinking}
          className="flex-1 bg-transparent border-none outline-none text-[11px] text-white font-mono placeholder:text-white/10 disabled:opacity-50"
          placeholder={isCipherThinking ? "Terminal locked by CIPHER..." : (isLoading ? "Kernel busy..." : "Enter command...")}
          autoFocus
        />
        <button 
          type="submit" 
          disabled={isLoading || isCipherThinking || !input.trim()}
          className="opacity-0 group-hover:opacity-50 transition-opacity disabled:hidden"
        >
          <Send size={12} className="text-accent" />
        </button>
      </form>
    </div>
  );
};
