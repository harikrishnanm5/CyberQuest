import React from 'react';
import { Inbox, Terminal, LayoutDashboard, ShieldAlert, Lock } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'inbox', label: 'CipherMail', icon: Inbox },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'missions', label: 'Missions', icon: LayoutDashboard },
    { id: 'vault', label: 'CipherVault', icon: Lock },
  ];

  return (
    <div className="w-64 bg-cipher-dark-panel border-r border-cipher-accent flex flex-col h-full">
      <div className="p-6 flex flex-col gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all font-mono text-sm ${
              activeTab === tab.id
                ? 'bg-cipher-accent text-white shadow-[0_0_15px_rgba(233,69,96,0.5)]'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto p-6">
        <div className="p-3 bg-black/30 rounded border border-gray-700 text-xs font-mono">
          <div className="text-gray-500 mb-1">SESSION_STATUS:</div>
          <div className="text-cipher-green flex items-center gap-2">
            <span className="w-2 h-2 bg-cipher-green rounded-full animate-pulse"></span>
            ENCRYPTED_CONNECTION
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
