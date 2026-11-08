#!/usr/bin/env python3
"""Safety regression tests for isolated Fedora native 377 trace injection."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

SOURCE = Path(__file__).resolve().parents[1] / "content-factory/patch_377_sdk_trace.py"
SPEC = importlib.util.spec_from_file_location("patch_377_sdk_trace", SOURCE)
trace = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(trace)


class FedoraDisposableTraceScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.env = mock.patch.dict(os.environ, {
            "HOME": str(self.home),
            "GITHUB_ACTIONS": "false",
            "JOSHRS_QUEST_CAMPAIGN_APPROVED": "DISPOSABLE_ONLY",
        })
        self.env.start()
        self.addCleanup(self.env.stop)
        self.fedora = mock.patch.object(trace, "is_fedora", return_value=True)
        self.fedora.start()
        self.addCleanup(self.fedora.stop)
        self.base = self.home / ".cache" / "joshrs-disposable-quests"
        self.base.mkdir(parents=True, mode=0o700)
        self.base.chmod(0o700)
        self.work = self.base / "377-run-Abc12345"
        self.work.mkdir(mode=0o700)
        self.work.chmod(0o700)
        self.engine = self.work / "engine"
        self.engine.mkdir()
        (self.engine / ".git").mkdir()

    @unittest.skipIf(os.geteuid() == 0, "Run positive ownership tests as a non-root user")
    def test_approved_private_fedora_path(self):
        self.assertEqual(trace.verify_scope(self.engine, True), "FEDORA_DISPOSABLE")

    def test_reject_missing_approval(self):
        os.environ["JOSHRS_QUEST_CAMPAIGN_APPROVED"] = "false"
        with self.assertRaisesRegex(RuntimeError, "explicit local approval"):
            trace.verify_scope(self.engine, True)

    def test_reject_github_actions_spoof_for_fedora(self):
        os.environ["GITHUB_ACTIONS"] = "true"
        with self.assertRaisesRegex(RuntimeError, "explicit local approval"):
            trace.verify_scope(self.engine, True)

    def test_reject_family_engine(self):
        family_engine = self.home / "dev" / "JoshRS" / "engine"
        family_engine.mkdir(parents=True)
        with self.assertRaisesRegex(RuntimeError, "non-disposable"):
            trace.verify_scope(family_engine, True)

    @unittest.skipIf(os.geteuid() == 0, "Run ownership tests as a non-root user")
    def test_reject_group_readable_disposable_world(self):
        self.work.chmod(0o750)
        with self.assertRaisesRegex(RuntimeError, "shared"):
            trace.verify_scope(self.engine, True)

    def test_reject_wrong_mktemp_directory_name(self):
        wrong = self.base / "377-run-unsafe"
        (wrong / "engine" / ".git").mkdir(parents=True)
        wrong.chmod(0o700)
        with self.assertRaisesRegex(RuntimeError, "non-disposable"):
            trace.verify_scope(wrong / "engine", True)

    def test_reject_non_fedora(self):
        with mock.patch.object(trace, "is_fedora", return_value=False):
            with self.assertRaisesRegex(RuntimeError, "explicit local approval"):
                trace.verify_scope(self.engine, True)

    def test_ci_guard_is_still_ci_only(self):
        with self.assertRaisesRegex(RuntimeError, "GitHub runner"):
            trace.verify_scope(self.engine, False)

    def test_ci_guard_requires_exact_path(self):
        runner = self.home / "runner-temp"
        runner.mkdir()
        os.environ["RUNNER_TEMP"] = str(runner)
        os.environ["GITHUB_ACTIONS"] = "true"
        with self.assertRaisesRegex(RuntimeError, "GitHub runner"):
            trace.verify_scope(self.engine, False)
        exact = runner / "joshrs-377-build" / "engine"
        self.assertEqual(trace.verify_scope(exact, False), "CI")


if __name__ == "__main__":
    unittest.main()
