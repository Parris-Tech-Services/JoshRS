"""Regression checks for no-cheat JoshRS 377 benchmark reporter (no game connection)."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "report.py"
spec = importlib.util.spec_from_file_location("rs377_benchmark_report", SCRIPT)
report = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(report)


def header(**changes):
    result = {"type": "run", "run_id": "safe_test_01", "engine_sha": "a123456",
              "content_sha": "b123456", "tick_ms": 600, "xp_multiplier": 1,
              "cheats_enabled": False, "admin_changes": False,
              "seeded_items": False, "accelerated_time": False,
              "disposable_test_account": True, "isolated_test_world": True}
    result.update(changes)
    return result


def event(kind, minute, **changes):
    obj = {"type": kind, "run_id": "safe_test_01",
           "ts": f"2026-11-01T00:{minute:02d}:00Z"}
    obj.update(changes)
    return obj


class BenchmarkReportTests(unittest.TestCase):
    def test_all_21_skills_are_explicitly_unmeasured_without_evidence(self):
        result = report.score([header()])
        self.assertEqual(len(result["rates"]), 21)
        self.assertTrue(all(x["status"] == "NOT MEASURED" for x in result["rates"]))
        self.assertEqual(result["quests"], [])

    def test_wall_clock_rate_uses_internal_tenths_not_boosted_xp(self):
        data = [header(), event("xp", 0, skill="Woodcutting", xp_tenths=1000),
                event("xp", 10, skill="Woodcutting", xp_tenths=7000)]
        scored = report.score(data)
        wood = next(x for x in scored["rates"] if x["skill"] == "Woodcutting")
        self.assertEqual(wood["xp_gained"], 600.0)
        self.assertEqual(wood["xp_per_hour"], 3600.0)
        self.assertEqual(wood["elapsed_minutes"], 10.0)

    def test_quest_not_verified_without_relogin(self):
        data = [header(),
                event("quest", 1, quest="Cook's Assistant", state="complete",
                      journal_complete=True, persisted=False)]
        result = report.score(data, ["Cook's Assistant", "Doric's Quest"])
        self.assertEqual(result["quests"][0]["status"], "REPORTED COMPLETE - UNVERIFIED")
        self.assertEqual(result["quests"][1]["status"], "NOT_TESTED")
        data.append(event("quest", 2, quest="Cook's Assistant", state="complete",
                          journal_complete=True, persisted=True))
        self.assertEqual(report.score(data)["quests"][0]["status"], "VERIFIED COMPLETE")

    def test_repeated_action_failures_report_suspected_bug(self):
        data = [header()] + [
            event("action", n, task="Quest", method="opnpc3",
                  target="Yrsa", status="timeout", reason="No shop opened")
            for n in (1, 2, 3)
        ]
        result = report.score(data)
        self.assertEqual(result["failures"][0]["count"], 3)
        self.assertTrue(result["failures"][0]["suspected_bug"])
        self.assertIn("SUSPECTED BUG", report.markdown(result))

    def test_cheats_and_acceleration_are_rejected(self):
        for key, val in (("xp_multiplier", 2), ("accelerated_time", True),
                         ("seeded_items", True), ("disposable_test_account", False)):
            with self.subTest(key=key), self.assertRaises(ValueError):
                report.validate_header(header(**{key: val}))
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "e.jsonl"
            data = [header(), event("action", 2, method="addXp",
                                    status="success")]
            path.write_text("\n".join(json.dumps(x) for x in data) + "\n")
            with self.assertRaisesRegex(ValueError, "Cheat/admin action"):
                report.load_events(path)

    def test_cli_writes_reports_without_synthetic_success(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            records = root / "events.jsonl"
            records.write_text(json.dumps(header()) + "\n", encoding="utf-8")
            done = subprocess.run(
                [sys.executable, str(SCRIPT), "--events", str(records),
                 "--out", str(root / "results")],
                capture_output=True, text=True, check=True,
            )
            self.assertIn("measured skills: 0", done.stdout)
            markdown = (root / "results" / "report.md").read_text()
            self.assertIn("NOT MEASURED", markdown)
            self.assertIn("NOT VERIFIED BUG-FREE", markdown)
            self.assertEqual(len(json.loads((root / "results" / "report.json").read_text())["rates"]), 21)

    def test_mixed_runs_and_unknown_skills_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "events.jsonl"
            for bad in (
                event("xp", 1, skill="Sailing", xp_tenths=10),
                event("xp", 1, skill="Mining", xp_tenths=10, run_id="other"),
                event("xp", 1, skill="Mining", xp_tenths=1.5),
            ):
                path.write_text("\n".join(json.dumps(x) for x in [header(), bad]))
                with self.assertRaises(ValueError):
                    report.load_events(path)


if __name__ == "__main__":
    unittest.main()
