import React from 'react';
import { 
  Trophy, Target, Shield, Lock, Zap, Brain, 
  Terminal, Mail, Globe, Award, Star, Flame,
  CheckCircle, Clock, Users, TrendingUp, Lock as LockIcon,
  Database
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  xp: number;
  category: 'interview' | 'mission' | 'terminal' | 'social' | 'mastery';
  progress?: number;
  maxProgress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Interview Achievements (One-time only)
  {
    id: 'first-assessment',
    title: 'First Assessment',
    description: 'Complete your initial cybersecurity assessment',
    icon: <Brain size={24} />,
    color: '#8b5cf6',
    unlocked: true,
    unlockedAt: '2024-01-15',
    xp: 500,
    category: 'interview'
  },
  {
    id: 'sharp-shooter',
    title: 'Sharp Shooter',
    description: 'Answer 10 assessment questions correctly in a row',
    icon: <Target size={24} />,
    color: '#00ff9d',
    unlocked: true,
    unlockedAt: '2024-01-15',
    xp: 250,
    category: 'interview'
  },
  {
    id: 'cyber-scholar',
    title: 'Cyber Scholar',
    description: 'Score 90% or higher on initial assessment',
    icon: <Award size={24} />,
    color: '#fbbf24',
    unlocked: false,
    xp: 1000,
    category: 'interview',
    progress: 85,
    maxProgress: 90
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Answer all 30 assessment questions correctly',
    icon: <Star size={24} />,
    color: '#f59e0b',
    unlocked: false,
    xp: 2000,
    category: 'interview',
    progress: 28,
    maxProgress: 30
  },
  
  // Mission Achievements
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Complete your first investigation mission',
    icon: <Trophy size={24} />,
    color: '#ef4444',
    unlocked: true,
    unlockedAt: '2024-01-16',
    xp: 100,
    category: 'mission'
  },
  {
    id: 'case-closed',
    title: 'Case Closed',
    description: 'Complete 5 investigation missions',
    icon: <Shield size={24} />,
    color: '#00d0ff',
    unlocked: true,
    unlockedAt: '2024-01-18',
    xp: 500,
    category: 'mission',
    progress: 5,
    maxProgress: 5
  },
  {
    id: 'master-detective',
    title: 'Master Detective',
    description: 'Complete 20 investigation missions',
    icon: <Users size={24} />,
    color: '#bd00ff',
    unlocked: false,
    xp: 2000,
    category: 'mission',
    progress: 12,
    maxProgress: 20
  },
  {
    id: 'speed-runner',
    title: 'Speed Runner',
    description: 'Complete a mission in under 15 minutes',
    icon: <Clock size={24} />,
    color: '#f472b6',
    unlocked: false,
    xp: 300,
    category: 'mission'
  },
  {
    id: 'flawless-victory',
    title: 'Flawless Victory',
    description: 'Complete a mission with 100% accuracy on first try',
    icon: <CheckCircle size={24} />,
    color: '#10b981',
    unlocked: false,
    xp: 750,
    category: 'mission'
  },
  
  // Terminal Achievements
  {
    id: 'shell-shock',
    title: 'Shell Shock',
    description: 'Get your first reverse shell in a mission',
    icon: <Terminal size={24} />,
    color: '#a855f7',
    unlocked: true,
    unlockedAt: '2024-01-17',
    xp: 500,
    category: 'terminal'
  },
  {
    id: 'root-access',
    title: 'Root Access',
    description: 'Successfully escalate privileges to root 5 times',
    icon: <Lock size={24} />,
    color: '#dc2626',
    unlocked: false,
    xp: 1000,
    category: 'terminal',
    progress: 3,
    maxProgress: 5
  },
  {
    id: 'sql-wizard',
    title: 'SQL Wizard',
    description: 'Successfully use SQL injection in 3 missions',
    icon: <Database size={24} />,
    color: '#3b82f6',
    unlocked: false,
    xp: 600,
    category: 'terminal',
    progress: 1,
    maxProgress: 3
  },
  {
    id: 'network-ninja',
    title: 'Network Ninja',
    description: 'Perform successful network pivoting',
    icon: <Globe size={24} />,
    color: '#06b6d4',
    unlocked: false,
    xp: 800,
    category: 'terminal'
  },
  {
    id: 'crypto-master',
    title: 'Crypto Master',
    description: 'Decrypt 10 encrypted messages or files',
    icon: <LockIcon size={24} />,
    color: '#f59e0b',
    unlocked: false,
    xp: 750,
    category: 'terminal',
    progress: 4,
    maxProgress: 10
  },
  
  // Social/Community Achievements
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Participate in a team CTF event',
    icon: <Users size={24} />,
    color: '#ec4899',
    unlocked: false,
    xp: 400,
    category: 'social'
  },
  {
    id: 'helpful-hand',
    title: 'Helpful Hand',
    description: 'Help another student solve a mission',
    icon: <Mail size={24} />,
    color: '#84cc16',
    unlocked: false,
    xp: 300,
    category: 'social'
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 7-day login streak',
    icon: <Flame size={24} />,
    color: '#f97316',
    unlocked: false,
    xp: 500,
    category: 'social',
    progress: 4,
    maxProgress: 7
  },
  
  // Mastery Achievements
  {
    id: 'kql-expert',
    title: 'KQL Expert',
    description: 'Execute 50 successful KQL queries',
    icon: <Terminal size={24} />,
    color: '#6366f1',
    unlocked: false,
    xp: 1500,
    category: 'mastery',
    progress: 23,
    maxProgress: 50
  },
  {
    id: 'threat-hunter',
    title: 'Threat Hunter',
    description: 'Identify 100 threats across all missions',
    icon: <Zap size={24} />,
    color: '#ef4444',
    unlocked: false,
    xp: 2000,
    category: 'mastery',
    progress: 67,
    maxProgress: 100
  },
  {
    id: 'elite-operator',
    title: 'Elite Operator',
    description: 'Reach 10,000 total XP',
    icon: <Trophy size={24} />,
    color: '#fbbf24',
    unlocked: false,
    xp: 5000,
    category: 'mastery',
    progress: 3250,
    maxProgress: 10000
  },
  {
    id: 'master-hacker',
    title: 'Master Hacker',
    description: 'Unlock all other achievements',
    icon: <Star size={24} />,
    color: '#00ff9d',
    unlocked: false,
    xp: 10000,
    category: 'mastery'
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  interview: '#8b5cf6',
  mission: '#00d0ff',
  terminal: '#00ff9d',
  social: '#f472b6',
  mastery: '#fbbf24'
};

