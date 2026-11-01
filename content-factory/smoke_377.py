#!/usr/bin/env python3
"""Boot disposable compiled 377 world and probe both server listeners.

Does not claim any real player/client interaction. Never targets user profiles,
production worlds or preserved player saves. CI only, disposable runner checkout.
"""
from __future__ import annotations
import argparse
import os
import json
import secrets
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
    live = os.environ.get("RS377_TASK26_LIVE_TEST") == "true"
    if live and (ports != (15402, 18880) or os.environ.get("GITHUB_ACTIONS") != "true"):
        raise ValueError("Task26 real login probe is restricted to pinned disposable CI ports")
    env.update({
        "EASY_STARTUP": "true", "NODE_PROFILE": "joshrs_ci_377",
        "DB_BACKEND": "sqlite", "NODE_PORT": str(ports[0]),
        "WEB_PORT": str(ports[1]), "WEB_MANAGEMENT_PORT": str(ports[1] + 1),
        "LOGIN_SERVER": "true", "FRIEND_SERVER": "true", "LOGGER_SERVER": "true",
        "WEBSITE_REGISTRATION": "false",
        "BUILD_SRC_DIR": "../content",
        "NODE_DEBUG_SOCKET": "false",
        "NODE_XPRATE": "1",
        "WEBSITE_REGISTRATION": "false",
    })
    if live:
        manifest = json.loads((Path(os.environ["GITHUB_WORKSPACE"]) / "deploy/jparris-windows/upstreams.json").read_text())
        sha = manifest["engine"]["commit"]
        if len(sha) != 40:
            raise ValueError("Invalid pinned engine SHA")
        env.update({
            "RS377_OBSERVER_ENABLED": "true",
            "RS377_OBSERVER_ISOLATED": "true",
            "RS377_OBSERVER_TOKEN": secrets.token_urlsafe(48),
            "RS377_OBSERVER_BOT": "harnessbot",
            "RS377_OBSERVER_WORLD": "isolated-ci-task26-gateway",
            "RS377_OBSERVER_SOURCE_SHA": sha,
            "TASK26_ENGINE_DIR": str(engine),
            "TASK26_GAME_PORT": str(ports[0]),
            "TASK26_WEB_PORT": str(ports[1]),
            "TASK26_MANAGEMENT_PORT": str(ports[1] + 1),
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
            if os.environ.get('RS377_OBSERVER_PROBE') == 'true':
                from urllib.request import urlopen
                from urllib.error import HTTPError
                endpoint = f'http://127.0.0.1:{ports[1]+1}/dev/rs377-observe'
                # Game and web listeners may become available before management.
                for _ in range(40):
                    if listening(ports[1] + 1):
                        break
                    time.sleep(.25)
                else:
                    raise TimeoutError("Disposable management listener not reachable")
                try:
                    with urlopen(endpoint, timeout=3):
                        raise RuntimeError('Observer unexpectedly exposed without bearer')
                except HTTPError as error:
                    if error.code != 404:
                        raise RuntimeError(f'Observer guard returned unexpected HTTP {error.code}') from error
                print('Isolated engine observer endpoint denied unauthenticated request (404)')
            if live:
                check = subprocess.run([
                    "node", str(Path(os.environ["GITHUB_WORKSPACE"]) /
                        "tools/rs377-controller-boundary/test/real-engine-gateway.acceptance.mjs"),
                ], cwd=os.environ["GITHUB_WORKSPACE"], env=env,
                   check=False, timeout=100, capture_output=True, text=True)
                if check.returncode != 0:
                    # Redact bearer values from failure output, even if a dependency
                    # unexpectedly echoed them while processing invalid requests.
                    safe = (check.stdout + check.stderr).replace(env["RS377_OBSERVER_TOKEN"], "[REDACTED]")
                    raise RuntimeError("Task26 real-engine acceptance failed:\\n" + safe[-6000:])
                print(check.stdout.replace(env["RS377_OBSERVER_TOKEN"], "[REDACTED]"))
            return {"compiled_world_started": True, "game_tcp_port_reachable": True,
                    "web_http_port_reachable": True, "real_player_logged_in": live,
                    "gateway_verified_against_real_disposable_engine": live,
                    "elrothiro_save_verified": False}
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
