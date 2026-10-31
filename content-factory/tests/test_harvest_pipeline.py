"""Offline mocked safety tests for multi-provider JoshRS metadata harvesting and matching."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

BASE = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, BASE / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sources = load('harvest_sources')
match = load('harvest_match')
factory = load('factory')
SHA = 'a' * 40
PIN = json.loads((BASE.parent / 'deploy/jparris-windows/upstreams.json').read_text())['content']['commit']


class HarvestPipelineTests(unittest.TestCase):
    def test_path_safety(self):
        for p in ['maps/region.json', 'models/head.json', 'scripts/../../secret.json',
                  '.hidden.json', 'assets/npc.rs2', 'songs/song.json', '/private.rs2',
                  'scripts\\npc.rs2', 'cache/2696.json', 'server/db.sqlite']:
            self.assertFalse(sources.safe_path(p), p)
        self.assertTrue(sources.safe_path('Server/src/Quest.java'))

    def test_gitlab_cursor_and_exact_commit(self):
        urls = []
        def fetch(url):
            urls.append(url)
            if '/commits/' in url:
                return {'id': SHA}, {}
            if 'page_token=' in url:
                return [{'type':'blob','path':'Server/src/Quest2.java','id':'b'*40}], {}
            return ([{'type':'blob','path':'Server/src/Quest.java','id':SHA},
                     {'type':'blob','path':'models/evil.json','id':SHA}],
                    {'Link': '<https://gitlab.com/api/v4/projects/2009scape%2F2009scape/repository/tree?page_token=abc123>; rel="next"'})
        first = sources.collect_gitlab({}, 1, fetch)
        self.assertFalse(first['complete'])
        self.assertEqual('abc123', first['cursor'])
        self.assertEqual(1, len(first['candidates']))
        second = sources.collect_gitlab(first, 1, fetch)
        self.assertTrue(second['complete'])
        self.assertEqual(2, len(second['candidates']))
        self.assertIn('ref=' + SHA, urls[1])
        self.assertNotIn('&page=', urls[-1])

    def test_gitlab_bad_commit_rejected(self):
        with self.assertRaises(sources.MetadataBlocked):
            sources.collect_gitlab({}, 1, lambda url: ({'id':'master'}, {}))

    def test_gitlab_next_link_must_be_gitlab(self):
        bad = {'Link':'<https://evil.example/repository/tree?page_token=secret>; rel="next"'}
        with self.assertRaises(sources.MetadataBlocked):
            sources._link_token(bad)

    def test_gitlab_full_page_without_cursor_is_blocked(self):
        fake = [{'type':'blob','path':f'Server/src/Script{i}.java','id':SHA} for i in range(100)]
        def fetch(url):
            return ({'id':SHA}, {}) if '/commits/' in url else (fake, {})
        with self.assertRaises(sources.MetadataBlocked):
            sources.collect_gitlab({}, 1, fetch)

    def test_openrs2_snapshot_metadata_only(self):
        raw = [{'id': 2696, 'game':'runescape','build':377,
                'download_url':'https://not-to-copy.example/cache.zip'}]
        result = sources.collect_openrs2({}, 2, lambda url: (raw, {}))
        self.assertEqual('openrs2:2696', result['revision'])
        self.assertEqual([], result['candidates'])
        self.assertNotIn('download_url', result['snapshot'])

    def test_openrs2_missing_or_duplicate_id_fails(self):
        for raw in ([], [{'id':2696}, {'id':2696}]):
            with self.assertRaises(sources.MetadataBlocked):
                sources.collect_openrs2({}, 2, lambda url: (raw, {}))

    def test_huggingface_no_data_download(self):
        raw = {'sha':SHA, 'siblings': [{'rfilename':'README.md'},
                                       {'rfilename':'knowledge.sqlite3'},
                                       {'rfilename':'data/entities.json'},
                                       {'rfilename':'scripts/build.py'}]}
        result = sources.collect_hf({}, 2, lambda url: (raw, {}))
        self.assertEqual(['README.md','scripts/build.py'],
                         [r['path'] for r in result['candidates']])
        self.assertTrue(all(r['eligible_for_import'] is False for r in result['candidates']))

    def test_one_blocked_provider_preserves_checkpoint(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            checkpoint = {'openrs2-377':{'revision':'old','candidates':[],
                                        'complete':True, 'cursor':None}}
            (path/'source-metadata-state.json').write_text(json.dumps(checkpoint))
            report = sources.collect_all(path, ('openrs2-377',), 2,
                                         fetch=lambda url: (_ for _ in ()).throw(sources.MetadataBlocked()))
            self.assertEqual('blocked', report['source_access']['openrs2-377'])
            self.assertEqual('old', json.loads((path/'source-metadata-state.json').read_text())['openrs2-377']['revision'])

    def test_metadata_source_not_arbitrary_url(self):
        with self.assertRaises(ValueError):
            sources.collect_all(Path('/tmp/unused'), ('evil-custom-url',), 1)

    def test_exact_pinned_source_compare(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            factory.put_json(output/'packs/lostcity-content-377.json',
                             {'commit_sha':PIN, 'candidates':[{'path':'scripts/a.rs2','blob_sha':SHA}]})
            factory.put_json(output/'packs/older.json', {'candidates':[
                {'id':'old','source':'lostcity-content-274','path':'scripts/a.rs2',
                 'blob_sha':SHA, 'source_commit_sha':'b'*40},
                {'id':'changed','source':'lostcity-content-274','path':'scripts/a.rs2',
                 'blob_sha':'c'*40, 'source_commit_sha':'b'*40},
                {'id':'unknown','source':'luna-377','path':'src/quest.kt',
                 'blob_sha':'d'*40, 'source_commit_sha':'e'*40}]})
            report = match.match_all(output)
            self.assertEqual(1, report['counts']['existing_unverified'])
            self.assertEqual(1, report['counts']['version_difference_unverified'])
            self.assertEqual(1, report['counts']['unmapped_partial_inventory'])
            self.assertFalse(report['baseline_complete'])
            self.assertEqual(0, report['missing_confirmed'])
            self.assertTrue(all(x['target_id377'] is None for x in report['rows']))

    def test_full_377_index_permits_exact_nonmatch_classification(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            factory.put_json(path/'packs/lostcity-content-377.json',
                             {'commit_sha': PIN, 'candidates': []})
            factory.put_json(path/'pinned-377-index.json', {'commit': PIN,
                             'complete': True, 'paths': {'scripts/a.rs2': SHA}})
            factory.put_json(path/'packs/earlier.json', {'candidates': [
                {'id':'candidate','source':'older','path':'scripts/different.rs2',
                 'blob_sha':'c'*40,'source_commit_sha':'d'*40}]})
            report = match.match_all(path)
            self.assertTrue(report['baseline_complete'])
            self.assertEqual(1,report['counts']['unmapped_reference'])
            self.assertEqual(0,report['missing_confirmed'])

    def test_stale_mutable_branch_baseline_rejected(self):
        with self.assertRaises(ValueError):
            match.baseline_map({'commit_sha':'b'*40,'candidates':[]}, PIN)

    def test_no_pinned_pack_blocks_instead_of_claiming_gaps(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual('blocked_no_pinned_inventory',match.match_all(Path(tmp))['status'])

    def test_original_dialogue_graph_good(self):
        doc = {'schema':'joshrs-377-original-dialogue-v1','entries':[
            {'key':'craft_watcher','id377':None,'origin':'original_user_authored',
             'status':'research_proposal_not_installable', 'nodes':[
                 {'id':'start','text':'The furnaces are still warm.','next':['question','exit']},
                 {'id':'question','text':'Do you need a hand finding ore?','next':['exit']},
                 {'id':'exit','text':'Keep your gloves close.','exit':True}]}]}
        self.assertEqual([], match.dialogue_health(doc))

    def test_duplicate_universal_greetings_and_dangling_branches_fail(self):
        doc = {'schema':'joshrs-377-original-dialogue-v1','entries':[
            {'key':'test_npc','id377':None,'origin':'original_user_authored',
             'status':'research_proposal_not_installable','nodes':[
                 {'id':'start','text':'Hello adventurer','next':['missing']},
                 {'id':'bye','text':'Farewell.','exit':True}]}]}
        problems = match.dialogue_health(doc)
        self.assertTrue(any('universal greeting' in x for x in problems))
        self.assertTrue(any('dangling branch' in x for x in problems))
        self.assertTrue(any('unreachable' in x for x in problems))

    def test_factory_uses_exact_pin_not_moving_377_wip_branch(self):
        calls = []
        def gh(path):
            calls.append(path)
            return ({'sha':PIN} if '/commits/' in path else
                    {'sha':SHA,'tree':[{'type':'blob','path':'scripts/area/a.rs2','sha':'b'*40}]})
        with tempfile.TemporaryDirectory() as tmp, patch.object(factory,'gh',side_effect=gh):
            factory.scan([{'key':'lostcity-content-377','repo':'LostCityRS/Content',
                           'ref':'377-wip','era':'377','policy':'review_only'}],Path(tmp),2,False)
        self.assertTrue(all('377-wip' not in x for x in calls))
        self.assertTrue(any(PIN in x for x in calls))


if __name__ == '__main__':
    unittest.main()
