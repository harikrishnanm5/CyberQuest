/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Clock, Terminal, Target, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { useLearnerProfile, LearnerProfile } from '../store/learnerProfile';

// ─── Real-world breach database ─────────────────────────────────────────────
const REAL_WORLD_CONTEXT: Record<string, { headline: string; cve: string; detail: string }> = {
  'mission-101': {
    headline: 'Capital One Data Breach (2019)',
    cve: 'CVE-2019-7609',
    detail: 'A misconfigured WAF and SSRF vulnerability allowed an attacker to exfiltrate over 100M records from AWS S3. The attack vector mirrors what you just simulated — JWT bypass and API endpoint probing to escalate privileges.',
  },
  'mission-102': {
    headline: 'SolarWinds Orion Supply Chain Attack (2020)',
    cve: 'CVE-2020-10148',
    detail: 'BGP manipulation and MITM positioning were used to intercept trusted node communication across critical infrastructure. Your network analysis scenario was modelled on this lateral movement pattern.',
  },
  'mission-103': {
    headline: 'WannaCry Ransomware (2017)',
    cve: 'CVE-2017-0144',
    detail: 'EternalBlue was weaponised to deploy a self-propagating ransomware payload across NHS systems within hours. The malware reverse engineering task you completed maps directly to early-stage IOC extraction from this incident.',
  },
  'mission-104': {
    headline: 'Twitter Spear Phishing Attack (2020)',
    cve: 'CVE-2020-TWITTER',
    detail: 'A targeted vishing and credential harvesting campaign compromised high-profile accounts by exploiting employee access controls. The pretexting and OSINT vectors you investigated were directly present here.',
  },
};

const DOMAIN_SKILLS: Record<string, { primary: keyof LearnerProfile['skillMap']; secondary: keyof LearnerProfile['skillMap'] }> = {
  web:               { primary: 'cve_identification',  secondary: 'header_forensics'    },
  network:           { primary: 'network_analysis',    secondary: 'cve_identification'  },
  malware:           { primary: 'cve_identification',  secondary: 'network_analysis'    },
  social_engineering:{ primary: 'phishing_analysis',   secondary: 'header_forensics'    },
};

