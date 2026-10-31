"""Offline compatibility and dialogue checks for the single existing JoshRS harvester."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec=importlib.util.spec_from_file_location(name, ROOT/(name+'.py'))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


match=load('harvest_match')
factory=load('factory')
PIN=json.loads((ROOT.parent/'deploy/jparris-windows/upstreams.json').read_text())['content']['commit']
SHA='a'*40


class ComparisonTests(unittest.TestCase):
    def test_source_presence_is_not_playable(self):
        with tempfile.TemporaryDirectory() as t:
            d=Path(t)
            factory.put_json(d/'packs/lostcity-content-377.json',{'commit_sha':PIN,
                'candidates':[{'path':'scripts/a.rs2','blob_sha':SHA}]})
            factory.put_json(d/'packs/older.json',{'candidates':[
                {'id':'same','source':'older','path':'scripts/a.rs2','blob_sha':SHA,'source_commit_sha':'b'*40},
                {'id':'different','source':'older','path':'scripts/a.rs2','blob_sha':'c'*40,'source_commit_sha':'b'*40},
                {'id':'unmapped','source':'older','path':'scripts/other.rs2','blob_sha':'d'*40,'source_commit_sha':'b'*40}]})
            report=match.match_all(d)
            self.assertEqual(report['counts']['existing_unverified'],1)
            self.assertEqual(report['counts']['version_difference_unverified'],1)
            self.assertEqual(report['counts']['unmapped_partial_inventory'],1)
            self.assertEqual(report['missing_confirmed'],0)
            self.assertEqual(report['client_verified'],0)

    def test_full_pinned_index_avoids_false_unknowns(self):
        with tempfile.TemporaryDirectory() as t:
            d=Path(t)
            factory.put_json(d/'packs/lostcity-content-377.json',{'commit_sha':PIN,'candidates':[]})
            factory.put_json(d/'pinned-377-index.json',
                {'commit':PIN,'complete':True,'paths':{'scripts/a.rs2':SHA}})
            factory.put_json(d/'packs/older.json',{'candidates':[
                {'id':'a','source':'older','path':'scripts/other.rs2','blob_sha':'b'*40}]})
            report=match.match_all(d)
            self.assertTrue(report['baseline_complete'])
            self.assertEqual(report['counts']['unmapped_reference'],1)
            self.assertEqual(report['missing_confirmed'],0)

    def test_mutable_branch_masquerading_as_pin_rejected(self):
        with self.assertRaises(ValueError):
            match.baseline_map({'commit_sha':'b'*40,'candidates':[]},PIN)

    def test_no_baseline_blocks(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual('blocked_no_pinned_inventory',match.match_all(Path(t))['status'])

    def test_native_dialogue_graph_reachable_exit(self):
        doc={'schema':'joshrs-377-original-dialogue-v1','entries':[
            {'key':'original_guide','id377':None,'origin':'original_user_authored',
             'status':'research_proposal_not_installable','nodes':[
              {'id':'start','text':'There are paths beyond the timberline.','next':['help','exit']},
              {'id':'help','text':'A compass makes the journey easier.','next':['exit']},
              {'id':'exit','text':'Travel carefully.','exit':True}]}]}
        self.assertEqual([],match.dialogue_health(doc))

    def test_generic_and_dangling_dialogue_rejected(self):
        doc={'schema':'joshrs-377-original-dialogue-v1','entries':[
            {'key':'generic_npc','id377':None,'origin':'original_user_authored',
             'status':'research_proposal_not_installable','nodes':[
               {'id':'start','text':'Hello adventurer','next':['missing']},
               {'id':'exit','text':'Farewell.','exit':True}]}]}
        issues=match.dialogue_health(doc)
        self.assertTrue(any('universal greeting' in e for e in issues))
        self.assertTrue(any('dangling branch' in e for e in issues))
        self.assertTrue(any('unreachable' in e for e in issues))

    def test_factory_pins_exact_content_commit(self):
        calls=[]
        def gh(path):
            calls.append(path)
            return {'sha':PIN} if '/commits/' in path else {
                'sha':SHA,'tree':[{'type':'blob','path':'scripts/areas/a.rs2','sha':'b'*40}]}
        with tempfile.TemporaryDirectory() as t, patch.object(factory,'gh',side_effect=gh):
            factory.scan([{'key':'lostcity-content-377','repo':'LostCityRS/Content',
                           'ref':'377-wip','era':'377','policy':'review_only'}],Path(t),2,False)
        self.assertFalse(any('377-wip' in u for u in calls))
        self.assertTrue(any(PIN in u for u in calls))

    def test_pinned_index_file_is_saved(self):
        def gh(path):
            return {'sha':PIN} if '/commits/' in path else {
                'sha':SHA,'tree':[{'type':'blob','path':'scripts/areas/a.rs2','sha':'b'*40}]}
        with tempfile.TemporaryDirectory() as t, patch.object(factory,'gh',side_effect=gh):
            dest=Path(t)
            factory.scan([{'key':'lostcity-content-377','repo':'LostCityRS/Content',
                           'ref':'377-wip','era':'377','policy':'review_only'}],dest,2,False)
            idx=json.loads((dest/'pinned-377-index.json').read_text())
            self.assertEqual(idx['commit'],PIN)
            self.assertTrue(idx['complete'])
            self.assertEqual(idx['paths']['scripts/areas/a.rs2'],'b'*40)


if __name__=='__main__':
    unittest.main()
