import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Send } from 'lucide-react';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { useLearnerProfile } from '../store/learnerProfile';

interface TerminalLine {
  text: string;
  color?: string;
  timestamp: number;
}

interface MissionTerminalProps {
  title?: string;
  onExit?: () => void;
  /** Substrings (case-insensitive) that count as a correct command for the current mission. */
  expectedCommands?: string[];
  /** Fires when the student has submitted 3 correct commands. Parent decides what to do next (e.g. advance to debrief). */
  onMissionEnd?: (commandsUsed: string[]) => void;
}

const REQUIRED_CORRECT = 3;

export const MissionTerminal: React.FC<MissionTerminalProps> = ({
  title = "operator@cipher-os:~",
  onExit,
  expectedCommands = [],
  onMissionEnd,
}) => {
  const { state: learnerProfile } = useLearnerProfile();
  const [mode, setMode] = useState<'AI' | 'SSH'>('SSH');
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: 'CipherOS v4.2.0-secure (x86_64)', timestamp: Date.now() },
    { text: 'Initializing security kernel...', timestamp: Date.now() },
    { text: '[*] Neural link established. System state: SENTINEL.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCipherThinking, setIsCipherThinking] = useState(false);

  const aiWsRef = useRef<WebSocket | null>(null);
  const sshWsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<'AI' | 'SSH'>('AI');
  const correctCommandsRef = useRef<string[]>([]);
  const allSubmittedRef = useRef<string[]>([]);
  const missionEndedRef = useRef<boolean>(false);
  const tauntTimer = useRef<NodeJS.Timeout | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const addLine = (line: Omit<TerminalLine, 'timestamp'>) => {
    setLines(prev => [...prev, { ...line, timestamp: Date.now() }]);
  };

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
    const bridgeToken = import.meta.env.VITE_BRIDGE_TOKEN || 'cyberquest_secret_token_123';
    const sshWs = new WebSocket(sshWsUrl);
    sshWsRef.current = sshWs;

    sshWs.onopen = () => {
      console.log('[SSH] Connected. Sending auth token...');
      sshWs.send(JSON.stringify({ type: 'auth', token: bridgeToken }));
      setLines(prev => [...prev, { text: '[+] SSH Tunnel Established (Port 3002). Authenticating...', color: 'text-green-400', timestamp: Date.now() }]);
    };
    sshWs.onmessage = (e) => {
      if (modeRef.current !== 'SSH') return;

      let terminalData = '';
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') {
          terminalData = msg.data;
        } else if (msg.type === 'auth_success') {
          terminalData = `\r\n${msg.data}\r\n`;
        } else if (msg.type === 'exit') {
          terminalData = `\r\n[PROCESS EXITED WITH CODE ${msg.code}]\r\n`;
        } else if (msg.error) {
          terminalData = `\r\n[BRIDGE ERROR] ${msg.error}\r\n`;
        } else {
          terminalData = e.data;
        }
      } catch {
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
        // Also treat tool launches as a submitted command so the matcher can credit them.
        handleSubmission(command);
      }
    };

    window.addEventListener('launch-kali-tool' as any, handleLaunch);
    return () => window.removeEventListener('launch-kali-tool' as any, handleLaunch);
  }, []);

  // CIPHER: format & emit a taunt
  const triggerCipherResponse = async (userMsg: string, isTaunt = false) => {
    setIsCipherThinking(true);
    try {
      const response = await aiService.complete({
        agent: 'cipher',
        systemPrompt: SYSTEM_PROMPTS.cipher(learnerProfile),
        userMessage: isTaunt
          ? "Send a mid-mission taunt or escalation message."
          : `Student entered: "${userMsg}". Mock them.`,
        learnerProfile,
      });
      // Best-effort JSON parse; fall back to raw text.
      try {
        const parsed = JSON.parse(response);
        const text = parsed.attack_message
          ? `${parsed.attack_message}\n\n"${parsed.taunt || ''}"`
          : response;
        addLine({ type: undefined as any, text: `[CIPHER]: ${text}`, color: 'text-red-400' } as any);
      } catch {
        addLine({ text: `[CIPHER]: ${response}`, color: 'text-red-400' });
      }
    } catch (err) {
      console.error("Cipher failure:", err);
    } finally {
      setIsCipherThinking(false);
    }
  };

  // Initial attack narrative + taunt scheduler (runs regardless of WS state — local UI flavor).
  useEffect(() => {
    const initCipher = async () => {
      await triggerCipherResponse("", false);
    };

    const scheduleNextTaunt = () => {
      const delay = 75000 + Math.random() * 45000; // 75–120s jitter
      tauntTimer.current = setTimeout(async () => {
        if (missionEndedRef.current) return;
        await triggerCipherResponse("", true);
        scheduleNextTaunt();
      }, delay);
    };

    initCipher();
    scheduleNextTaunt();

    return () => {
      if (tauntTimer.current) clearTimeout(tauntTimer.current);
    };
  }, []);

  // Centralised submission handler — called by handleSubmit (typed input)
  // and by tool launches from the Kali menu. Owns expectedCommands matching,
  // correct-command tracking, and the mission-end trigger.
  const handleSubmission = (rawCmd: string) => {
    if (missionEndedRef.current) return;
    const cmd = rawCmd.trim();
    if (!cmd) return;

    allSubmittedRef.current = [...allSubmittedRef.current, cmd];

    // No expected commands provided → treat as decorative; never auto-end.
    if (!expectedCommands || expectedCommands.length === 0) return;

    const isCorrect = expectedCommands.some(expected =>
      cmd.toLowerCase().includes(expected.toLowerCase())
    );

    if (!isCorrect) return;

    correctCommandsRef.current = [...correctCommandsRef.current, cmd];
    const correctCount = correctCommandsRef.current.length;

    addLine({
      text: `[SUCCESS] Command accepted. Node ${Math.floor(Math.random() * 20)} secured. (${correctCount}/${REQUIRED_CORRECT})`,
      color: 'text-green-400',
    });

    if (correctCount >= REQUIRED_CORRECT) {
      missionEndedRef.current = true;
      if (tauntTimer.current) clearTimeout(tauntTimer.current);
      addLine({ text: '[MISSION COMPLETE] Threat neutralized. Initiating post-mortem...', color: 'text-green-400' });
      setTimeout(() => {
        if (onMissionEnd) {
          // Pass ALL submitted commands up — debrief distinguishes correct vs total itself.
          onMissionEnd(allSubmittedRef.current);
        }
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (missionEndedRef.current) return;

    // Cancel any pending AXIOM inactivity hint on explicit submit.
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const cmd = input;
    const lower = cmd.toLowerCase();

    // AXIOM direct question — detect prefix "axiom " (with trailing space)
    if (lower.startsWith('axiom ')) {
      const question = cmd.slice(6).trim();
      if (question.length > 0) {
        addLine({ text: 'analyst@soc:~$', color: 'text-cyan-500' });
        addLine({ text: cmd, color: 'text-white' });
        window.dispatchEvent(new CustomEvent('axiom-request', {
          detail: { question, context: learnerProfile, isHint: false }
        }));
      }
      setInput('');
      return; // skip standard command processing
    }

    addLine({ text: 'analyst@soc:~$', color: mode === 'AI' ? 'text-cyan-500' : 'text-green-500' });

    // Forward to the active WS
    const payload = mode === 'AI'
      ? JSON.stringify({ type: 'input', data: cmd + '\n' })
      : cmd + '\n';

    const activeWs = mode === 'AI' ? aiWsRef.current : sshWsRef.current;
    if (activeWs?.readyState === WebSocket.OPEN) {
      activeWs.send(payload);
    }

    // In AI mode, echo the command locally; SSH mode echoes via the shell.
    if (mode === 'AI') {
      addLine({ text: `analyst@soc:~$ ${cmd}` });
    }

    // Submission handling (matching, mission end, etc.)
    handleSubmission(cmd);

    // Save to history if not empty and not identical to last command
    if (cmd.trim()) {
      setCommandHistory(prev => {
        const last = prev[prev.length - 1];
        if (last === cmd.trim()) return prev;
        return [...prev, cmd.trim()];
      });
    }
    setHistoryIndex(-1);

    setInput('');
  };

  // 8-second inactivity hint — only fires if >= 3 chars and mission isn't ended.
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (input.trim().length >= 3 && !missionEndedRef.current) {
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
          <TerminalIcon size={12} className={`text-cyan-500 ${isCipherThinking ? 'animate-pulse' : ''}`} />
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
          disabled={missionEndedRef.current}
          className="flex-1 bg-transparent border-none outline-none text-[11px] text-white font-mono placeholder:text-white/5 disabled:opacity-50"
          placeholder={missionEndedRef.current ? "Mission complete..." : "Enter command..."}
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