const SKILL_LABELS: Record<keyof LearnerProfile['skillMap'], string> = {
  phishing_analysis: 'Phishing Analysis',
  header_forensics:  'Header Forensics',
  cve_identification:'CVE Identification',
  network_analysis:  'Network Analysis',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface MissionDebriefProps {
  outcome: 'success' | 'failure';
  missionId: string;
  commandsUsed: string[];
  timeTaken: number;
  onNextMission: () => void;
  onReturnToBase: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const MissionDebrief: React.FC<MissionDebriefProps> = ({
  outcome,
  missionId,
  commandsUsed,
  timeTaken,
  onNextMission,
  onReturnToBase,
}) => {
  const { state: learnerProfile, dispatch } = useLearnerProfile();

  const [debriefLines, setDebriefLines] = useState<string[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [xpAwarded, setXpAwarded]       = useState(false);

  const isSuccess  = outcome === 'success';
  const accentColor = isSuccess ? 'text-accent' : 'text-red-500';
  const headerText  = `MISSION ${isSuccess ? 'SUCCESS' : 'FAILURE'} — POST-MORTEM`;
  const accuracy    = commandsUsed.length > 0
    ? Math.min(100, Math.round((commandsUsed.filter(Boolean).length / Math.max(commandsUsed.length, 1)) * 100))
    : 0;

  const realWorld = REAL_WORLD_CONTEXT[missionId] ?? REAL_WORLD_CONTEXT['mission-101'];
  const domainSkills = DOMAIN_SKILLS[learnerProfile.domain ?? 'web'];
  const xpAmount = isSuccess ? 150 : 50;

  // Fetch debrief from AI
  useEffect(() => {
    const fetchDebrief = async () => {
      setIsLoading(true);
      try {
        const response = await aiService.complete({
          agent: 'debrief',
          systemPrompt: SYSTEM_PROMPTS.debrief(learnerProfile),
          userMessage: `Mission outcome: ${outcome.toUpperCase()}. Domain: ${learnerProfile.domain}. Commands used: ${commandsUsed.join(', ') || 'none'}. Time taken: ${timeTaken}s. Level: ${learnerProfile.actualLevel}. Write a 3–4 sentence post-mortem that covers what the analyst did well, what they missed, and one specific improvement.`,
          learnerProfile,
        });
        // Split into lines for stagger reveal
        const lines = response
          .split(/(?<=[.!?])\s+/)
          .map(s => s.trim())
          .filter(Boolean);
        setDebriefLines(lines.length ? lines : [response]);
      } catch {
        setDebriefLines(['[ERROR] Debrief data could not be retrieved. Check system logs.']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebrief();
  }, []);

  // Award XP/Skills after dramatic 1.5s delay
  useEffect(() => {
    if (!isLoading && !xpAwarded) {
      const timer = setTimeout(() => {
        dispatch({ type: 'ADD_XP', payload: xpAmount });
        dispatch({ type: 'UPDATE_SKILL', payload: { skill: domainSkills.primary,   delta: isSuccess ? 20 : 8  } });
        dispatch({ type: 'UPDATE_SKILL', payload: { skill: domainSkills.secondary,  delta: isSuccess ? 12 : 4  } });
        dispatch({ type: 'ADD_SESSION', payload: missionId });
        setXpAwarded(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const skillBars: { label: string; key: keyof LearnerProfile['skillMap']; delta: number }[] = [
    { label: SKILL_LABELS[domainSkills.primary],   key: domainSkills.primary,   delta: isSuccess ? 20 : 8  },
    { label: SKILL_LABELS[domainSkills.secondary],  key: domainSkills.secondary,  delta: isSuccess ? 12 : 4  },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#050608] font-mono overflow-y-auto">
      {/* Ambient scanline */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn('absolute inset-0 bg-radial-[at_50%_10%] via-transparent to-transparent opacity-20',
          isSuccess ? 'from-accent/10' : 'from-red-500/10')} />
        <div className="scanline" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-16 space-y-12">

        {/* ── 1. Typed Header ───────────────────────────────────────── */}
        <div className={cn('border-b pb-6', isSuccess ? 'border-accent/20' : 'border-red-500/20')}>
          <div className="flex items-center gap-3 mb-3">
            {isSuccess
              ? <ShieldCheck className="text-accent" size={22} />
              : <ShieldAlert className="text-red-500" size={22} />}
            <h1 className={cn('text-2xl font-black uppercase tracking-tighter italic', accentColor)}>
              {headerText.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.035 }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: 3, duration: 0.6, delay: headerText.length * 0.035 }}
                className={cn('inline-block w-2 ml-1 align-middle', isSuccess ? 'bg-accent' : 'bg-red-500')}
                style={{ height: '1em' }}
              />
            </h1>
          </div>
          <p className="text-gray-600 text-[10px] uppercase tracking-widest">
            Session ID: {learnerProfile.userId.slice(0, 8)} · Mission: {missionId}
          </p>
        </div>

        {/* ── 2. AI Debrief Card ────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
              AX
            </div>
            <div>
              <div className="text-[10px] font-black text-white uppercase tracking-widest">AXIOM — Incident Analysis</div>
              <div className="text-[8px] text-blue-400/50 uppercase">Post-mortem report</div>
            </div>
          </div>

          <AnimatePresence>
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-accent animate-pulse py-4">
                <span className="text-[10px] font-black uppercase tracking-widest">Compiling incident data</span>
                {[0,1,2].map(i => (
                  <motion.span key={i} animate={{ opacity:[0,1,0] }} transition={{ repeat:Infinity, duration:1.2, delay: i*0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                ))}
              </motion.div>
            ) : (
              <motion.div key="lines" className="space-y-3">
                {debriefLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.3 }}
                    className="text-gray-300 text-[12px] leading-relaxed"
                  >
                    {line}
                  </motion.p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 3. Stat Boxes ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { icon: <Clock size={16} className="text-accent" />, label: 'TIME', value: `${timeTaken}s` },
            { icon: <Terminal size={16} className="text-accent" />, label: 'COMMANDS', value: commandsUsed.length },
            { icon: <Target size={16} className={isSuccess ? 'text-accent' : 'text-red-400'} />, label: 'ACCURACY', value: `${accuracy}%` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 flex flex-col items-center gap-2 text-center">
              {icon}
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</span>
              <span className="text-xl font-black text-white tabular-nums">{value}</span>
            </div>
          ))}
        </motion.div>

        {/* ── 4. Real-World Breach ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">What Really Happened</span>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded">
              {realWorld.cve}
            </span>
          </div>
          <h3 className="text-white font-black text-sm">{realWorld.headline}</h3>
          <p className="text-gray-400 text-[11px] leading-relaxed">{realWorld.detail}</p>
        </motion.div>

        {/* ── 5. Skill XP Awards ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Skill Awards</span>
            <span className="ml-auto px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest rounded">
              +{xpAmount} XP
            </span>
          </div>

          <div className="space-y-3">
            {skillBars.map(({ label, key, delta }, idx) => {
              const currentVal = learnerProfile.skillMap[key];
              const newVal = Math.min(100, currentVal + delta);
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-gray-400">{label}</span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: xpAwarded ? 1 : 0 }}
                      className="text-accent"
                    >
                      +{delta}
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: `${currentVal}%` }}
                      animate={{ width: xpAwarded ? `${newVal}%` : `${currentVal}%` }}
                      transition={{ delay: 0.2 + idx * 0.15, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,157,0.4)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 6. Action Buttons ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex gap-4 pt-4 border-t border-white/5"
        >
          <button
            onClick={onNextMission}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-accent text-black font-black uppercase text-xs tracking-[0.2em] rounded hover:bg-accent/80 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,157,0.15)]"
          >
            <ChevronRight size={14} />
            [NEXT MISSION]
          </button>
          <button
            onClick={onReturnToBase}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-black uppercase text-xs tracking-[0.2em] rounded hover:bg-white/10 hover:text-white active:scale-95 transition-all"
          >
            <ChevronRight size={14} />
            [RETURN TO BASE]
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default MissionDebrief;
