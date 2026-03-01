import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TerminalDemo } from './components/TerminalDemo';
import { FeatureCard } from './components/FeatureCard';
import { Button } from './components/Button';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Feature } from './types';
import {
  BrainCircuit,
  Flag,
  Users,
  Trophy,
  Code,
  Lock,
  Cpu,
  Globe,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react';

const features: Feature[] = [
  {
    id: '1',
    title: 'Adaptive AI Learning',
    description: 'Our core AI engine analyzes your performance in real-time and dynamically adjusts the difficulty of challenges to keep you in the flow state.',
    icon: <BrainCircuit size={24} />,
    color: '#00ff9d'
  },
  {
    id: '2',
    title: 'Generative CTFs',
    description: 'Never play the same CTF twice. Our AI generates unique flags, vulnerabilities, and scenarios based on real-world threat intelligence.',
    icon: <Flag size={24} />,
    color: '#00d0ff'
  },
  {
    id: '3',
    title: 'Virtual Labs',
    description: 'Spin up isolated Docker containers instantly directly in your browser. Practice Linux commands, penetration testing tools, and defense strategies safely.',
    icon: <Cpu size={24} />,
    color: '#bd00ff'
  },
  {
    id: '4',
    title: 'Global Leaderboards',
    description: 'Compete against hackers worldwide. Earn XP, badges, and reputation points to climb the ranks from Script Kiddie to Elite CISO.',
    icon: <Trophy size={24} />,
    color: '#fbbf24'
  }
];

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-cyber-black flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyber-primary/20 mb-4 animate-pulse">
        <Shield className="text-cyber-primary" size={32} />
      </div>
      <div className="flex items-center gap-2 text-cyber-primary font-mono">
        <Loader2 className="animate-spin" size={20} />
        <span>INITIALIZING SYSTEM...</span>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Keep dark theme when showing dashboard so background is never white
  useEffect(() => {
    if (user) {
      document.documentElement.classList.add('dark');
    }
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cyber-black text-gray-900 dark:text-gray-100 font-sans selection:bg-cyber-primary selection:text-black transition-colors duration-300">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Grid & Glows */}
        <div className="absolute inset-0 bg-grid-pattern-light dark:bg-grid-pattern bg-[size:40px_40px] opacity-[0.05] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-cyber-primary/20 blur-[120px] rounded-full pointer-events-none opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono text-cyber-secondary mb-8 animate-pulse-fast">
            <span className="w-2 h-2 rounded-full bg-cyber-secondary"></span>
            SYSTEM ONLINE // V2.0 LIVE
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
            <span className="block">Gamified Cyber Security</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent">
              Powered by AI
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Cyber Quest adapts to your skill level. Learn hacking, defense, and networking through immersive, AI-generated simulations and challenges.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-emerald-500/20 dark:shadow-[0_0_30px_rgba(0,255,157,0.3)]" onClick={() => setIsAuthOpen(true)}>
              START HACKING NOW
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              VIEW ROADMAP
            </Button>
          </div>

          {/* AI Demo Section embedded in Hero */}
          <div className="mt-12 mx-auto max-w-4xl perspective-1000">
            <div className="text-left mb-2 pl-4 flex items-center gap-2 text-sm font-mono text-gray-500">
              <Code size={14} />
              <span>TRY THE AI MENTOR</span>
            </div>
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-cyber-dark border-t border-gray-200 dark:border-white/5 relative transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="text-cyber-primary">///</span> System Capabilities
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A comprehensive suite of tools designed to take you from novice to expert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(feature => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-24 bg-gray-50 dark:bg-cyber-black border-t border-gray-200 dark:border-white/5 relative transition-colors duration-300">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-cyber-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                <span className="text-cyber-secondary">///</span> Live Operations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl">
                Participate in real-time CTF events and hackathons. Compete for prizes and global ranking points.
              </p>
            </div>
            <Button variant="outline" className="shrink-0">VIEW ALL EVENTS</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Event Card 1 */}
            <div className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-cyber-dark hover:border-cyber-secondary/50 transition-all duration-300 shadow-sm hover:shadow-lg">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-cyber-dark dark:to-gray-900 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary/20 px-2 py-1 rounded text-xs font-bold font-mono">
                  REGISTRATION_OPEN
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Operation: Midnight Sun</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">
                  <div className="flex items-center gap-1"><Calendar size={14} /> OCT 15</div>
                  <div className="flex items-center gap-1"><Clock size={14} /> 48H</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-500 mb-6">A global CTF event focusing on cryptography and reverse engineering challenges.</p>
                <Button variant="secondary" className="w-full" size="sm">REGISTER TEAM</Button>
              </div>
            </div>

            {/* Event Card 2 */}
            <div className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-cyber-dark hover:border-cyber-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-cyber-dark dark:to-gray-900 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558494949-ef526b01201b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/20 px-2 py-1 rounded text-xs font-bold font-mono">
                  LIVE_NOW
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Red vs Blue: Siege</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">
                  <div className="flex items-center gap-1"><Calendar size={14} /> TODAY</div>
                  <div className="flex items-center gap-1"><MapPin size={14} /> ONLINE</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-500 mb-6">Real-time attack and defense simulation. Protect your servers while infiltrating others.</p>
                <Button variant="primary" className="w-full" size="sm">JOIN LOBBY</Button>
              </div>
            </div>

            {/* Event Card 3 */}
            <div className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-cyber-dark hover:border-cyber-accent/50 transition-all duration-300 shadow-sm hover:shadow-lg">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-cyber-dark dark:to-gray-900 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/20 px-2 py-1 rounded text-xs font-bold font-mono">
                  UPCOMING
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Zero Day Workshop</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">
                  <div className="flex items-center gap-1"><Calendar size={14} /> NOV 02</div>
                  <div className="flex items-center gap-1"><Users size={14} /> 500+</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-500 mb-6">Masterclass on discovering and exploiting zero-day vulnerabilities with expert mentors.</p>
                <Button variant="outline" className="w-full" size="sm">REMIND ME</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Features Grid */}
      <section className="py-16 bg-white dark:bg-cyber-dark relative border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-cyber-secondary/30 dark:hover:border-cyber-primary/30 transition-colors">
              <Users className="mx-auto mb-2 text-cyber-secondary" />
              <h4 className="font-bold text-gray-900 dark:text-white">Community</h4>
              <p className="text-xs text-gray-500 mt-1">Join 10k+ Hackers</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-cyber-primary/30 dark:hover:border-cyber-primary/30 transition-colors">
              <Lock className="mx-auto mb-2 text-cyber-primary" />
              <h4 className="font-bold text-gray-900 dark:text-white">Privacy First</h4>
              <p className="text-xs text-gray-500 mt-1">No Data Tracking</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-cyber-accent/30 dark:hover:border-cyber-primary/30 transition-colors">
              <Globe className="mx-auto mb-2 text-cyber-accent" />
              <h4 className="font-bold text-gray-900 dark:text-white">Real Scenarios</h4>
              <p className="text-xs text-gray-500 mt-1">Based on CVEs</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-yellow-400/30 dark:hover:border-cyber-primary/30 transition-colors">
              <Cpu className="mx-auto mb-2 text-yellow-500 dark:text-yellow-400" />
              <h4 className="font-bold text-gray-900 dark:text-white">Cloud Native</h4>
              <p className="text-xs text-gray-500 mt-1">No Setup Req.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 relative overflow-hidden bg-gray-50 dark:bg-cyber-black transition-colors duration-300">
        <div className="absolute inset-0 bg-cyber-primary/5"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
            Ready to Initialize?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
            Join thousands of cybersecurity students mastering the art of defense and offense.
          </p>
          <div className="p-1 rounded-lg bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent inline-block">
            <div className="bg-white dark:bg-cyber-black rounded-md p-8 transition-colors duration-300">
              <Button size="lg" className="w-full md:w-auto text-lg px-12" onClick={() => setIsAuthOpen(true)}>
                CREATE FREE ACCOUNT
              </Button>
              <p className="mt-4 text-xs text-gray-500 font-mono">NO CREDIT CARD REQUIRED // OPEN SOURCE CORE</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-cyber-black border-t border-gray-200 dark:border-white/10 pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-cyber-primary" size={24} />
                <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">CYBER<span className="text-cyber-primary">QUEST</span></span>
              </div>
              <p className="text-gray-600 dark:text-gray-500 text-sm">
                Empowering the next generation of ethical hackers through adaptive AI education.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-cyber-primary">Challenges</a></li>
                <li><a href="#" className="hover:text-cyber-primary">Leaderboard</a></li>
                <li><a href="#" className="hover:text-cyber-primary">Labs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-cyber-primary">About Us</a></li>
                <li><a href="#" className="hover:text-cyber-primary">Blog</a></li>
                <li><a href="#" className="hover:text-cyber-primary">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-cyber-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyber-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-600 text-sm font-mono">
              © 2024 Cyber Quest Inc. All systems operational.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-300 dark:hover:bg-white/10 cursor-pointer transition-colors">X</div>
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-300 dark:hover:bg-white/10 cursor-pointer transition-colors">in</div>
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-300 dark:hover:bg-white/10 cursor-pointer transition-colors">Git</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
