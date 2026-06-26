"""
Docker Manager for CipherOps — Kali Edition
Handles Kali Linux containers with:
  - Named Docker volumes for filesystem persistence across disconnects
  - Time-based container destruction (watchdog)
  - Process isolation (no host network, read-only FS options)
  - xterm-compatible interactive shell via docker exec
"""
import docker
import threading
import asyncio
import time
import logging
from typing import Dict, Optional
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DockerManager")


# Default Kali image — has nmap, sqlmap, hydra, john, gobuster, nikto, etc.
DEFAULT_IMAGE = "kalilinux/kali-rolling"
# Lightweight alternative if user pulls custom image:
# DEFAULT_IMAGE = "cipherops/kali-mvp:latest"


class DockerManager:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Cannot connect to Docker daemon: {e}")
            self.client = None
        self.containers: Dict[str, docker.models.containers.Container] = {}
        self.user_to_container: Dict[str, str] = {}
        self._watchdog_started = False

    # ---------------- Container Lifecycle ----------------

    def start_container(self, user_id: str, volume_name: str) -> Optional[str]:
        """
        Start a new Kali container with a persistent named volume.
        Returns container_id or None on failure.
        """
        if not self.client:
            logger.error("Docker client unavailable")
            return None

        container_name = f"cipherops_{user_id}_{int(time.time())}"

        try:
            # Ensure the volume exists (reused for resume)
            try:
                self.client.volumes.get(volume_name)
            except docker.errors.NotFound:
                self.client.volumes.create(name=volume_name)
                logger.info(f"Created volume: {volume_name}")

            container = self.client.containers.run(
                image=DEFAULT_IMAGE,
                detach=True,
                tty=True,
                stdin_open=True,
                mem_limit="512m",
                nano_cpus=500000000,  # 0.5 CPU
                pids_limit=256,        # prevent fork bombs
                read_only=False,      # Kali tools need write access during setup
                network_mode="bridge",
                name=container_name,
                command="/bin/bash",
                volumes={volume_name: {"bind": "/root", "mode": "rw"}},
                environment={
                    "TERM": "xterm-256color",
                    "DEBIAN_FRONTEND": "noninteractive",
                },
                labels={
                    "cipherops.user": user_id,
                    "cipherops.managed": "true",
                },
            )

            self.containers[user_id] = container
            self.user_to_container[user_id] = container.id

            # Wait briefly for bash to be ready
            time.sleep(0.5)

            logger.info(
                f"Started container {container.id[:12]} for user {user_id} "
                f"with volume {volume_name}"
            )
            return container.id

        except docker.errors.ImageNotFound:
            logger.error(
                f"Kali image '{DEFAULT_IMAGE}' not found. "
                f"Run: docker pull {DEFAULT_IMAGE}"
            )
            return None
        except Exception as e:
            logger.error(f"Error starting container: {e}")
            return None

    def stop_container(
        self,
        user_id: str,
        remove: bool = True,
        delete_volume: bool = False,
        volume_name: Optional[str] = None,
    ) -> bool:
        """
        Stop a container.
        - remove=True: delete container (default)
        - delete_volume=True: ALSO delete the volume (use on mission completion)
        - If session is being suspended, leave delete_volume=False (keep for resume)
        """
        if user_id not in self.containers:
            logger.warning(f"No active container for user {user_id}")
            # Still try to delete the volume if requested
            if delete_volume and volume_name:
                self.delete_volume(volume_name)
            return False

        container = self.containers[user_id]
        try:
            container.stop(timeout=5)
            if remove:
                container.remove()
        except Exception as e:
            logger.error(f"Error stopping container: {e}")
            try:
                container.kill()
                if remove:
                    container.remove(force=True)
            except Exception as e2:
                logger.error(f"Force kill failed: {e2}")
                return False

        del self.containers[user_id]
        if user_id in self.user_to_container:
            del self.user_to_container[user_id]

        if delete_volume and volume_name:
            self.delete_volume(volume_name)

        if delete_volume:
            logger.info(
                f"Stopped container + DELETED volume for user {user_id} (full cleanup)"
            )
        else:
            logger.info(
                f"Stopped container for user {user_id} (volume preserved for resume)"
            )
        return True

    def delete_volume(self, volume_name: str) -> bool:
        """Hard-delete a Docker volume and all its data."""
        if not self.client:
            return False
        try:
            vol = self.client.volumes.get(volume_name)
            vol.remove(force=True)
            logger.info(f"Deleted volume: {volume_name}")
            return True
        except Exception as e:
            # NotFound is fine — volume already gone
            if "not found" in str(e).lower() or "notfound" in str(e).lower():
                logger.info(f"Volume {volume_name} already absent")
                return True
            logger.error(f"Error deleting volume {volume_name}: {e}")
            return False

    def nuke_user(self, user_id: str, volume_name: Optional[str] = None) -> bool:
        """
        Full cleanup: stop container + delete volume.
        Use this on mission completion, failure, or user-initiated end.
        """
        ok = self.stop_container(user_id, remove=True, delete_volume=True, volume_name=volume_name)
        return ok

    def exec_command(self, user_id: str, cmd: str) -> str:
        """
        Run a command inside the user's container.
        Returns the output as a decoded string.
        """
        if user_id not in self.containers:
            return f"[!] No active container for user {user_id}"

        container = self.containers[user_id]
        try:
            # exec_run blocks — call from threadpool in async context
            result = container.exec_run(
                cmd=["/bin/bash", "-c", cmd],
                demux=True,
            )
            stdout, stderr = result.output
            out = (stdout or b"").decode("utf-8", errors="replace")
            err = (stderr or b"").decode("utf-8", errors="replace")
            return out + err
        except Exception as e:
            logger.error(f"exec_run failed for {user_id}: {e}")
            return f"[!] Execution error: {e}"

    def get_container(self, user_id: str):
        return self.containers.get(user_id)

    # ---------------- Watchdog (Time-Based Destruction) ----------------

    def start_watchdog(self, session_manager, interval: int = 10):
        """
        Background thread that destroys containers whose session has expired.
        Called once on FastAPI startup.
        """
        if self._watchdog_started:
            return
        self._watchdog_started = True

        def _run():
            logger.info("[Watchdog] Started — checking expirations every 10s")
            while True:
                try:
                    active = session_manager.get_active_sessions()
                    now = time.time()
                    for user_id, session in active:
                        if now > session["expires_at"]:
                            logger.info(
                                f"[Watchdog] Session expired for {user_id} — destroying container"
                            )
                            self.stop_container(user_id, remove=True)
                            session_manager.expire_session(user_id)
                        elif now > session["expires_at"] - 30 and session.get("warned") is None:
                            # 30-second warning sent via flag
                            session_manager.update_session(user_id, warned=True)
                except Exception as e:
                    logger.error(f"[Watchdog] Error: {e}")
                time.sleep(interval)

        t = threading.Thread(target=_run, daemon=True, name="cipherops-watchdog")
        t.start()


docker_manager = DockerManager()