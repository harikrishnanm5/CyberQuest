import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { apiPost } from '../api';
import { getUserId } from './ResumeBanner';

const MissionEval = ({ session, cheatFlags = [], onComplete, onCancel }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    submitEvaluation();
  }, []);

  const submitEvaluation = async () => {
    try {
      const userId = getUserId();
      const data = await apiPost('/api/evaluate', {
        user_id: userId,
        mission_id: session?.mission_id || 'unknown',
        mission_title: session?.mission_title || 'Untitled',
        commands_used: [],
        time_taken: session?.time_taken || 0,
        hints_requested: 0,
        mission_type: session?.attack?.attack_type || 'unknown',
        mission_completed: true,
        cheat_flags: cheatFlags,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center font-mono">
        <div className="text-cipher-accent text-2xl animate-pulse">
          [GRADING MISSION...]
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center font-mono">
        <div className="max-w-md bg-cipher-dark-panel border border-red-600 p-8 rounded text-center">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <div className="text-red-400 mb-4">EVALUATION FAILED</div>
          <div className="text-gray-400 text-sm mb-6">{error}</div>
          <button
            onClick={onCancel}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  const success = result?.success !== false;
  const score = result?.score || 0;
  const cheatPenalty = cheatFlags.length * 5;

  return (
    <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center font-mono p-4">
      <div className="max-w-lg w-full bg-cipher-dark-panel border-2 border-cipher-accent p-8 rounded-lg shadow-[0_0_50px_rgba(233,69,96,0.5)]">
        <div className="text-center mb-6">
          {success ? (
            <CheckCircle className="text-cipher-green mx-auto mb-4" size={64} />
          ) : (
            <XCircle className="text-red-500 mx-auto mb-4" size={64} />
          )}
          <h1 className={`text-3xl font-bold mb-2 ${success ? 'text-cipher-green' : 'text-red-500'}`}>
            {success ? 'MISSION_COMPLETE' : 'MISSION_FAILED'}
          </h1>
          <p className="text-gray-400">{result?.message || 'Evaluation complete'}</p>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded p-4 mb-4">
          <div className="text-sm text-gray-400 mb-2">SCORE BREAKDOWN</div>
          <div className="flex justify-between text-white text-lg">
            <span>Base Score:</span>
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex justify-between text-yellow-400 text-sm mt-1">
            <span>Anti-Cheat Penalty:</span>
            <span>-{cheatPenalty} ({cheatFlags.length} flags)</span>
          </div>
          <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between text-cipher-accent text-xl font-bold">
            <span>FINAL SCORE:</span>
            <span>{Math.max(0, score - cheatPenalty)}</span>
          </div>
        </div>

        {cheatFlags.length > 0 && (
          <div className="bg-yellow-950/30 border border-yellow-700 rounded p-3 mb-4 text-xs">
            <div className="text-yellow-400 font-bold mb-2 flex items-center gap-1">
              <AlertTriangle size={14} /> {cheatFlags.length} ANTI-CHEAT FLAGS LOGGED
            </div>
            <div className="text-yellow-200/70 max-h-24 overflow-y-auto">
              {cheatFlags.slice(0, 10).map((f, i) => (
                <div key={i}>• {f.type || f.flag || 'UNKNOWN'}</div>
              ))}
              {cheatFlags.length > 10 && <div>... and {cheatFlags.length - 10} more</div>}
            </div>
          </div>
        )}

        <div className="bg-green-950/30 border border-green-700 rounded p-3 mb-6 text-xs text-green-300 flex items-center gap-2">
          <CheckCircle size={14} />
          Container destroyed. Volume wiped. Session recorded to profile.
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-cipher-accent hover:bg-red-600 text-white px-6 py-3 rounded font-bold transition"
        >
          RETURN TO INBOX
        </button>
      </div>
    </div>
  );
};

export default MissionEval;