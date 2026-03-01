import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Search, Terminal, FileText, Users, Award, 
  Clock, ChevronRight, Play, CheckCircle, Lock, 
  Database, Mail, Activity, Globe, AlertTriangle,
  Filter, Download, HelpCircle, LogOut, Menu, X
} from 'lucide-react';
import { Button } from './Button';

// Types
interface Investigation {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  completed: boolean;
  progress: number;
  tags: string[];
  scenario: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  eventType: 'login' | 'email' | 'file' | 'network' | 'alert';
  user: string;
  ip?: string;
  details: string;
  suspicious: boolean;
}

interface KQLQuery {
  id: string;
  name: string;
  query: string;
  description: string;
}

// Sample Investigations
const INVESTIGATIONS: Investigation[] = [
  {
    id: 'inv-001',
    title: 'The Phantom Login',
    description: 'A mysterious login from an unknown location has triggered an alert. Investigate the breach and identify the attacker.',
    difficulty: 'Beginner',
    duration: '30-45 min',
    completed: false,
    progress: 0,
    tags: ['Log Analysis', 'KQL Basics', 'Authentication'],
    scenario: 'Acme Corp reported suspicious activity on their CEO\'s account. Someone logged in from Russia at 3 AM when the CEO was asleep in New York.'
  },
  {
    id: 'inv-002',
    title: 'Ransomware Rampage',
    description: 'A ransomware attack has encrypted critical files. Trace the attack vector and identify patient zero.',
    difficulty: 'Intermediate',
    duration: '60-90 min',
    completed: false,
    progress: 0,
    tags: ['Malware Analysis', 'Lateral Movement', 'Forensics'],
    scenario: 'GlobalTech Industries was hit by ransomware overnight. Files are encrypted with .locked extension. Find how they got in.'
  },
  {
    id: 'inv-003',
    title: 'The Insider Threat',
    description: 'Sensitive data was exfiltrated by someone with internal access. Find the mole before they strike again.',
    difficulty: 'Advanced',
    duration: '2-3 hours',
    completed: false,
    progress: 0,
    tags: ['Data Exfiltration', 'User Behavior', 'Advanced KQL'],
    scenario: 'PharmaCorp\'s secret drug formula was leaked to competitors. The attacker had legitimate credentials. Who betrayed the company?'
  },
  {
    id: 'inv-004',
    title: 'Phishing Frenzy',
    description: 'Multiple employees received suspicious emails. Investigate the phishing campaign and prevent credential theft.',
    difficulty: 'Beginner',
    duration: '20-30 min',
    completed: true,
    progress: 100,
    tags: ['Email Analysis', 'Social Engineering', 'OSINT'],
    scenario: 'Several employees at FinanceFirst clicked suspicious links. Find the phishing emails before credentials are stolen.'
  }
];

// Sample Log Data
const SAMPLE_LOGS: LogEntry[] = [
  { id: '1', timestamp: '2024-01-15 03:23:45', eventType: 'login', user: 'ceo@acme.com', ip: '185.220.101.42', details: 'Successful login from Moscow, Russia', suspicious: true },
  { id: '2', timestamp: '2024-01-15 03:24:12', eventType: 'file', user: 'ceo@acme.com', details: 'Downloaded: Q4_Financial_Report.xlsx', suspicious: true },
  { id: '3', timestamp: '2024-01-15 03:25:33', eventType: 'email', user: 'ceo@acme.com', details: 'Forwarded email to: external@darknet.com', suspicious: true },
  { id: '4', timestamp: '2024-01-15 08:45:00', eventType: 'login', user: 'ceo@acme.com', ip: '192.168.1.100', details: 'Successful login from New York, USA', suspicious: false },
  { id: '5', timestamp: '2024-01-15 09:12:15', eventType: 'alert', user: 'system', details: 'Impossible travel alert: Russia to USA in 5 hours', suspicious: true },
  { id: '6', timestamp: '2024-01-15 10:30:22', eventType: 'network', user: 'ceo@acme.com', ip: '185.220.101.42', details: 'Data transfer: 2.3 GB to external IP', suspicious: true },
];

// KQL Query Templates
const KQL_TEMPLATES: KQLQuery[] = [
  { id: '1', name: 'All Login Events', query: 'AuthenticationEvents\n| where TimeGenerated > ago(24h)\n| order by TimeGenerated desc', description: 'Show all authentication events in the last 24 hours' },
  { id: '2', name: 'Failed Logins', query: 'AuthenticationEvents\n| where Result == "Failed"\n| summarize count() by User', description: 'Count failed login attempts per user' },
  { id: '3', name: 'Suspicious IPs', query: 'AuthenticationEvents\n| where IP in ("185.220.101.42", "45.142.212.100")\n| project TimeGenerated, User, IP, Result', description: 'Check logins from known suspicious IPs' },
  { id: '4', name: 'File Access', query: 'FileEvents\n| where Action == "Download"\n| where TimeGenerated > ago(7d)', description: 'Show all file downloads in the last week' },
];

