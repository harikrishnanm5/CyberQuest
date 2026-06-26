"""
CipherOps Backend — FastAPI v3
Auth (Firebase) + Firestore profiles + Hard cleanup on completion + Anti-cheat logging.
"""
import asyncio
import time
import json
import uuid
import hashlib
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.core.docker_manager import docker_manager
from backend.core.session_manager import session_manager
from backend.core.auth import verify_token
from backend.core.firestore_client import UserProfile
from backend.agents.evaluator import evaluator
from backend.agents.colleague import colleague
from backend.agents.adversary import adversary
from backend.agents.architect import architect
from backend.agents.assessment import assessment_agent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
# Suppress noisy third-party loggers
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("docker").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)
logger = logging.getLogger("CipherOps")

app = FastAPI(title="CipherOps Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ---------------- Auth Dependency ----------------

async def current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Require a valid Firebase ID token. Falls back to dev mode in development."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    user = await _verify_async(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


async def _verify_async(authorization: str) -> Optional[Dict[str, Any]]:
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    return await asyncio.get_event_loop().run_in_executor(None, verify_token, token)


# ---------------- Schemas ----------------

class EvaluationRequest(BaseModel):
    user_id: str
    mission_id: str
    mission_title: str
    commands_used: List[str]
    time_taken: int
    hints_requested: int
    mission_type: str
    mission_completed: bool
    cheat_flags: List[Dict[str, Any]] = []


class MissionRequest(BaseModel):
    user_id: str
    user_rank: int
    domain: str
    time_limit_minutes: int = 30


class HintRequest(BaseModel):
    user_id: str
    mission_context: str
    user_question: str
    user_rank: int


class AssessmentQuestionRequest(BaseModel):
    domain: str
    rating: str


class AssessmentEvaluationRequest(BaseModel):
    domain: str
    rating: str
    questions: List[str]
    answers: List[str]


# ---------------- Startup ----------------

@app.on_event("startup")
async def startup_event():
    docker_manager.start_watchdog(session_manager, interval=10)


# ---------------- Helpers ----------------

def _volume_name(user_id: str) -> str:
    h = hashlib.md5(user_id.encode()).hexdigest()[:12]
    return f"cipherops_vol_{h}"


# ---------------- Session APIs ----------------

@app.post("/api/session/start")
async def start_session(req: MissionRequest, user: Dict = Depends(current_user)):
    """Generate mission, start Kali container, persist session."""
    user_id = req.user_id or user["uid"]
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    existing = session_manager.get_session(user_id)
    if existing and existing["status"] == "active":
        return {
            "status": "resumed",
            "session": existing,
            "message": "Active session already exists",
        }

    # Generate mission
    try:
        attack = adversary.generate_attack(req.user_rank, req.domain)
        mission = architect.create_mission([], attack, req.user_rank)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mission generation failed: {e}")

    volume_name = _volume_name(user_id)

    # Cleanup any leftover volume from a previous failed mission
    docker_manager.delete_volume(volume_name)

    # Start fresh container
    container_id = docker_manager.start_container(user_id, volume_name)
    if not container_id:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to start Kali container. Ensure Docker is running and "
                "the image is pulled: `docker pull kalilinux/kali-rolling`"
            ),
        )

    session = session_manager.create_session(
        user_id=user_id,
        mission_id=mission.get("mission_id", str(uuid.uuid4())),
        mission_title=mission.get("mission_title", "Untitled Operation"),
        mission_type=attack.get("attack_type", "unknown"),
        time_limit_minutes=req.time_limit_minutes,
        volume_name=volume_name,
    )
    session_manager.update_session(
        user_id,
        container_id=container_id,
        mission_payload=mission,
        attack_payload=attack,
        user_email=user.get("email"),
    )

    return {
        "status": "started",
        "session_uuid": session["session_uuid"],
        "mission": mission,
        "attack": attack,
        "expires_at": session["expires_at"],
        "time_limit_minutes": req.time_limit_minutes,
    }


@app.post("/api/session/end")
async def end_session(user_id: str, user: Dict = Depends(current_user)):
    """User-initiated end. DESTROYS container + volume (no resume)."""
    session = session_manager.get_session(user_id)
    volume_name = session.get("volume_name") if session else None
    docker_manager.nuke_user(user_id, volume_name=volume_name)
    session_manager.complete_session(user_id)
    return {"status": "ended", "cleanup": "full"}


