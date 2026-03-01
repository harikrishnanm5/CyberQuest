import React from 'react';
import { Shield, Menu, X, Terminal, Sun, Moon, Globe } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  onOpenAuth: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, isDark, toggleTheme }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-cyber-black/80 backdrop-blur-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <Shield className="text-cyber-primary group-hover:rotate-12 transition-transform duration-300" size={32} />
              <Terminal className="absolute -bottom-1 -right-1 text-cyber-secondary bg-cyber-black rounded-full p-0.5" size={14} />
            </div>
            <span className="text-xl font-mono font-bold tracking-tighter text-gray-900 dark:text-white transition-colors">
              CYBER<span className="text-cyber-primary">QUEST</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#events" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Events</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Pricing</a>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group relative">
              <Globe size={18} className="text-gray-500 group-hover:text-cyber-primary transition-colors" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-mono font-bold text-gray-600 dark:text-gray-300 focus:outline-none appearance-none cursor-pointer pr-4"
              >
                <option value="en" className="dark:bg-cyber-dark">EN</option>
                <option value="es" className="dark:bg-cyber-dark">ES</option>
                <option value="fr" className="dark:bg-cyber-dark">FR</option>
                <option value="de" className="dark:bg-cyber-dark">DE</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <div className="w-1.5 h-1.5 border-r border-b border-current rotate-45"></div>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 dark:border-white/10">
              <button
                onClick={onOpenAuth}
                className="text-sm font-bold text-gray-700 dark:text-white hover:text-cyber-primary transition-colors"
              >
                LOG IN
              </button>
              <Button size="sm" variant="primary" onClick={onOpenAuth}>JOIN THE QUEST</Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-cyber-dark border-b border-gray-200 dark:border-white/10 transition-colors">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">Features</a>
            <a href="#events" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">Events</a>
            <div className="mt-4 px-3 space-y-2">
              <Button className="w-full" variant="outline" onClick={onOpenAuth}>LOG IN</Button>
              <Button className="w-full" onClick={onOpenAuth}>SIGN UP</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};