// Components
const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({ icon, value, label, color }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex items-center gap-4 hover:border-gray-700 transition-colors">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </div>
);

const InvestigationCard: React.FC<{ investigation: Investigation; onStart: () => void }> = ({ investigation, onStart }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-cyber-primary/50 transition-all group cursor-pointer" onClick={onStart}>
    <div className="flex justify-between items-start mb-4">
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        investigation.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
        investigation.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {investigation.difficulty}
      </div>
      {investigation.completed && <CheckCircle className="text-cyber-primary" size={20} />}
    </div>
    
    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-primary transition-colors">{investigation.title}</h3>
    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{investigation.description}</p>
    
    <div className="flex flex-wrap gap-2 mb-4">
      {investigation.tags.map((tag, i) => (
        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{tag}</span>
      ))}
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock size={14} />
        {investigation.duration}
      </div>
      <Button size="sm" variant={investigation.completed ? 'outline' : 'primary'}>
        {investigation.completed ? 'Replay' : 'Start'} <ChevronRight size={14} />
      </Button>
    </div>
    
    {!investigation.completed && investigation.progress > 0 && (
      <div className="mt-4">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyber-primary rounded-full" style={{ width: `${investigation.progress}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">{investigation.progress}% complete</div>
      </div>
    )}
  </div>
);

