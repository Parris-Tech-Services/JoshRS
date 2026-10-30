import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('factory', HERE / 'factory.py')
factory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(factory)

class FactoryTests(unittest.TestCase):
    def test_block_assets(self):
        for name in ['assets/models/123.dat','maps/region.json','nonfree/sprites/tree.png','.github/workflows/evil.yml','engine/node_modules/x.ts']:
            self.assertFalse(factory.allowed_path(name), name)
        self.assertTrue(factory.allowed_path('scripts/quest/start.rs2'))

    def test_status_never_autoverified(self):
        s = {'key': 'x', 'policy': 'review_only', 'era': '377'}
        c = factory.candidate('owner/repo', 'a' * 40, {'path': 'scripts/abc.rs2', 'sha': 'b' * 40}, s)
        self.assertEqual(c['status'], 'agent_review_required')
        self.assertFalse(c['native_runtime_verified'])
        self.assertFalse(c['rights_cleared_for_redistribution'])
        self.assertEqual(factory.category('configs/example.obj', s), 'rights_review_required')

    def test_batch_rotation(self):
        entries = [{'type':'blob','path':f'scripts/{i:02d}.rs2','sha':str(i)} for i in range(5)]
        a, next_a = factory.select_batch(entries, 0, 2)
        b, next_b = factory.select_batch(entries, next_a, 2)
        c, next_c = factory.select_batch(entries, next_b, 2)
        self.assertEqual([len(a),len(b),len(c)], [2,2,1])
        self.assertEqual(next_c, 0)

    def test_owned_conversion(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder/'custom.json').write_text(json.dumps({'schema':1,'entries':[{'kind':'npc','key':'safe_npc','name':'Safe NPC','description':'An original character.','origin':'original_user_authored'}]}))
            output=folder/'out.json'
            self.assertEqual(factory.convert_owned(folder, output), 1)
            obj=json.loads(output.read_text())
            self.assertTrue(obj['requires_runtime_adapter'])
            self.assertFalse(obj['compiled_in_377'])
            self.assertEqual(obj['entries'][0]['key'],'safe_npc')

    def test_reject_unlicensed_and_unreviewed_fields(self):
        original = {'kind':'npc','key':'safe_npc','name':'Safe NPC','description':'An original character.','origin':'original_user_authored'}
        with self.assertRaises(ValueError):
            factory.normalize_owned({**original, 'origin':'downloaded_game_cache'})
        with self.assertRaises(ValueError):
            factory.normalize_owned({**original, 'model_file':'unlicensed.dat'})
        with self.assertRaises(ValueError):
            factory.normalize_owned({**original, 'name':'bad\nname'})

    def test_full_scan_resume_and_persist(self):
        s = {'key':'seed','repo':'owner/repo','ref':'377','era':'377','policy':'review_only','license':'MIT'}
        fake_tree = {'sha':'a'*40,'tree':[{'type':'blob','path':f'scripts/{i:02d}.rs2','sha':str(i)} for i in range(5)]}
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            with patch.object(factory, 'gh', side_effect=lambda p: {'sha':'c'*40} if '/commits/' in p else fake_tree):
                first = factory.scan([s], dest, 2, False)
                self.assertEqual(first['checked'], 1)
                second = factory.scan([s], dest, 2, False)
                self.assertEqual(second['checked'], 1)
                third = factory.scan([s], dest, 2, False)
                self.assertEqual(third['checked'], 1)
            pack = json.loads((dest/'packs/seed.json').read_text())
            state = json.loads((dest/'state.json').read_text())
            self.assertEqual(len(pack['candidates']), 5)
            self.assertTrue(state['seed']['complete_pass'])
            self.assertTrue(all(c['native_runtime_verified'] is False for c in pack['candidates']))

if __name__ == '__main__':
    unittest.main()
