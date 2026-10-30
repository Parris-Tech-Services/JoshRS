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
        self.assertEqual(c['status'], 'manual_port_required')
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

    def test_agent_queue_prioritises_safe_review_without_installation(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            factory.put_json(dest/'packs/sample.json', {'candidates': [
                {'id':'1','status':'blocked_reference_only','source':'test','repo':'a/b','path':'client.class','url':'https://github.com/a/b'},
                {'id':'2','status':'agent_review_required','source':'lostcity-content-377','repo':'a/b','path':'scripts/a.rs2','url':'https://github.com/a/b'}]})
            q = factory.prepare_agent_queue(dest)
            self.assertEqual(q['tasks'][0]['work_id'], '377-2')
            self.assertFalse(q['tasks'][0]['automatically_installed'])
            self.assertEqual(q['tasks'][1]['status'], 'blocked_rights_review')

    def test_cheats_not_promoted_to_agent_queue(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            factory.put_json(dest/'packs/test.json', {'candidates': [
                {'id':'x','status':'agent_review_required','source':'lostcity-content-377','repo':'a/b','path':'scripts/_test/scripts/cheats/cheat.rs2','url':'https://github.com/a/b'},
                {'id':'y','status':'agent_review_required','source':'lostcity-content-377','repo':'a/b','path':'scripts/areas/area_alkharid/scripts/tanner.rs2','url':'https://github.com/a/b'}]})
            tasks = factory.prepare_agent_queue(dest)['tasks']
            self.assertEqual([t['candidate_id'] for t in tasks], ['y'])

    def test_agent_queue_rotates_without_repeating_first_page(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            factory.put_json(dest/'packs/rotation.json', {'candidates': [
                {'id':str(i),'status':'agent_review_required','source':'lostcity-content-377',
                 'repo':'owner/approved','path':f'scripts/areas/area{i}/script.rs2',
                 'url':'https://github.com/owner/approved'}
                for i in range(5)]})
            pages = [factory.prepare_agent_queue(dest, max_tasks=2) for _ in range(3)]
            self.assertEqual([[t['candidate_id'] for t in p['tasks']] for p in pages],
                             [['0','1'],['2','3'],['4','0']])
            self.assertEqual(pages[-1]['next_rotation_offset'], 1)

    def test_pinned_377_is_not_a_missing_feature(self):
        import json
        pins=json.loads((HERE.parent/'deploy/jparris-windows/upstreams.json').read_text())
        src={'key':'lostcity-content-377','repo':'LostCityRS/Content','era':'377','policy':'review_only'}
        c=factory.candidate(src['repo'],'a'*40, {'path':'scripts/areas/test.rs2','sha':'123'},src,pins['content']['commit'])
        self.assertEqual(c['status'],'already_in_pinned_source')
        self.assertFalse(c['native_runtime_verified'])

    def test_historical_identical_blob_and_incompatible_engine(self):
        s={'key':'lostcity-content-274','repo':'LostCityRS/Content','era':'pre377','policy':'review_only'}
        self.assertEqual(factory.category('scripts/example.rs2',s,'274commit',{'scripts/example.rs2':'abc'},'abc'),'already_in_pinned_source')
        self.assertEqual(factory.category('scripts/example.rs2',s,'274commit',{'scripts/example.rs2':'def'},'abc'),'manual_port_required')
        s2={'key':'luna-377','repo':'luna-rs/luna','era':'377','policy':'review_only'}
        self.assertEqual(factory.category('src/engine/test.kt',s2),'manual_port_required')
        s3={'key':'other','repo':'someone/else','era':'other','policy':'metadata_only'}
        self.assertEqual(factory.category('scripts/exam.rs2',s3),'blocked_reference_only')

    def test_historical_versions_are_one_work_order_preferring_latest(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp); (dest/'packs').mkdir()
            for era in (225,254,274):
                factory.put_json(dest/'packs'/f'content-{era}.json',{'candidates':[{
                    'id':str(era),'status':'manual_port_required',
                    'source':f'lostcity-content-{era}','repo':'LostCityRS/Content',
                    'path':'scripts/areas/common/dialogue.rs2','blob_sha':f'blob-{era}',
                    'url':f'https://github.com/LostCityRS/Content/blob/{era}/scripts/areas/common/dialogue.rs2',
                    'source_commit_sha':f'commit-{era}'}]})
            task=factory.prepare_agent_queue(dest)
            self.assertEqual(1,task['candidate_pool'])
            self.assertEqual(3,task['raw_reference_versions'])
            self.assertEqual(2,task['deduplicated_reference_versions'])
            self.assertEqual(1,len(task['tasks']))
            self.assertEqual('274',task['tasks'][0]['candidate_id'])
            self.assertFalse(task['tasks'][0]['playable_in_377'])

if __name__ == '__main__':
    unittest.main()
