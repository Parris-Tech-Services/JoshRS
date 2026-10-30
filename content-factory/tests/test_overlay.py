import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import native377
import prepare_377_overlay as ov

class OverlayTests(unittest.TestCase):
    def test_valid_overlay_and_repeat(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); out=root/'generated'; target=root/'upstream'; (target/'scripts').mkdir(parents=True); (target/'pack').mkdir(); (target/'pack/npc.pack').write_text('0=hans\n1=man\n')
            source=Path(__file__).resolve().parents[1]/'intake'
            native377.build_native(source,out)
            self.assertEqual(2,ov.apply_overlay(out,target))
            self.assertEqual(2,ov.apply_overlay(out,target))
            scripts=(target/'scripts/areas/joshrs_custom/scripts/joshrs_original.rs2')
            self.assertIn('[opnpc1,joshrs_woodland_guide]', scripts.read_text())
            self.assertFalse((target/'players').exists())

    def test_cannot_clobber_modified_world_or_untrusted_manifest(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); out=root/'generated'; target=root/'upstream'; (target/'scripts').mkdir(parents=True)
            native377.build_native(Path(__file__).resolve().parents[1]/'intake',out)
            ov.apply_overlay(out,target)
            compiled=target/'scripts/areas/joshrs_custom/scripts/joshrs_original.rs2'
            compiled.write_text('custom existing script')
            with self.assertRaises(ValueError): ov.apply_overlay(out,target)
            self.assertEqual(compiled.read_text(),'custom existing script')
            manifest=out/'manifest.json'; obj=json.loads(manifest.read_text()); obj['files'][0]['path']='../../players/saves.json';manifest.write_text(json.dumps(obj))
            with self.assertRaises(ValueError): ov.verified_files(out)

if __name__=='__main__': unittest.main()
