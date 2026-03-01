import React from 'react';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface TerminalMessage {
  role: 'user' | 'system' | 'ai';
  content: string;
  timestamp: Date;
}

export enum GameMode {
  LEARN = 'LEARN',
  CTF = 'CTF',
  LAB = 'LAB'
}

export interface UserStats {
  rank: string;
  xp: number;
  streak: number;
  level: number;
}

// 6 Main Headings for Cyber Security
export type SkillCategory =
  | 'Network_Ops'
  | 'Web_Security'
  | 'Cryptography'
  | 'Linux_Forensics'
  | 'Cloud_Defense'
  | 'Threat_Intel';

export interface InterviewQuestion {
  id: number;
  topic: SkillCategory;
  text: string;
  type: 'multiple_choice' | 'console_command';
  options?: string[]; // For multiple choice
  validationRegex?: string; // For console command (handled by AI usually, but good for local check)
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SkillMetric {
  category: SkillCategory;
  score: number; // 0-100
  level: 'Poor' | 'Average' | 'Excellent';
}

export interface AssessmentResult {
  overallScore: number;
  rank: string;
  metrics: SkillMetric[];
  summary: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'Recruit' | 'Operator' | 'Elite';
  status: 'locked' | 'active' | 'completed';
  skillFocus: SkillCategory;
}

export interface UserProfile {
  role: string; // e.g., "Network Sentinel", "Crypto Hunter"
  department: string; // e.g., "Ops Wing", "Intel Division"
  mentor: string; // Name of the character (e.g., "Titan")
  missions: Mission[];
}
