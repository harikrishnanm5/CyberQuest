import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, RefreshCw, Lock } from 'lucide-react';
import { getTerminalStream } from '../services/groqService';
import { TerminalMessage } from '../types';

export const TerminalDemo: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TerminalMessage[]>([
    { role: 'system', content: 'QUEST-OS [GUEST_MODE] initialized...', timestamp: new Date() },
    { role: 'ai', content: 'Identity Unknown. I can provide surface-level intel on Cyber Security. For deep dive access and code generation, authentication is required.', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const MAX_INTERACTIONS = 5;
  const [interactionCount, setInteractionCount] = useState(() => {
    // Persist limit across refreshes to prevent simple brute forcing
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('guest_interactions') || '0');
    }
    return 0;
  });

  const isLimitReached = interactionCount >= MAX_INTERACTIONS;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    if (isLimitReached) {
      setMessages(prev => [...prev, 
        { role: 'user', content: input, timestamp: new Date() },
        { role: 'system', content: 'TRIAL_LIMIT_EXCEEDED // Connection terminated. Please Log In to continue training.', timestamp: new Date() }
      ]);
      setInput('');
      return;
    }

    const userMsg: TerminalMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    const newCount = interactionCount + 1;
    setInteractionCount(newCount);
    localStorage.setItem('guest_interactions', newCount.toString());

    // Keep last 5 messages for context
    const history = messages.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`);
    
    setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: new Date() }]);
    
    try {
      const stream = getTerminalStream(userMsg.content, history);
      let accumulatedText = "";
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === 'ai') {
            lastMsg.content = accumulatedText;
          }
          return newMsgs;
        });
      }
    } catch (error) {
       console.error(error);
       setMessages(prev => {
         const newMsgs = [...prev];
         const lastMsg = newMsgs[newMsgs.length - 1];
         if (lastMsg.role === 'ai') {
           lastMsg.content = "SYSTEM ERROR // Connection interrupted.";
         }
         return newMsgs;
       });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto neon-box bg-cyber-black border border-gray-800 rounded-lg overflow-hidden font-mono text-sm shadow-2xl relative z-10">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-2 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal size={14} />
          <span className="text-xs">
            bash -- guest-session {isLimitReached ? '[LOCKED]' : `[${interactionCount}/${MAX_INTERACTIONS}]`}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={scrollRef}
        className="h-[300px] overflow-y-auto p-4 space-y-3 bg-black/90 text-green-500 font-medium"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`px-2 py-1 rounded max-w-[90%] ${
              msg.role === 'user' 
                ? 'bg-cyber-primary/10 text-cyber-primary' 
                : msg.role === 'system' 
                  ? 'text-red-500 font-bold border border-red-900/50 bg-red-900/10'
                  : 'text-emerald-400'
            }`}>
              {msg.role === 'ai' && <span className="mr-2 text-xs opacity-50">root@quest:~#</span>}
              {msg.content}
            </span>
          </div>
        ))}
        {loading && messages[messages.length - 1].content === '' && (
          <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
            <span className="w-2 h-4 bg-emerald-600 block"></span>
            <span>Decrypting...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-2 bg-gray-900 border-t border-gray-800 flex gap-2 relative">
        {isLimitReached && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-red-500 font-bold">
              <Lock size={16} />
              <span>SESSION TERMINATED // LOGIN REQUIRED</span>
            </div>
          </div>
        )}
        <span className="flex items-center pl-2 text-cyber-primary text-lg">❯</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLimitReached ? "Access Denied" : "Enter command..."}
          disabled={isLimitReached}
          className="flex-1 bg-transparent text-gray-200 focus:outline-none placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={loading || isLimitReached}
          className="p-2 hover:bg-white/10 rounded text-cyber-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};