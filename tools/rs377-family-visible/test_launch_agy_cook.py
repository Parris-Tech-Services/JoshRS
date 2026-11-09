#!/usr/bin/env python3
"""Offline simulated Agy CLI handoff. Never connects to an actual game or AI."""
from __future__ import annotations

import os
import pathlib
import pty
import select
import subprocess
import tempfile
import time
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
LAUNCHER = ROOT / "tools/rs377-family-visible/launch-agy-cook.sh"


class AgyHandoffTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="joshrs-agy-fixture-")
        self.addCleanup(self.tmp.cleanup)
        self.home = pathlib.Path(self.tmp.name) / "home"
        self.home.mkdir()
        (self.home / "dev/JoshRS/lostcity377/engine/data/players/main").mkdir(parents=True)
        for name in ("harnessview1", "elrothiro"):
            (self.home / f"dev/JoshRS/lostcity377/engine/data/players/main/{name}.sav").write_bytes(b"synthetic")
        self.bin = pathlib.Path(self.tmp.name) / "bin"
        self.bin.mkdir()
        self.make_exe("ss", "#!/bin/sh\nprintf 'LISTEN\\n'\n")
        self.make_exe("agy", """#!/bin/sh
case "$1" in
 -i)
  case "$2" in *"Cook's Assistant"*"HarnessView1"*) ;; *) exit 11 ;; esac
  ;;
 --conversation=ed46254e-75c9-411b-9d31-7d048c0fe8dd)
  ;;
 *) exit 10 ;;
esac
if [ "$1" = "-i" ]; then
 [ "$#" -eq 2 ] || [ "$#" -eq 3 ] || exit 13
 if [ "$#" -eq 3 ]; then [ "$3" = "--dangerously-skip-permissions" ] || exit 12; fi
 flag="$3"
else
 [ "$#" -eq 1 ] || [ "$#" -eq 2 ] || exit 13
 if [ "$#" -eq 2 ]; then [ "$2" = "--dangerously-skip-permissions" ] || exit 12; fi
 flag="$2"
fi
[ "$JOSHRS_HARNESSVIEW1_PASSWORD" = "onlybot123" ] || exit 14
printf 'FAKE_AGY_ACCEPTED_TASK\\n'
printf 'FAKE_AGY_FLAGS=%s\\n' "$flag"
printf 'FAKE_AGY_CWD=%s\\n' "$PWD"
""")
        self.resume_dir = self.home / "dev/JoshRS-agy-cook-2CQGiwsR"
        (self.resume_dir / "docs/rs377").mkdir(parents=True)
        (self.resume_dir / ".git").write_text("gitdir: synthetic")
        (self.resume_dir / "docs/rs377/AGY_HARNESSVIEW1_COOKS_ASSISTANT_LIVE_2026-11-09.md").write_text("Cook's Assistant")
        self.env = dict(os.environ, HOME=str(self.home),
                        PATH=str(self.bin) + os.pathsep + os.environ.get("PATH", ""))

    def make_exe(self, name, body):
        p = self.bin / name
        p.write_text(body)
        p.chmod(0o700)

    def test_preflight_in_synthetic_world_does_not_launch_agy(self):
        result = subprocess.run(["bash", str(LAUNCHER), "--check"], env=self.env,
                                text=True, capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HANDOFF_PREFLIGHT_OK", result.stdout)
        self.assertNotIn("FAKE_AGY_ACCEPTED_TASK", result.stdout)

    def test_unattended_login_refused_without_terminal(self):
        result = subprocess.run(["bash", str(LAUNCHER)], env=self.env,
                                text=True, capture_output=True, timeout=10)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("interactive Terminal required", result.stderr)

    def run_private_tty(self, extra_args):
        master, slave = pty.openpty()
        try:
            child = subprocess.Popen(["bash", str(LAUNCHER), *extra_args], env=self.env,
                                     stdin=slave, stdout=slave, stderr=slave,
                                     start_new_session=True, close_fds=True)
            os.close(slave)
            slave = -1
            output = b""
            sent = False
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                readable, _, _ = select.select([master], [], [], 0.2)
                if readable:
                    try:
                        chunk = os.read(master, 65536)
                    except OSError:
                        break
                    if not chunk:
                        break
                    output += chunk
                    if b"bot-only password (hidden)" in output and not sent:
                        os.write(master, b"onlybot123\n")
                        sent = True
                if child.poll() is not None:
                    break
            self.assertTrue(sent, output.decode("utf8", "replace"))
            self.assertEqual(child.wait(timeout=5), 0, output.decode("utf8", "replace"))
            self.assertIn(b"FAKE_AGY_ACCEPTED_TASK", output)
            self.assertIn(b"AGY_HANDOFF_FINISHED: CLI exit 0", output)
            self.assertNotIn(b"onlybot123", output)
            return output
        finally:
            try:
                if slave >= 0:
                    os.close(slave)
            except OSError:
                pass
            os.close(master)

    def test_default_foreground_still_requires_normal_permissions(self):
        output = self.run_private_tty([])
        self.assertIn(b"Agy prompt preview (first 12 lines)", output)
        self.assertIn(b"Standard Agy permission prompts remain enabled", output)
        self.assertNotIn(b"permission bypass enabled", output)

    def test_explicit_permission_bypass_uses_exact_documented_cli_flag(self):
        output = self.run_private_tty(["--dangerously-skip-permissions"])
        self.assertIn(b"permission bypass enabled", output)
        self.assertIn(b"FAKE_AGY_FLAGS=--dangerously-skip-permissions", output)

    def test_resume_preserves_existing_worktree_and_conversation(self):
        output = self.run_private_tty([
            "--dangerously-skip-permissions",
            "--resume-conversation", "ed46254e-75c9-411b-9d31-7d048c0fe8dd",
            "--workspace", str(self.resume_dir)])
        self.assertIn(b"Resuming existing Agy conversation", output)
        self.assertIn(str(self.resume_dir).encode(), output)
        self.assertIn(b"FAKE_AGY_FLAGS=--dangerously-skip-permissions", output)
        self.assertIn(("FAKE_AGY_CWD="+str(self.resume_dir)).encode(), output)
        self.assertNotIn(b"Agy prompt preview", output)

    def test_invalid_resume_refused_before_any_agent_start(self):
        result = subprocess.run([
            "bash", str(LAUNCHER),
            "--dangerously-skip-permissions",
            "--resume-conversation", "unverified",
            "--workspace", "/tmp/random"], env=self.env,
            text=True, capture_output=True, timeout=10)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("HANDOFF_BLOCKED", result.stderr)
        self.assertNotIn("FAKE_AGY_ACCEPTED_TASK", result.stdout)


if __name__ == "__main__":
    unittest.main()

