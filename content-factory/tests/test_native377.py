import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import native377

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

if __name__=='__main__': unittest.main()