const CATEGORY_NAMES: Record<string, string> = {
  interview: 'Assessment',
  mission: 'Missions',
  terminal: 'Terminal',
  social: 'Community',
  mastery: 'Mastery'
};

interface AchievementsProps {
  onBack: () => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  
  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);
  
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalXP = ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const totalPossibleXP = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);
  
  const categories = ['all', ...Array.from(new Set(ACHIEVEMENTS.map(a => a.category)))];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button 
              onClick={onBack}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="text-yellow-400" size={36} />
              Achievements
            </h1>
            <p className="text-gray-400 mt-2">Track your progress and unlock rewards</p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyber-primary">{unlockedCount}</div>
              <div className="text-sm text-gray-500">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyber-secondary">{ACHIEVEMENTS.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{totalXP.toLocaleString()}</div>
              <div className="text-sm text-gray-500">XP Earned</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-cyber-primary">{Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {totalXP.toLocaleString()} / {totalPossibleXP.toLocaleString()} XP collected
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-cyber-primary text-black' 
                  : 'bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat === 'all' ? 'All Achievements' : CATEGORY_NAMES[cat]}
              {cat !== 'all' && (
                <span className="ml-2 text-xs opacity-60">
                  {ACHIEVEMENTS.filter(a => a.category === cat && a.unlocked).length}/{ACHIEVEMENTS.filter(a => a.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`relative p-5 rounded-xl border transition-all ${
                achievement.unlocked 
                  ? 'bg-gray-900/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-gray-900/30 border-gray-800 opacity-60'
              }`}
            >
              {/* Locked Overlay */}
              {!achievement.unlocked && (
                <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                  <LockIcon className="text-gray-600" size={32} />
                </div>
              )}
              
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: achievement.unlocked ? `${achievement.color}20` : '#374151',
                    color: achievement.unlocked ? achievement.color : '#6b7280'
                  }}
                >
                  {achievement.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{achievement.title}</h3>
                    {achievement.unlocked && (
                      <CheckCircle className="text-cyber-primary flex-shrink-0" size={16} />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                  
                  {/* XP Badge */}
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: achievement.unlocked ? `${achievement.color}20` : 'transparent',
                        color: achievement.unlocked ? achievement.color : '#6b7280',
                        border: `1px solid ${achievement.unlocked ? achievement.color : '#374151'}`
                      }}
                    >
                      +{achievement.xp} XP
                    </span>
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-gray-500">
                        Unlocked {achievement.unlockedAt}
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar for Locked Achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-cyber-primary">{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyber-primary rounded-full transition-all"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category Tag */}
              <div 
                className="absolute top-3 right-3 w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[achievement.category] }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Special Notice for Assessment */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4">
          <Brain className="text-purple-400" size={32} />
          <div>
            <h3 className="font-bold text-purple-300">Initial Assessment - One Time Only</h3>
            <p className="text-sm text-purple-200/70">
              Your initial cybersecurity assessment can only be completed once per account. 
              Make it count! Your score determines your starting rank and unlocks exclusive achievements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
