import React, { useState } from 'react';
import { Mail, User, Calendar, CheckCircle, LoaderCircle } from 'lucide-react';
import { getUserId } from './ResumeBanner';
import { apiPost } from '../api';

const SAMPLE_EMAILS = [
  {
    id: 'm1',
    sender: 'DIRECTOR_SANTIAGO',
    subject: 'URGENT: Network Intrusion Detected',
    timestamp: '2026-06-22 09:12',
    content: `Employee,\n\nOur monitoring systems have flagged an unauthorized access attempt on Port 22 of the main production server. We suspect a brute-force attack from a known malicious IP range.\n\nYour objective: Access the terminal, investigate the auth logs, identify the attacker's origin, and close the vulnerability.\n\nFailure to resolve this immediately may lead to data exfiltration.`,
    missionId: 'ghost-protocol',
    domain: 'Network Security',
    timeLimit: 30,
  },
  {
    id: 'm2',
    sender: 'SEC_OPS_CENTRAL',
    subject: 'Scheduled Security Audit - Vault Access',
    timestamp: '2026-06-22 11:45',
    content: `Attention,\n\nWe are conducting a routine audit of the CipherVault access logs. We've noticed several failed attempts to access the encrypted seed fragments using legacy credentials.\n\nYour objective: Audit the vault access logs and rotate the compromised keys before the next sync cycle.\n\nEnsure all logs are archived before performing the rotation.`,
    missionId: 'vault-sweep',
    domain: 'Cryptography',
    timeLimit: 45,
  },
  {
    id: 'm3',
    sender: 'THREAT_INTEL_BETA',
    subject: 'New Zero-Day Vulnerability Report',
    timestamp: '2026-06-22 14:20',
    content: `Team,\n\nA new remote code execution (RCE) vulnerability has been reported in the web server's request handling logic. Intelligence suggests that state-sponsored actors are already scanning for this.\n\nYour objective: Deploy a temporary patch to the middleware and analyze the request payload to develop a permanent fix.\n\nTime is of the essence.`,
    missionId: 'zero-day-patch',
    domain: 'Web Application Security',
    timeLimit: 60,
  },
];

const CipherMail = ({ onSessionStarted }) => {
  const [selectedEmail, setSelectedEmail] = useState(SAMPLE_EMAILS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAcceptMission = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = getUserId();
      const data = await apiPost('/api/session/start', {
        user_id: userId,
        user_rank: 2,
        domain: selectedEmail.domain,
        time_limit_minutes: selectedEmail.timeLimit,
      });
      if (onSessionStarted) {
        onSessionStarted({
          mission: data.mission,
          attack: data.attack,
          expiresAt: data.expires_at,
          timeLimitMinutes: data.time_limit_minutes,
          sessionUuid: data.session_uuid,
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="text-cipher-accent" size={24} />
        <h1 className="text-2xl text-cipher-accent tracking-widest">CIPHER_MAIL // SECURE_INBOX</h1>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden h-[calc(100vh-160px)]">
        {/* Email List */}
        <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2">
          {SAMPLE_EMAILS.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-3 cursor-pointer border transition-all ${
                selectedEmail.id === email.id
                  ? 'bg-cipher-accent/20 border-cipher-accent text-white'
                  : 'bg-cipher-dark-panel border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold truncate uppercase">{email.sender}</span>
                <span className="text-[10px] opacity-50">{email.timestamp}</span>
              </div>
              <div className="truncate opacity-80">{email.subject}</div>
            </div>
          ))}
        </div>

        {/* Email Content */}
        <div className="flex-1 bg-cipher-dark-panel border border-gray-700 rounded-lg flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-700 bg-black/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-300 font-bold">{selectedEmail.sender}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={16} />
                <span>{selectedEmail.timestamp}</span>
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-2">{selectedEmail.subject}</div>
            <div className="text-xs text-cipher-accent mt-2">
              DOMAIN: {selectedEmail.domain} | TIME_LIMIT: {selectedEmail.timeLimit}min
            </div>
          </div>

          <div className="p-8 overflow-y-auto flex-1 leading-relaxed text-gray-300 whitespace-pre-wrap">
            {selectedEmail.content}
          </div>

          <div className="p-6 border-t border-gray-700 bg-black/20 flex flex-col items-end gap-2">
            {error && (
              <div className="text-red-500 text-xs bg-red-950 border border-red-700 px-3 py-2 rounded w-full">
                [ERROR] {error}
              </div>
            )}
            <button
              onClick={handleAcceptMission}
              disabled={loading}
              className="bg-cipher-accent hover:bg-red-600 disabled:bg-gray-700 text-white px-6 py-2 rounded font-bold transition-colors shadow-[0_0_10px_rgba(233,69,96,0.4)] flex items-center gap-2"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'BOOTING KALI ENVIRONMENT...' : `ACCEPT MISSION: ${selectedEmail.missionTitle}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CipherMail;