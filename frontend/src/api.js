/**
 * Centralized API helper — attaches Firebase ID token to every request.
 */
import { getIdToken } from './firebase';

const API_BASE = 'http://localhost:8000';

async function authHeaders() {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
      throw new Error(
        'Backend offline. Start it with: cd D:/cipherops && python -m uvicorn backend.main:app --port 8000'
      );
    }
    throw e;
  }
}

export async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
      throw new Error(
        'Backend offline. Start it with: cd D:/cipherops && python -m uvicorn backend.main:app --port 8000'
      );
    }
    throw e;
  }
}

export async function apiSendBeacon(path, body) {
  const token = await getIdToken();
  const url = `${API_BASE}${path}?token=${encodeURIComponent(token)}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

export { API_BASE };
