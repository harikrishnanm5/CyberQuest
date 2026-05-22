/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { Taskbar } from './components/Taskbar';
import { Terminal } from './components/Terminal';
import { ActiveThreats } from './components/ActiveThreats';
import { BootScreen } from './components/BootScreen';
import MissionBriefing from './components/MissionBriefing';
import MissionDebrief from './components/MissionDebrief';
import { MissionBar } from './components/MissionBar';
import { SkillTracker } from './components/SkillTracker';
import { Onboarding } from './components/Onboarding';
import MissionTerminal from './components/MissionTerminal';
import { MailClient } from './components/MailClient';
import { NetworkMap } from './components/NetworkMap';
import { SystemLogs } from './components/SystemLogs';
import { Shield, Lock, Globe, Server, Loader2, Cpu, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { generateMission } from './services/missionGenerator';

// ─── Screen state ─────────────────────────────────────────────────────────────

type Screen =
  | 'onboarding'   // Intro + domain + level + AXIOM interview (all in Onboarding)
  | 'generating'   // AI is building the adaptive mission
  | 'briefing'     // AXIOM presents mission brief
  | 'booting'      // CipherOS boot splash
  | 'terminal'     // Active mission: Terminal + AXIOM panel
  | 'debrief';     // Post-mortem screen

// ─── Mission data per domain ──────────────────────────────────────────────────

interface MissionData {
  targetOrgType: string;
  attackVector: string;
  objective: string;
  timeLimit: string;
  expectedCommands: string[];
  missionIdSuffix: string; // used to index REAL_WORLD_CONTEXT in MissionDebrief
}

const DOMAIN_MISSIONS: Record<string, MissionData[]> = {
  web: [
    {
      targetOrgType: 'Financial Services API',
      attackVector: 'JWT Manipulation / Injection',
      objective: 'Intercept and neutralize the data exfiltration point.',
      timeLimit: '08:00',
      expectedCommands: ['nmap', 'sqlmap', 'curl', 'jwt'],
      missionIdSuffix: '101',
    },
    {
      targetOrgType: 'E-Commerce Platform',
      attackVector: 'Cross-Site Scripting / Cookie Theft',
      objective: 'Trace the malicious script and patch the injection vector.',
      timeLimit: '09:00',
      expectedCommands: ['burpsuite', 'xss', 'cookie', 'csp'],
      missionIdSuffix: '101',
    },
  ],
  network: [
    {
      targetOrgType: 'Municipal Power Grid',
      attackVector: 'BGP Hijacking / MITM',
      objective: 'Identify the rogue node and restore routing integrity.',
      timeLimit: '10:00',
      expectedCommands: ['wireshark', 'tcpdump', 'iptables', 'nmap'],
      missionIdSuffix: '102',
    },
    {
      targetOrgType: 'Corporate WAN',
      attackVector: 'DNS Poisoning / Packet Injection',
      objective: 'Detect the forged DNS records and flush the poisoned cache.',
      timeLimit: '11:00',
      expectedCommands: ['dig', 'nslookup', 'tcpdump', 'nmap'],
      missionIdSuffix: '102',
    },
  ],
  malware: [
    {
      targetOrgType: 'Research Laboratory',
      attackVector: 'Polymorphic Ransomware',
      objective: 'Isolate the payload and decrypt the critical datasets.',
      timeLimit: '12:00',
      expectedCommands: ['ghidra', 'strace', 'strings', 'binwalk'],
      missionIdSuffix: '103',
    },
    {
      targetOrgType: 'Hospital Network',
      attackVector: 'Trojan Dropper / Lateral Movement',
      objective: 'Identify the initial access vector and quarantine infected nodes.',
      timeLimit: '14:00',
      expectedCommands: ['volatility', 'yara', 'strings', 'strace'],
      missionIdSuffix: '103',
    },
  ],
  social_engineering: [
    {
      targetOrgType: 'Government Intranet',
      attackVector: 'Spear Phishing / Credential Harvest',
      objective: 'Trace the origin and revoke compromised certificates.',
      timeLimit: '06:00',
      expectedCommands: ['whois', 'lookup', 'search', 'social-engineer'],
      missionIdSuffix: '104',
    },
    {
      targetOrgType: 'Tech Company HR Department',
      attackVector: 'Pretexting / Vishing',
      objective: 'Map the social graph and identify the compromised insider account.',
      timeLimit: '07:00',
      expectedCommands: ['osint', 'maltego', 'whois', 'hunt'],
      missionIdSuffix: '104',
    },
  ],
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [missionNumber, setMissionNumber] = useState(1);
  const [domain, setDomain]               = useState('web');
  const [profile, setProfile]             = useState<any>(null);
  const [currentMission, setCurrentMission] = useState<MissionData | null>(null);
  const [currentTab, setCurrentTab]       = useState<'terminal' | 'mail' | 'network' | 'logs'>('terminal');

  // Terminal session tracking (for debrief)
  const missionStartTime  = useRef<number>(Date.now());
  const commandsUsed      = useRef<string[]>([]);

  const missionId = currentMission ? `mission-${currentMission.missionIdSuffix}` : 'mission-000';

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Step 1 → 5: Onboarding complete
  const handleOnboardingComplete = async (completedDomain: string, completedProfile: any) => {
    setDomain(completedDomain);
    setProfile(completedProfile);
    setMissionNumber(1);
    setScreen('generating');
    
    try {
      const adaptiveMission = await generateMission(completedDomain, completedProfile);
      setCurrentMission(adaptiveMission);
      setScreen('briefing');
    } catch (error) {
      console.error("Failed to generate mission:", error);
      // Fallback to static mission if AI fails
      const pool = DOMAIN_MISSIONS[completedDomain] ?? DOMAIN_MISSIONS['web'];
      setCurrentMission(pool[0]);
      setScreen('briefing');
    }
  };

  const handleLaunchTool = (command: string) => {
    setCurrentTab('terminal');
    window.dispatchEvent(new CustomEvent('launch-kali-tool', { detail: command }));
  };

  // Step 5 → 6: Accept mission briefing
  const handleAcceptMission = useCallback(() => {
    missionStartTime.current = Date.now();
    commandsUsed.current = [];
    setScreen('booting');
  }, []);

  // Boot → Terminal
  const handleBootComplete = useCallback(() => {
    setScreen('terminal');
  }, []);

  // Step 6 → 7: Mission ends from terminal
  const handleMissionEnd = useCallback((commands: string[]) => {
    commandsUsed.current = commands;
    setScreen('debrief');
  }, []);

  // Step 7 → 5: Next mission (loop)
  const handleNextMission = useCallback(() => {
    setMissionNumber(prev => prev + 1);
    setScreen('briefing');
  }, []);

  // Step 7 → 1: Return to base (restart from onboarding)
  const handleReturnToBase = useCallback(() => {
    setMissionNumber(1);
    setScreen('onboarding');
  }, []);

  // Time elapsed since mission started
  const timeTaken = Math.round((Date.now() - missionStartTime.current) / 1000);

  // ── Shared fade transition ────────────────────────────────────────────────
  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit:    { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col h-screen bg-bg relative overflow-hidden selection:bg-accent/30 font-mono">
      <AnimatePresence mode="wait">

        {/* ── Screen 1–4: Full onboarding flow ───────────────────────── */}
        {screen === 'onboarding' && (
          <motion.div key="onboarding" {...fadeVariants} className="flex-1 flex flex-col">
            <Onboarding onComplete={handleOnboardingComplete} />
          </motion.div>
        )}

        {/* ── Screen: Generating Adaptive Mission ───────────────────────── */}
        {screen === 'generating' && (
          <motion.div 
            key="generating" 
            {...fadeVariants} 
            className="flex-1 flex flex-col items-center justify-center p-8 bg-bg relative overflow-hidden"
          >
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(29,158,117,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(29,158,117,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            <div className="max-w-md w-full text-center space-y-12 relative">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 90, 180, 270, 360],
                    borderColor: ['#1D9E75', '#00ffff', '#1D9E75']
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-3xl border-2 border-accent/30 mx-auto flex items-center justify-center bg-accent/5 backdrop-blur-xl"
                >
                  <Cpu className="text-accent" size={48} />
                </motion.div>
                
                {/* Orbital nodes */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full blur-[4px]" />
                </motion.div>
              </div>

              <div className="space-y-6">
                <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  Customizing your <span className="text-accent">Experience</span>
                </h1>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      <span>Synthesizing Scenarios</span>
                      <Loader2 className="animate-spin text-accent" size={12} />
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full w-1/3 bg-accent/50"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-40">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                      <Zap size={10} /> INJECTING RAG CONTEXT
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                      <Shield size={10} /> CALIBRATING DIFFICULTY
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                      <Globe size={10} /> MAPPING TARGET NODES
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em] animate-pulse">
                Establishing Neural Handshake...
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Screen 5: Mission Briefing ──────────────────────────────── */}
        {screen === 'briefing' && currentMission && (
          <motion.div key={`briefing-${missionNumber}`} {...fadeVariants} className="flex-1 flex flex-col">
            <MissionBriefing
              missionNumber={missionNumber}
              targetOrgType={currentMission.targetOrgType}
              attackVector={currentMission.attackVector}
              objective={currentMission.objective}
              timeLimit={currentMission.timeLimit}
              onAccept={handleAcceptMission}
            />
          </motion.div>
        )}

        {/* ── Boot Splash ─────────────────────────────────────────────── */}
        {screen === 'booting' && (
          <motion.div key="booting" {...fadeVariants} className="flex-1 flex flex-col">
            <BootScreen onComplete={handleBootComplete} />
          </motion.div>
        )}

        {/* ── Screen 6: Mission Terminal ──────────────────────────────── */}
        {screen === 'terminal' && (
          <motion.div
            key={`terminal-${missionNumber}`}
            {...fadeVariants}
            className="flex flex-col h-full w-full"
          >
            {/* Background Ambience / Scanlines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-radial-[at_50%_40%] from-accent/5 via-transparent to-transparent opacity-50" />
              <div className="scanline" />
            </div>

            <Taskbar 
              activeTab={currentTab} 
              onTabChange={setCurrentTab} 
              onLaunchTool={handleLaunchTool}
            />

            <main className="flex-1 flex overflow-hidden relative z-10 border-t border-white/5">

              {/* Panel 1: Lead Workspace (Left) */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <MissionBar domain={domain} />

                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative">
                  {/* View Switcher */}
                  <AnimatePresence mode="wait">
                    {currentTab === 'terminal' && (
                      <motion.div 
                        key="terminal-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="flex-1 flex flex-col gap-4 overflow-hidden"
                      >
                        {/* Status Sub-Row */}
                        <div className="grid grid-cols-4 gap-3 flex-none">
                          <StatusCard icon={<Shield className="text-accent" size={14} />} label="Firewall" status="ACTIVE"  subtext="Subnet: 10.0.x" />
                          <StatusCard icon={<Lock   className="text-accent" size={14} />} label="Crypto"   status="AES-256" subtext="Volume: Secure" />
                          <StatusCard icon={<Globe  className="text-accent" size={14} />} label="Gateway"  status="UP"      subtext="Node: OSLO-01" />
                          <StatusCard icon={<Server className="text-accent" size={14} />} label="Decoys"   status="12 UP"   subtext="Honeypots active" />
                        </div>

                        {/* Terminal */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                          <MissionTerminal
                            title={`operator@cipher-os:~/mission-${missionNumber}`}
                          />
                        </div>
                      </motion.div>
                    )}

                    {currentTab === 'mail' && (
                      <motion.div 
                        key="mail-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 overflow-hidden rounded-xl border border-white/5"
                      >
                        <MailClient />
                      </motion.div>
                    )}

                    {currentTab === 'network' && (
                      <motion.div 
                        key="network-view"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex-1 overflow-hidden rounded-xl border border-white/5"
                      >
                        <NetworkMap />
                      </motion.div>
                    )}

                    {currentTab === 'logs' && (
                      <motion.div 
                        key="logs-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 overflow-hidden rounded-xl border border-white/5"
                      >
                        <SystemLogs />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Thin Vertical Divider */}
              <div className="w-px bg-white/5 shadow-[1px_0_0_rgba(255,255,255,0.02)]" />

              {/* Panels 2 & 3: Analyst Insights (Right) */}
              <div className="w-[320px] flex flex-col overflow-hidden bg-taskbar/40 backdrop-blur-xl">
                <div className="flex-1 overflow-hidden flex flex-col border-b border-white/5">
                  <ActiveThreats />
                </div>
                <div className="flex-none bg-white/[0.01]">
                  <SkillTracker level={profile?.level} />
                </div>
              </div>
            </main>

            {/* Retro Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
          </motion.div>
        )}

        {/* ── Screen 7: Mission Debrief ───────────────────────────────── */}
        {screen === 'debrief' && (
          <motion.div key={`debrief-${missionNumber}`} {...fadeVariants} className="flex-1 flex flex-col">
            <MissionDebrief
              outcome="success"
              missionId={missionId}
              commandsUsed={commandsUsed.current}
              timeTaken={timeTaken}
              onNextMission={handleNextMission}
              onReturnToBase={handleReturnToBase}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─── StatusCard ───────────────────────────────────────────────────────────────

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  status: string;
  subtext: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, label, status, subtext }) => (
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
