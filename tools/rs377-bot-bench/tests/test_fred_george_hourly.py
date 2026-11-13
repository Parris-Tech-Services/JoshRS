from datetime import datetime, timedelta, timezone
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "fred_george_hourly.py"
spec = importlib.util.spec_from_file_location("fg_hourly", MODULE)
fg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fg)
HOUR = datetime(2026, 11, 1, 4, 0, tzinfo=timezone.utc)


def sample(bot, end, *, exp=fg.EXPERIMENT, start_sig="abcdef0123456789"):
    values = {skill: 0 for skill in fg.SKILLS}
    values["Woodcutting"] = 100
    after = {**values, "Woodcutting": 350 if bot == "Fred" else 200}
    return {
        "schema": fg.SCHEMA, "experiment_id": exp, "bot": bot,
        "policy": fg.ALL_POLICIES[bot], "world_mode": "isolated", "ab_run_id": "trial_fred_george_01",
        "policy_version": "v1", "online": True, "phase": "solo", "cooperation_events": [],
        "window_start_utc": fg.iso(end - timedelta(minutes=10)),
        "window_end_utc": fg.iso(end),
        "fresh_account": True, "items_seeded": False, "cheats_enabled": False,
        "accelerated_time": False, "xp_multiplier": 1, "tick_ms": 600,
        "engine_sha": "a1c34ff", "content_sha": "b5ac859", "starting_signature": start_sig,
        "xp_before_tenths": values, "xp_after_tenths": after,
        "successful_actions": 3, "failed_actions": 1, "deaths": 0,
        "quests_verified_new": [],
        "bug_candidates": [{"id": "stucktree001", "severity": "medium"}] if bot == "Fred" else [],
        "location": {"x": 3210, "z": 3200 if bot == "Fred" else 3201,
                     "plane": 0, "region": "Lumbridge"},
        "route_points": [[3210, 3200], [3215, 3202]],
    }


def put(root, bot, end, **changes):
    record = sample(bot, end, **{k: v for k, v in changes.items() if k in ("exp", "start_sig")})
    record.update({k: v for k, v in changes.items() if k not in ("exp", "start_sig")})
    path = fg.snapshot_path(root, end, bot)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record), encoding="utf-8")
    return path


