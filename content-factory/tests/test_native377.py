import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import native377

HERE_INTAKE = Path(__file__).resolve().parents[1] / 'intake'

class Native377Tests(unittest.TestCase):
    def test_native_npc_overlay_is_reproducible_and_saves_safe(self):
        with tempfile.TemporaryDirectory() as tmp:
            intake=Path(tmp)/'intake'; intake.mkdir()
            (intake/'original.json').write_text(json.dumps({'schema':1,'entries':[
                {'kind':'npc','key':'joshrs_woodland_guide','name':'Woodland Guide','description':'A friendly original guide.','origin':'original_user_authored'},
                {'kind':'item','key':'joshrs_token','name':'Token','description':'A prize.','origin':'original_user_authored'}]}))
            output=Path(tmp)/'out'
            first=native377.build_native(intake,output)
            self.assertEqual(first['npc_names'],['joshrs_woodland_guide'])
            self.assertFalse(first['compilation_verified'])
            self.assertFalse(first['runtime_login_verified'])
            self.assertFalse(first['includes_player_save_changes'])
            self.assertFalse(first['persistent_npc_spawns'])
            for f in first['files']:
                self.assertTrue(f['path'].startswith('scripts/areas/joshrs_custom/'))
                self.assertEqual(hashlib.sha256((output/f['path']).read_bytes()).hexdigest(),f['sha256'])
            rs2=(output/first['files'][1]['path']).read_text()
            self.assertIn('[opnpc1,joshrs_woodland_guide]',rs2)
            self.assertIn('[debugproc,joshrs_spawn_joshrs_woodland_guide]',rs2)
            self.assertNotIn('[obj,joshrs_token]',rs2)
            self.assertEqual(first,native377.build_native(intake,output))

    def test_reject_runescript_injection_and_duplicate_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            intake=Path(tmp)/'intake'; intake.mkdir()
            base={'kind':'npc','key':'joshrs_woodland_guide','name':'Guide','description':'Friendly.','origin':'original_user_authored'}
            (intake/'x.json').write_text(json.dumps({'schema':1,'entries':[{**base,'name':'Guide\"); npc_add(coord, hacker, 1);'}]}))
            with self.assertRaises(ValueError): native377.build_native(intake,Path(tmp)/'out')
            (intake/'x.json').write_text(json.dumps({'schema':1,'entries':[base,base]}))
            with self.assertRaises(ValueError): native377.build_native(intake,Path(tmp)/'out')

    def test_refuse_unexpected_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            intake=Path(tmp)/'intake'; intake.mkdir()
            (intake/'x.json').write_text(json.dumps({'schema':1,'entries':[{'kind':'npc','key':'joshrs_walker','name':'Walker','description':'Walks quietly.','origin':'original_user_authored'}]}))
            out=Path(tmp)/'out';out.mkdir()
            (out/'unknown.dat').write_bytes(b'not allowed')
            with self.assertRaises(ValueError): native377.build_native(intake,out)

    def test_duplicate_npc_merchants_are_not_generated_or_deployed(self):
        with tempfile.TemporaryDirectory() as tmp:
            target=Path(tmp)/'overlay'
            manifest=native377.build_native(HERE_INTAKE, target)
            self.assertEqual(manifest['npc_names'], ['joshrs_woodland_guide'])
            self.assertEqual(manifest['gameplay_mechanics'], [])
            self.assertTrue(manifest['feature_gap_evidence_required'])
            self.assertEqual(set(manifest['retired_unrequested_merchant_keys']),
                             native377.RETIRED_UNREQUESTED_MERCHANTS)
            script=(target/'scripts/areas/joshrs_custom/scripts/joshrs_original.rs2').read_text()
            config=(target/'scripts/areas/joshrs_custom/configs/joshrs_original.npc').read_text()
            self.assertIn('[opnpc1,joshrs_woodland_guide]',script)
            for name in native377.RETIRED_UNREQUESTED_MERCHANTS:
                self.assertNotIn(name,script)
                self.assertNotIn(name,config)
            self.assertNotIn('inv_add(inv,',script)
            self.assertNotIn('inv_del(inv,',script)

    def test_new_npc_requires_verified_missing_feature_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            inp=Path(tmp)/'intake'
            inp.mkdir()
            (inp/'new.json').write_text(json.dumps({'schema':1,'entries':[
                {'kind':'npc','key':'joshrs_another_supplier','name':'Supplier',
                 'description':'One more vendor.', 'origin':'original_user_authored'}]}))
            with self.assertRaisesRegex(ValueError, 'feature-gap'):
                native377.build_native(inp,Path(tmp)/'out')

if __name__=='__main__': unittest.main()
