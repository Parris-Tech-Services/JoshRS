"""Synthetic fail-closed tests for the single-command Varrock evidence handoff."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "collect_varrock_triage.py"
spec = importlib.util.spec_from_file_location("collect_varrock_triage", MODULE)
triage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(triage)


class TriageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.content = root / "content"
        self.content.mkdir()
        (self.content / "scripts").mkdir()
        self.packs = root / "pack"
        self.packs.mkdir()
        self.dat, self.idx = self.packs / "script.dat", self.packs / "script.idx"
        self.dat.write_bytes(b"fake dat")
        self.idx.write_bytes(b"fake idx")

    def modules(self, *, collision=None, source=None, verdict=None):
        src = source or {
            "cases": [{"npc": n, "source_exists": True, "source_trigger_present": True,
                       "source_matches_pinned_377": True, "generic_literal_detected": False}
                      for n in triage.NPCS],
            "packs": {"script_dat": {"present": True, "sha256": "a"*64},
                      "script_idx": {"present": True, "sha256": "b"*64}},
        }
        col = collision or {"scan_complete": True, "duplicate_trigger_count": 0,
                            "scan_failure_count": 0,
                            "targets": [{"npc": n, "classification": "unique_in_expected_source_path_not_runtime_verified"}
                                        for n in triage.NPCS]}
        ev = verdict or {"agent3_observations_supplied": False,
                         "loaded_pack_sha256_matches_audited_files": False,
                         "cases": [{"npc": n, "classification": "awaiting_agent3_client_evidence",
                                    "agent3_relog_reported": False} for n in triage.NPCS]}
        return patch.dict(sys.modules, {
            "audit_dispatch": types.SimpleNamespace(audit=lambda *args: src),
            "audit_npc_trigger_collisions": types.SimpleNamespace(scan=lambda *args: col),
            "verify_varrock_dispatch_evidence": types.SimpleNamespace(verify=lambda *args: ev),
        })

    def test_clean_static_source_still_not_playable(self):
        with self.modules():
            report = triage.collect(self.content, self.dat, self.idx)
        self.assertEqual(report["static_source_gate"], "pass_source_only")
        self.assertFalse(report["live_process_verified_by_this_tool"])
        self.assertFalse(report["java_client_verified_by_this_tool"])
        self.assertFalse(report["player_saves_read_or_modified"])
        self.assertEqual(len(report["cases"]), 3)
        self.assertNotIn(str(self.content), json.dumps(report))
        self.assertNotIn("source_definitions", json.dumps(report))

    def test_missing_source_requires_review(self):
        with self.modules() as _:
            pass
        src = {"cases": [{"npc": n, "source_exists": n != "juliet", "source_trigger_present": n != "juliet",
                          "source_matches_pinned_377": True, "generic_literal_detected": False}
                         for n in triage.NPCS],
               "packs": {"script_dat": {"present": True, "sha256": "a"*64},
                         "script_idx": {"present": True, "sha256": "b"*64}}}
        with self.modules(source=src):
            report = triage.collect(self.content, self.dat, self.idx)
        self.assertEqual(report["static_source_gate"], "review_required")

    def test_modified_public_pinned_source_requires_review(self):
        src = {"cases": [{"npc": n, "source_exists": True, "source_trigger_present": True,
                          "source_matches_pinned_377": n != "juliet", "generic_literal_detected": False}
                         for n in triage.NPCS],
               "packs": {"script_dat": {"present": True, "sha256": "a"*64},
                         "script_idx": {"present": True, "sha256": "b"*64}}}
        with self.modules(source=src):
            report = triage.collect(self.content, self.dat, self.idx)
        self.assertEqual(report["static_source_gate"], "review_required")

    def test_collision_requires_review(self):
        col = {"scan_complete": True, "duplicate_trigger_count": 1, "scan_failure_count": 0,
               "targets": [{"npc": n, "classification": "duplicate_source_trigger_requires_agent1_review" if n == "romeo" else "unique_in_expected_source_path_not_runtime_verified"} for n in triage.NPCS]}
        with self.modules(collision=col):
            report = triage.collect(self.content, self.dat, self.idx)
        self.assertEqual(report["static_source_gate"], "review_required")
        self.assertEqual(report["collision_count_all_npc_triggers"], 1)

    def test_incomplete_scan_requires_review(self):
        col = {"scan_complete": False, "duplicate_trigger_count": 0, "scan_failure_count": 1,
               "targets": [{"npc": n, "classification": "incomplete_scan_cannot_prove_uniqueness"} for n in triage.NPCS]}
        with self.modules(collision=col):
            self.assertEqual(triage.collect(self.content, self.dat, self.idx)["static_source_gate"], "review_required")

    def test_generic_literal_requires_review(self):
        src = {"cases": [{"npc": n, "source_exists": True, "source_trigger_present": True,
                          "source_matches_pinned_377": True, "generic_literal_detected": n == "reldo"}
                         for n in triage.NPCS],
               "packs": {"script_dat": {"present": True, "sha256": "a"*64},
                         "script_idx": {"present": True, "sha256": "b"*64}}}
        with self.modules(source=src):
            self.assertEqual(triage.collect(self.content, self.dat, self.idx)["static_source_gate"], "review_required")

    def test_reject_missing_pack(self):
        self.idx.unlink()
        with self.assertRaises(ValueError):
            triage.collect(self.content, self.dat, self.idx)

    def test_reject_pack_wrong_name(self):
        other = self.packs / "player.sav"
        other.write_bytes(b"do not read")
        with self.assertRaises(ValueError):
            triage.collect(self.content, other, self.idx)

    def test_reject_pack_different_directories(self):
        other = Path(self.temp.name) / "script.idx"
        other.write_bytes(b"other")
        with self.assertRaises(ValueError):
            triage.collect(self.content, self.dat, other)

    def test_reject_symlinked_pack(self):
        link = self.packs / "sub" / "script.dat"
        link.parent.mkdir()
        link.symlink_to(self.dat)
        with self.assertRaises(ValueError):
            triage.collect(self.content, link, self.idx)

    def test_reject_symlinked_source_ancestor(self):
        (self.content / "scripts" / "areas").symlink_to(self.packs, target_is_directory=True)
        with self.assertRaises(ValueError):
            triage.collect(self.content, self.dat, self.idx)

    def test_reject_symlinked_root(self):
        link = Path(self.temp.name) / "link"
        link.symlink_to(self.content, target_is_directory=True)
        with self.assertRaises(ValueError):
            triage.collect(link, self.dat, self.idx)

    def test_reject_missing_scripts(self):
        (self.content / "scripts").rmdir()
        with self.assertRaises(ValueError):
            triage.collect(self.content, self.dat, self.idx)

    def test_reject_inconsistent_inventory(self):
        verdict = {"agent3_observations_supplied": False,
                   "loaded_pack_sha256_matches_audited_files": False,
                   "cases": [{"npc": "romeo", "classification": "unknown", "agent3_relog_reported": False}]}
        with self.modules(verdict=verdict):
            with self.assertRaises(ValueError):
                triage.collect(self.content, self.dat, self.idx)

    def test_observation_never_asserts_client_verification(self):
        verdict = {"agent3_observations_supplied": True,
                   "loaded_pack_sha256_matches_audited_files": True,
                   "cases": [{"npc": n, "classification": "agent3_reported_distinct_client_dialogue",
                              "agent3_relog_reported": True} for n in triage.NPCS]}
        with self.modules(verdict=verdict):
            report = triage.collect(self.content, self.dat, self.idx, {"private": "not exported"})
        self.assertTrue(report["agent3_observations_supplied"])
        self.assertFalse(report["java_client_verified_by_this_tool"])
        self.assertNotIn("not exported", json.dumps(report))


if __name__ == "__main__":
    unittest.main()