@app.post("/api/session/suspend")
async def suspend_session(user_id: str, user: Dict = Depends(current_user)):
    """
    User disconnected. Stop container, KEEP volume so they can resume.
    """
    docker_manager.stop_container(user_id, remove=True, delete_volume=False)
    session_manager.suspend_session(user_id)
    return {"status": "suspended", "resumable": True}


@app.get("/api/session/check/{user_id}")
async def check_resumable(user_id: str, user: Dict = Depends(current_user)):
    """On login, frontend calls this to check for an unfinished session."""
    session = session_manager.get_resumable_session(user_id)
    if not session:
        return {"resumable": False}

    remaining = max(0, int(session["expires_at"] - time.time()))
    return {
        "resumable": True,
        "session_uuid": session["session_uuid"],
        "mission_title": session["mission_title"],
        "mission_type": session["mission_type"],
        "time_remaining_seconds": remaining,
        "scrollback": session.get("scrollback", [])[-50:],
        "commands_count": len(session.get("commands", [])),
        "expires_at": session["expires_at"],
    }


@app.post("/api/session/resume/{user_id}")
async def resume_session(user_id: str, user: Dict = Depends(current_user)):
    """Spin up new container using the saved volume."""
    session = session_manager.get_resumable_session(user_id)
    if not session:
        raise HTTPException(status_code=404, detail="No resumable session")

    volume_name = session["volume_name"]
    container_id = docker_manager.start_container(user_id, volume_name)
    if not container_id:
        raise HTTPException(status_code=500, detail="Failed to resume container")

    updated = session_manager.resume_session(user_id, container_id)
    return {
        "status": "resumed",
        "session_uuid": updated["session_uuid"],
        "container_id": container_id,
        "time_remaining_seconds": max(0, int(updated["expires_at"] - time.time())),
        "scrollback": updated.get("scrollback", [])[-50:],
    }


# ---------------- Evaluation (with HARD cleanup) ----------------

@app.post("/api/evaluate")
async def evaluate_mission(req: EvaluationRequest, user: Dict = Depends(current_user)):
    """
    Grade the mission. On success/failure, DESTROY the container AND the volume.
    Record the result to Firestore for persistent user history.
    """
    # Aggregate cheat flag types
    cheat_flag_types = [f.get("type", "UNKNOWN") for f in req.cheat_flags]
    mission_type_with_flags = req.mission_type
    if cheat_flag_types:
        mission_type_with_flags += f" (FLAGS: {', '.join(set(cheat_flag_types))})"

    result = evaluator.evaluate(
        req.commands_used,
        req.time_taken,
        req.hints_requested,
        mission_type_with_flags,
        req.mission_completed,
    )

    # Persist to Firestore
    try:
        UserProfile.record_mission_completion(
            uid=user["uid"],
            mission_id=req.mission_id,
            mission_title=req.mission_title,
            success=req.mission_completed,
            score=result.get("score", 0) if isinstance(result, dict) else 0,
            duration_seconds=req.time_taken,
            cheat_flags=cheat_flag_types,
        )
    except Exception as e:
        logger.error(f"Firestore write failed: {e}")

    # HARD CLEANUP: destroy container + delete volume
    session = session_manager.get_session(req.user_id)
    volume_name = session.get("volume_name") if session else None
    docker_manager.nuke_user(req.user_id, volume_name=volume_name)
    session_manager.complete_session(req.user_id)

    return {
        **result,
        "cleanup": "container_and_volume_destroyed",
        "recorded_to_profile": True,
    }


# ---------------- AI Agent APIs ----------------

@app.post("/api/mission/generate")
async def generate_mission(req: MissionRequest, user: Dict = Depends(current_user)):
    attack = adversary.generate_attack(req.user_rank, req.domain)
    mission = architect.create_mission([], attack, req.user_rank)
    return mission


@app.post("/api/hint")
async def get_hint(req: HintRequest, user: Dict = Depends(current_user)):
    hint = colleague.get_hint(req.mission_context, req.user_question, req.user_rank)
    if req.user_id:
        session_manager.increment_hints(req.user_id)
    return {"hint": hint}


