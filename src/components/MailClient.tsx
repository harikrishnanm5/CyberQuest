import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail as MailIcon, Inbox, Send, AlertTriangle, CheckCircle, User, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'mission' | 'official' | 'alert';
}

const INITIAL_EMAILS: Email[] = [
  {
    id: '1',
    from: 'AXIOM Intelligence',
    subject: 'Welcome to the SOC Platform',
    body: 'Operator,\n\nYour workstation has been initialized. We have synchronized your learner profile with our threat intelligence registry. Expect missions to adapt to your performance.\n\nGood luck.',
    timestamp: '2 hours ago',
    read: true,
    type: 'official'
  },
  {
    id: '2',
    from: 'Chief Information Security Officer',
    subject: 'Quarterly Performance Review',
    body: 'We are monitoring your assessment progress. Based on your current telemetry, your placement in the SOC is being finalized. Maintain high precision in your command execution.',
    timestamp: '1 hour ago',
    read: false,
    type: 'official'
  }
];

export const MailClient: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedEmail = emails.find(e => e.id === selectedId);

  const handleRead = (id: string) => {
    setSelectedId(id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  return (
    <div className="flex h-full bg-black/40 backdrop-blur-xl overflow-hidden font-mono">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 p-4 space-y-2 flex flex-col">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mailbox</div>
        <button className="flex items-center gap-3 px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-bold border border-accent/20">
          <Inbox size={14} /> Inbox
          <span className="ml-auto bg-accent text-taskbar text-[9px] px-1.5 rounded-full">
            {emails.filter(e => !e.read).length}
          </span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-bold">
          <Send size={14} /> Sent
        </button>
        <button className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-bold">
          <AlertTriangle size={14} /> Urgent
        </button>
      </div>

      {/* List */}
      <div className="w-96 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search communications..." 
              className="w-full bg-black/40 border border-white/5 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-accent/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {emails.map(email => (
            <button
              key={email.id}
              onClick={() => handleRead(email.id)}
              className={cn(
                "w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/[0.03]",
                selectedId === email.id ? "bg-white/[0.05] border-l-2 border-l-accent" : "",
                !email.read ? "bg-accent/5" : ""
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[10px] font-black uppercase tracking-wider", !email.read ? "text-white" : "text-gray-500")}>
                  {email.from}
                </span>
                <span className="text-[9px] text-gray-600 italic">{email.timestamp}</span>
              </div>
              <div className={cn("text-xs font-bold mb-1 truncate", !email.read ? "text-accent" : "text-gray-400")}>
                {email.subject}
              </div>
              <div className="text-[10px] text-gray-600 line-clamp-1 italic">
                {email.body.substring(0, 50)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 flex flex-col bg-white/[0.01]">
        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div 
              key={selectedEmail.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 p-8 overflow-y-auto custom-scrollbar"
            >
              <div className="mb-12 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      <span>From: {selectedEmail.from}</span>
                      <span>•</span>
                      <span>{selectedEmail.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] text-accent font-black uppercase">
                    {selectedEmail.type}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-gray-400 font-black uppercase flex items-center gap-1">
                    <Clock size={10} /> Priority High
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                {selectedEmail.body}
              </div>

              <div className="mt-12 pt-12 border-t border-white/5 flex gap-4">
                <button className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-accent hover:text-white transition-all">
                  Reply
                </button>
                <button className="px-6 py-2 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/10 transition-all">
                  Forward
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
              <MailIcon size={48} className="opacity-10" />
              <span className="text-xs font-black uppercase tracking-[0.4em] opacity-20">No Message Selected</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