const LogTable: React.FC<{ logs: LogEntry[] }> = ({ logs }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-800 text-gray-400">
        <tr>
          <th className="px-4 py-3 text-left">Time</th>
          <th className="px-4 py-3 text-left">Type</th>
          <th className="px-4 py-3 text-left">User</th>
          <th className="px-4 py-3 text-left">Details</th>
          <th className="px-4 py-3 text-left">Alert</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id} className={`border-t border-gray-800 hover:bg-gray-800/50 ${log.suspicious ? 'bg-red-900/10' : ''}`}>
            <td className="px-4 py-3 font-mono text-gray-400">{log.timestamp}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center gap-1 ${
                log.eventType === 'login' ? 'text-blue-400' :
                log.eventType === 'email' ? 'text-green-400' :
                log.eventType === 'file' ? 'text-yellow-400' :
                log.eventType === 'alert' ? 'text-red-400' :
                'text-purple-400'
              }`}>
                {log.eventType === 'login' && <Shield size={14} />}
                {log.eventType === 'email' && <Mail size={14} />}
                {log.eventType === 'file' && <FileText size={14} />}
                {log.eventType === 'alert' && <AlertTriangle size={14} />}
                {log.eventType === 'network' && <Globe size={14} />}
                {log.eventType}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-300">{log.user}</td>
            <td className="px-4 py-3 text-gray-400">{log.details}</td>
            <td className="px-4 py-3">
              {log.suspicious && <AlertTriangle className="text-red-500" size={16} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const KQLWorkspace: React.FC = () => {
  const [query, setQuery] = useState('AuthenticationEvents\n| where TimeGenerated > ago(24h)\n| order by TimeGenerated desc');
  const [results, setResults] = useState<LogEntry[]>([]);
  const [executing, setExecuting] = useState(false);

  const executeQuery = () => {
    setExecuting(true);
    setTimeout(() => {
      setResults(SAMPLE_LOGS);
      setExecuting(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal size={18} className="text-cyber-primary" />
          KQL Query Workspace
        </h3>
        <div className="flex gap-2">
          <select className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-gray-300">
            <option>Load Template...</option>
            {KQL_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-full bg-transparent text-gray-300 resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">Press Ctrl+Enter to execute</span>
            <Button onClick={executeQuery} isLoading={executing} size="sm">
              <Play size={14} className="mr-1" /> Run Query
            </Button>
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg overflow-auto">
            {results.length > 0 ? (
              <LogTable logs={results} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Database size={48} className="mx-auto mb-2 opacity-30" />
                  <p>Execute a query to see results</p>
                </div>
              </div>
            )}
          </div>
          {results.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>{results.length} records found</span>
              <span>Query executed in 0.3s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main KC7 Dashboard Component
interface KC7DashboardProps {
  userName: string;
  onLogout: () => void;
}

export const KC7Dashboard: React.FC<KC7DashboardProps> = ({ userName, onLogout }) => {
  const [activeView, setActiveView] = useState<'home' | 'investigation' | 'training'>('home');
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const startInvestigation = (inv: Investigation) => {
    setSelectedInvestigation(inv);
    setActiveView('investigation');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-lg flex items-center justify-center">
              <Shield className="text-black" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">CYBER</h1>
              <p className="text-xs text-cyber-primary font-mono">QUEST INVESTIGATIONS</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveView('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'home' ? 'bg-cyber-primary/10 text-cyber-primary' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveView('training')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'training' ? 'bg-cyber-primary/10 text-cyber-primary' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Search size={18} /> Investigations
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400">
              <Terminal size={18} /> KQL Practice
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400">
              <Award size={18} /> Achievements
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="px-4 mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Rank</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm">🕵️</div>
                <div>
                  <div className="text-sm font-bold">Junior Analyst</div>
                  <div className="text-xs text-gray-500">Level 3</div>
                </div>
              </div>
            </div>
            <div className="px-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full" />
              </div>
              <div className="text-xs text-gray-500 mt-1">1,250 / 2,000 XP</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-primary to-blue-500 flex items-center justify-center font-bold text-black text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-bold">
                {activeView === 'home' && 'Investigation Dashboard'}
                {activeView === 'investigation' && selectedInvestigation?.title}
                {activeView === 'training' && 'Available Investigations'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <HelpCircle size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <AlertTriangle size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeView === 'home' && (
            <>
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-cyber-primary/20 via-cyber-secondary/20 to-cyber-accent/20 border border-cyber-primary/30 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Detective {userName}! 🕵️</h1>
                    <p className="text-gray-300 max-w-xl">
                      Ready to hunt some hackers? You have <span className="text-cyber-primary font-bold">3 active investigations</span> waiting for your analysis.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => setActiveView('training')}>
                    <Search size={18} className="mr-2" /> Start Investigating
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<CheckCircle size={24} />} value="12" label="Cases Solved" color="#00ff9d" />
                <StatCard icon={<AlertTriangle size={24} />} value="847" label="Threats Found" color="#ef4444" />
                <StatCard icon={<Clock size={24} />} value="24h" label="Investigation Time" color="#00d0ff" />
                <StatCard icon={<Award size={24} />} value="1,250" label="XP Earned" color="#fbbf24" />
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-cyber-primary" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle size={16} className="text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Completed "Phishing Frenzy"</div>
                        <div className="text-xs text-gray-500">2 hours ago</div>
                      </div>
                      <span className="text-xs text-cyber-primary font-mono">+150 XP</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Search size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Found suspicious login</div>
                        <div className="text-xs text-gray-500">5 hours ago</div>
                      </div>
                      <span className="text-xs text-cyber-primary font-mono">+50 XP</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Terminal size={16} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Executed first KQL query</div>
                        <div className="text-xs text-gray-500">1 day ago</div>
                      </div>
                      <span className="text-xs text-cyber-primary font-mono">+25 XP</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lock size={18} className="text-red-400" />
                    Active Alerts
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-sm font-bold text-red-400">Critical</span>
                      </div>
                      <div className="text-sm text-gray-300">Potential data breach detected in "The Phantom Login"</div>
                    </div>
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400">Warning</span>
                      </div>
                      <div className="text-sm text-gray-300">Multiple failed login attempts from unknown IP</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'training' && (
            <>
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-gray-400">Select an investigation to start hunting. Each case teaches real cybersecurity skills.</p>
                <div className="flex gap-2">
                  <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                    <option>All Difficulties</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <button className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {INVESTIGATIONS.map((inv) => (
                  <InvestigationCard 
                    key={inv.id} 
                    investigation={inv} 
                    onStart={() => startInvestigation(inv)} 
                  />
                ))}
              </div>
            </>
          )}

          {activeView === 'investigation' && selectedInvestigation && (
            <div className="h-[calc(100vh-140px)] flex flex-col">
              {/* Investigation Header */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedInvestigation.title}</h2>
                    <p className="text-gray-400">{selectedInvestigation.description}</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('training')}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold text-cyber-secondary mb-2">SCENARIO</h4>
                  <p className="text-gray-300">{selectedInvestigation.scenario}</p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Objectives:</span>
                  <span className="text-cyber-primary">1. Identify the attacker</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-gray-500">2. Find entry point</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-gray-500">3. Assess damage</span>
                </div>
              </div>

              {/* KQL Workspace */}
              <div className="flex-1 bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                <KQLWorkspace />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KC7Dashboard;
