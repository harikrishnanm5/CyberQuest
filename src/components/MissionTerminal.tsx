import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Send } from 'lucide-react';

interface TerminalLine {
  text: string;
  color?: string;
  timestamp: number;
}

interface MissionTerminalProps {
  title?: string;
  onExit?: () => void;
}

export const MissionTerminal: React.FC<MissionTerminalProps> = ({ title = "operator@cipher-os:~", onExit }) => {
  const [mode, setMode] = useState<'AI' | 'SSH'>('SSH');
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: 'CipherOS v4.2.0-secure (x86_64)', timestamp: Date.now() },
    { text: 'Initializing security kernel...', timestamp: Date.now() },
    { text: '[*] Neural link established. System state: SENTINEL.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const aiWsRef = useRef<WebSocket | null>(null);
  const sshWsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<'AI' | 'SSH'>('AI');

  // Sync modeRef for callback access
  useEffect(() => {
    modeRef.current = mode;
    if (inputRef.current) inputRef.current.focus();
  }, [mode]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // 1. Setup AI WebSocket
    const aiWsUrl = import.meta.env.VITE_TERMINAL_WS || 'ws://localhost:3001';
    const aiWs = new WebSocket(aiWsUrl);
    aiWsRef.current = aiWs;

    aiWs.onopen = () => {
      console.log('[AI] Connected');
      setLines(prev => [...prev, { text: '[+] Connected to AI System Bridge (Port 3001)', color: 'text-cyan-400', timestamp: Date.now() }]);
    };
    aiWs.onmessage = (e) => {
      if (modeRef.current !== 'AI') return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') {
          setLines(prev => [...prev, { text: msg.data, timestamp: Date.now() }]);
        } else if (msg.error) {
          setLines(prev => [...prev, { text: `[ERROR] ${msg.error}`, color: 'text-red-400', timestamp: Date.now() }]);
        } else {
          // If JSON but unknown type, just show the data if present
          const text = msg.data || msg.text || e.data;
          setLines(prev => [...prev, { text, timestamp: Date.now() }]);
        }
      } catch {
        setLines(prev => [...prev, { text: e.data, timestamp: Date.now() }]);
      }
    };
    aiWs.onerror = () => {
      console.error('[AI] Connection failed');
      setLines(prev => [...prev, { text: '[!] AI Bridge Unreachable. Operating in local simulation mode.', color: 'text-red-400', timestamp: Date.now() }]);
    };

    // 2. Setup SSH WebSocket
    const sshWsUrl = import.meta.env.VITE_SSH_WS || 'ws://localhost:3002';
    const sshWs = new WebSocket(sshWsUrl);
    sshWsRef.current = sshWs;

    sshWs.onopen = () => {
      console.log('[SSH] Connected');
      setLines(prev => [...prev, { text: '[+] SSH Tunnel Established (Port 3002)', color: 'text-green-400', timestamp: Date.now() }]);
    };
    sshWs.onmessage = (e) => {
      if (modeRef.current !== 'SSH') return;
      
      let terminalData = '';
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') {
          terminalData = msg.data;
        } else if (msg.type === 'exit') {
          terminalData = `\r\n[PROCESS EXITED WITH CODE ${msg.code}]\r\n`;
        } else if (msg.error) {
          terminalData = `\r\n[BRIDGE ERROR] ${msg.error}\r\n`;
        } else {
          // If it's a valid JSON but not a recognized type, maybe it's just raw data
          terminalData = e.data;
        }
      } catch {
        // Not JSON, treat as raw data
        terminalData = typeof e.data === 'string' ? e.data : e.data.toString();
      }
      
      // 1. Strip ANSI escape codes
      const cleanData = terminalData.replace(/\x1B\[[0-9;?]*[A-Za-z=]/g, '')
                            .replace(/\x1B[=>]/g, '')
                            .replace(/\x1B\([A-Z]/g, '');

      setLines(prev => {
        const updated = [...prev];
        if (updated.length === 0) {
          updated.push({ text: '', color: 'text-green-400', timestamp: Date.now() });
        }

        let lastLineIndex = updated.length - 1;
        
        for (let i = 0; i < cleanData.length; i++) {
          const char = cleanData[i];
          
          if (char === '\n') {
            updated.push({ text: '', color: 'text-green-400', timestamp: Date.now() });
            lastLineIndex++;
          } else if (char === '\r') {
            // Standard terminal behavior for \r is cursor return to start of line.
            // For our simple line-based UI, we'll just ignore it to avoid clearing the line.
            continue;
          } else {
            // If we detect the start of a prompt and we're not at the start of the line, 
            // maybe force a newline. (Heuristic for cleaner Kali look)
            const remaining = cleanData.slice(i);
            if (remaining.startsWith('kali@kali') && updated[lastLineIndex].text.length > 0) {
              updated.push({ text: '', color: 'text-green-400', timestamp: Date.now() });
              lastLineIndex++;
            }
            updated[lastLineIndex].text += char;
          }
        }
        return updated;
      });
    };
    sshWs.onerror = () => {
      console.error('[SSH] Connection failed');
      setLines(prev => [...prev, { text: '[!] SSH Bridge Offline. Real-time remote shell unavailable.', color: 'text-red-400', timestamp: Date.now() }]);
    };

    return () => {
      aiWs.close();
      sshWs.close();
    };
  }, []);

  // Listen for tool launches from the menu
  useEffect(() => {
    const handleLaunch = (e: CustomEvent) => {
      const command = e.detail;
      if (command) {
        setMode('SSH');
        const payload = command + '\n';
        if (sshWsRef.current?.readyState === WebSocket.OPEN) {
          sshWsRef.current.send(payload);
        }
      }
    };

    window.addEventListener('launch-kali-tool' as any, handleLaunch);
    return () => window.removeEventListener('launch-kali-tool' as any, handleLaunch);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const payload = mode === 'AI' 
      ? JSON.stringify({ type: 'input', data: input + '\n' })
      : input + '\n';

    const activeWs = mode === 'AI' ? aiWsRef.current : sshWsRef.current;
    if (activeWs?.readyState === WebSocket.OPEN) {
      activeWs.send(payload);
    }

    // Only manually add the line for AI mode. 
    // In SSH mode, the shell will echo the command back to us.
    if (mode === 'AI') {
      setLines(prev => [...prev, { 
        text: `analyst@soc:~$ ${input}`, 
        timestamp: Date.now() 
      }]);
    }
    // Save to history if not empty and not identical to last command
    if (input.trim()) {
      setCommandHistory(prev => {
        const last = prev[prev.length - 1];
        if (last === input.trim()) return prev;
        return [...prev, input.trim()];
      });
    }
    setHistoryIndex(-1);
    
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Recognize Ctrl + C
    if (e.ctrlKey && e.key === 'c') {
      const activeWs = mode === 'AI' ? aiWsRef.current : sshWsRef.current;
      if (activeWs?.readyState === WebSocket.OPEN) {
        activeWs.send('\x03'); // Send SIGINT (Ctrl+C)
        setLines(prev => [...prev, { text: '^C', color: 'text-gray-500', timestamp: Date.now() }]);
      }
    }

    // Command History Navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  };

  return (
    <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden flex flex-col shadow-2xl relative">
      {/* Header */}
      <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-cyan-500" />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            {mode === 'AI' ? title : 'root@kali:~#'}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMode('AI')} 
            className={`text-[9px] font-mono px-2 py-0.5 border transition-colors ${
              mode === 'AI' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
            }`}
          >
            AI MODE
          </button>
          <button 
            onClick={() => setMode('SSH')} 
            className={`text-[9px] font-mono px-2 py-0.5 border transition-colors ${
              mode === 'SSH' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-gray-700 text-gray-500'
            }`}
          >
            SSH MODE
          </button>
        </div>
      </div>

      {/* Output */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed custom-scrollbar selection:bg-cyan-500/30 whitespace-pre-wrap"
      >
        {lines.map((line, i) => (
          <div key={i} className={`mb-0.5 ${line.color || 'text-gray-300'}`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
        <span className={`${mode === 'AI' ? 'text-cyan-500' : 'text-green-500'} font-black text-[11px] tracking-tight whitespace-nowrap`}>
          {mode === 'AI' ? 'analyst@soc:~$' : 'root@kali:~#'}
        </span>
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-[11px] text-white font-mono placeholder:text-white/5"
          placeholder="Enter command..."
          autoFocus
        />
        <button type="submit" className="opacity-30 hover:opacity-100">
          <Send size={12} className={mode === 'AI' ? 'text-cyan-500' : 'text-green-500'} />
        </button>
      </form>
    </div>
  );
};

export default MissionTerminal;
