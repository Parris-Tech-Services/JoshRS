"""Integration test: compose the REAL existing JoshRS source diagnostics."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import collect_varrock_triage as triage


class VarrockRealDiagnosticsIntegration(unittest.TestCase):
    def test_existing_three_diagnostics_compose_on_disposable_fixture(self):
        # This deliberately does NOT copy pinned game dialogue or touch active.json.
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content = root / "content"
            scripts = content / "scripts/areas/area_varrock/scripts"
            scripts.mkdir(parents=True)
            for npc, symbol in (("reldo", "reldo"),
                                ("juliet", "juliet_multi_visible"),
                                ("romeo", "romeo")):
                (scripts / (npc + ".rs2")).write_text(
                    "[opnpc1," + symbol + "]\nreturn;\n", encoding="utf-8")
            pack = root / "pack"
            pack.mkdir()
            dat, idx = pack / "script.dat", pack / "script.idx"
            dat.write_bytes(b"synthetic-disposable-script-dat")
            idx.write_bytes(b"synthetic-disposable-script-idx")
            report = triage.collect(content, dat, idx)
            self.assertEqual(report["schema"], "joshrs-377-varrock-one-command-triage-v1")
            self.assertEqual(report["static_source_gate"], "review_required")
            self.assertTrue(report["collision_scan_complete"])
            self.assertEqual(report["collision_count_all_npc_triggers"], 0)
            self.assertEqual([r["npc"] for r in report["cases"]], ["reldo", "juliet", "romeo"])
            self.assertTrue(all(r["source_trigger_present"] for r in report["cases"]))
            self.assertTrue(all(r["source_matches_public_pinned_blob"] is False
                                for r in report["cases"]))
            self.assertFalse(report["live_process_verified_by_this_tool"])
            self.assertFalse(report["java_client_verified_by_this_tool"])
            serialised = json.dumps(report)
            self.assertNotIn(str(root), serialised)
            self.assertNotIn("synthetic-disposable", serialised)


if __name__ == "__main__":
    unittest.main()
