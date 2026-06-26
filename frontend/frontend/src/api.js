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
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPostNoAuth(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiSendBeacon(path, body) {
  const token = await getIdToken();
  // sendBeacon doesn't allow custom headers — token must be in body or query
  // For our use case, we use a simple fetch with keepalive instead
  const url = `${API_BASE}${path}?token=${encodeURIComponent(token)}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

export { API_BASE };