@app.post("/api/assessment/questions")
async def get_assessment_questions(req: AssessmentQuestionRequest):
    questions = assessment_agent.generate_questions(req.domain, req.rating)
    return {"questions": questions}


@app.post("/api/assessment/evaluate")
async def evaluate_assessment(req: AssessmentEvaluationRequest):
    return assessment_agent.evaluate_answers(
        req.domain, req.rating, req.questions, req.answers
    )


@app.get("/api/user/me")
async def get_me(user: Dict = Depends(current_user)):
    """Get current user's profile from Firestore."""
    profile = UserProfile.get(user["uid"]) or {
        "uid": user["uid"],
        "rank": 1,
        "tier": "Recruit",
        "missions_completed": 0,
    }
    profile["email"] = user.get("email")
    profile["name"] = user.get("name")
    return profile


@app.get("/api/user/{id}/rank")
async def get_user_rank(id: str, user: Dict = Depends(current_user)):
    profile = UserProfile.get(id)
    if profile:
        return {"rank": profile.get("rank", 1), "tier": profile.get("tier", "Recruit")}
    return {"rank": 1, "tier": "Recruit"}


# ---------------- WebSocket Terminal (with full anti-cheat logging) ----------------

@app.websocket("/ws/terminal/{user_id}")
async def terminal_websocket(websocket: WebSocket, user_id: str):
    # Token can come via query string (?token=...) because browsers can't set headers on WS
    query_token = websocket.query_params.get("token", "")
    user = verify_token(query_token) if query_token else None
    if not user:
        await websocket.send_text("\r\n[!] AUTH_FAILED: Invalid or missing token.\r\n")
        await websocket.close(code=4001)
        return

    await websocket.accept()

    # Restore or create container
    container = docker_manager.get_container(user_id)
    if container is None:
        session = session_manager.get_session(user_id)
        if session is None:
            await websocket.send_text(
                "\r\n[!] No active session. Start one from the CipherMail inbox.\r\n"
            )
            await websocket.close()
            return

        volume_name = session.get("volume_name") or _volume_name(user_id)
        new_id = docker_manager.start_container(user_id, volume_name)
        if not new_id:
            await websocket.send_text(
                "\r\n[!] Failed to start container. Check Docker is running.\r\n"
            )
            await websocket.close()
            return
        session_manager.update_session(user_id, container_id=new_id)

    # Replay scrollback
    session = session_manager.get_session(user_id)
    if session:
        for line in session.get("scrollback", [])[-30:]:
            await websocket.send_text(line + "\r\n")

    await websocket.send_text("\r\n[+] Connected to Kali Linux (CipherOps Sandboxed Env)\r\n")
    await websocket.send_text("root@kali:~# ")

    try:
        while True:
            data = await websocket.receive_text()

            # ---- Anti-cheat / event handling ----
            if data.startswith("{") and data.endswith("}"):
                try:
                    event = json.loads(data)
                    if event.get("type") == "event":
                        event_name = event.get("event", "UNKNOWN")
                        details = event.get("details", "")
                        session_manager.add_cheat_flag(user_id, event_name, details)
                        logger.info(
                            f"[ANTI-CHEAT] {user_id} -> {event_name}: {details}"
                        )
                except json.JSONDecodeError:
                    pass
                continue  # events don't execute as commands

            # ---- Command execution ----
            if data.endswith("\n") or data.endswith("\r"):
                cmd = data.strip()
                if not cmd:
                    await websocket.send_text("root@kali:~# ")
                    continue

                # Block-level paste detection
                if len(cmd) > 20:
                    session_manager.add_cheat_flag(
                        user_id, "PASTE", f"len={len(cmd)} cmd={cmd[:50]}"
                    )

                loop = asyncio.get_event_loop()
                output = await loop.run_in_executor(
                    None, docker_manager.exec_command, user_id, cmd
                )

                session_manager.append_command(user_id, cmd)
                session_manager.append_scrollback(user_id, f"root@kali:~# {cmd}")
                for line in output.splitlines():
                    session_manager.append_scrollback(user_id, line)

                await websocket.send_text(output)
                await websocket.send_text("\r\nroot@kali:~# ")
            else:
                await websocket.send_text(data)

    except WebSocketDisconnect:
        logger.info(f"WebSocket closed for {user_id} (session kept alive)")
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)