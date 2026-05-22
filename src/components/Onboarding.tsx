import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, ShieldAlert, Bug, Globe, Loader2, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { useLearnerProfile } from '../store/learnerProfile';
import DomainSelection from './DomainSelection';

interface OnboardingProps {
  onComplete: (domain: string, profile: any) => void;
}

const AXIOM_PRESETS = [
  "Interesting. Let me probe deeper...",
  "Noted. Moving on.",
  "Your instincts are showing. Next.",
  "I've seen better. Let's continue."
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { state: learnerProfile, dispatch } = useLearnerProfile();
  const [step, setStep] = useState<'intro' | 'domain' | 'experience' | 'interview' | 'result'>('intro');
  const [selectedLevel, setSelectedLevel] = useState<'A' | 'B' | 'C' | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [typedQuestion, setTypedQuestion] = useState('');
  const [isTypingQuestion, setIsTypingQuestion] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  
  const [axiomPreset, setAxiomPreset] = useState<string | null>(null);
  const [isTypingPreset, setIsTypingPreset] = useState(false);
  
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(15); // Initial confidence
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (step === 'interview') {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parsedQuestion = useMemo(() => {
    if (!currentQuestion) return { text: '', options: null };
    const optionsMatch = currentQuestion.match(/([A-D]\).*?(?=(?:[A-D]\)|$)))/gs);
    if (optionsMatch && optionsMatch.length >= 2) {
      const textPart = currentQuestion.split(/A\)/)[0].trim();
      return { text: textPart, options: optionsMatch.map(o => o.trim()) };
    }
    return { text: currentQuestion, options: null };
  }, [currentQuestion]);

  useEffect(() => {
    if (parsedQuestion.text) {
      setTypedQuestion('');
      setIsTypingQuestion(true);
      setTimerKey(k => k + 1);
      let i = 0;
      const interval = setInterval(() => {
        setTypedQuestion(parsedQuestion.text.slice(0, i + 1));
        i++;
        if (i >= parsedQuestion.text.length) {
          clearInterval(interval);
          setIsTypingQuestion(false);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [parsedQuestion.text]);

  useEffect(() => {
    if (step === 'result' && profile) {
      const timer = setTimeout(() => {
        onComplete(learnerProfile?.domain || 'web', profile);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, profile, onComplete, learnerProfile]);

  const handleStartMission = () => {
    setStep('domain');
  };

  const getDifficultyContext = (level: 'A' | 'B' | 'C' | 'D' | 'E'): string => {
    switch (level) {
      case 'A':
        return `DIFFICULTY: NOVICE. The candidate has ZERO security experience. Questions MUST be simple, conceptual recognition (e.g., "What is a strong password?"). No technical jargon.`;
      case 'B':
        return `DIFFICULTY: BEGINNER. The candidate knows basic concepts. Questions should focus on identifying common threats (Phishing, Malware) and basic networking.`;
      case 'C':
        return `DIFFICULTY: INTERMEDIATE. The candidate has used tools. Questions should involve basic tool usage (Nmap flags, Wireshark filters) or interpreting simple logs.`;
      case 'D':
        return `DIFFICULTY: ADVANCED. The candidate has real lab experience. Focus on multi-step attacks, vulnerability analysis, and incident response procedures.`;
      case 'E':
        return `DIFFICULTY: EXPERT. The candidate is a professional. Focus on advanced forensics, complex CVE analysis, chained exploits, and enterprise-level architecture.`;
    }
  };

  const handleLevelSelect = async (level: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setSelectedLevel(level);
    setStep('interview');
    
    setIsThinking(true);
    setCurrentQuestion("Establishing secure channel. AXIOM is analyzing your profile...");

    try {
      const text = await aiService.complete({
        agent: 'axiom',
        systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile) + " NO JSON.",
        userMessage: `The candidate selected domain: ${learnerProfile?.domain}. ${getDifficultyContext(level)} Generate the very first assessment question for this candidate relevant to their domain. Output ONLY the question text. Do NOT use JSON. If giving options, use A) B) C) D) format.`,
        learnerProfile
      });

      setCurrentQuestion(text.trim());
    } catch (err) {
      console.error(err);
      setCurrentQuestion("Error establishing connection. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const mapLevelToActual = (profileLevel: string | undefined, fallback: 'A' | 'B' | 'C' | null): 'beginner' | 'intermediate' | 'advanced' => {
    const l = (profileLevel || '').toUpperCase();
    if (l.includes('ROOKIE') || l.includes('BEGINNER')) return 'beginner';
    if (l.includes('ANALYST') || l.includes('INTERMEDIATE')) return 'intermediate';
    if (l.includes('SPECIALIST') || l.includes('ADVANCED') || l.includes('EXPERT')) return 'advanced';
    const fallbackMap = { A: 'beginner', B: 'intermediate', C: 'advanced' } as const;
    return fallbackMap[fallback ?? 'A'];
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking || isTypingQuestion || isTypingPreset) return;
    const playerText = input;
    setInput('');
    setIsThinking(true);
    
    const preset = AXIOM_PRESETS[Math.floor(Math.random() * AXIOM_PRESETS.length)];
    setAxiomPreset('');
    setIsTypingPreset(true);
    
    for (let i = 0; i <= preset.length; i++) {
      setAxiomPreset(preset.slice(0, i));
      await new Promise(r => setTimeout(r, 1500 / preset.length));
    }
    setIsTypingPreset(false);
    
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    // Dynamic Termination: AXIOM decides when it has enough info, 
    // but we enforce a minimum of 3 and a maximum of 8 questions.
    const isMinReached = newCount >= 3;
    const isMaxReached = newCount >= 8;

    try {
      const completionCheck = await aiService.complete({
        agent: 'axiom',
        systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile) + " NO JSON. Your goal is to assess the user. If you have enough info, end the interview. Otherwise, ask a question.",
        userMessage: `User Answer: "${playerText}". 
        Current exchange count: ${newCount}. 
        Difficulty Context: ${getDifficultyContext(selectedLevel!)} 
        
        CRITICAL INSTRUCTIONS:
        1. If (and ONLY IF) you have a clear understanding of their skill level AND exchange count >= 3, output exactly "---COMPLETE---".
        2. Otherwise, output ONLY the next technical question. 
        3. Do NOT provide reasoning, thoughts, or internal states. 
        4. If this is exchange #8, you MUST output "---COMPLETE---".
        5. At the very end of your response, always include your current confidence in their placement as: ---CONFIDENCE: X--- where X is 0-100.`,
        learnerProfile
      });

      // Parse confidence if present
      const confMatch = completionCheck.match(/---CONFIDENCE: (\d+)---/);
      if (confMatch) {
        setAiConfidence(parseInt(confMatch[1]));
      }
      
      const cleanResponse = completionCheck.replace(/---CONFIDENCE: \d+---/, '').trim();

      if ((cleanResponse.includes('---COMPLETE---') && isMinReached) || isMaxReached) {
        setIsThinking(true);
        const fullText = await aiService.complete({
          agent: 'axiom',
          systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile) + " Output JSON profile only.",
          userMessage: `Final Answer: "${playerText}". Assessment complete. ${getDifficultyContext(selectedLevel!)} Initial Tier: ${selectedLevel === 'A' ? 'Rookie' : selectedLevel === 'B' ? 'Analyst' : 'Specialist'}. Based on answer quality relative to the difficulty tier, output a JSON profile only.`,
          learnerProfile
        });

        try {
          const cleanedJson = fullText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          setProfile(parsed);
          dispatch({ type: 'SET_ACTUAL_LEVEL', payload: mapLevelToActual(parsed.level, selectedLevel) });
          setStep('result');
        } catch (e) {
          setProfile({ 
            level: 'ANALYST', 
            placement_note: "Logic diagnostics complete. Optimal placement: Sector 7.",
            strong_areas: ['Logic', 'Observations']
          });
          dispatch({ type: 'SET_ACTUAL_LEVEL', payload: mapLevelToActual('ANALYST', selectedLevel) });
          setStep('result');
          setStep('result');
        }
      } else {
        let nextQ = cleanResponse;
        if (nextQ.includes('---QUESTION---')) {
          nextQ = nextQ.split('---QUESTION---')[1].trim();
        }
        setCurrentQuestion(nextQ);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const experienceOptions: Record<string, any> = (() => {
    switch (learnerProfile?.domain) {
      case 'web':
        return {
          A: <>I'm completely new to <span className="text-white">Web Security</span></>,
          B: <>I know basics like <span className="text-white">IPs, Phishing, and URL structures</span></>,
          C: <>I've used tools like <span className="text-white">Burp Suite or ZAP</span> for basic tasks</>,
          D: <>I can manually exploit <span className="text-white">XSS, SQLi, and IDOR</span> vulnerabilities</>,
          E: <>I perform <span className="text-white">professional web audits</span> and research CVEs</>
        };
      case 'network':
        return {
          A: <>I'm completely new to <span className="text-white">Network Security</span></>,
          B: <>I know how <span className="text-white">IPs and Routers</span> work conceptually</>,
          C: <>I've used <span className="text-white">Nmap or Wireshark</span> to scan local networks</>,
          D: <>I can perform <span className="text-white">packet analysis</span> and identify attack vectors</>,
          E: <>I manage <span className="text-white">enterprise infrastructure</span> and threat hunting</>
        };
      case 'malware':
        return {
          A: <>I've never looked at <span className="text-white">malicious code</span></>,
          B: <>I know what a <span className="text-white">virus does conceptually</span></>,
          C: <>I've used <span className="text-white">sandboxes</span> to run suspicious files</>,
          D: <>I can perform <span className="text-white">static/dynamic analysis</span> on samples</>,
          E: <>I <span className="text-white">reverse engineer</span> complex binaries and rootkits</>
        };
      case 'social_engineering':
        return {
          A: <>I'm new to <span className="text-white">Social Engineering</span></>,
          B: <>I know about <span className="text-white">Phishing and Pretexting</span> basics</>,
          C: <>I've studied <span className="text-white">psychological manipulation</span> techniques</>,
          D: <>I've run <span className="text-white">simulated phishing</span> campaigns or OSINT</>,
          E: <>I perform <span className="text-white">Red Team SE engagements</span> for companies</>
        };
      default:
        return {
          A: <>I'm curious about how attacks happen — <span className="text-white">I want to learn</span></>,
          B: <>I've poked around with <span className="text-white">security tools</span> before</>,
          C: <>I've completed <span className="text-white">CTFs or online labs</span></>,
          D: <>I have <span className="text-white">significant hands-on</span> hobbyist experience</>,
          E: <>I am a <span className="text-white">dedicated security professional</span></>
        };
    }
  })();

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col font-mono selection:bg-accent/30 selection:text-white">
      <style>{`
        @keyframes drainTimer {
          0% { width: 100%; background-color: #00ffff; }
          100% { width: 0%; background-color: #ff0000; }
        }
        .animate-drain {
          animation: drainTimer 60s linear forwards;
        }
      `}</style>
      
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-red-900/50 flex items-center justify-center pointer-events-none"
          >
            <h1 className="text-5xl font-black text-red-500 tracking-[0.5em] uppercase border-y-4 border-red-500 py-8 bg-black/80 w-full text-center shadow-[0_0_100px_rgba(239,68,68,0.5)]">
              [AXIOM]: UNAUTHORIZED ACTIVITY DETECTED
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Bar */}
      {step === 'interview' && (
        <div className="absolute top-6 right-8 z-50 flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Session Elapsed</span>
            <span className="text-sm font-black text-gray-400 tabular-nums">{formatTime(seconds)}</span>
          </div>
        </div>
      )}

      {/* Universal Header Area */}
      <div className="p-8 flex justify-between items-start pointer-events-none absolute top-0 w-full z-10">
        <div className="space-y-1">
          <div className="text-3xl font-black text-white italic tracking-tighter">CipherOS<span className="text-accent">_onboarding</span></div>
          <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Recruitment Protocol v2.1.0</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full"
          >
            <div className="space-y-8 bg-white/[0.02] border border-white/5 p-12 rounded-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black">AX</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">AXIOM Intelligence System — ACTIVE</span>
                  <span className="text-[8px] font-bold text-blue-400/50 uppercase tracking-tighter shrink-0">Transmission Priority: CRITICAL</span>
                </div>
              </div>

              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p className="text-lg font-black text-white italic mb-4">Operative,</p>
                <p><span className="text-accent font-black">CIPHER has gone dark.</span></p>
                <p>Three weeks ago, our most dangerous adversary vanished from every known channel. No transmissions. No attacks. Just silence.</p>
                <p>That's not retirement. That's preparation.</p>
                <p>We've been watching you. Your instincts, your curiosity — the way you think. CIPHER doesn't just target systems. They target people who aren't ready.</p>
                <p>We're building a team of analysts who can anticipate the next move before it happens. Not soldiers. <span className="text-accent font-black">Thinkers.</span></p>
                <p>You don't need to know everything yet. You just need to be willing to learn.</p>
                <p>If you're in — we begin your assessment now.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  onClick={handleStartMission}
                  className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded hover:bg-accent hover:text-white transition-all active:scale-95 flex-1 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {'>'} [ACCEPT MISSION]
                </button>
                <button
                  className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-black uppercase text-xs tracking-[0.2em] rounded hover:bg-white/10 transition-all flex-1"
                >
                  {'>'} [I need more information]
                </button>
              </div>

              <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/5 blur-[100px] pointer-events-none" />
            </div>
          </motion.div>
        )}

        {step === 'domain' && (
          <motion.div
            key="domain"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 w-full"
          >
            <DomainSelection onComplete={() => setStep('experience')} />
          </motion.div>
        )}

        {step === 'experience' && (
          <motion.div 
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full"
          >
            <div className="mb-12 text-center">
              <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-4 italic">
                How much do you know?
              </h1>
              <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
                "Before we assess you — how deep have you gone?" - AXIOM
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 w-full max-w-2xl mx-auto">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left hover:bg-white/[0.05] hover:border-accent/40 transition-all group flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-accent/10 group-hover:text-accent font-black border border-white/5 group-hover:border-accent/30 transition-all shrink-0 text-xs">{level}</div>
                  <div className="text-gray-300 font-bold text-xs tracking-wide leading-snug">
                    {experienceOptions[level]}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row p-8 pt-32 gap-8 max-w-7xl mx-auto w-full min-h-0 overflow-hidden"
          >
            {/* Left Column: AXIOM Card */}
            <div className="w-full md:w-[35%] flex flex-col gap-6 min-h-0 overflow-hidden">
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center h-full max-h-full relative overflow-hidden shadow-2xl">
                <div className="relative mb-8 mt-4">
                  <div className={cn("w-32 h-32 rounded-full border-2 flex items-center justify-center text-4xl font-black z-10 relative bg-black", isTypingQuestion || isTypingPreset ? "border-[#00ffff] text-[#00ffff] shadow-[0_0_50px_rgba(0,255,255,0.4)]" : "border-blue-500/30 text-blue-400 bg-blue-500/10")}>
                    AX
                  </div>
                  {/* Pulse ring animation while typing */}
                  {(isTypingQuestion || isTypingPreset) && (
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute -inset-0 border border-[#00ffff] rounded-full z-0"
                    />
                  )}
                </div>
                
                <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">AXIOM</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Senior SOC Analyst</p>
                
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                    Interview in Progress
                  </span>
                </div>

                {/* AXIOM Typewriter Response */}
                <div className="w-full mt-auto mb-8 min-h-[60px] flex items-center justify-center">
                  <p className="text-[#00ffff] font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {axiomPreset}
                    {isTypingPreset && <span className="animate-pulse">█</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interaction Area */}
            <div className="w-full md:w-[65%] flex flex-col gap-6 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl p-10 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                    <span className="text-xs font-black text-[#00ffff] uppercase tracking-[0.4em]">Question Protocol</span>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">0X0{exchangeCount + 1}</span>
                  </div>
                  
                  {/* Question Typewriter */}
                  <div className="text-lg font-mono text-gray-300 leading-relaxed min-h-[120px] whitespace-pre-wrap">
                    {typedQuestion}
                    {isTypingQuestion && <span className="animate-pulse text-[#00ffff]">█</span>}
                  </div>
                  
                  {/* Timer Bar */}
                  {!isTypingQuestion && !isThinking && !isTypingPreset && (
                    <div className="w-full h-1 bg-white/10 mt-8 overflow-hidden rounded-full relative">
                      <div 
                        key={timerKey} 
                        className="absolute top-0 bottom-0 left-0 animate-drain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-end mt-4">
                  {!isTypingQuestion && !isTypingPreset && (
                    parsedQuestion.options ? (
                      <div className="grid grid-cols-2 gap-4">
                        {parsedQuestion.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(opt)}
                            className={cn(
                              "p-6 text-left border rounded-xl font-mono text-sm transition-all group relative overflow-hidden", 
                              input === opt 
                                ? "bg-[#00ffff]/10 border-[#00ffff] text-white shadow-[0_0_20px_rgba(0,255,255,0.2)]" 
                                : "bg-black border-white/10 text-gray-400 hover:border-[#00ffff]/50"
                            )}
                          >
                            <span className="relative z-10">{opt}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00ffff]/0 to-[#00ffff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="absolute top-5 left-5 text-[#00ffff] font-black text-sm">{'>'}</div>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPaste={(e) => {
                            e.preventDefault();
                            setShowWarning(true);
                            setTimeout(() => setShowWarning(false), 3000);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (input.trim()) handleSendMessage();
                            }
                          }}
                          placeholder="Type your response or command..."
                          disabled={isThinking || isTypingQuestion}
                          className="w-full bg-black/80 border border-white/10 rounded-xl pl-12 pr-6 py-5 text-sm text-white font-mono min-h-[140px] focus:outline-none focus:border-[#00ffff]/50 transition-all placeholder:text-gray-700 disabled:opacity-50 resize-none"
                        />
                      </div>
                    )
                  )}
                  
                  <div className="flex items-center justify-between mt-8">
                    <div className="flex flex-col gap-1.5 w-48">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">AI Confidence</span>
                        <span className="text-[9px] font-black text-[#00ffff]">{aiConfidence}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: '15%' }}
                          animate={{ width: `${aiConfidence}%` }}
                          className="h-full bg-[#00ffff]"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isThinking || isTypingQuestion || isTypingPreset}
                      className="px-8 py-4 bg-[#00ffff] text-black font-black uppercase text-xs tracking-[0.2em] rounded hover:bg-white transition-all disabled:opacity-20 disabled:grayscale disabled:hover:bg-[#00ffff] shadow-[0_0_20px_rgba(0,255,255,0.2)] flex items-center gap-3"
                    >
                      {isThinking ? <Loader2 size={16} className="animate-spin" /> : 'Submit Response'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 mt-20"
          >
            <div className="max-w-xl w-full text-center">
              <div className="relative inline-block mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mx-auto"
                >
                  <Award size={48} />
                </motion.div>
                <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] px-2 py-0.5 font-black uppercase tracking-widest rounded border border-black transform rotate-6 shadow-xl">
                  {profile?.level || 'ANALYST'}
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">
                  Deployment Authorized.
                </h1>
                <p className="text-gray-400 text-lg font-medium leading-relaxed px-4">
                  "{profile?.placement_note || "Your investigative logic is sound, Operator. The system awaits."}"
                </p>
                
                <div className="flex flex-wrap justify-center gap-3 pt-6">
                   {profile?.strong_areas?.map((area: string) => (
                     <span key={area} className="text-[9px] font-black uppercase tracking-[0.2em] bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full text-accent shadow-[0_0_15px_rgba(29,158,117,0.1)]">
                        {area}
                     </span>
                   ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 text-accent animate-pulse">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">Synchronizing Deployment Protocol...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none -z-10 bg-[#050608]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_50%)] opacity-30" />
        <div className="scanline" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>
    </div>
  );
};
