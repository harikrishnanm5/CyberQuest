"""
Firestore user-profile wrapper.
Stores: rank, completed missions, stats, anti-cheat history summary.
Session hot-path (containers, volumes, scrollback) stays in local JSON for speed.
"""
import os
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("Firestore")

try:
    from google.cloud import firestore
    from google.oauth2 import service_account
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    logger.warning("google-cloud-firestore not installed — running in DEV mode")


# Service account path
SERVICE_ACCOUNT_PATH = __import__("pathlib").Path(__file__).parent.parent.parent / "firebase-service-account.json"

_db = None


def _get_db():
    global _db
    if _db is not None:
        return _db
    if not FIRESTORE_AVAILABLE:
        return None
    if not SERVICE_ACCOUNT_PATH.exists():
        logger.warning("Service account not found — Firestore in DEV mode (in-memory)")
        return None
    try:
        cred = service_account.Credentials.from_service_account_file(str(SERVICE_ACCOUNT_PATH))
        _db = firestore.Client(credentials=cred)
        logger.info("Firestore client initialized")
        return _db
    except Exception as e:
        logger.error(f"Firestore init failed: {e}")
        return None


# In-memory fallback for DEV (so the app still works without Firebase configured)
_DEV_STORE: Dict[str, Dict[str, Any]] = {}


class UserProfile:
    """User profile stored in Firestore (or in-memory fallback)."""

    @staticmethod
    def get(uid: str) -> Optional[Dict[str, Any]]:
        db = _get_db()
        if db is None:
            return _DEV_STORE.get(uid)
        try:
            doc = db.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"UserProfile.get failed: {e}")
            return _DEV_STORE.get(uid)

    @staticmethod
    def upsert(uid: str, data: Dict[str, Any]) -> None:
        db = _get_db()
        if db is None:
            existing = _DEV_STORE.get(uid, {})
            existing.update(data)
            _DEV_STORE[uid] = existing
            return
        try:
            db.collection("users").document(uid).set(data, merge=True)
        except Exception as e:
            logger.error(f"UserProfile.upsert failed: {e}")

    @staticmethod
    def record_mission_completion(
        uid: str,
        mission_id: str,
        mission_title: str,
        success: bool,
        score: int,
        duration_seconds: int,
        cheat_flags: List[str],
    ) -> None:
        """Append a mission result to user history."""
        from datetime import datetime
        completion = {
            "mission_id": mission_id,
            "mission_title": mission_title,
            "success": success,
            "score": score,
            "duration_seconds": duration_seconds,
            "cheat_flag_count": len(cheat_flags),
            "timestamp": datetime.utcnow().isoformat(),
        }
        profile = UserProfile.get(uid) or {
            "uid": uid,
            "rank": 1,
            "tier": "Recruit",
            "missions_completed": 0,
            "missions_failed": 0,
            "total_score": 0,
            "history": [],
        }
        history = profile.get("history", [])
        history.append(completion)
        if success:
            profile["missions_completed"] = profile.get("missions_completed", 0) + 1
            profile["total_score"] = profile.get("total_score", 0) + score
        else:
            profile["missions_failed"] = profile.get("missions_failed", 0) + 1

        # Promote rank based on completed missions (simple progression)
        completed = profile.get("missions_completed", 0)
        if completed >= 20:
            profile["rank"], profile["tier"] = 5, "Operator"
        elif completed >= 10:
            profile["rank"], profile["tier"] = 4, "Specialist"
        elif completed >= 5:
            profile["rank"], profile["tier"] = 3, "Analyst"
        elif completed >= 2:
            profile["rank"], profile["tier"] = 2, "Agent"
        else:
            profile["rank"], profile["tier"] = 1, "Recruit"

        UserProfile.upsert(uid, profile)