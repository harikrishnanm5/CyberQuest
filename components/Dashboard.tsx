import React, { useState, useEffect, useRef } from 'react';
import { Shield, Target, Award, BrainCircuit, Activity, Terminal, LogOut, Fingerprint, Globe, Cloud, Wifi, SkipForward, Play, User, Zap, Loader2, Volume2, VolumeX, Calendar, Trophy, CheckCircle, Cpu, ChevronDown, Server } from 'lucide-react';
import { startInterviewSession, submitAnswerAndGetNext } from '../services/groqService';
import { generateLocalResponse, getLocalAIConfig, autoDetectLocalAI } from '../services/localAIService';
import { generateStoryMissions, getStoryIntroduction, StoryMission, STORY_ARC } from '../services/storyMissions';
import { KC7Dashboard } from './KC7Dashboard';
import { Achievements } from './Achievements';
import { LocalAIConfig } from './LocalAIConfig';
import { InterviewQuestion, AssessmentResult, SkillCategory, UserProfile, Mission } from '../types';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

import { TerminalPanel } from './TerminalPanel';
import { AliceSidebar } from './AliceSidebar';
import { MissionSuccessOverlay } from './MissionSuccessOverlay';
import { ModelsDropdown } from './ModelsDropdown';
import { saveUserProgress, getUserProgress } from '../services/userService';
import { terminalService } from '../services/TerminalService';
import { aliceService } from '../services/AliceService';
import { localTTSService } from '../services/localTTSService';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
   onLogout: () => void;
}

// --- Data ---
const INTERVIEWERS: Record<string, { name: string; role: string; image: string; color: string; bg: string; voice: string; gridIndex: number }> = {
   'Network_Ops': { name: "Titan", role: "Infrastructure Lead", image: "/interview-panel.png", color: "#10b981", bg: "from-emerald-900/20 to-black", voice: "Fenrir", gridIndex: 0 },
   'Web_Security': { name: "Neon", role: "Penetration Tester", image: "/interview-panel.png", color: "#f472b6", bg: "from-pink-900/20 to-black", voice: "Kore", gridIndex: 1 },
   'Cryptography': { name: "Professor Cipher", role: "Cryptanalyst", image: "/interview-panel.png", color: "#8b5cf6", bg: "from-purple-900/20 to-black", voice: "Puck", gridIndex: 2 },
   'Linux_Forensics': { name: "Root", role: "SysAdmin", image: "/interview-panel.png", color: "#f59e0b", bg: "from-amber-900/20 to-black", voice: "Charon", gridIndex: 3 },
   'Cloud_Defense': { name: "Azure", role: "Cloud Architect", image: "/interview-panel.png", color: "#0ea5e9", bg: "from-sky-900/20 to-black", voice: "Zephyr", gridIndex: 4 },
   'Threat_Intel': { name: "The Watcher", role: "Intelligence Officer", image: "/interview-panel.png", color: "#ef4444", bg: "from-red-900/20 to-black", voice: "Puck", gridIndex: 5 }
};

// Role assignments based on overall score
const ROLE_ASSIGNMENTS = [
   { minScore: 90, role: "Elite Cyber Sentinel", department: "Alpha Division", icon: "👑" },
   { minScore: 80, role: "Senior Security Architect", department: "Defense Grid", icon: "🛡️" },
   { minScore: 70, role: "Security Analyst", department: "Operations Center", icon: "🔍" },
   { minScore: 60, role: "Junior Penetration Tester", department: "Red Team", icon: "🎯" },
   { minScore: 50, role: "Security Intern", department: "Training Wing", icon: "🎓" },
   { minScore: 0, role: "Cyber Recruit", department: "Boot Camp", icon: "⭐" }
];

const getRoleByScore = (score: number) => {
   return ROLE_ASSIGNMENTS.find(r => score >= r.minScore) || ROLE_ASSIGNMENTS[ROLE_ASSIGNMENTS.length - 1];
};

const PANEL_ORDER: SkillCategory[] = ['Network_Ops', 'Web_Security', 'Cryptography', 'Linux_Forensics', 'Cloud_Defense', 'Threat_Intel'];

// Helper to find interviewer data by name (for mentor lookup)
const getInterviewerByName = (name: string) => {
   return Object.values(INTERVIEWERS).find(i => name.includes(i.name) || i.name.includes(name)) || INTERVIEWERS['Network_Ops'];
};

// Typewriter only (no TTS) - fixed speed
const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
   const [displayed, setDisplayed] = useState('');
   const indexRef = useRef(0);
   useEffect(() => {
      setDisplayed('');
      indexRef.current = 0;
      const interval = setInterval(() => {
         if (indexRef.current < text.length) {
            setDisplayed((prev) => prev + text.charAt(indexRef.current));
            indexRef.current++;
         } else {
            clearInterval(interval);
            if (onComplete) onComplete();
         }
      }, 20);
      return () => clearInterval(interval);
   }, [text]);
   return <span>{displayed}</span>;
};

// Typewriter + TTS in sync: text and voice start together and finish together
const TypewriterWithTTS = ({
   text,
   audioUrl,
   durationMs,
   muted,
   onComplete,
   onSkip,
}: {
   text: string;
   audioUrl: string;
   durationMs: number;
   muted: boolean;
   onComplete: () => void;
   onSkip?: () => void;
}) => {
   const [displayed, setDisplayed] = useState('');
   const indexRef = useRef(0);
   const audioRef = useRef<HTMLAudioElement | null>(null);
   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

   useEffect(() => {
      setDisplayed('');
      indexRef.current = 0;
      const len = text.length;
      if (len === 0) {
         onComplete();
         return;
      }
      // Faster TTS: use 0.7x duration so text and voice finish sooner; tighter typewriter range
      const effectiveDurationMs = durationMs * 0.7;
      const intervalMs = Math.max(8, Math.min(50, Math.floor(effectiveDurationMs / len)));
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = 1.25;
      if (!muted) {
         audio.play().catch(() => { });
      }
      intervalRef.current = setInterval(() => {
         if (indexRef.current < len) {
            setDisplayed((prev) => prev + text.charAt(indexRef.current));
            indexRef.current++;
         } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            onComplete();
         }
      }, intervalMs);
      const onEnded = () => {
         audioRef.current = null;
      };
      audio.addEventListener('ended', onEnded);
      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
         audio.removeEventListener('ended', onEnded);
         audio.pause();
         audioRef.current = null;
      };
   }, [text, audioUrl, durationMs, muted]);

   const handleSkip = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (audioRef.current) audioRef.current.pause();
      setDisplayed(text);
      onComplete();
      onSkip?.();
   };

   return (
      <span>
         {displayed}
         {displayed.length < text.length && onSkip != null && (
            <button
               type="button"
               onClick={handleSkip}
               className="ml-2 text-xs text-gray-500 hover:text-white transition-colors align-baseline"
               aria-label="Skip to end"
            >
               <SkipForward size={12} className="inline" />
            </button>
         )}
      </span>
   );
};

