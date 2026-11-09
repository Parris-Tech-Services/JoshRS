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
[ "$1" = "-i" ] || exit 10
case "$2" in *"Cook's Assistant"*"HarnessView1"*) ;; *) exit 11 ;; esac
[ "$#" = "2" ] || exit 12
[ "$JOSHRS_HARNESSVIEW1_PASSWORD" = "onlybot123" ] || exit 14
printf 'FAKE_AGY_ACCEPTED_TASK\\n'
""")
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

    def test_foreground_handoff_passes_private_password_without_echo(self):
        master, slave = pty.openpty()
        try:
            child = subprocess.Popen(["bash", str(LAUNCHER)], env=self.env,
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
            self.assertIn(b"Agy prompt preview (first 12 lines)", output)
            self.assertIn(b"Launching Agy interactive (-i)", output)
            self.assertIn(b"AGY_HANDOFF_FINISHED: CLI exit 0", output)
            self.assertNotIn(b"onlybot123", output)
        finally:
            try:
                if slave >= 0:
                    os.close(slave)
            except OSError:
                pass
            os.close(master)


if __name__ == "__main__":
    unittest.main()
