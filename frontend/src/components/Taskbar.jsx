import React, { useState, useEffect } from 'react';

const Taskbar = ({ missionTime }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-10 bg-cipher-dark-panel border-b border-cipher-accent flex items-center justify-between px-4 text-sm font-mono z-50">
      <div className="flex items-center gap-2">
        <span className="text-cipher-accent font-bold tracking-wider">CIPHER_OS v0.1</span>
        <div className="h-4 w-px bg-gray-600 mx-2"></div>
        <span className="text-gray-400 italic">Securing the digital frontier...</span>
      </div>
      <div className="flex items-center gap-6">
        {missionTime !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${missionTime < 60 ? 'text-red-500 border-red-500 animate-pulse' : 'text-cipher-green border-cipher-green'}`}>
            <span className="text-[10px] uppercase font-bold">Mission Timer:</span>
            <span className="font-bold">{formatTime(missionTime)}</span>
          </div>
        )}
        <div className="text-cipher-green">
          {time}
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
