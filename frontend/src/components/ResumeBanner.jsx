import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'cipherops_user_id';

// Persistent user_id — generated once per browser
export const getUserId = () => {
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
};

const ResumeBanner = ({ onResume, onStartFresh, onDismiss }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const userId = getUserId();
    fetch(`http://localhost:8000/api/session/check/${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.resumable) {
          setData(d);
          setSecondsLeft(d.time_remaining_seconds);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft > 0]);

  if (loading) return null;
  if (!data) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed top-0 left-0 right-0 z-[300] bg-yellow-600 text-black px-6 py-3 font-mono shadow-lg flex items-center justify-between">
      <div>
        <div className="font-bold">⚠ UNFINISHED SESSION DETECTED</div>
        <div className="text-sm">
          Mission: <b>{data.mission_title}</b> — Time left: {mins}m {secs}s
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onResume(data)}
          className="bg-black text-yellow-400 px-4 py-2 font-bold hover:bg-gray-900 transition"
        >
          RESUME
        </button>
        <button
          onClick={onStartFresh}
          className="bg-red-700 text-white px-4 py-2 font-bold hover:bg-red-800 transition"
        >
          ABANDON
        </button>
        <button
          onClick={onDismiss}
          className="text-black hover:text-white px-2"
          title="Hide (session still saved)"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ResumeBanner;