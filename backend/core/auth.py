"""
Firebase Auth verification for CipherOps.
Verifies Firebase ID tokens sent from the frontend on every request.
Uses firebase-admin SDK on the backend.
"""
import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger("Auth")

# firebase-admin is optional in dev — fall back to stub mode if not configured
try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin not installed — running in DEV mode (no real auth)")


# Path to Firebase service account JSON (download from Firebase Console)
SERVICE_ACCOUNT_PATH = Path(__file__).parent.parent.parent / "firebase-service-account.json"


_initialized = False


def _ensure_initialized():
    """Initialize Firebase Admin SDK once."""
    global _initialized
    if _initialized or not FIREBASE_AVAILABLE:
        return
    try:
        if SERVICE_ACCOUNT_PATH.exists():
            cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
            firebase_admin.initialize_app(cred)
            _initialized = True
            logger.info("Firebase Admin initialized with service account")
        else:
            # Try default credentials (e.g. on GCP / Cloud Run)
            try:
                firebase_admin.initialize_app()
                _initialized = True
                logger.info("Firebase Admin initialized with default credentials")
            except Exception as e:
                logger.warning(f"Firebase Admin not configured: {e} — DEV mode active")
    except Exception as e:
        logger.error(f"Firebase init failed: {e}")


def verify_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Firebase ID token. Returns user info dict or None.
    In DEV mode (no service account), accepts a simple "dev:<user_id>" pattern.
    """
    # DEV mode check FIRST — if token starts with "dev:", skip Firebase entirely
    if id_token.startswith("dev:"):
        return {
            "uid": id_token[4:],
            "email": f"{id_token[4:]}@dev.local",
            "name": id_token[4:],
            "provider": "dev",
        }

    # Real Firebase verification
    _ensure_initialized()
    if not FIREBASE_AVAILABLE or not _initialized:
        return None

    try:
        decoded = fb_auth.verify_id_token(id_token)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "name": decoded.get("name", decoded.get("email", "").split("@")[0]),
            "provider": decoded.get("firebase", {}).get("sign_in_provider", "unknown"),
        }
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


# FastAPI dependency
async def get_current_user(authorization: str = "") -> Optional[Dict[str, Any]]:
    """FastAPI dependency that extracts and verifies the Bearer token."""
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    return verify_token(token)