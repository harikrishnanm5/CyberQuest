import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TerminalPanelProps {
    terminalHistory: { role: 'system' | 'user' | 'output', text: string }[];
    activeMission: any; // StoryMission
    onCommandSubmit: (cmd: string) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
    terminalHistory,
    activeMission,
    onCommandSubmit
}) => {
    const { t } = useLanguage();
    const [terminalInput, setTerminalInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!terminalInput.trim()) return;

        const cmd = terminalInput.trim();
        onCommandSubmit(cmd);

        // Update history
        setHistory(prev => [cmd, ...prev.slice(0, 49)]); // Keep last 50
        setHistoryIndex(-1);
        setTerminalInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setTerminalInput(history[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setTerminalInput(history[newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setTerminalInput('');
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-black border-r border-gray-800">
            {/* Terminal Header */}
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500 font-mono">{t('mission.terminal')}</span>
                </div>
                <span className="text-xs text-cyber-primary font-mono">{activeMission?.title}</span>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar">
                {terminalHistory.map((line, i) => (
                    <div key={i} className={`mb-2 ${line.role === 'user' ? 'text-cyber-primary' :
                        line.role === 'system' ? 'text-yellow-500' :
                            'text-gray-300'
                        }`}>
                        <pre className="whitespace-pre-wrap font-mono">{line.text}</pre>
                    </div>
                ))}
                <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input */}
            <div className="p-4 bg-gray-900 border-t border-gray-800">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <span className="text-cyber-primary font-mono shrink-0">root@mission:~$</span>
                    <input
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('mission.enterCommand')}
                        className="flex-1 bg-transparent text-white font-mono focus:outline-none"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!terminalInput.trim()}
                        className="px-4 py-2 bg-cyber-primary text-black font-bold rounded hover:bg-emerald-400 disabled:opacity-50 transition-colors text-xs"
                    >
                        {t('mission.execute')}
                    </button>
                </form>
            </div>
        </div>
    );
};