// Hexagon Chart Component
const HexagonChart: React.FC<{ metrics: AssessmentResult['metrics'] }> = ({ metrics }) => {
   const size = 300;
   const center = size / 2;
   const radius = (size / 2) - 40;
   const getPoint = (index: number, value: number) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      const r = (value / 100) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
   };
   return (
      <div className="relative w-full max-w-[300px] mx-auto aspect-square">
         <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            <polygon points={metrics.map((_, i) => getPoint(i, 100)).join(' ')} className="fill-gray-900 stroke-gray-700 stroke-1" />
            {[0.25, 0.5, 0.75].map((scale, idx) => (
               <polygon key={idx} points={metrics.map((_, i) => getPoint(i, 100 * scale)).join(' ')} className="fill-none stroke-gray-800 stroke-1" />
            ))}
            <polygon points={metrics.map((m, i) => getPoint(i, m.score)).join(' ')} className="fill-cyber-primary/20 stroke-cyber-primary stroke-2 animate-in zoom-in duration-1000" />
            {metrics.map((m, i) => {
               const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
               const x = center + (radius + 20) * Math.cos(angle);
               const y = center + (radius + 20) * Math.sin(angle);
               return (
                  <g key={m.category}>
                     <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px] font-mono uppercase">{m.category.replace('_', ' ')}</text>
                  </g>
               );
            })}
         </svg>
      </div>
   );
};

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
   const { user } = useAuth();
   const { t, language } = useLanguage();
   const [view, setView] = useState<'home' | 'interview' | 'results' | 'mission' | 'kc7' | 'achievements' | 'overview' | 'events' | 'localai'>('home');
   const [loading, setLoading] = useState(false);
   const [initialLoading, setInitialLoading] = useState(true);

   // Interview State
   const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
   const [result, setResult] = useState<AssessmentResult | null>(null);
   const [questionNumber, setQuestionNumber] = useState(1);

   // Profile & Mission State
   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
   const [activeMission, setActiveMission] = useState<Mission | null>(null);
   const [missionTab, setMissionTab] = useState<'brief' | 'terminal' | 'alice'>('brief');
   const [assessmentCompleted, setAssessmentCompleted] = useState(false); // Track if initial assessment is done

   // Local AI State
   const [localAIConnected, setLocalAIConnected] = useState(false);
   const [localAIModel, setLocalAIModel] = useState('');
   const [recommendedModel, setRecommendedModel] = useState('');
   const [aliceUsingFallback, setAliceUsingFallback] = useState(false);

   // Mission Progress State
   const [missionProgress, setMissionProgress] = useState<{
      completedObjectives: number[];
      currentStep: number;
      commandsExecuted: string[];
   }>({
      completedObjectives: [],
      currentStep: 0,
      commandsExecuted: []
   });

   // Mission Terminal State
   const [terminalHistory, setTerminalHistory] = useState<{ role: 'system' | 'user' | 'output', text: string }[]>([
      { role: 'system', text: 'MISSION TERMINAL v2.0 - Type "help" for available commands' }
   ]);

   // Alice AI Chat State
   const [aliceChatHistory, setAliceChatHistory] = useState<{ role: 'ai' | 'user', text: string }[]>([
      { role: 'ai', text: 'Hi! I\'m Alice, your AI assistant. I can help you with hints, explain concepts, or guide you through this mission. How can I help?' }
   ]);
   const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

   // UI State
   const [textFinished, setTextFinished] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [ttsLoading, setTtsLoading] = useState(false);
   const [stallMessage, setStallMessage] = useState<string | null>(null);
   const stallAudioRef = useRef<HTMLAudioElement | null>(null);
   const stallCacheRef = useRef<Map<string, string>>(new Map());
   const prevTtsUrlRef = useRef<string | null>(null);
   const [selectedAI, setSelectedAI] = useState('Groq');

   // Short reactions shown (and optionally spoken) while next question loads
   const STALL_PHRASES = ['Interesting...', 'Ok.', 'Oh.', 'I see.', 'Hmm.', 'Right.', 'Noted.', 'Understood.', 'Good.', 'Nice.'];

   // Load user progress from Firestore on mount
   useEffect(() => {
      let isMounted = true;

      const loadUserProgress = async () => {
         if (!user) {
            if (isMounted) setInitialLoading(false);
            return;
         }

         try {
            const data = await getUserProgress(user.uid);
            if (isMounted && data) {
               if (data.assessmentResult) {
                  setResult(data.assessmentResult);
               }
               if (data.userProfile) {
                  setUserProfile(data.userProfile);
               }
            }
         } catch (error) {
            // Firestore read might fail due to security rules - that's OK, user just hasn't done assessment yet
            console.warn('Could not load user progress (may not exist yet):', error);
         } finally {
            if (isMounted) setInitialLoading(false);
         }
      };

      loadUserProgress();

      return () => { isMounted = false };
   }, [user]);

   // Auto-detect local AI on mount
   useEffect(() => {
      const detectLocalAI = async () => {
         const detection = await autoDetectLocalAI();
         setLocalAIConnected(detection.connected);
         setLocalAIModel(detection.model);

         if (detection.connected) {
            console.log(`✅ Local AI auto-detected: ${detection.provider} (${detection.model})`);
         } else {
            console.log('⚠️ No local AI detected. Alice will use fallback responses.');
         }
      };

      detectLocalAI();
   }, []);

   // --- Initialization ---
   useEffect(() => {
      const initAlice = async () => {
         try {
            await aliceService.initOnnx();
            setLocalAIConnected(true);
         } catch (e) {
            console.error('Alice Init failed:', e);
            setLocalAIConnected(false);
         }
      };
      if (view === 'mission') initAlice();
   }, [view]);

   // Save progress to Firestore when result or userProfile changes (skip initial load to avoid overwriting)
   useEffect(() => {
      if (!user || initialLoading) return;
      if (!result && !userProfile) return;

      const saveProgress = async () => {
         try {
            await saveUserProgress(user.uid, {
               assessmentResult: result || undefined,
               userProfile: userProfile || undefined
            });
         } catch (error) {
            // Firestore write might fail due to security rules - log but don't crash
            console.warn('Could not save user progress (check Firestore rules):', error);
         }
      };

      saveProgress();
   }, [result, userProfile, user, initialLoading]);

   // Fetch Local TTS when interview question changes
   useEffect(() => {
      if (view !== 'interview' || !currentQuestion?.text) {
         setTtsLoading(false);
         return;
      }
      if (!isMuted) {
         setTtsLoading(true);
         localTTSService.getSpeechLocal(currentQuestion.text, currentQuestion.topic)
            .catch((err) => console.warn('Local TTS failed:', err))
            .finally(() => setTtsLoading(false));
      }
      return () => {
         localTTSService.stop(); // Stop any pending local speech
      };
   }, [view, currentQuestion?.id, currentQuestion?.text, currentQuestion?.topic, isMuted]);

   // Preload is removed for local TTS as it's nearly instant and doesn't require cloud caching

   // --- Interview Logic ---
   const startInterview = async () => {
      setLoading(true);
      setQuestionNumber(1);
      setCurrentQuestion(null);
      setView('interview');
      setTextFinished(false);
      try {
         const q = await startInterviewSession();
         setCurrentQuestion(q);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
   };

   const handleInterviewAnswer = async (answer: string) => {
      setTextFinished(false);
      const phrase = STALL_PHRASES[Math.floor(Math.random() * STALL_PHRASES.length)];
      setStallMessage(phrase);
      setLoading(true);
      if (!isMuted && phrase) {
         localTTSService.getSpeechLocal(phrase, currentQuestion?.topic).catch(() => { });
      }
      try {
         const response = await submitAnswerAndGetNext(answer, questionNumber);
         if (stallAudioRef.current) {
            try { stallAudioRef.current.pause(); } catch (_) { }
            stallAudioRef.current = null;
         }
         setStallMessage(null);
         if (response.result) {
            setResult(response.result);
            setView('results');
         } else if (response.nextQuestion) {
            setCurrentQuestion(response.nextQuestion);
            setQuestionNumber(prev => prev + 1);
         }
      } catch (e) { console.error(e); }
      finally {
         setStallMessage(null);
         setLoading(false);
      }
   };

   // --- Career & Mission Logic ---
   const handleAcceptAssignment = async () => {
      if (!result) return;
      setLoading(true);
      try {
         // Use score-based role assignment
         const assignedRole = getRoleByScore(result.overallScore);

         // Find best skill for mentor assignment
         const bestMetric = result.metrics.reduce((best, current) => current.score > best.score ? current : best);
         const mentorName = INTERVIEWERS[bestMetric.category]?.name || 'Titan';

         // Generate story-based missions from weakest skills
         const storyMissions = generateStoryMissions(result.metrics, result.overallScore);

         const profile: UserProfile = {
            role: assignedRole.role,
            department: assignedRole.department,
            mentor: mentorName,
            missions: storyMissions
         };

         setUserProfile(profile);
         setAssessmentCompleted(true); // Mark assessment as completed
         // Redirect to Overview after assignment
         setView('overview');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
   };

   const startMission = async (mission: Mission) => {
      if (!userProfile) return;
      setLoading(true);
      setActiveMission(mission);
      setMissionTab('brief');
      // Reset terminal, alice chat, and mission progress for new mission
      setTerminalHistory([
         { role: 'system', text: `MISSION: ${mission.title}` },
         { role: 'system', text: 'Type "help" for available commands' }
      ]);
      setMissionProgress({
         completedObjectives: [],
         currentStep: 0,
         commandsExecuted: []
      });
      // Generate contextual welcome message based on mission
      const getWelcomeMessage = (m: Mission) => {
         const skillFocus = m.skillFocus.replace('_', ' ').toLowerCase();

         if (skillFocus.includes('penetration') || skillFocus.includes('exploitation')) {
            return `Hi! I'm Alice, your guide for "${m.title}". This mission focuses on ${skillFocus}. Start by scanning the target with nmap to discover open ports. Need help with any specific step?`;
         } else if (skillFocus.includes('network')) {
            return `Hello! I'm Alice, here to help with "${m.title}". We'll be working on ${skillFocus}. Begin by analyzing the network topology. What would you like to explore first?`;
         } else if (skillFocus.includes('forensics')) {
            return `Hi! I'm Alice, your forensic analysis assistant for "${m.title}". This mission involves ${skillFocus}. Start by examining the provided evidence files. Let me know if you need guidance!`;
         } else if (skillFocus.includes('cryptography')) {
            return `Hello! I'm Alice, ready to help with "${m.title}". We'll tackle ${skillFocus} challenges. Identify the cipher type first, then work on decryption. Need a hint?`;
         } else {
            return `Hi! I'm Alice, your AI assistant for "${m.title}". This ${m.difficulty.toLowerCase()} mission focuses on ${skillFocus}. I know the objectives and can guide you step-by-step. What would you like to do first?`;
         }
      };

      setAliceChatHistory([
         { role: 'ai', text: getWelcomeMessage(mission) }
      ]);
      try {
         setView('mission');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
   };

   // Check if command advances mission objectives
   const checkMissionProgress = (cmd: string): { advanced: boolean; message?: string; objectiveCompleted?: number } => {
      const storyMission = activeMission as StoryMission;
      if (!storyMission.objectives || !storyMission.terminalCommands) return { advanced: false };

      const lowerCmd = cmd.toLowerCase();
      const baseCmd = lowerCmd.split(' ')[0];

      // Track command execution
      const newCommands = [...missionProgress.commandsExecuted, baseCmd];

      // Check if command is relevant to current objective
      const currentObjectiveIndex = missionProgress.currentStep;
      const expectedCommands = storyMission.terminalCommands;

      // Simple progression logic based on command type and mission skill
      const skillFocus = activeMission.skillFocus;
      let advanced = false;
      let objectiveCompleted: number | undefined;
      let message: string | undefined;

      // Network Ops - Step by step progression
      if (skillFocus === 'Network_Ops') {
         if (currentObjectiveIndex === 0 && (baseCmd === 'ping' || baseCmd === 'nmap')) {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: Network scan initiated. Host discovered!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'nmap' && lowerCmd.includes('-sV')) {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: Service versions identified. Vulnerabilities found!";
         } else if (currentObjectiveIndex === 2 && (baseCmd === 'traceroute' || baseCmd === 'whois')) {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: Network path analyzed!";
         }
      }
      // Web Security progression
      else if (skillFocus === 'Web_Security') {
         if (currentObjectiveIndex === 0 && (baseCmd === 'dirb' || baseCmd === 'gobuster')) {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: Application structure mapped!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'curl') {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: Web requests analyzed!";
         } else if (currentObjectiveIndex === 2 && baseCmd === 'sqlmap') {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: SQL injection vulnerability confirmed!";
         }
      }
      // Linux Forensics progression
      else if (skillFocus === 'Linux_Forensics') {
         if (currentObjectiveIndex === 0 && baseCmd === 'strings') {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: File analysis started!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'grep') {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: Log analysis in progress!";
         } else if (currentObjectiveIndex === 2 && (baseCmd === 'find' || baseCmd === 'file')) {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: Evidence recovered!";
         }
      }
      // Cryptography progression
      else if (skillFocus === 'Cryptography') {
         if (currentObjectiveIndex === 0 && (baseCmd === 'base64' || baseCmd === 'hash')) {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: Encoding analyzed!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'strings') {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: Cipher patterns identified!";
         } else if (currentObjectiveIndex === 2 && baseCmd === 'openssl') {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: Decryption successful!";
         }
      }
      // Cloud Defense progression
      else if (skillFocus === 'Cloud_Defense') {
         if (currentObjectiveIndex === 0 && (baseCmd === 'aws' || baseCmd === 'curl')) {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: Cloud resources enumerated!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'dig') {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: DNS records analyzed!";
         } else if (currentObjectiveIndex === 2 && baseCmd === 'nslookup') {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: Infrastructure mapped!";
         }
      }
      // Threat Intel progression
      else if (skillFocus === 'Threat_Intel') {
         if (currentObjectiveIndex === 0 && baseCmd === 'whois') {
            advanced = true;
            objectiveCompleted = 0;
            message = "✅ Objective 1 Complete: IOCs compiled!";
         } else if (currentObjectiveIndex === 1 && baseCmd === 'grep') {
            advanced = true;
            objectiveCompleted = 1;
            message = "✅ Objective 2 Complete: Patterns analyzed!";
         } else if (currentObjectiveIndex === 2 && baseCmd === 'dig') {
            advanced = true;
            objectiveCompleted = 2;
            message = "✅ Objective 3 Complete: Threat intelligence gathered!";
         }
      }

      // Generic progression for any valid command
      if (!advanced && expectedCommands.includes(baseCmd)) {
         // Check if we've used enough different commands to advance
         const uniqueCommands = [...new Set(newCommands)];
         if (uniqueCommands.length > missionProgress.currentStep + 1) {
            advanced = true;
            objectiveCompleted = currentObjectiveIndex;
            message = `✅ Objective ${currentObjectiveIndex + 1} Complete: Progress tracked!`;
         }
      }

      return { advanced, message, objectiveCompleted };
   };

   // Terminal command handler
   const handleTerminalCommand = async (cmd: string) => {
      if (!cmd.trim() || !activeMission) return;
      setTerminalHistory(prev => [...prev, { role: 'user', text: `$ ${cmd}` }]);

      // Simulate command processing
      setTimeout(() => {
         let response = '';
         const lowerCmd = cmd.toLowerCase();
         const args = lowerCmd.split(' ');
         const baseCmd = args[0];

         // Check if command advances mission
         const progress = checkMissionProgress(cmd);
         if (progress.advanced && progress.objectiveCompleted !== undefined) {
            // Update mission progress
            setMissionProgress(prev => ({
               completedObjectives: [...prev.completedObjectives, progress.objectiveCompleted!],
               currentStep: prev.currentStep + 1,
               commandsExecuted: [...prev.commandsExecuted, baseCmd]
            }));

            // Add progress message to response
            response += `\n${progress.message}\n`;

            // Check if all objectives completed
            const storyMission = activeMission as StoryMission;
            if (progress.objectiveCompleted === (storyMission.objectives?.length || 3) - 1) {
               response += `\n🎉 MISSION COMPLETE! All objectives achieved.\n`;
               response += `Use the terminal to practice more commands or exit to claim your rewards.\n`;
            } else {
               response += `\n📋 Next Objective: ${storyMission.objectives?.[progress.objectiveCompleted + 1] || 'Continue investigation'}\n`;
            }
         }

         const result = terminalService.execute(cmd, {
            activeMission,
            missionProgress
         });

         if (result.clear) {
            setTerminalHistory([{ role: 'system', text: 'Terminal cleared.' }]);
            return;
         }

         response = result.output;

         setTerminalHistory(prev => [...prev, { role: 'output', text: response }]);
      }, 500 + Math.random() * 500);
   };

   // Alice AI chat handler - Tries Local AI → Groq → Fallback
   const handleAliceMessage = async (msg: string) => {
      if (!msg.trim() || !userProfile) return;
      setAliceChatHistory(prev => [...prev, { role: 'user', text: msg }]);

      // Show typing indicator
      setAliceChatHistory(prev => [...prev, { role: 'ai', text: '...' }]);

      // Build comprehensive mission context for Alice
      const storyMission = activeMission as StoryMission;
      const completedObjectives = missionProgress.completedObjectives.map(idx => storyMission.objectives?.[idx]);
      const remainingObjectives = storyMission.objectives?.filter((_, idx) => !missionProgress.completedObjectives.includes(idx));
      const currentStepObj = storyMission.objectives?.[missionProgress.currentStep];

      const missionContext = activeMission ? `
STORY CONTEXT - Operation: Shadow Network
Mission: ${activeMission.title}
Description: ${activeMission.description}
Difficulty: ${activeMission.difficulty}
Skill Focus: ${activeMission.skillFocus.replace('_', ' ')}

USER PROGRESS:
- Completed Objectives: ${completedObjectives.length > 0 ? completedObjectives.join(', ') : 'None yet'}
- CURRENT Objective to work on: ${currentStepObj || 'Mission wrap-up'}
- Remaining Objectives: ${remainingObjectives && remainingObjectives.length > 1 ? remainingObjectives.slice(1).join(', ') : 'None'}

AVAILABLE TOOLS FOR THIS MISSION:
${storyMission.terminalCommands?.join(', ') || 'nmap, curl, grep, find'}

EXPECTED OUTCOME:
${storyMission.expectedOutcome || 'Successfully complete the mission objectives'}

STEP-BY-STEP GUIDANCE APPROACH:
1. Identify which objective the student is currently working on
2. Provide the NEXT logical step they should take (not the full solution)
3. Suggest specific commands from the available tools list
4. Reference the story context - they're investigating "The Shadows"
5. If stuck, use these hints: ${storyMission.hints?.slice(0, 2).join(' | ') || 'Check logs, scan the network'}

IMPORTANT: Keep the narrative immersive. The student is part of "Operation: Shadow Network" tracking a cyber threat group.
` : 'General cybersecurity training mission';

      const systemPrompt = `You are Alice, an AI cybersecurity mentor helping a student with a mission. 
${missionContext}

YOUR ROLE:
- Guide students to DISCOVER solutions themselves, never give direct answers
- Ask probing questions that lead them to the right approach
- Provide hints and direction, not step-by-step instructions
- Encourage critical thinking and problem-solving
- Keep responses concise (2-3 sentences max)

STRICT GUIDELINES - NEVER BREAK THESE:
1. NEVER give exact commands with all parameters - suggest the tool and let them figure out syntax
2. NEVER reveal passwords, flags, or hidden data directly
3. NEVER say "type this exact command" - instead say "try using nmap to..."
4. NEVER solve the objective for them - guide them to the solution
5. If they ask "what's the answer?" or "just tell me", respond with "I can't give you the answer, but I can help you find it. What have you tried so far?"

HELPFUL GUIDANCE APPROACH:
- Instead of: "Type 'nmap -sV 192.168.1.1'" → Say: "Consider scanning the target to discover services. What tool could help with that?"
- Instead of: "The password is 'admin123'" → Say: "Look for common weak credentials. Have you tried analyzing the login patterns?"
- Instead of: "Use SQL injection with ' OR 1=1 --" → Say: "The login form might be vulnerable to injection. How could you test for that safely?"
- Instead of: "The flag is in /etc/passwd" → Say: "Sensitive files often contain valuable information. Where might user data be stored?"

Socratic questioning - help them think, don't think for them.`;

      // Try Local AI (ALICE) if selected
      if (selectedAI !== 'Groq') {
         try {
            const response = await aliceService.getHint(msg, {
               activeMission,
               missionProgress
            });

            if (!response) throw new Error('Empty response from ALICE');

            setAliceChatHistory(prev => {
               const filtered = prev.filter(m => m.text !== '...');
               return [...filtered, { role: 'ai', text: response.trim() }];
            });
            setAliceUsingFallback(false);
            return;
         } catch (localError) {
            console.log('ALICE Local Engine failed, trying Groq:', localError);
         }
      }

      // Try Groq as fallback or if selected
      try {
         const groq = await import('groq-sdk');
         const groqClient = new groq.default({
            apiKey: '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',
            dangerouslyAllowBrowser: true
         });

         const completion = await groqClient.chat.completions.create({
            messages: [
               { role: 'system', content: systemPrompt },
               { role: 'user', content: msg },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 150,
         });

         const response = completion.choices[0]?.message?.content || '';

         setAliceChatHistory(prev => {
            const filtered = prev.filter(m => m.text !== '...');
            return [...filtered, { role: 'ai', text: response.trim() }];
         });
         setAliceUsingFallback(false);
         return;
      } catch (groqError) {
         console.log('Groq failed, using fallback:', groqError);
      }

      // Final fallback to preset responses
      setAliceUsingFallback(true);
      const responses = [
         "That's a great question! Let me think... Based on the mission objectives, you should focus on scanning the target first.",
         "I can help with that! Try using the 'scan' command in the terminal to identify open ports.",
         "Hint: Look for vulnerabilities in the web server. The version might be outdated.",
         "You're on the right track! Keep exploring the system for more clues.",
         "Pro tip: Always enumerate before exploiting. Gather as much information as possible."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      setAliceChatHistory(prev => {
         const filtered = prev.filter(m => m.text !== '...');
         return [...filtered, { role: 'ai', text: randomResponse }];
      });
   };

   // --- Effects ---


   const getTopicIcon = (topic?: string) => {
      if (!topic) return <Activity />;
      if (topic.includes('Net')) return <Wifi size={18} />;
      if (topic.includes('Web')) return <Globe size={18} />;
      if (topic.includes('Crypto')) return <Fingerprint size={18} />;
      if (topic.includes('Linux') || topic.includes('Sys')) return <Terminal size={18} />;
      if (topic.includes('Cloud')) return <Cloud size={18} />;
      if (topic.includes('Threat') || topic.includes('Intel')) return <Shield size={18} />;
      return <BrainCircuit size={18} />;
   };

   const activeInterviewer = currentQuestion ? (INTERVIEWERS[currentQuestion.topic] || INTERVIEWERS['Network_Ops']) : null;

   return (
      <div className="h-screen w-full bg-[#0a0a0f] text-gray-100 font-sans flex flex-col md:flex-row overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
         {/* Sidebar - Shows Profile if available */}
         {view !== 'interview' && view !== 'mission' && view !== 'achievements' && view !== 'overview' && view !== 'events' && view !== 'localai' && (
            <aside className="w-full md:w-80 bg-gray-900/50 border-r border-gray-800 p-6 flex flex-col z-20 overflow-y-auto">
               <div className="flex items-center gap-2 mb-6 text-cyber-primary">
                  <Shield size={28} />
                  <span className="text-xl font-bold font-mono">DASHBOARD</span>
               </div>

               {userProfile ? (
                  <div className="mb-6 p-4 bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-2 opacity-20"><User size={48} /></div>
                     <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">ID Card // Verified</div>
                     <div className="text-lg font-bold text-white mb-1">{userProfile.role}</div>
                     <div className="text-sm text-cyber-secondary mb-4">{userProfile.department}</div>
                     {user && (
                        <div className="text-[10px] font-mono text-gray-600 truncate">
                           {user.displayName || user.email}
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="flex items-center gap-4 mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-primary to-blue-500 flex items-center justify-center font-bold text-black">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'OP'}
                     </div>
                     <div>
                        <div className="text-sm font-bold">{user?.displayName || 'Recruit'}</div>
                        <div className="text-xs text-gray-400">{user?.email || 'Unassigned'}</div>
                     </div>
                  </div>
               )}

               <nav className="space-y-2 mb-6">
                  {/* Dashboard - Always visible */}
                  <button
                     onClick={() => setView('home')}
                     className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${view === 'home' ? 'bg-cyber-primary/10 text-cyber-primary' : 'hover:bg-white/5 text-gray-400'}`}
                  >
                     <Shield size={18} /> Dashboard
                  </button>

                  {/* Events - Always visible */}
                  <button
                     onClick={() => setView('events')}
                     className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${view === 'events' ? 'bg-cyber-primary/10 text-cyber-primary' : 'hover:bg-white/5 text-gray-400'}`}
                  >
                     <Calendar size={18} /> Events
                  </button>

                  {/* Missions - Only show after assessment */}
                  {assessmentCompleted && (
                     <button
                        onClick={() => setView('mission')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${view === 'mission' ? 'bg-cyber-primary/10 text-cyber-primary' : 'hover:bg-white/5 text-gray-400'}`}
                     >
                        <Target size={18} /> Missions
                     </button>
                  )}


               </nav>

               {/* Events Section */}
               <div className="mb-6">
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Calendar size={14} /> Live Events
                  </h3>
                  <div className="space-y-2">
                     <div className="p-3 bg-gradient-to-r from-red-900/20 to-transparent border-l-2 border-red-500 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                           <span className="text-xs font-bold text-red-400">LIVE NOW</span>
                        </div>
                        <div className="text-sm font-medium text-white">Red vs Blue CTF</div>
                        <div className="text-xs text-gray-500">2,847 participants</div>
                     </div>
                     <div className="p-3 bg-gradient-to-r from-cyber-primary/10 to-transparent border-l-2 border-cyber-primary rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-cyber-primary">STARTS IN 2H</span>
                        </div>
                        <div className="text-sm font-medium text-white">Web Exploitation Workshop</div>
                        <div className="text-xs text-gray-500">Beginner friendly</div>
                     </div>
                     <div className="p-3 bg-gradient-to-r from-cyber-secondary/10 to-transparent border-l-2 border-cyber-secondary rounded-r-lg opacity-60">
                        <div className="text-sm font-medium text-white">Crypto Challenge Series</div>
                        <div className="text-xs text-gray-500">Tomorrow, 14:00 UTC</div>
                     </div>
                  </div>
               </div>

               <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 transition-colors">
                  <LogOut size={18} /> Logout
               </button>
            </aside>
         )}

         {/* Main Content */}
         <main className={`flex-1 overflow-hidden relative ${view === 'interview' || view === 'mission' ? 'p-0' : 'p-0 md:p-8'}`}>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>

            {view === 'home' && (
               <div className="max-w-5xl mx-auto p-6 animate-in fade-in h-full overflow-y-auto">
                  {initialLoading ? (
                     // Loading State
                     <div className="flex flex-col items-center justify-center h-[80vh] text-center">
                        <div className="w-24 h-24 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary mb-8">
                           <Loader2 size={48} className="animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4 font-mono text-cyber-primary">LOADING PROFILE...</h1>
                        <p className="text-gray-400 max-w-xl">
                           Retrieving your data from secure servers.
                        </p>
                     </div>
                  ) : !userProfile && !assessmentCompleted ? (
                     // Initial State: Prompt for Interview (Only if not completed)
                     <div className="flex flex-col items-center justify-center h-[80vh] text-center">
                        <div className="w-24 h-24 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary mb-8 animate-pulse">
                           <Terminal size={48} />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Initial Assessment Required</h1>
                        <p className="text-gray-400 max-w-xl mb-8">
                           To receive your role assignment and adaptive missions, you must face the Cyber Council.
                           <span className="block text-cyber-secondary mt-2 text-sm">⚠️ This assessment can only be taken once per account.</span>
                        </p>
                        <Button onClick={startInterview} isLoading={loading} size="lg">
                           ENTER THE HALL
                        </Button>
                     </div>
                  ) : (!userProfile && assessmentCompleted) || (result && !userProfile) ? (
                     // Assessment completed but profile not loaded - show dashboard with result data
                     <div>
                        <header className="mb-8 flex justify-between items-end">
                           <div>
                              <h1 className="text-3xl font-bold mb-2">Operations Center</h1>
                              <p className="text-gray-400">Welcome back, Agent. Your assessment is complete.</p>
                           </div>
                        </header>

                        {/* Stats Cards - XP, Level, Rank, Status */}
                        {result && (
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              {/* Level */}
                              <div className="bg-gradient-to-br from-cyber-primary/20 to-gray-900 border border-cyber-primary/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Award size={18} className="text-cyber-primary" />
                                    <span className="text-xs text-gray-500 uppercase">Level</span>
                                 </div>
                                 <div className="text-3xl font-bold text-cyber-primary">
                                    {Math.floor((500 + result.overallScore * 10) / 1000) + 1}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    {(() => {
                                       const assignedRole = getRoleByScore(result.overallScore);
                                       return assignedRole.role;
                                    })()}
                                 </div>
                              </div>

                              {/* XP */}
                              <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Zap size={18} className="text-purple-400" />
                                    <span className="text-xs text-gray-500 uppercase">Total XP</span>
                                 </div>
                                 <div className="text-3xl font-bold text-purple-400">
                                    {(500 + result.overallScore * 10).toLocaleString()}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    +{Math.floor(result.overallScore * 10)} from assessment
                                 </div>
                              </div>

                              {/* Rank */}
                              <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-500/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={18} className="text-yellow-400" />
                                    <span className="text-xs text-gray-500 uppercase">Rank</span>
                                 </div>
                                 <div className="text-2xl font-bold text-yellow-400">
                                    {result.overallScore >= 90 ? 'Elite' : result.overallScore >= 70 ? 'Advanced' : result.overallScore >= 50 ? 'Intermediate' : 'Beginner'}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    Top {Math.max(1, Math.floor((100 - result.overallScore) / 10))}%
                                 </div>
                              </div>

                              {/* Status */}
                              <div className="bg-gradient-to-br from-cyber-secondary/20 to-gray-900 border border-cyber-secondary/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Activity size={18} className="text-cyber-secondary" />
                                    <span className="text-xs text-gray-500 uppercase">Status</span>
                                 </div>
                                 <div className="text-2xl font-bold text-cyber-secondary flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Active
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    3 missions available
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Missions Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                           <div className="md:col-span-2 space-y-6">
                              <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-cyber-primary" /> Active Directives</h2>
                              <div className="grid gap-4">
                                 {/* Generate missions from result */}
                                 {result && result.metrics
                                    .sort((a, b) => a.score - b.score)
                                    .slice(0, 3)
                                    .map((metric, i) => {
                                       const mission: Mission = {
                                          id: `mission-${i}`,
                                          title: `${metric.category.replace('_', ' ')} Challenge`,
                                          description: `Improve your ${metric.category.replace('_', ' ')} skills. Current level: ${metric.level} (${metric.score}%)`,
                                          difficulty: metric.score < 50 ? 'Recruit' : metric.score < 75 ? 'Operator' : 'Elite',
                                          status: 'active',
                                          skillFocus: metric.category
                                       };
                                       return (
                                          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyber-primary/50 transition-colors group relative overflow-hidden">
                                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                {getTopicIcon(metric.category)}
                                             </div>
                                             <div className="flex justify-between items-start mb-4">
                                                <div>
                                                   <div className="text-xs font-mono text-cyber-secondary mb-1 uppercase">{metric.category.replace('_', ' ')}</div>
                                                   <h3 className="text-xl font-bold">{mission.title}</h3>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold border ${mission.difficulty === 'Recruit' ? 'border-green-500 text-green-500' : mission.difficulty === 'Operator' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
                                                   {mission.difficulty}
                                                </div>
                                             </div>
                                             <p className="text-gray-400 text-sm mb-6">{mission.description}</p>
                                             <Button onClick={() => startMission(mission)} size="sm" variant="outline" className="w-full">
                                                <Play size={14} className="mr-2" /> INITIALIZE MISSION
                                             </Button>
                                          </div>
                                       );
                                    })
                                 }
                              </div>
                           </div>

                        </div>
                     </div>
                  ) : (
                     // Profile State: Dashboard with Missions (userProfile exists)
                     <div>
                        <header className="mb-8 flex justify-between items-end">
                           <div>
                              <h1 className="text-3xl font-bold mb-2">Operations Center</h1>
                              <p className="text-gray-400">Welcome back, {userProfile.role}. Your mentor is online.</p>
                           </div>
                        </header>

                        {/* Stats Cards - XP, Level, Rank, Status */}
                        {result && (
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              {/* Level */}
                              <div className="bg-gradient-to-br from-cyber-primary/20 to-gray-900 border border-cyber-primary/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Award size={18} className="text-cyber-primary" />
                                    <span className="text-xs text-gray-500 uppercase">Level</span>
                                 </div>
                                 <div className="text-3xl font-bold text-cyber-primary">
                                    {Math.floor((500 + result.overallScore * 10) / 1000) + 1}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    {(() => {
                                       const assignedRole = getRoleByScore(result.overallScore);
                                       return assignedRole.role;
                                    })()}
                                 </div>
                              </div>

                              {/* XP */}
                              <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Zap size={18} className="text-purple-400" />
                                    <span className="text-xs text-gray-500 uppercase">Total XP</span>
                                 </div>
                                 <div className="text-3xl font-bold text-purple-400">
                                    {(500 + result.overallScore * 10).toLocaleString()}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    +{Math.floor(result.overallScore * 10)} from assessment
                                 </div>
                              </div>

                              {/* Rank */}
                              <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-500/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={18} className="text-yellow-400" />
                                    <span className="text-xs text-gray-500 uppercase">Rank</span>
                                 </div>
                                 <div className="text-2xl font-bold text-yellow-400">
                                    {result.overallScore >= 90 ? 'Elite' : result.overallScore >= 70 ? 'Advanced' : result.overallScore >= 50 ? 'Intermediate' : 'Beginner'}
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    Top {Math.max(1, Math.floor((100 - result.overallScore) / 10))}%
                                 </div>
                              </div>

                              {/* Status */}
                              <div className="bg-gradient-to-br from-cyber-secondary/20 to-gray-900 border border-cyber-secondary/30 rounded-xl p-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Activity size={18} className="text-cyber-secondary" />
                                    <span className="text-xs text-gray-500 uppercase">Status</span>
                                 </div>
                                 <div className="text-2xl font-bold text-cyber-secondary flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Active
                                 </div>
                                 <div className="text-xs text-gray-400 mt-1">
                                    {userProfile.missions?.length || 0} missions available
                                 </div>
                              </div>
                           </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                           <div className="md:col-span-2 space-y-6">
                              <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-cyber-primary" /> Active Directives</h2>
                              <div className="grid gap-4">
                                 {/* Show missions from userProfile or generate from result if empty */}
                                 {(userProfile.missions?.length ? userProfile.missions : result ?
                                    result.metrics
                                       .sort((a, b) => a.score - b.score)
                                       .slice(0, 3)
                                       .map((metric, i) => ({
                                          id: `mission-${i}`,
                                          title: `${metric.category.replace('_', ' ')} Challenge`,
                                          description: `Improve your ${metric.category.replace('_', ' ')} skills. Current level: ${metric.level} (${metric.score}%)`,
                                          difficulty: metric.score < 50 ? 'Recruit' : metric.score < 75 ? 'Operator' : 'Elite' as const,
                                          status: 'active' as const,
                                          skillFocus: metric.category
                                       })) : []
                                 ).map((m, i) => (
                                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyber-primary/50 transition-colors group relative overflow-hidden">
                                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                          {getTopicIcon(m.skillFocus)}
                                       </div>
                                       <div className="flex justify-between items-start mb-4">
                                          <div>
                                             <div className="text-xs font-mono text-cyber-secondary mb-1 uppercase">{m.skillFocus.replace('_', ' ')}</div>
                                             <h3 className="text-xl font-bold">{m.title}</h3>
                                          </div>
                                          <div className={`px-2 py-1 rounded text-xs font-bold border ${m.difficulty === 'Recruit' ? 'border-green-500 text-green-500' : m.difficulty === 'Operator' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
                                             {m.difficulty}
                                          </div>
                                       </div>
                                       <p className="text-gray-400 text-sm mb-6">{m.description}</p>
                                       <Button onClick={() => startMission(m)} size="sm" variant="outline" className="w-full">
                                          <Play size={14} className="mr-2" /> INITIALIZE MISSION
                                       </Button>
                                    </div>
                                 ))}
                              </div>
                           </div>

                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* --- Interview Mode --- */}
            {view === 'interview' && (
               <div className="relative w-full h-screen bg-black overflow-hidden select-none flex flex-col">
                  {/* Video Call Panel: Full viewport, no topbar */}
                  <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                     <div className="relative w-full h-full">
                        <img
                           src="/interview-panel.png"
                           alt="Interview Panel"
                           className="absolute inset-0 w-full h-full object-cover"
                           style={{ objectPosition: 'center 35%' }}
                        />
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden />
                        {/* Highlight box removed for cleaner UI */}
                     </div>
                  </div>

                  {/* Top left: Question counter */}
                  <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                     <span className="font-mono text-xs md:text-sm font-bold text-cyber-primary tracking-widest px-3 py-1.5 bg-black/70 border border-cyber-primary/50 rounded-lg backdrop-blur-sm">
                        Q {questionNumber}/30
                     </span>
                     <button
                        type="button"
                        onClick={() => setIsMuted((m) => !m)}
                        className="p-2 bg-black/70 border border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors backdrop-blur-sm"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                     >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                     </button>
                  </div>

                  {/* Top right: Current interviewer name */}
                  <div className="absolute top-4 right-4 z-30">
                     <span className="font-mono text-xs font-bold text-white/90 tracking-wider px-3 py-1.5 bg-black/70 border border-white/20 rounded-lg backdrop-blur-sm">
                        {activeInterviewer?.name?.toUpperCase() || 'PANEL'}
                     </span>
                  </div>

                  {/* Interaction Area - Bottom Panel */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-6">
                     <div className="w-full max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
                        {/* Question Text + TTS (synced: voice and text show at same time) */}
                        <div className="p-4 md:p-6 max-h-[22vh] overflow-y-auto font-mono text-sm md:text-base text-gray-200 custom-scrollbar">
                           {loading && stallMessage ? (
                              <span className="flex items-center gap-2 italic text-cyber-primary/90">
                                 {stallMessage}
                              </span>
                           ) : loading && questionNumber === 1 && !currentQuestion ? (
                              <span className="animate-pulse flex items-center gap-2">
                                 <Loader2 size={16} className="animate-spin" /> Connecting...
                              </span>
                           ) : (loading || (ttsLoading && currentQuestion)) ? (
                              <span className="animate-pulse flex items-center gap-2">
                                 <Loader2 size={16} className="animate-spin" /> Analyzing...
                              </span>
                           ) : currentQuestion ? (
                              <TypewriterText text={currentQuestion.text} onComplete={() => setTextFinished(true)} />
                           ) : null}
                        </div>
                        {/* Answer Options - Multiple Choice Only */}
                        <div className="p-3 md:p-4 bg-black/50 border-t border-white/5 min-h-[60px] flex items-center justify-center">
                           {!loading && textFinished && currentQuestion?.options && (
                              <div className="w-full animate-in slide-in-from-bottom-2 fade-in">
                                 <div className="grid grid-cols-2 gap-2 md:gap-3 max-w-2xl mx-auto">
                                    {currentQuestion.options.map((opt, i) => (
                                       <button
                                          key={i}
                                          onClick={() => handleInterviewAnswer(opt)}
                                          className="px-4 py-3 md:px-6 md:py-4 bg-gray-800 hover:bg-cyber-primary hover:text-black border border-gray-600 rounded-lg font-mono text-xs md:text-sm transition-all text-left"
                                       >
                                          {opt}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                           {!textFinished && !loading && <button onClick={() => setTextFinished(true)} className="text-xs text-gray-500 flex items-center gap-1 hover:text-white transition-colors"><SkipForward size={12} /> SKIP</button>}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- Results Mode - Gamified Stats Display --- */}
            {view === 'results' && result && (
               <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
                  <div className="max-w-5xl w-full animate-in zoom-in-95">
                     {/* Header with Level Up Animation */}
                     <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyber-primary via-cyber-secondary to-cyber-accent mb-6 animate-pulse shadow-[0_0_60px_rgba(0,255,157,0.4)]">
                           <Award size={64} className="text-black" />
                        </div>
                        <h2 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent">
                           LEVEL UP!
                        </h2>
                        <p className="text-xl text-gray-400">Initial Assessment Complete</p>
                     </div>

                     {/* Main Stats Grid */}
                     <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {/* Overall Score - Big Number */}
                        <div className="md:col-span-1 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-cyber-primary/5"></div>
                           <div className="relative z-10">
                              <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Overall Score</div>
                              <div className="text-7xl font-bold text-cyber-primary mb-2">{result.overallScore}</div>
                              <div className="text-gray-400">/ 100</div>
                              <div className="mt-4">
                                 {(() => {
                                    const assignedRole = getRoleByScore(result.overallScore);
                                    return (
                                       <div className="inline-flex items-center gap-2 bg-gray-800/50 rounded-full px-4 py-2">
                                          <span className="text-2xl">{assignedRole.icon}</span>
                                          <span className="text-sm font-bold text-white">{assignedRole.role}</span>
                                       </div>
                                    );
                                 })()}
                              </div>
                           </div>
                        </div>

                        {/* Skill Breakdown */}
                        <div className="md:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                              <Target size={20} className="text-cyber-secondary" />
                              Skill Breakdown
                           </h3>
                           <div className="space-y-3">
                              {result.metrics.map((metric, i) => (
                                 <div key={i} className="flex items-center gap-4">
                                    <div className="w-32 text-sm text-gray-400">{metric.category.replace('_', ' ')}</div>
                                    <div className="flex-1">
                                       <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                          <div
                                             className={`h-full rounded-full transition-all duration-1000 ${metric.score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                metric.score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                                   'bg-gradient-to-r from-red-400 to-pink-500'
                                                }`}
                                             style={{ width: `${metric.score}%` }}
                                          />
                                       </div>
                                    </div>
                                    <div className="w-16 text-right">
                                       <span className={`font-bold ${metric.score >= 80 ? 'text-green-400' :
                                          metric.score >= 60 ? 'text-yellow-400' :
                                             'text-red-400'
                                          }`}>{metric.score}%</span>
                                    </div>
                                    <div className="w-20 text-right">
                                       <span className={`text-xs px-2 py-1 rounded ${metric.level === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                                          metric.level === 'Average' ? 'bg-yellow-500/20 text-yellow-400' :
                                             'bg-red-500/20 text-red-400'
                                          }`}>{metric.level}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Rewards Section */}
                     <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {/* XP Earned */}
                        <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 rounded-xl p-6 text-center">
                           <div className="text-4xl mb-2">⭐</div>
                           <div className="text-sm text-gray-400 mb-1">XP Earned</div>
                           <div className="text-3xl font-bold text-purple-400">+{500 + Math.floor(result.overallScore * 10)}</div>
                        </div>

                        {/* Rank Unlocked */}
                        <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-500/30 rounded-xl p-6 text-center">
                           <div className="text-4xl mb-2">🏆</div>
                           <div className="text-sm text-gray-400 mb-1">Rank Unlocked</div>
                           <div className="text-xl font-bold text-yellow-400">
                              {result.overallScore >= 90 ? 'Elite' : result.overallScore >= 70 ? 'Advanced' : result.overallScore >= 50 ? 'Intermediate' : 'Beginner'}
                           </div>
                        </div>

                        {/* Missions Unlocked */}
                        <div className="bg-gradient-to-br from-cyber-primary/20 to-gray-900 border border-cyber-primary/30 rounded-xl p-6 text-center">
                           <div className="text-4xl mb-2">🎯</div>
                           <div className="text-sm text-gray-400 mb-1">Missions Unlocked</div>
                           <div className="text-3xl font-bold text-cyber-primary">3</div>
                        </div>
                     </div>

                     {/* Summary Quote */}
                     <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 mb-8 text-center">
                        <p className="text-lg text-gray-300 italic">"{result.summary}"</p>
                     </div>

                     {/* Continue Button */}
                     <div className="text-center">
                        <Button onClick={handleAcceptAssignment} isLoading={loading} size="lg" className="px-12 py-4 text-lg">
                           <Zap size={20} className="mr-2" />
                           ENTER CYBER QUEST
                        </Button>
                        <p className="text-sm text-gray-500 mt-3">Your assessment results are saved. This cannot be retaken.</p>
                     </div>
                  </div>
               </div>
            )}

            {/* --- Mission Mode (Three Tabs: Brief, Terminal, Alice) --- */}
            {view === 'mission' && activeMission && userProfile && (
               <div className="relative w-full h-full flex flex-col bg-black">
                  {/* Mission Header with Tabs */}
                  <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/80 backdrop-blur-md z-10">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-cyber-primary">
                           <Zap size={18} />
                           <span className="font-bold font-mono">{activeMission.title}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${activeMission.difficulty === 'Recruit' ? 'border-green-500 text-green-500' : activeMission.difficulty === 'Operator' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
                           {activeMission.difficulty}
                        </span>
                     </div>

                     {/* Tab Navigation */}
                     <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                        <button
                           onClick={() => setMissionTab('brief')}
                           className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${missionTab === 'brief' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           📋 Brief
                        </button>
                        <button
                           onClick={() => setMissionTab('terminal')}
                           className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${missionTab === 'terminal' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           💻 Terminal + Alice
                        </button>
                     </div>

                     <Button variant="outline" size="sm" onClick={() => setView('home')}>Exit</Button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                     {/* BRIEF TAB */}
                     {missionTab === 'brief' && (
                        <div className="h-full flex flex-col md:flex-row">
                           {/* Mission Info */}
                           <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                              <h2 className="text-2xl font-bold mb-4">Mission Objective</h2>
                              <p className="text-gray-300 mb-6 leading-relaxed">{activeMission.description}</p>

                              <div className="space-y-4">
                                 <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                    <h3 className="text-sm font-bold text-cyber-secondary mb-2">TARGET INFO</h3>
                                    <div className="space-y-2 text-sm text-gray-400">
                                       <div className="flex justify-between"><span>IP Address:</span> <span className="font-mono text-cyber-primary">10.0.0.{Math.floor(Math.random() * 255)}</span></div>
                                       <div className="flex justify-between"><span>OS:</span> <span>Unknown</span></div>
                                       <div className="flex justify-between"><span>Difficulty:</span> <span>{activeMission.difficulty}</span></div>
                                    </div>
                                 </div>

                                 <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                    <div className="flex items-center justify-between mb-3">
                                       <h3 className="text-sm font-bold text-cyber-secondary">MISSION OBJECTIVES</h3>
                                       <span className="text-xs text-cyber-primary">
                                          {missionProgress.completedObjectives.length} / {(activeMission as StoryMission).objectives?.length || 3} Complete
                                       </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                                       <div
                                          className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary transition-all duration-500"
                                          style={{ width: `${((missionProgress.completedObjectives.length) / ((activeMission as StoryMission).objectives?.length || 3)) * 100}%` }}
                                       />
                                    </div>

                                    <ul className="space-y-2 text-sm">
                                       {(activeMission as StoryMission).objectives?.map((obj, idx) => {
                                          const isCompleted = missionProgress.completedObjectives.includes(idx);
                                          const isCurrent = missionProgress.currentStep === idx;
                                          return (
                                             <li key={idx} className={`flex items-start gap-2 ${isCompleted ? 'text-green-400' : isCurrent ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 ${isCompleted ? 'bg-green-500/20 border border-green-500' :
                                                   isCurrent ? 'bg-cyber-primary/20 border border-cyber-primary animate-pulse' :
                                                      'bg-gray-800 border border-gray-600'
                                                   }`}>
                                                   {isCompleted ? '✓' : idx + 1}
                                                </span>
                                                <span className={isCompleted ? 'line-through opacity-70' : ''}>{obj}</span>
                                                {isCurrent && <span className="text-xs text-cyber-secondary ml-auto">CURRENT</span>}
                                             </li>
                                          );
                                       }) || (
                                             <>
                                                <li className="flex items-center gap-2 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">1</span> Reconnaissance - Gather information</li>
                                                <li className="flex items-center gap-2 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">2</span> Identify vulnerabilities</li>
                                                <li className="flex items-center gap-2 text-gray-400"><span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">3</span> Exploit and gain access</li>
                                             </>
                                          )}
                                    </ul>
                                 </div>

                                 {(activeMission as StoryMission).hints && (
                                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                       <h3 className="text-sm font-bold text-yellow-500 mb-2">AVAILABLE HINTS</h3>
                                       <ul className="space-y-2 text-sm text-gray-400">
                                          {(activeMission as StoryMission).hints?.slice(0, 2).map((hint, idx) => (
                                             <li key={idx} className="flex items-start gap-2">
                                                <span className="text-yellow-500 flex-shrink-0">💡</span>
                                                <span className="italic">{hint}</span>
                                             </li>
                                          ))}
                                       </ul>
                                       <p className="text-xs text-gray-500 mt-2">Ask Alice for more hints!</p>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Mentor Info */}
                           <div className="w-full md:w-1/2 bg-gray-900/30 p-8 flex flex-col items-center justify-center border-l border-gray-800">
                              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyber-primary mb-4 shadow-[0_0_30px_rgba(0,255,157,0.3)]">
                                 {(() => {
                                    const mentor = getInterviewerByName(userProfile.mentor);
                                    const idx = mentor.gridIndex || 0;
                                    const x = (idx % 3) * 50; // Approximating 3 columns in the container
                                    const y = Math.floor(idx / 3) * 100;
                                    return (
                                       <img
                                          src={mentor.image}
                                          alt="Mentor"
                                          className="w-[300%] h-[200%] max-w-none"
                                          style={{
                                             transform: `translate(-${(idx % 3) * 33.33}%, -${Math.floor(idx / 3) * 50}%)`
                                          }}
                                       />
                                    );
                                 })()}
                              </div>
                              <h3 className="text-xl font-bold">{userProfile.mentor}</h3>
                              <p className="text-gray-500 text-sm mb-4">Mission Mentor</p>
                              <div className="bg-black/40 rounded-lg p-4 max-w-sm text-center">
                                 <p className="text-sm text-gray-300 italic">"{activeMission.skillFocus.replace('_', ' ')} is critical for this mission. Use the terminal to execute commands and ask Alice if you need guidance."</p>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* TERMINAL TAB - With Alice Side Panel */}
                     {missionTab === 'terminal' && (
                        <div className="h-full flex overflow-hidden">
                           <TerminalPanel
                              terminalHistory={terminalHistory}
                              activeMission={activeMission}
                              onCommandSubmit={handleTerminalCommand}
                           />

                           <AliceSidebar
                              aliceChatHistory={aliceChatHistory}
                              selectedAI={selectedAI}
                              onSelectAI={setSelectedAI}
                              onSendMessage={handleAliceMessage}
                              activeMission={activeMission}
                              missionProgress={missionProgress}
                              localAIConnected={localAIConnected}
                              aliceUsingFallback={aliceUsingFallback}
                           />
                        </div>
                     )}

                     {/* Mission Success Overlay */}
                     {showSuccessOverlay && (
                        <MissionSuccessOverlay
                           missionTitle={activeMission.title}
                           skillFocus={activeMission.skillFocus}
                           xpEarned={500} // Example XP
                           onClose={() => {
                              setShowSuccessOverlay(false);
                              setView('home');
                           }}
                        />
                     )}


                  </div>
               </div>
            )}

            {/* --- KC7 Dashboard (After Interview) --- */}
            {view === 'kc7' && (
               <KC7Dashboard
                  userName={user?.displayName || user?.email?.split('@')[0] || 'Detective'}
                  onLogout={onLogout}
               />
            )}

            {/* --- Local AI Config Page --- */}
            {view === 'localai' && (
               <LocalAIConfig onClose={() => setView('home')} />
            )}

            {/* --- Events Page --- */}
            {view === 'events' && (
               <div className="min-h-screen bg-[#0a0a0f] p-6 overflow-y-auto">
                  <div className="max-w-6xl mx-auto">
                     {/* Header */}
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <button
                              onClick={() => setView('home')}
                              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                           >
                              ← Back to Dashboard
                           </button>
                           <h1 className="text-4xl font-bold mb-2">Events & Competitions</h1>
                           <p className="text-gray-400">Join live CTFs, workshops, and challenges</p>
                        </div>
                     </div>

                     {/* Live Events */}
                     <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                           <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                           Live Now
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                           <div className="bg-gradient-to-br from-red-900/20 to-gray-900 border border-red-500/30 rounded-xl p-6">
                              <div className="flex items-center justify-between mb-4">
                                 <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-bold rounded-full">LIVE</span>
                                 <span className="text-gray-500 text-sm">2,847 participants</span>
                              </div>
                              <h3 className="text-xl font-bold mb-2">Red vs Blue CTF</h3>
                              <p className="text-gray-400 mb-4">Team-based capture the flag competition. Attack and defend systems in real-time.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                 <span>⏱️ 4 hours remaining</span>
                                 <span>🏆 Prize: $5,000</span>
                              </div>
                              <button className="mt-4 w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
                                 Join Now
                              </button>
                           </div>

                           <div className="bg-gradient-to-br from-cyber-primary/10 to-gray-900 border border-cyber-primary/30 rounded-xl p-6">
                              <div className="flex items-center justify-between mb-4">
                                 <span className="px-3 py-1 bg-cyber-primary/20 text-cyber-primary text-sm font-bold rounded-full">STARTS IN 2H</span>
                                 <span className="text-gray-500 text-sm">456 registered</span>
                              </div>
                              <h3 className="text-xl font-bold mb-2">Web Exploitation Workshop</h3>
                              <p className="text-gray-400 mb-4">Learn advanced SQL injection, XSS, and CSRF techniques from industry experts.</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                 <span>🎓 Beginner friendly</span>
                                 <span>📅 Today, 18:00 UTC</span>
                              </div>
                              <button className="mt-4 w-full py-3 bg-cyber-primary hover:bg-cyber-secondary text-black font-bold rounded-lg transition-colors">
                                 Register
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Upcoming Events */}
                     <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Upcoming</h2>
                        <div className="space-y-4">
                           <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
                              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">🔐</div>
                              <div className="flex-1">
                                 <h3 className="text-lg font-bold mb-1">Crypto Challenge Series</h3>
                                 <p className="text-gray-400 text-sm">Test your cryptography skills with increasingly difficult cipher challenges.</p>
                              </div>
                              <div className="text-right">
                                 <div className="text-sm text-gray-500">Tomorrow</div>
                                 <div className="text-cyber-primary font-bold">14:00 UTC</div>
                              </div>
                              <button className="px-6 py-2 border border-gray-700 hover:border-cyber-primary text-gray-400 hover:text-cyber-primary rounded-lg transition-colors">
                                 Remind Me
                              </button>
                           </div>

                           <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
                              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">☁️</div>
                              <div className="flex-1">
                                 <h3 className="text-lg font-bold mb-1">Cloud Security Summit</h3>
                                 <p className="text-gray-400 text-sm">Learn AWS, Azure, and GCP security best practices from certified professionals.</p>
                              </div>
                              <div className="text-right">
                                 <div className="text-sm text-gray-500">Feb 25</div>
                                 <div className="text-cyber-primary font-bold">10:00 UTC</div>
                              </div>
                              <button className="px-6 py-2 border border-gray-700 hover:border-cyber-primary text-gray-400 hover:text-cyber-primary rounded-lg transition-colors">
                                 Remind Me
                              </button>
                           </div>

                           <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
                              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">🐧</div>
                              <div className="flex-1">
                                 <h3 className="text-lg font-bold mb-1">Linux Forensics Bootcamp</h3>
                                 <p className="text-gray-400 text-sm">Hands-on training in log analysis, file recovery, and incident response.</p>
                              </div>
                              <div className="text-right">
                                 <div className="text-sm text-gray-500">Mar 1</div>
                                 <div className="text-cyber-primary font-bold">09:00 UTC</div>
                              </div>
                              <button className="px-6 py-2 border border-gray-700 hover:border-cyber-primary text-gray-400 hover:text-cyber-primary rounded-lg transition-colors">
                                 Remind Me
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Past Events */}
                     <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-500">Past Events</h2>
                        <div className="grid md:grid-cols-3 gap-4 opacity-60">
                           <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                              <div className="text-sm text-gray-500 mb-2">Jan 15, 2026</div>
                              <h3 className="font-bold mb-1">Network Defense 101</h3>
                              <p className="text-xs text-gray-500">1,234 participants</p>
                           </div>
                           <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                              <div className="text-sm text-gray-500 mb-2">Jan 10, 2026</div>
                              <h3 className="font-bold mb-1">Bug Bounty Basics</h3>
                              <p className="text-xs text-gray-500">892 participants</p>
                           </div>
                           <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                              <div className="text-sm text-gray-500 mb-2">Jan 5, 2026</div>
                              <h3 className="font-bold mb-1">Threat Intel Workshop</h3>
                              <p className="text-xs text-gray-500">567 participants</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- Achievements Page --- */}
            {view === 'achievements' && (
               <Achievements onBack={() => setView('overview')} />
            )}

            {/* --- Overview Page (After Assessment) --- */}
            {view === 'overview' && result && (
               <div className="min-h-screen bg-[#0a0a0f] p-6 overflow-y-auto">
                  <div className="max-w-6xl mx-auto">
                     {/* Header */}
                     <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Agent Overview</h1>
                        <p className="text-gray-400">Welcome back, {user?.displayName || 'Agent'}</p>
                     </div>

                     {/* Level & Stats Cards */}
                     <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {/* Level Card */}
                        <div className="bg-gradient-to-br from-cyber-primary/20 to-gray-900 border border-cyber-primary/30 rounded-2xl p-6 text-center">
                           <div className="text-sm text-gray-400 mb-1">Current Level</div>
                           <div className="text-5xl font-bold text-cyber-primary mb-2">
                              {Math.floor((500 + result.overallScore * 10) / 1000) + 1}
                           </div>
                           <div className="text-xs text-cyber-secondary">
                              {(() => {
                                 const assignedRole = getRoleByScore(result.overallScore);
                                 return assignedRole.role;
                              })()}
                           </div>
                        </div>

                        {/* XP Card */}
                        <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 rounded-2xl p-6 text-center">
                           <div className="text-sm text-gray-400 mb-1">Total XP</div>
                           <div className="text-4xl font-bold text-purple-400 mb-2">
                              {(500 + result.overallScore * 10).toLocaleString()}
                           </div>
                           <div className="text-xs text-gray-500">+{Math.floor(result.overallScore * 10)} from assessment</div>
                        </div>

                        {/* Rank Card */}
                        <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-500/30 rounded-2xl p-6 text-center">
                           <div className="text-sm text-gray-400 mb-1">Rank</div>
                           <div className="text-3xl font-bold text-yellow-400 mb-2">
                              {result.overallScore >= 90 ? 'Elite' : result.overallScore >= 70 ? 'Advanced' : result.overallScore >= 50 ? 'Intermediate' : 'Beginner'}
                           </div>
                           <div className="text-xs text-gray-500">Top {Math.max(1, Math.floor((100 - result.overallScore) / 10))}%</div>
                        </div>

                        {/* Missions Card */}
                        <div className="bg-gradient-to-br from-cyber-secondary/20 to-gray-900 border border-cyber-secondary/30 rounded-2xl p-6 text-center">
                           <div className="text-sm text-gray-400 mb-1">Active Missions</div>
                           <div className="text-5xl font-bold text-cyber-secondary mb-2">3</div>
                           <div className="text-xs text-gray-500">Adaptive training</div>
                        </div>
                     </div>

                     {/* Skill Radar & Position */}
                     <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Skill Chart */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                           <h3 className="text-lg font-bold mb-4">Skill Analysis</h3>
                           <HexagonChart metrics={result.metrics} />
                        </div>

                        {/* Position/Department */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                           <h3 className="text-lg font-bold mb-4">Your Position</h3>
                           {(() => {
                              const assignedRole = getRoleByScore(result.overallScore);
                              const bestMetric = result.metrics.reduce((best, current) => current.score > best.score ? current : best);
                              return (
                                 <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                                       <div className="text-5xl">{assignedRole.icon}</div>
                                       <div>
                                          <div className="text-2xl font-bold text-white">{assignedRole.role}</div>
                                          <div className="text-cyber-secondary">{assignedRole.department}</div>
                                       </div>
                                    </div>

                                    <div className="p-4 bg-gray-800/30 rounded-xl">
                                       <div className="text-sm text-gray-400 mb-2">Strongest Skill</div>
                                       <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-cyber-primary"></div>
                                          <span className="font-bold">{bestMetric.category.replace('_', ' ')}</span>
                                          <span className="text-cyber-primary">({bestMetric.score}%)</span>
                                       </div>
                                    </div>

                                    <div className="p-4 bg-gray-800/30 rounded-xl">
                                       <div className="text-sm text-gray-400 mb-2">Mentor Assigned</div>
                                       <div className="flex items-center gap-3">
                                          <img
                                             src={INTERVIEWERS[bestMetric.category]?.image}
                                             alt="Mentor"
                                             className="w-10 h-10 rounded-full object-cover"
                                          />
                                          <div>
                                             <div className="font-bold">{INTERVIEWERS[bestMetric.category]?.name}</div>
                                             <div className="text-xs text-gray-500">{INTERVIEWERS[bestMetric.category]?.role}</div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })()}
                        </div>
                     </div>

                     {/* Story Arc Introduction */}
                     <div className="bg-gradient-to-r from-gray-900/80 to-gray-900/40 border border-cyber-primary/30 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center flex-shrink-0">
                              <Shield size={24} className="text-cyber-primary" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-cyber-primary mb-2">{STORY_ARC[language].title}</h3>
                              <p className="text-gray-300 leading-relaxed mb-3">{getStoryIntroduction(result.overallScore)}</p>
                              <p className="text-sm text-gray-500">{STORY_ARC[language].description}</p>
                           </div>
                        </div>
                     </div>

                     {/* Adaptive Missions Preview */}
                     <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-lg font-bold flex items-center gap-2">
                              <Target size={20} className="text-cyber-primary" />
                              Story Missions
                           </h3>
                           <button
                              onClick={() => setView('mission')}
                              className="text-sm text-cyber-primary hover:text-cyber-secondary transition-colors"
                           >
                              View All →
                           </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                           {result.metrics
                              .sort((a, b) => a.score - b.score)
                              .slice(0, 3)
                              .map((metric, i) => (
                                 <div
                                    key={i}
                                    onClick={() => {
                                       const mission: Mission = {
                                          id: `mission-${i}`,
                                          title: `${metric.category.replace('_', ' ')} Training`,
                                          description: `Improve your ${metric.category.replace('_', ' ')} skills. Current: ${metric.level} (${metric.score}%)`,
                                          difficulty: metric.score < 50 ? 'Recruit' : metric.score < 75 ? 'Operator' : 'Elite',
                                          status: 'active',
                                          skillFocus: metric.category
                                       };
                                       startMission(mission);
                                    }}
                                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-cyber-primary/50 cursor-pointer transition-all group"
                                 >
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-2xl">
                                          {metric.category === 'Network_Ops' && '🌐'}
                                          {metric.category === 'Web_Security' && '🕸️'}
                                          {metric.category === 'Cryptography' && '🔐'}
                                          {metric.category === 'Linux_Forensics' && '🐧'}
                                          {metric.category === 'Cloud_Defense' && '☁️'}
                                          {metric.category === 'Threat_Intel' && '🎯'}
                                       </span>
                                       <span className={`text-xs px-2 py-1 rounded ${metric.score < 50 ? 'bg-red-500/20 text-red-400' :
                                          metric.score < 75 ? 'bg-yellow-500/20 text-yellow-400' :
                                             'bg-green-500/20 text-green-400'
                                          }`}>
                                          {metric.level}
                                       </span>
                                    </div>
                                    <h4 className="font-bold mb-1 group-hover:text-cyber-primary transition-colors">
                                       {metric.category.replace('_', ' ')}
                                    </h4>
                                    <p className="text-xs text-gray-400 mb-3">Focus area - needs improvement</p>
                                    <div className="flex items-center gap-2">
                                       <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                          <div
                                             className="h-full bg-cyber-primary rounded-full"
                                             style={{ width: `${metric.score}%` }}
                                          />
                                       </div>
                                       <span className="text-xs text-gray-500">{metric.score}%</span>
                                    </div>
                                 </div>
                              ))}
                        </div>
                     </div>

                     {/* Alice AI Assistant Card */}
                     <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                              A
                           </div>
                           <div className="flex-1">
                              <h3 className="text-xl font-bold mb-1">Alice - Your AI Assistant</h3>
                              <p className="text-gray-400 text-sm mb-3">
                                 I'm here to help you with hints, explain concepts, or guide you through missions.
                                 Click on any mission to start, and I'll be there to assist!
                              </p>
                              <button
                                 onClick={() => {
                                    // Open Alice chat in the first mission
                                    const weakestMetric = result.metrics.sort((a, b) => a.score - b.score)[0];
                                    const mission: Mission = {
                                       id: 'mission-alice',
                                       title: `${weakestMetric.category.replace('_', ' ')} Training`,
                                       description: `Improve your ${weakestMetric.category.replace('_', ' ')} skills`,
                                       difficulty: weakestMetric.score < 50 ? 'Recruit' : weakestMetric.score < 75 ? 'Operator' : 'Elite',
                                       status: 'active',
                                       skillFocus: weakestMetric.category
                                    };
                                    startMission(mission);
                                 }}
                                 className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                 Start Training with Alice
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </main>
      </div>
   );
};
