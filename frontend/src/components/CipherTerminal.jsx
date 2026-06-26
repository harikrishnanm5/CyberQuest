import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { getUserId } from './ResumeBanner';
import { getIdToken } from '../firebase';
import AntiCheatMonitor from './AntiCheatMonitor';

const CipherTerminal = ({ userId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  // Stable callback for AntiCheatMonitor to send events
  const sendEvent = useCallback((event) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const uid = typeof userId === 'string' ? userId : getUserId();

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      cursorBlinking: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#00FF41',
        cursor: '#00FF41',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    // Get auth token and open WebSocket
    (async () => {
      const token = await getIdToken();
      if (cancelled) return;
      const url = `ws://localhost:8000/ws/terminal/${uid}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        term.write('\r\n[+] Connection established with CipherOps...\r\n');
        term.write('[+] Booting Kali Linux sandbox...\r\n');
        setSocketReady(true);
      };

      socket.onmessage = (event) => {
        term.write(event.data);
      };

      socket.onerror = () => {
        term.write('\r\n[!] WebSocket Error: Cannot reach backend at localhost:8000\r\n');
      };

      socket.onclose = (ev) => {
        if (ev.code === 4001) {
          term.write('\r\n[!] AUTH_FAILED. Please log in again.\r\n');
        } else {
          term.write('\r\n[!] Connection closed. Refresh or resume from inbox to reconnect.\r\n');
        }
        setSocketReady(false);
      };

      // Send keystrokes / commands to backend
      term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });
    })();

    return () => {
      cancelled = true;
      try {
        if (socketRef.current) socketRef.current.close();
      } catch (e) {}
      term.dispose();
    };
  }, [userId]);

  return (
    <>
      {/* AntiCheatMonitor runs invisibly while terminal is open */}
      <AntiCheatMonitor
        userId={typeof userId === 'string' ? userId : getUserId()}
        sendEvent={sendEvent}
      />
      <div className="h-full w-full bg-black rounded-lg border border-cipher-green shadow-[0_0_15px_rgba(0,255,65,0.2)] overflow-hidden relative">
        <div
          ref={terminalRef}
          className="h-full w-full"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500 cursor-pointer"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 cursor-pointer"></div>
          <div className={`h-3 w-3 rounded-full ${socketReady ? 'bg-green-500' : 'bg-gray-600'}`}></div>
        </div>
      </div>
    </>
  );
};

export default CipherTerminal;