class FredGeorgeTests(unittest.TestCase):
    def test_missing_are_explicit_not_zero(self):
        with tempfile.TemporaryDirectory() as t:
            result = fg.scan(Path(t), HOUR)
            self.assertEqual(result["received"], 0)
            self.assertEqual(len(result["missing"]), 12)
            self.assertIsNone(result["bots"]["Fred"]["xp_per_hour_of_observed_time"])
            self.assertFalse(result["comparable"])
            self.assertIn("NOT", fg.summary_md(result).upper())

    def test_six_each_at_same_start_for_valid_hour(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            for minute in range(10, 61, 10):
                end = HOUR + timedelta(minutes=minute)
                for bot in fg.BOTS:
                    put(root, bot, end)
            result = fg.scan(root, HOUR)
            self.assertTrue(result["comparable"])
            self.assertEqual(result["received"], 12)
            self.assertEqual(result["bots"]["Fred"]["total_xp_gained"], 150.0)
            self.assertEqual(result["bots"]["George"]["total_xp_gained"], 60.0)
            self.assertEqual(result["bots"]["Fred"]["xp_per_hour_of_observed_time"], 150.0)
            self.assertEqual(len(result["bots"]["Fred"]["progress"]), 6)
            self.assertEqual(result["bug_candidates"][0]["count_reports"], 6)
            for kind in ("xp", "quest", "bugs", "routes"):
                svg = fg.svg_chart(result, kind)
                self.assertIn("<svg", svg)
                self.assertIn("</svg>", svg)

    def test_incomplete_does_not_claim_a_full_hour(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            put(root, "Fred", HOUR + timedelta(minutes=10))
            result = fg.scan(root, HOUR)
            self.assertEqual(result["received"], 1)
            self.assertEqual(result["status"], "PARTIAL_OR_NOT_COMPARABLE")
            self.assertEqual(result["bots"]["Fred"]["minutes_observed"], 10)
            self.assertEqual(result["bots"]["Fred"]["xp_per_hour_of_observed_time"], 150.0)
            self.assertEqual(result["bots"]["George"]["total_xp_gained"], 0)

    def test_detects_different_starts_as_not_comparable(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            for minute in range(10, 61, 10):
                end = HOUR + timedelta(minutes=minute)
                put(root, "Fred", end)
                put(root, "George", end, start_sig="123456789abcdef0")
            result = fg.scan(root, HOUR)
            self.assertFalse(result["comparable"])

    def test_cooperation_is_tracked_separately_and_ab_not_comparable(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            for minute in range(10, 61, 10):
                end = HOUR + timedelta(minutes=minute)
                for bot in fg.BOTS:
                    put(root, bot, end)
            end = HOUR + timedelta(minutes=30)
            put(root, "Fred", end, phase="coop",
                cooperation_events=[{"type": "joint_combat", "partner": "George"}])
            put(root, "George", end, phase="coop",
                cooperation_events=[{"type": "joint_combat", "partner": "Fred"}])
            result = fg.scan(root, HOUR)
            self.assertFalse(result["comparable"])
            self.assertEqual(result["received"], 12)
            self.assertEqual(result["bots"]["Fred"]["solo_xp"], 125.0)
            self.assertEqual(result["bots"]["Fred"]["coop_or_mixed_xp"], 25.0)
            self.assertEqual(len(result["cooperation_events"]), 2)
            self.assertIn("joint_combat", fg.summary_md(result))

    def test_forged_solo_cooperation_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            end = HOUR + timedelta(minutes=10)
            put(root, "Fred", end, cooperation_events=[{"type": "trade", "partner": "George"}])
            result = fg.scan(root, HOUR)
            self.assertEqual(result["received"], 0)
            self.assertEqual(len(result["invalid"]), 1)

    def test_bad_xp_flags_dates_are_flagged_not_accepted(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            end = HOUR + timedelta(minutes=10)
            put(root, "Fred", end, xp_multiplier=5)
            put(root, "George", end, window_start_utc="2026-11-01T00:00:00Z")
            result = fg.scan(root, HOUR)
            self.assertEqual(result["received"], 0)
            self.assertEqual(len(result["invalid"]), 2)

    def test_initial_signature_and_21_skills_required(self):
        end = HOUR + timedelta(minutes=10)
        sample_record = sample("Fred", end)
        del sample_record["xp_before_tenths"]["Magic"]
        with self.assertRaises(ValueError):
            fg.validate(sample_record, HOUR, end, "Fred")

    def test_path_name_sanitized_by_bot_allowlist(self):
        p = fg.snapshot_path(Path("reports"), HOUR + timedelta(minutes=10), "Fred")
        self.assertEqual(p.name, "2026-11-01T04-10Z-Fred.json")

    def test_cross_window_xp_rollback_marks_not_comparable(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            for minute in range(10, 61, 10):
                end = HOUR + timedelta(minutes=minute)
                for bot in fg.BOTS:
                    put(root, bot, end)
            # Simulate a mid-hour account reset where Fred's Woodcutting XP drops in window :30
            low_before = {skill: 0 for skill in fg.SKILLS}
            low_after = {**low_before, "Woodcutting": 120}
            put(root, "Fred", HOUR + timedelta(minutes=30), xp_before_tenths=low_before, xp_after_tenths=low_after)
            result = fg.scan(root, HOUR)
            self.assertFalse(result["xp_continuity_ok"])
            self.assertFalse(result["comparable"])
            self.assertGreaterEqual(len(result["xp_rollbacks"]), 1)
            self.assertIn("XP_ROLLBACK", fg.summary_md(result))

    def test_additional_adventurers_barry_larry_gary_rory_summarised(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            end = HOUR + timedelta(minutes=10)
            for bot in ("Fred", "George", "Barry", "Larry", "Gary", "Rory"):
                put(root, bot, end, quests_verified_new=["Cook's Assistant"] if bot == "Barry" else [])
            result = fg.scan(root, HOUR)
            self.assertEqual(result["adventurers"]["Barry"]["intervals_received"], 1)
            self.assertEqual(result["adventurers"]["Barry"]["new_quests_verified"], ["Cook's Assistant"])
            self.assertIn("Barry", fg.summary_md(result))


if __name__ == "__main__":
    unittest.main()
