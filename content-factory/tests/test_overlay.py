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
            root=Path(d); out=root/'generated'; target=root/'upstream'; (target/'scripts').mkdir(parents=True); (target/'pack').mkdir(); (target/'pack/npc.pack').write_text('0=hans\n1=man\n')
            native377.build_native(Path(__file__).resolve().parents[1]/'intake',out)
            ov.apply_overlay(out,target)
            compiled=target/'scripts/areas/joshrs_custom/scripts/joshrs_original.rs2'
            compiled.write_text('custom existing script')
            with self.assertRaises(ValueError): ov.apply_overlay(out,target)
            self.assertEqual(compiled.read_text(),'custom existing script')
            manifest=out/'manifest.json'; obj=json.loads(manifest.read_text()); obj['files'][0]['path']='../../players/saves.json';manifest.write_text(json.dumps(obj))
            with self.assertRaises(ValueError): ov.verified_files(out)

    def test_retire_only_unrequested_merchant_ids_and_keep_other_npcs(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            source=root/'generated'
            target=root/'upstream'
            (target/'scripts').mkdir(parents=True)
            (target/'pack').mkdir()
            pack=target/'pack/npc.pack'
            pack.write_text('0=hans\n1=joshrs_law_rune_vendor\n2=joshrs_ore_buyer\n3=custom_quest_npc\n4=joshrs_woodland_guide\n')
            native377.build_native(Path(__file__).resolve().parents[1]/'intake',source)
            self.assertEqual(2,ov.apply_overlay(source,target))
            updated=pack.read_text()
            self.assertIn('0=hans',updated)
            self.assertIn('3=custom_quest_npc',updated)
            self.assertIn('4=joshrs_woodland_guide',updated)
            self.assertNotIn('joshrs_law_rune_vendor',updated)
            self.assertNotIn('joshrs_ore_buyer',updated)
            backups=list((target/'pack').glob('npc.pack.joshrs-before-*.bak'))
            self.assertEqual(len(backups),1)
            self.assertIn('joshrs_law_rune_vendor',backups[0].read_text())
            self.assertEqual(2,ov.apply_overlay(source,target))
            self.assertEqual(len(list((target/'pack').glob('npc.pack.joshrs-before-*.bak'))),1)

    def test_arbitrary_registry_retirement_is_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            source=root/'generated'
            target=root/'upstream'
            (target/'scripts').mkdir(parents=True)
            (target/'pack').mkdir()
            (target/'pack/npc.pack').write_text('0=custom_quest_npc\n')
            native377.build_native(Path(__file__).resolve().parents[1]/'intake',source)
            m=source/'manifest.json'
            data=json.loads(m.read_text())
            data['retired_unrequested_merchant_keys'].append('custom_quest_npc')
            m.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'retired'):
                ov.apply_overlay(source,target)
            self.assertEqual((target/'pack/npc.pack').read_text(),'0=custom_quest_npc\n')

if __name__=='__main__': unittest.main()
