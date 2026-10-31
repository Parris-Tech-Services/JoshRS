"""Synthetic-only tests for the Varrock NPC source collision scan."""
from __future__ import annotations
import importlib.util
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "audit_npc_trigger_collisions.py"
spec = importlib.util.spec_from_file_location("npc_collision_gate", MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def fixture(root, missing=None):
    for npc, (trigger, rel) in mod.EXPECTED.items():
        if npc == missing:
            continue
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(f"// synthetic fixture\n[{trigger}]\nreturn;\n", encoding="utf-8")


class TriggerCollisionTests(unittest.TestCase):
    def test_exact_three_unique_paths(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            r = mod.scan(root)
            self.assertTrue(r["scan_complete"])
            self.assertEqual(r["duplicate_trigger_count"], 0)
            self.assertEqual(r["trigger_headers_found"], 3)
            self.assertEqual({x["classification"] for x in r["targets"]},
                             {"unique_in_expected_source_path_not_runtime_verified"})
            self.assertFalse(r["live_server_verified"])

    def test_duplicate_across_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            p = root / "scripts/areas/area_other/scripts/duplicate.rs2"
            p.parent.mkdir(parents=True)
            p.write_text("[opnpc1,romeo]\n")
            r = mod.scan(root)
            self.assertEqual(r["duplicate_trigger_count"], 1)
            self.assertEqual(r["targets"][2]["classification"], "duplicate_source_trigger_requires_agent1_review")
            self.assertEqual(len(r["duplicate_triggers"][0]["source_definitions"]), 2)

    def test_duplicate_in_one_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            p = root / mod.EXPECTED["reldo"][1]
            p.write_text(p.read_text() + "[opnpc1,reldo]\n")
            self.assertEqual(mod.scan(root)["targets"][0]["classification"], "duplicate_source_trigger_requires_agent1_review")

    def test_missing_target(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root, "juliet")
            self.assertEqual(mod.scan(root)["targets"][1]["classification"], "trigger_missing_from_source_scan")

    def test_wrong_source_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root, "romeo")
            p = root / "scripts/areas/area_other/scripts/romeo.rs2"
            p.parent.mkdir(parents=True)
            p.write_text("[opnpc1,romeo]\n")
            self.assertEqual(mod.scan(root)["targets"][2]["classification"], "trigger_in_unexpected_source_path")

    def test_case_and_spaces_are_normalised(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            p = root / mod.EXPECTED["reldo"][1]
            p.write_text(" [ OPNPC1 , RELDO ] // a comment\n")
            self.assertEqual(mod.scan(root)["targets"][0]["classification"], "unique_in_expected_source_path_not_runtime_verified")

    def test_comment_only_not_counted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            p = root / "scripts/comment.rs2"
            p.write_text("// [opnpc1,romeo]\n")
            self.assertEqual(mod.scan(root)["duplicate_trigger_count"], 0)

    def test_unreadable_binary_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / "scripts/bad.rs2").write_bytes(b"\xff\xfe")
            r = mod.scan(root)
            self.assertFalse(r["scan_complete"])
            self.assertEqual(r["scan_failure_count"], 1)
            self.assertTrue(all("incomplete_scan" in x["classification"] for x in r["targets"]))

    def test_oversize_file_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / "scripts/large.rs2").write_bytes(b"a" * (mod.MAX_BYTES + 1))
            self.assertFalse(mod.scan(root)["scan_complete"])

    def test_symlink_file_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / "scripts/link.rs2").symlink_to(root / mod.EXPECTED["reldo"][1])
            r = mod.scan(root)
            self.assertFalse(r["scan_complete"])
            self.assertEqual(r["scan_failures"][0]["reason"], "nonregular_or_symlink")

    def test_missing_scripts_dir_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, "scripts directory"):
                mod.scan(Path(tmp))

    def test_does_not_report_dialogue_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            p = root / mod.EXPECTED["romeo"][1]
            p.write_text(p.read_text() + "SECRET_PRIVATE_DIALOGUE_TEXT\n")
            self.assertNotIn("SECRET_PRIVATE_DIALOGUE_TEXT", str(mod.scan(root)))

    def test_other_npc_collision_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            for n in ("a", "b"):
                (root / f"scripts/{n}.rs2").write_text("[opnpc2,unknown_npc]\n")
            r = mod.scan(root)
            self.assertEqual(r["duplicate_trigger_count"], 1)
            self.assertEqual(r["duplicate_triggers"][0]["trigger"], "opnpc2,unknown_npc")


if __name__ == "__main__":
    unittest.main()
