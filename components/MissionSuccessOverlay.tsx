import React from 'react';
import { Trophy, Award, Zap, ArrowRight, Share2 } from 'lucide-react';
import { Button } from './Button';

interface MissionSuccessOverlayProps {
    missionTitle: string;
    skillFocus: string;
    xpEarned: number;
    onClose: () => void;
}

export const MissionSuccessOverlay: React.FC<MissionSuccessOverlayProps> = ({
    missionTitle,
    skillFocus,
    xpEarned,
    onClose
}) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" />

            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #00ff9d 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />

            {/* Card Container */}
            <div className="relative w-full max-w-lg bg-gray-900 border-2 border-cyber-primary p-8 rounded-2xl shadow-[0_0_50px_rgba(0,255,157,0.3)] animate-in zoom-in slide-in-from-bottom-10 duration-700">

                {/* Success Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-cyber-primary/20 flex items-center justify-center mb-4 border border-cyber-primary animate-pulse">
                        <Trophy size={40} className="text-cyber-primary" />
                    </div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">
                        MISSION <span className="text-cyber-primary">COMPLETE</span>
                    </h2>
                    <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">{missionTitle}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/50 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center">
                        <Award size={24} className="text-cyber-secondary mb-2" />
                        <span className="text-xs text-gray-500 uppercase font-bold">Skill Mastery</span>
                        <span className="text-white font-mono">{skillFocus.replace('_', ' ')}</span>
                    </div>
                    <div className="bg-black/50 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center">
                        <Zap size={24} className="text-yellow-500 mb-2" />
                        <span className="text-xs text-gray-500 uppercase font-bold">XP Gained</span>
                        <span className="text-white font-mono">+{xpEarned}</span>
                    </div>
                </div>

                {/* Quote/Motivation */}
                <div className="bg-gradient-to-r from-cyber-primary/10 to-transparent border-l-4 border-cyber-primary p-4 mb-8 italic text-gray-300 text-sm">
                    "Your precision in this sector has not gone unnoticed. The network is becoming clearer. Next level clearance pending."
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-gray-700 text-gray-400 hover:text-white"
                        onClick={() => { }} // Placeholder for share
                    >
                        <Share2 size={16} className="mr-2" /> SHARE
                    </Button>
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-cyber-primary text-black hover:bg-emerald-400 font-black"
                    >
                        CONTINUE <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-primary -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-primary translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-primary -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-primary translate-x-1 translate-y-1" />
            </div>
        </div>
    );
};
