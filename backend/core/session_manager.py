"""
Session Manager for CipherOps
Handles persistent user session state across disconnects.
Stores: volume name, scrollback history, mission metadata, expiry timestamp.
Backing store: JSON file (MVP) — swap to Redis/SQLite later.
"""
import json
import os
import time
import uuid
import threading
from pathlib import Path
from typing import Optional, Dict, Any

SESSION_STORE_PATH = Path(__file__).parent.parent.parent / "database" / "sessions.json"
SESSION_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)

_lock = threading.Lock()


def _load() -> Dict[str, Any]:
    """Load all sessions from disk. Returns dict keyed by user_id."""
    if not SESSION_STORE_PATH.exists():
        return {}
    try:
        with open(SESSION_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def _save(sessions: Dict[str, Any]) -> None:
    """Atomically write sessions to disk."""
    tmp = SESSION_STORE_PATH.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2, default=str)
    os.replace(tmp, SESSION_STORE_PATH)


class SessionManager:
    """Manages user session lifecycle with filesystem persistence."""

    def create_session(
        self,
        user_id: str,
        mission_id: str,
        mission_title: str,
        mission_type: str,
        time_limit_minutes: int,
        volume_name: str,
    ) -> Dict[str, Any]:
        """Create a new session record. Returns the session dict."""
        with _lock:
            sessions = _load()
            now = time.time()
            session = {
                "session_uuid": str(uuid.uuid4()),
                "user_id": user_id,
                "mission_id": mission_id,
                "mission_title": mission_title,
                "mission_type": mission_type,
                "volume_name": volume_name,
                "container_id": None,
                "scrollback": [],
                "commands": [],
                "cheat_flags": [],
                "hints_requested": 0,
                "started_at": now,
                "expires_at": now + (time_limit_minutes * 60),
                "last_active": now,
                "status": "active",  # active | suspended | completed | expired
                "time_limit_minutes": time_limit_minutes,
            }
            sessions[user_id] = session
            _save(sessions)
            return session

    def get_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user's session if one exists."""
        with _lock:
            sessions = _load()
            return sessions.get(user_id)

    def get_resumable_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns a session that can be resumed if:
          - It exists
          - Hasn't expired
          - Is in 'suspended' status (container stopped, volume kept)
        """
        session = self.get_session(user_id)
        if not session:
            return None
        if session["status"] != "suspended":
            return None
        if time.time() > session["expires_at"]:
            # Auto-expire stale sessions
            self.expire_session(user_id)
            return None
        return session

    def update_session(self, user_id: str, **kwargs) -> None:
        """Update fields on a session."""
        with _lock:
            sessions = _load()
            if user_id not in sessions:
                return
            sessions[user_id].update(kwargs)
            sessions[user_id]["last_active"] = time.time()
            _save(sessions)

    def append_scrollback(self, user_id: str, line: str) -> None:
        """Append a terminal output line. Keeps last 500 lines."""
        with _lock:
            sessions = _load()
            if user_id not in sessions:
                return
            sb = sessions[user_id]["scrollback"]
            sb.append(line)
            # Trim to last 500 lines to prevent unbounded growth
            if len(sb) > 500:
                sessions[user_id]["scrollback"] = sb[-500:]
            sessions[user_id]["last_active"] = time.time()
            _save(sessions)

    def append_command(self, user_id: str, cmd: str) -> None:
        """Track a command for evaluation."""
        with _lock:
            sessions = _load()
            if user_id not in sessions:
                return
            sessions[user_id]["commands"].append({
                "cmd": cmd,
                "ts": time.time(),
            })
            _save(sessions)

    def increment_hints(self, user_id: str) -> None:
        with _lock:
            sessions = _load()
            if user_id in sessions:
                sessions[user_id]["hints_requested"] += 1
                _save(sessions)

    def add_cheat_flag(self, user_id: str, flag_type: str, details: str = "") -> None:
        """
        Record an anti-cheat violation.
        flag_type: PASTE | FOCUS_LOSS | DEVTOOLS_OPEN | COPY | TAB_NAV | KEYBOARD_SHORTCUT | etc.
        """
        with _lock:
            sessions = _load()
            if user_id in sessions:
                flag = {
                    "type": flag_type,
                    "details": details,
                    "ts": time.time(),
                }
                sessions[user_id]["cheat_flags"].append(flag)
                _save(sessions)

    def suspend_session(self, user_id: str) -> None:
        """User disconnected — keep volume, stop container, mark for resume."""
        with _lock:
            sessions = _load()
            if user_id in sessions:
                sessions[user_id]["status"] = "suspended"
                sessions[user_id]["container_id"] = None
                _save(sessions)

    def resume_session(self, user_id: str, new_container_id: str) -> Dict[str, Any]:
        """Mark a session as active again with a new container."""
        with _lock:
            sessions = _load()
            if user_id not in sessions:
                raise ValueError("No session to resume")
            sessions[user_id]["status"] = "active"
            sessions[user_id]["container_id"] = new_container_id
            sessions[user_id]["last_active"] = time.time()
            _save(sessions)
            return sessions[user_id]

    def complete_session(self, user_id: str) -> None:
        """Mark session as completed (success or failure)."""
        with _lock:
            sessions = _load()
            if user_id in sessions:
                sessions[user_id]["status"] = "completed"
                _save(sessions)

    def expire_session(self, user_id: str) -> None:
        """Time's up — mark as expired."""
        with _lock:
            sessions = _load()
            if user_id in sessions:
                sessions[user_id]["status"] = "expired"
                _save(sessions)

    def delete_session(self, user_id: str) -> None:
        """Hard delete a session record."""
        with _lock:
            sessions = _load()
            if user_id in sessions:
                del sessions[user_id]
                _save(sessions)

    def get_active_sessions(self) -> list:
        """Return all sessions with status='active'. Used by watchdog."""
        with _lock:
            sessions = _load()
            return [
                (uid, s) for uid, s in sessions.items()
                if s["status"] == "active"
            ]


session_manager = SessionManager()