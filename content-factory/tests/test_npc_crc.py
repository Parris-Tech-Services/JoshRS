from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from patch_377_npc_crc import patch_engine, STOCK, LOC, ONLY_NPC, BOTH

class ScopedChecksumTests(unittest.TestCase):
    def test_npc_crc_only_and_idempotent(self):
        with tempfile.TemporaryDirectory() as d:
            engine=Path(d); src=engine/'tools/pack/config/PackShared.ts';src.parent.mkdir(parents=True)
            src.write_text(STOCK)
            patch_engine(engine)
            self.assertEqual(src.read_text(),ONLY_NPC)
            self.assertEqual(patch_engine(engine),'already scoped')
            self.assertEqual(src.with_suffix('.ts.joshrs-original.bak').read_text(),STOCK)

    def test_respects_custom_loc_bypass(self):
        with tempfile.TemporaryDirectory() as d:
            engine=Path(d); src=engine/'tools/pack/config/PackShared.ts';src.parent.mkdir(parents=True)
            src.write_text(LOC)
            patch_engine(engine)
            self.assertEqual(src.read_text(),BOTH)
            self.assertIn("JOSHRS_CUSTOM_LOCS",src.read_text())
            self.assertIn("JOSHRS_CUSTOM_NPCS",src.read_text())

    def test_unknown_engine_refused(self):
        with tempfile.TemporaryDirectory() as d:
            engine=Path(d); src=engine/'tools/pack/config/PackShared.ts';src.parent.mkdir(parents=True)
            src.write_text('unrecognised')
            with self.assertRaises(ValueError):patch_engine(engine)
            self.assertEqual(src.read_text(),'unrecognised')

if __name__=='__main__':unittest.main()
