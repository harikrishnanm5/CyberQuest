import React, { useState, useRef, useEffect } from 'react';
import { Send, SkipForward, Cpu } from 'lucide-react';
import { ModelsDropdown } from './ModelsDropdown';
import { StoryMission } from '../services/storyMissions';
import { useLanguage } from '../contexts/LanguageContext';

interface AliceSidebarProps {
    aliceChatHistory: { role: 'ai' | 'user', text: string }[];
    selectedAI: string;
    onSelectAI: (modelName: string) => void;
    onSendMessage: (msg: string) => void;
    activeMission: any;
    missionProgress: { completedObjectives: number[] };
    localAIConnected: boolean;
    aliceUsingFallback: boolean;
    recommendedModel?: string;
}

export const AliceSidebar: React.FC<AliceSidebarProps> = ({
    aliceChatHistory,
    selectedAI,
    onSelectAI,
    onSendMessage,
    activeMission,
    missionProgress,
    localAIConnected,
    aliceUsingFallback,
    recommendedModel
}) => {
    const { t } = useLanguage();
    const [aliceInput, setAliceInput] = useState('');
    const aliceEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll Alice chat
    useEffect(() => {
        aliceEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aliceChatHistory]);

    const handleSend = () => {
        if (!aliceInput.trim()) return;
        onSendMessage(aliceInput);
        setAliceInput('');
    };

    return (
        <div className="w-2/5 flex flex-col bg-gradient-to-br from-gray-900 to-black h-full border-l border-gray-800">
            {/* Alice Header */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">A</div>
                    <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                            {t('alice.assistant')}
                            {selectedAI !== 'Groq' && recommendedModel && selectedAI.toLowerCase().replace(/[:\-_]/g, '').includes(recommendedModel.toLowerCase().replace(/[:\-_]/g, '')) && (
                                <span className="flex items-center gap-0.5 px-1 py-0.5 bg-cyber-primary/20 text-[8px] text-cyber-primary rounded border border-cyber-primary/30 font-bold animate-pulse">
                                    <Cpu size={8} />
                                    {t('alice.hardwareOptimized')}
                                </span>
                            )}
                        </div>
                        <div className={`text-xs flex items-center gap-1 ${selectedAI === 'Groq' ? 'text-cyber-secondary' :
                            aliceUsingFallback ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${selectedAI === 'Groq' ? 'bg-cyber-secondary' :
                                aliceUsingFallback ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></span>
                            {aliceUsingFallback ? t('alice.fallback') : (selectedAI === 'Groq' ? t('alice.cloud') : t('alice.localAi'))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission Objectives Card */}
            <div className="m-3 p-3 bg-gray-900/60 border border-gray-800 rounded-lg shadow-inner">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-cyber-secondary uppercase tracking-wider">{t('mission.objectives')}</h3>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {missionProgress.completedObjectives.length}/{(activeMission as StoryMission).objectives?.length || 3}
                    </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {(activeMission as StoryMission).objectives?.map((obj, idx) => {
                        const isCompleted = missionProgress.completedObjectives.includes(idx);
                        const isCurrent = missionProgress.completedObjectives.length === idx; // Simplified logic for UI
                        return (
                            <div key={idx} className={`flex items-start gap-2 text-[10px] transition-all duration-300 ${isCompleted ? 'text-green-400/60' : isCurrent ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5 border ${isCompleted ? 'bg-green-500/20 border-green-500/50' :
                                    isCurrent ? 'bg-cyber-primary/20 border-cyber-primary animate-pulse' :
                                        'bg-gray-800 border-gray-700'
                                    }`}>
                                    {isCompleted ? '✓' : idx + 1}
                                </span>
                                <span className={`${isCompleted ? 'line-through' : ''} truncate`}>{obj}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {aliceChatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">A</div>
                        )}
                        <div className={`max-w-[85%] rounded-xl p-2.5 text-xs ${msg.role === 'user'
                            ? 'bg-cyber-primary/20 border border-cyber-primary/30 text-cyber-primary rounded-tr-none'
                            : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
                            }`}>
                            <div className="leading-relaxed whitespace-pre-wrap break-words">{msg.text || '(No response)'}</div>
                        </div>
                    </div>
                ))}
                <div ref={aliceEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-black/60 border-t border-gray-800">
                <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-3">
                    <input
                        type="text"
                        value={aliceInput}
                        onChange={e => setAliceInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={t('alice.helpPlaceholder')}
                        className="w-full bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none text-sm mb-3"
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ModelsDropdown variant="chat" selectedModel={selectedAI} onSelect={onSelectAI} />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!aliceInput.trim()}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
