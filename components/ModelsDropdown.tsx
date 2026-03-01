import React, { useState, useRef, useEffect } from 'react';
import { Cpu, ChevronDown } from 'lucide-react';

interface ModelsDropdownProps {
    variant?: 'sidebar' | 'chat';
    selectedModel: string;
    onSelect: (modelName: string) => void;
    recommendedModel?: string;
}

export const ModelsDropdown: React.FC<ModelsDropdownProps> = ({
    variant = 'sidebar',
    selectedModel,
    onSelect,
    recommendedModel
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const modelGroups = [
        {
            title: 'Local AI',
            items: [
                { name: 'Llama 3.2-3B', provider: 'Meta', purpose: 'Lightweight inference', icon: '🦙', id: 'llama-3.2-3b-instruct' },
                { name: 'Llama 3.1-8B', provider: 'Meta', purpose: 'Balanced performance', icon: '🦙', id: 'meta-llama-3.1-8b-instruct' },
                { name: 'SmolLM2-1.7B', provider: 'HuggingFace', purpose: 'Hardware Optimized', icon: '🤖', id: 'smollm2-1.7b' },
            ]
        },
        {
            title: 'Cloud',
            items: [
                { name: 'Groq', provider: 'Cloud', purpose: 'High-speed cloud inference', icon: '⚡', id: 'Groq' },
            ]
        }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isChat = variant === 'chat';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-md hover:bg-white/5 text-gray-400 transition-colors ${isChat ? 'px-2 py-1 text-xs border border-gray-700 bg-black/40' : 'w-full px-3 py-2 justify-between'
                    }`}
            >
                <div className={`flex items-center gap-2 ${isChat ? '' : 'gap-3'}`}>
                    {isChat ? <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div> : <Cpu size={18} />}
                    <span className="truncate max-w-[80px]">{selectedModel}</span>
                </div>
                <ChevronDown
                    size={isChat ? 12 : 16}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className={`absolute z-[100] space-y-4 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-3 shadow-2xl ${isChat ? 'right-0 bottom-full mb-2 w-64' : 'mt-2 ml-4 w-full'
                    }`}>
                    {modelGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 px-2 border-b border-gray-800 pb-1">{group.title}</div>
                            <div className="space-y-1">
                                {group.items.map((model, i) => {
                                    const isSelected = selectedModel === model.name || selectedModel === model.id;
                                    const isRecommended = recommendedModel && model.id.toLowerCase().replace(/[:\-_]/g, '').includes(recommendedModel.toLowerCase().replace(/[:\-_]/g, ''));

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                onSelect(model.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-start gap-3 p-2 rounded transition-colors text-left ${isSelected ? 'bg-cyber-primary/20 border border-cyber-primary/30' :
                                                isRecommended ? 'bg-cyber-secondary/10 border border-cyber-secondary/20' : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-xl">{model.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`font-medium text-xs ${isSelected ? 'text-cyber-primary' : isRecommended ? 'text-cyber-secondary' : 'text-white'} truncate`}>{model.name}</div>
                                                    {isRecommended && (
                                                        <span className="flex items-center gap-0.5 px-1 py-0.5 bg-cyber-secondary/20 text-[7px] text-cyber-secondary rounded border border-cyber-secondary/30 font-bold uppercase tracking-tighter">
                                                            <Cpu size={7} />
                                                            Recommended
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500">{model.purpose}</div>
                                            </div>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary self-center"></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
