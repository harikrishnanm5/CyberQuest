/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Taskbar } from './components/Taskbar';
import { Terminal } from './components/Terminal';
import { ActiveThreats } from './components/ActiveThreats';
import { BootScreen } from './components/BootScreen';
import { MissionBar } from './components/MissionBar';
import { SkillTracker } from './components/SkillTracker';
import { Onboarding } from './components/Onboarding';
import { Shield, Lock, Globe, Server, Activity, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type UIState = 'onboarding' | 'booting' | 'dashboard';

export default function App() {
  const [uiState, setUiState] = useState<UIState>('onboarding');
  const [sessionData, setSessionData] = useState<{ domain: string, profile: any } | null>(null);

  const handleOnboardingComplete = (domain: string, profile: any) => {
    setSessionData({ domain, profile });
    setUiState('booting');
  };

  const handleBootComplete = useCallback(() => {
    setUiState('dashboard');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg relative overflow-hidden selection:bg-accent/30 font-mono">
      <AnimatePresence mode="wait">
        {uiState === 'onboarding' && (
          <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
        )}
        
        {uiState === 'booting' && (
          <BootScreen key="boot" onComplete={handleBootComplete} />
        )}

        {uiState === 'dashboard' && (
          <motion.div 
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full"
          >
            {/* Background Ambience / Scanlines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-radial-[at_50%_40%] from-accent/5 via-transparent to-transparent opacity-50" />
              <div className="scanline" />
            </div>

            <Taskbar />

            <main className="flex-1 flex overflow-hidden relative z-10 border-t border-white/5">
              
              {/* Panel 1: Lead Workspace (Left) */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <MissionBar domain={sessionData?.domain} />
                
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                  {/* High Density Status Sub-Row */}
                  <div className="grid grid-cols-4 gap-3 flex-none">
                    <StatusCard 
                      icon={<Shield className="text-accent" size={14} />} 
                      label="Firewall" 
                      status="ACTIVE" 
                      subtext="Subnet: 10.0.x"
                    />
                    <StatusCard 
                      icon={<Lock className="text-accent" size={14} />} 
                      label="Crypto" 
                      status="AES-256" 
                      subtext="Volume: Secure"
                    />
                    <StatusCard 
                      icon={<Globe className="text-accent" size={14} />} 
                      label="Gateway" 
                      status="UP" 
                      subtext="Node: OSLO-01"
                    />
                    <StatusCard 
                      icon={<Server className="text-accent" size={14} />} 
                      label="Decoys" 
                      status="12 UP" 
                      subtext="Honeypots active"
                    />
                  </div>

                  {/* Terminal Area */}
                  <div className="flex-1 flex overflow-hidden min-h-0">
                    <Terminal title="operator@cipher-os:~/mission_control" />
                  </div>
                </div>
              </div>

              {/* Thin Vertical Divider */}
              <div className="w-px bg-white/5 shadow-[1px_0_0_rgba(255,255,255,0.02)]" />

              {/* Panels 2 & 3: Analyst Insights (Right) */}
              <div className="w-[320px] flex flex-col overflow-hidden bg-taskbar/40 backdrop-blur-xl">
                {/* Panel 2: AXIOM Chat */}
                <div className="flex-1 overflow-hidden flex flex-col border-b border-white/5">
                   <ActiveThreats />
                </div>

                {/* Panel 3: Skill XP Bars */}
                <div className="flex-none bg-white/[0.01]">
                   <SkillTracker level={sessionData?.profile?.level} />
                </div>
              </div>
            </main>

            {/* Retro Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  status: string;
  subtext: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, label, status, subtext }) => {
  return (
    <div className="bg-white/5 border border-white/5 p-2 rounded flex items-center gap-3 group hover:border-accent/40 hover:bg-white/[0.08] transition-all cursor-crosshair">
      <div className="p-1.5 bg-white/5 rounded transition-colors group-hover:bg-accent/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest truncate">{label}</div>
        <div className="text-[10px] font-black text-gray-200 truncate">{status}</div>
      </div>
    </div>
  );
}

