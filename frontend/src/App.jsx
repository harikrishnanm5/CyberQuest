import React, { useState, useEffect } from 'react';
import Taskbar from './components/Taskbar';
import Sidebar from './components/Sidebar';
import CipherMail from './components/CipherMail';
import CipherTerminal from './components/CipherTerminal';
import Assessment from './components/Assessment';
import ResumeBanner, { getUserId } from './components/ResumeBanner';
import Login from './components/Login';
import MissionEval from './components/MissionEval';
import { apiPost, apiGet, apiSendBeacon } from './api';

const App = () => {
  const [user, setUser] = useState(null); // logged-in user
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);

  // Session state
  const [session, setSession] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [failedMission, setFailedMission] = useState(null);
  const [showResume, setShowResume] = useState(true);
  const [dismissedResume, setDismissedResume] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [evalCheatFlags, setEvalCheatFlags] = useState([]);

  // ---- Auth check on mount ----
  useEffect(() => {
    const cached = localStorage.getItem('cipherops_user_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
      } catch (e) {}
    }
    setAuthChecked(true);
  }, []);

  // ---- Countdown timer ----
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((session.expiresAt - Date.now() / 1000)));
      setSecondsLeft(left);
      if (left === 0) {
        handleMissionFailure('timeout');
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session]);

  // ---- Disconnect handling — suspend session on tab close ----
  useEffect(() => {
    const handleUnload = () => {
      if (session) {
        const userId = getUserId();
        apiSendBeacon('/api/session/suspend', { user_id: userId });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('cipherops_user_cache', JSON.stringify(userData));
  };

  const handleAssessmentComplete = (rank) => {
    setHasCompletedAssessment(true);
  };

  const handleSessionStarted = (sessionData) => {
    setSession({
      ...sessionData,
      expiresAt: sessionData.expiresAt,
    });
    setActiveTab('terminal');
  };

  const handleResume = async (resumeData) => {
    const userId = getUserId();
    try {
      const data = await apiPost(`/api/session/resume/${userId}`, {});
      setSession({
        mission: { mission_title: resumeData.mission_title, mission_id: resumeData.session_uuid },
        attack: { attack_type: resumeData.mission_type },
        expiresAt: Date.now() / 1000 + data.time_remaining_seconds,
        sessionUuid: data.session_uuid,
      });
      setShowResume(false);
      setActiveTab('terminal');
    } catch (e) {
      console.error('Resume failed:', e);
      alert('Resume failed: ' + e.message);
    }
  };

  const handleAbandonSession = async () => {
    const userId = getUserId();
    try {
      await apiPost(`/api/session/end?user_id=${userId}`, {});
    } catch (e) {
      console.warn('Abandon error:', e);
    }
    setShowResume(false);
  };

  const handleMissionFailure = async (reason = 'manual') => {
    if (failedMission) return;
    setFailedMission({
      message: 'Mission Failed — Environment Wiped',
      summary: reason === 'timeout'
        ? 'Time expired. Your isolated environment was destroyed.'
        : 'You abandoned the mission. The isolated environment was terminated.',
    });
    const userId = getUserId();
    try {
      await apiPost(`/api/session/end?user_id=${userId}`, {});
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
    setSession(null);
  };

  const handleCompleteMission = () => {
    setShowEval(true);
  };

  const handleEvalComplete = () => {
    setShowEval(false);
    setSession(null);
    setActiveTab('inbox');
  };

  // ---- Render ----
  if (!authChecked) {
    return <div className="h-screen w-screen bg-black" />;
  }

  if (!user) {
    return <Login onLoggedIn={handleLogin} />;
  }

  const renderContent = () => {
    if (!hasCompletedAssessment) {
      return <Assessment onComplete={handleAssessmentComplete} />;
    }

    switch (activeTab) {
      case 'inbox':
        return (
          <div className="p-8 h-full">
            <CipherMail onSessionStarted={handleSessionStarted} />
          </div>
        );
      case 'terminal':
        if (!session) {
          return (
            <div className="p-8 font-mono text-center text-gray-400">
              <h1 className="text-2xl text-cipher-accent mb-4">NO ACTIVE MISSION</h1>
              <p>Accept a mission from CipherMail to start your Kali environment.</p>
            </div>
          );
        }
        return (
          <div className="p-8 h-full flex flex-col font-mono">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl text-cipher-accent">
                CIPHER_TERMINAL // {session.mission?.mission_title || 'LIVE'}
              </h1>
              <div className="flex items-center gap-4">
                <div className="text-cipher-green font-bold">
                  {secondsLeft !== null && (
                    <>
                      TIME_LEFT: {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                      {String(secondsLeft % 60).padStart(2, '0')}
                    </>
                  )}
                </div>
                <button
                  onClick={handleCompleteMission}
                  className="bg-cipher-green text-black hover:bg-green-400 px-4 py-1 rounded font-bold text-sm"
                >
                  COMPLETE MISSION
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <CipherTerminal userId={getUserId()} />
            </div>
          </div>
        );
      case 'missions':
        return (
          <div className="p-8 font-mono">
            <h1 className="text-2xl text-cipher-accent mb-4">MISSION_BOARD // ACTIVE</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-cipher-dark-panel border border-gray-700 p-4 rounded-lg">
                <div className="text-cipher-accent font-bold mb-2">Operation: Ghost Protocol</div>
                <div className="text-sm text-gray-400">Investigate anomalies in the kernel logs.</div>
              </div>
            </div>
          </div>
        );
      case 'vault':
        return (
          <div className="p-8 font-mono">
            <h1 className="text-2xl text-cipher-accent mb-4">CIPHER_VAULT // SECURE</h1>
            <div className="bg-cipher-dark-panel border border-gray-700 p-4 rounded-lg text-gray-400">
              <div className="mb-2">User: {user.email}</div>
              <div className="mb-2">Tier: {user.profile?.tier || 'Recruit'}</div>
              <div className="mb-2">Missions Completed: {user.profile?.missions_completed || 0}</div>
              <div>Total Score: {user.profile?.total_score || 0}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-cipher-bg overflow-hidden">
      {/* Resume banner */}
      {hasCompletedAssessment && showResume && !dismissedResume && (
        <ResumeBanner
          onResume={handleResume}
          onStartFresh={handleAbandonSession}
          onDismiss={() => setDismissedResume(true)}
        />
      )}

      {/* Mission eval modal */}
      {showEval && session && (
        <MissionEval
          session={{
            mission_id: session.mission?.mission_id,
            mission_title: session.mission?.mission_title,
            attack: session.attack,
            time_taken: session.timeLimitMinutes ? session.timeLimitMinutes * 60 : 0,
          }}
          cheatFlags={evalCheatFlags}
          onComplete={handleEvalComplete}
          onCancel={() => setShowEval(false)}
        />
      )}

      {!hasCompletedAssessment && (
        <div className="h-screen w-screen fixed inset-0 z-[100] bg-cipher-bg">
          <Assessment onComplete={handleAssessmentComplete} />
        </div>
      )}

      {failedMission && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full bg-cipher-dark-panel border-2 border-red-600 p-8 rounded-lg text-center shadow-[0_0_50px_rgba(230,0,0,0.5)]">
            <h1 className="text-3xl text-red-500 font-bold mb-4">SESSION_TERMINATED</h1>
            <div className="text-white text-lg mb-2">{failedMission.message}</div>
            <div className="text-gray-400 text-sm italic mb-8">{failedMission.summary}</div>
            <button
              onClick={() => {
                setFailedMission(null);
                setActiveTab('inbox');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold transition-all"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      <Taskbar missionTime={secondsLeft} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto bg-cipher-bg relative">
          <div className="absolute inset-0 pointer-events-none opacity-10"
               style={{ backgroundImage: 'radial-gradient(#E94560 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;