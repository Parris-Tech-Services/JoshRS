#!/usr/bin/env bash
# CI ONLY: run the AUTHENTIC compiled 377 server on the Linux host, forward
# its localhost listener to a hardware/software Android emulator via adb
# reverse, and run Android instrumentation tests against real server bytes.
# No real accounts, credentials, family database, or third-party cache used.
set -Eeuo pipefail
: "${GITHUB_ACTIONS:?CI only}"
: "${GITHUB_WORKSPACE:?requires repository checkout}"
engine="${1:?pass the disposable pinned Engine-TS directory}"
[[ -s "$engine/data/pack/server/script.dat" ]] || { echo "No genuine compiled 377 script pack" >&2; exit 2; }
[[ -s "$engine/data/pack/server/script.idx" ]] || { echo "No genuine compiled 377 script index" >&2; exit 2; }
python3 "$GITHUB_WORKSPACE/tools/android377-phone/loopback_bind.py" "$engine" --verify

status_dir="$GITHUB_WORKSPACE/reports/android377"
mkdir -p "$status_dir"
log="$RUNNER_TEMP/android377-genuine-server.log"
pid=''
stop_server() {
  adb reverse --remove tcp:52402 >/dev/null 2>&1 || true
  adb reverse --remove tcp:8888 >/dev/null 2>&1 || true
  if [[ -n "$pid" ]]; then
    kill -TERM -- "-$pid" 2>/dev/null || true
    sleep 2
    kill -KILL -- "-$pid" 2>/dev/null || true
  fi
}
trap stop_server EXIT

# Detached process group with a known PID, so teardown cannot accidentally
# terminate the GitHub worker's own shell process group.
python3 - "$engine" "$log" "$RUNNER_TEMP/android377-server.pid" <<'PY'
import os, pathlib, subprocess, sys
engine, log, pidfile = sys.argv[1:]
env = dict(os.environ)
env.update({
    "EASY_STARTUP": "true", "NODE_PROFILE": "joshrs_android_emulator_377",
    "DB_BACKEND": "sqlite", "NODE_PORT": "15402", "WEB_PORT": "18880",
    "WEB_MANAGEMENT_PORT": "18881", "LOGIN_SERVER": "true",
    "FRIEND_SERVER": "true", "LOGGER_SERVER": "true",
    "WEBSITE_REGISTRATION": "false", "BUILD_SRC_DIR": "../content",
    "NODE_DEBUG_SOCKET": "false"
})
with open(log, "wb") as output:
    p = subprocess.Popen(["npm", "run", "quickstart"], cwd=engine,
                         env=env, stdout=output, stderr=subprocess.STDOUT,
                         start_new_session=True)
pathlib.Path(pidfile).write_text(str(p.pid), encoding="ascii")
PY
pid="$(cat "$RUNNER_TEMP/android377-server.pid")"

echo "Starting AUTHENTIC disposable revision-377 engine; awaiting both listeners..."
python3 - <<'PY'
import socket, time, sys
deadline = time.monotonic() + 110
while time.monotonic() < deadline:
    try:
        for port in (15402, 18880):
            with socket.create_connection(("127.0.0.1", port), timeout=0.7):
                pass
        print("REAL_377_LOOPBACK_PORTS_REACHABLE")
        sys.exit(0)
    except OSError:
        time.sleep(1)
print("FAIL: authentic 377 engine did not expose expected loopback listeners", file=sys.stderr)
sys.exit(2)
PY

# The Android emulator's 127.0.0.1 is its own VM, not the CI host.
# adb reverse creates a LOCAL-only pipe without opening game ports publicly.
adb reverse tcp:52402 tcp:15402
adb reverse tcp:8888 tcp:18880
adb reverse --list
echo "Android guest localhost:52402 -> real host 377:15402, local only"

gradle -p "$GITHUB_WORKSPACE/android-client" --no-daemon :app:connectedDebugAndroidTest

# Capture evidence of the actual APK opening on an emulator. A static UI
# screenshot does NOT demonstrate authenticated game rendering.
# Gradle connectedAndroidTest can uninstall the target app on completion.
# Install the exact just-built debug APK before taking a screenshot.
adb install -r "$GITHUB_WORKSPACE/android-client/app/build/outputs/apk/debug/app-debug.apk"
adb shell am start -W -n au.com.parristech.joshrs.android/.MainActivity
sleep 2
adb exec-out screencap -p > "$status_dir/android-emulator-377-diagnostics.png"
test -s "$status_dir/android-emulator-377-diagnostics.png"
printf 'AUTHENTIC_377_ANDROID_NEGOTIATION_PASSED\n' > "$status_dir/status.txt"
echo "ANDROID_GUEST_TO_REAL_377_SERVER_VERIFIED: not authenticated gameplay"
