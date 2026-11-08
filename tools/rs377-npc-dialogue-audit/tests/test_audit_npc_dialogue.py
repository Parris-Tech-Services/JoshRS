import tempfile
import unittest
from pathlib import Path

from tools_npc_audit_helper import load_audit_module


class TestAuditNpcDialogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load_audit_module()

    def test_scan_content_detects_direct_category_and_multinpc_handlers(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "pack").mkdir()
            (root / "scripts" / "area").mkdir(parents=True)
            (root / "maps").mkdir()

            (root / "pack" / "npc.pack").write_text(
                "100=handled_direct\n101=handled_cat\n102=unhandled_npc\n103=multi_parent\n104=multi_child\n",
                encoding="utf-8",
            )
            (root / "scripts" / "area" / "test.npc").write_text(
                "[handled_direct]\nname=Direct\nop1=Talk-to\n\n"
                "[handled_cat]\nname=CatNpc\nop1=Talk-to\ncategory=town_citizen\n\n"
                "[unhandled_npc]\nname=Draul Leptoc\nop1=Talk-to\ndesc=Angry man.\n\n"
                "[multi_parent]\nmultinpc=0,multi_child\n\n"
                "[multi_child]\nname=Child\nop1=Talk-to\n",
                encoding="utf-8",
            )
            (root / "scripts" / "area" / "test.rs2").write_text(
                "[opnpc1,handled_direct]\n~chatnpc(\"<p,neutral>Hello.\");\n\n"
                "[opnpc1,_town_citizen]\n~chatnpc(\"<p,neutral>Hi.\");\n\n"
                "[opnpc1,multi_parent]\n~chatnpc(\"<p,neutral>Morph.\");\n",
                encoding="utf-8",
            )
            (root / "maps" / "m49_53.jm2").write_text(
                "==== NPC ====\n0 25 43: 102\n0 26 44: 103\n",
                encoding="utf-8",
            )

            report = self.mod.scan_content(root)
            summary = report["summary"]
            self.assertEqual(summary["total_npc_definitions"], 5)
            self.assertEqual(summary["total_talk_to_npcs"], 4)
            self.assertEqual(summary["handled_talk_to_npcs"], 3)
            self.assertEqual(summary["unhandled_talk_to_npcs"], 1)
            self.assertEqual(summary["unhandled_spawned_on_map"], 1)

            unhandled = report["unhandled_npcs"][0]
            self.assertEqual(unhandled["debugname"], "unhandled_npc")
            self.assertTrue(unhandled["spawned_on_map"])
            self.assertNotIn("desc", unhandled)  # Never export raw text strings


if __name__ == "__main__":
    unittest.main()
