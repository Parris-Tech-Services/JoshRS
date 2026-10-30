#!/usr/bin/env python3
"""Boot disposable compiled 377 world and probe both server listeners.

Does not claim any real player/client interaction. Never targets user profiles,
production worlds or preserved player saves. CI only, disposable runner checkout.
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path
import socket
import subprocess
import sys
import time


def listening(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.8):
            return True
    except OSError:
        return False


def smoke(engine: Path, ports: tuple[int, int], timeout: int) -> dict:
    engine = engine.resolve(strict=True)
    if (engine / "data/pack/server/script.dat").stat().st_size < 3:
        raise ValueError("Compiled native script.dat missing")
    if (engine / "data/pack/server/script.idx").stat().st_size < 3:
        raise ValueError("Compiled native script.idx missing")
    if any(listening(p) for p in ports):
        raise ValueError("CI probe port already occupied; refusing ambiguous results")
    env = dict(os.environ)
    env.update({
        "EASY_STARTUP": "true", "NODE_PROFILE": "joshrs_ci_377",
        "DB_BACKEND": "sqlite", "NODE_PORT": str(ports[0]),
        "WEB_PORT": str(ports[1]), "WEB_MANAGEMENT_PORT": str(ports[1] + 1),
        "LOGIN_SERVER": "true", "FRIEND_SERVER": "true", "LOGGER_SERVER": "true",
        "WEBSITE_REGISTRATION": "false",
        "BUILD_SRC_DIR": "../content",
        "NODE_DEBUG_SOCKET": "false",
    })
    outfile = engine / "joshrs-ci-boot.log"
    started = time.monotonic()
    with outfile.open("w", encoding="utf-8") as log:
        proc = subprocess.Popen(["npm", "run", "quickstart"], cwd=engine, env=env,
                                stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        success = False
        try:
            while time.monotonic() - started < timeout:
                if proc.poll() is not None:
                    raise RuntimeError(f"377 world exited early: {proc.returncode}")
                if all(listening(port) for port in ports):
                    success = True
                    break
                time.sleep(1)
            if not success:
                raise TimeoutError("Compiled 377 game/web ports not both reachable")
            return {"compiled_world_started": True, "game_tcp_port_reachable": True,
                    "web_http_port_reachable": True, "real_player_logged_in": False,
                    "npc_interaction_executed": False, "elrothiro_save_verified": False}
        finally:
            # Kill the entire spawned process group; npm starts tsx children.
            import signal
            try:
                os.killpg(proc.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                proc.wait(timeout=8)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.wait(timeout=8)
            if not success:
                print("Disposable world log tail:\n" + "\n".join(outfile.read_text(errors="replace").splitlines()[-70:]),file=sys.stderr)


if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--engine",type=Path,required=True)
    p.add_argument("--game-port",type=int,default=15402)
    p.add_argument("--web-port",type=int,default=18880)
    p.add_argument("--timeout",type=int,default=80)
    a=p.parse_args()
    try:
        print(smoke(a.engine,(a.game_port,a.web_port),a.timeout))
    except (OSError,ValueError,RuntimeError,TimeoutError) as e:
        print("Disposable 377 boot smoke FAILED: " + str(e),file=sys.stderr)
        sys.exit(1)
