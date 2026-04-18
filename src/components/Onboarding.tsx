import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Network, ShieldAlert, Bug, Globe, Send, Loader2, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import * as aiService from '../services/aiService';
import { SYSTEM_PROMPTS } from '../services/prompts';
import { learnerProfile } from '../store/learnerProfile';

interface OnboardingProps {
  onComplete: (domain: string, profile: any) => void;
}

const domains = [
  { id: 'network', title: 'Network Forensics', icon: <Network size={20} />, description: 'Analyze traffic patterns and identify deep-packet anomalies.' },
  { id: 'phishing', title: 'Phishing & Social Eng', icon: <ShieldAlert size={20} />, description: 'Expose deceptive vectors and psychological manipulation.' },
  { id: 'malware', title: 'Malware Analysis', icon: <Bug size={20} />, description: 'Dissect malicious binaries and reverse-engineer threat payloads.' },
  { id: 'web', title: 'Web Exploitation', icon: <Globe size={20} />, description: 'Audit application logic and neutralize injection threats.' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'intro' | 'experience' | 'interview' | 'result'>('intro');
  const [selectedLevel, setSelectedLevel] = useState<'A' | 'B' | 'C' | null>(null);
  const [chat, setChat] = useState<{ role: 'axiom' | 'player', text: string }[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, isThinking]);

  const handleStartMission = () => {
    setStep('experience');
  };

  const handleLevelSelect = (level: 'A' | 'B' | 'C') => {
    setSelectedLevel(level);
    setStep('interview');
    
    let firstQuestion = "";
    if (level === 'A') {
      firstQuestion = "Curiosity is the sharpest weapon we have. Let's see how you observe. \n\nScenario: You get an email from your bank. Subject line: 'Urgent — verify your account or it will be suspended.' There's a link. What's your first instinct?";
    } else if (level === 'B') {
      firstQuestion = "Interesting. Experience without structure — that's actually useful. \n\nTell me about a time something felt 'off' about a system or message. What tipped you off?";
    } else {
      firstQuestion = "Noted. We'll skip the warmup. \n\nYou're analyzing outbound traffic logs and notice a machine making repeated small DNS queries to a subdomain pattern like: a1b2.telemetry-sync.net — every 4 minutes, exactly. \n\nWhat's your read?";
    }
    setCurrentQuestion(firstQuestion);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return;
    const playerText = input;
    setInput('');
    setChat(prev => [...prev, { role: 'player', text: playerText }]);
    setIsThinking(true);
    
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    if (newCount >= 5) {
      try {
        const fullText = await aiService.complete({
          agent: 'axiom',
          systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile) + " Output JSON profile only.",
          userMessage: `Final Answer: "${playerText}". Assessment complete. Initial Tier: ${selectedLevel === 'A' ? 'Rookie' : selectedLevel === 'B' ? 'Analyst' : 'Specialist'}.`,
          learnerProfile
        });

        try {
          const cleanedJson = fullText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          setProfile(parsed);
          setStep('result');
        } catch (e) {
          setProfile({ 
            level: 'ANALYST', 
            placement_note: "Logic diagnostics complete. Optimal placement: Sector 7.",
            strong_areas: ['Logic', 'Observations']
          });
          setStep('result');
        }
      } catch (err) {
        console.error(err);
        setStep('result'); // Fallback to proceed
      } finally {
        setIsThinking(false);
      }
    } else {
      try {
        const text = await aiService.complete({
          agent: 'axiom',
          systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile),
          userMessage: `User Answer: "${playerText}". Current exchange: ${newCount}/5. Ask the next question for level ${selectedLevel}. Use ---QUESTION--- separator.`,
          learnerProfile
        });

        if (text.includes('---QUESTION---')) {
          const parts = text.split('---QUESTION---');
          setLastFeedback(parts[0].trim());
          setCurrentQuestion(parts[1].trim());
        } else {
          setLastFeedback(text);
          // If no question separator, we might be stuck, but for mock it's okay.
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsThinking(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col font-mono selection:bg-accent/30 selection:text-white">
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

              {/* Background Glow */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/5 blur-[100px] pointer-events-none" />
            </div>
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
                What brings you here?
              </h1>
              <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
                "Before we place you in the field, I need to understand how you think. Not what you know. How you think. What describes you best?" - AXIOM
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={() => handleLevelSelect('A')}
                className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.05] hover:border-accent/40 transition-all group flex items-center gap-8"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-accent/10 group-hover:text-accent font-black border border-white/5 group-hover:border-accent/30 transition-all shrink-0">A</div>
                <div className="text-gray-300 font-bold text-sm tracking-wide">
                  I'm curious about how attacks happen — <span className="text-white">I want to understand the "why"</span>
                </div>
              </button>
              <button
                onClick={() => handleLevelSelect('B')}
                className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.05] hover:border-accent/40 transition-all group flex items-center gap-8"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-accent/10 group-hover:text-accent font-black border border-white/5 group-hover:border-accent/30 transition-all shrink-0">B</div>
                <div className="text-gray-300 font-bold text-sm tracking-wide">
                  I've poked around with security tools before, <span className="text-white">but nothing serious</span>
                </div>
              </button>
              <button
                onClick={() => handleLevelSelect('C')}
                className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.05] hover:border-accent/40 transition-all group flex items-center gap-8"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-accent/10 group-hover:text-accent font-black border border-white/5 group-hover:border-accent/30 transition-all shrink-0">C</div>
                <div className="text-gray-300 font-bold text-sm tracking-wide">
                  I know my way around — <span className="text-white">I want to be challenged</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row p-8 pt-32 gap-8 max-w-6xl mx-auto w-full"
          >
            {/* Left Column: AXIOM Card */}
            <div className="w-full md:w-80 flex flex-col gap-6">
              <div className="bg-taskbar/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-black shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                    AX
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -inset-3 border-2 border-accent/20 rounded-full"
                  />
                </div>
                
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-1">AXIOM</h2>
                <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-tighter mb-4">Senior SOC Analyst — CyberQuest</p>
                
                <div className="w-full py-2 bg-accent/5 border border-accent/20 rounded text-[9px] font-black text-accent uppercase tracking-[0.2em]">
                  Interview in Progress
                </div>

                {/* Feedback Bubble */}
                <AnimatePresence>
                  {lastFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-left relative"
                    >
                      <div className="absolute -top-1.5 left-4 w-3 h-3 bg-taskbar/100 border-l border-t border-blue-500/20 rotate-45" />
                      <p className="text-[11px] leading-relaxed text-blue-200">
                        {lastFeedback}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Interaction Area */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col relative overflow-hidden">
                <div className="mb-12">
                  <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 block">Question Protocol</span>
                  <div className="text-xl md:text-2xl font-black text-gray-200 leading-tight">
                    {currentQuestion || "Initializing assessment bridge..."}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-end">
                  <div className="relative group">
                    <div className="absolute top-4 left-4 text-accent font-black text-sm">{'>'}</div>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your response or command..."
                      disabled={isThinking}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-sm text-white font-mono min-h-[140px] focus:outline-none focus:border-accent/50 transition-all placeholder:text-gray-800 disabled:opacity-50 resize-none shadow-inner"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between w-48 mb-1">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Progress</span>
                        <span className="text-[9px] font-black text-accent">{exchangeCount} / 5</span>
                      </div>
                      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(exchangeCount / 5) * 100}%` }}
                          className="h-full bg-accent"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={isThinking || !input.trim()}
                      className="px-8 py-3 bg-accent text-white font-black uppercase text-xs tracking-widest rounded-lg hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale shadow-[0_0_20px_rgba(29,158,117,0.3)] flex items-center gap-2"
                    >
                      {isThinking ? <Loader2 size={14} className="animate-spin" /> : 'Submit Response'}
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

              <button
                onClick={() => {
                  const domainMap = {
                    'A': 'Security Fundamentals',
                    'B': 'Threat Operations',
                    'C': 'Advanced Offensive Analytics'
                  };
                  onComplete(domainMap[selectedLevel!] || 'General Operations', profile);
                }}
                className="group relative inline-flex items-center gap-4 px-16 py-6 bg-white text-black font-black uppercase text-sm tracking-[0.3em] rounded-xl hover:bg-accent hover:text-white transition-all active:scale-95 shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-b-4 border-gray-300 hover:border-accent-dark"
              >
                Begin mission
                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[#050608]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_50%)] opacity-30" />
        <div className="scanline" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>
    </div>
  );
};
