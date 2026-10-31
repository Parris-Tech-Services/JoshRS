import json
from pathlib import Path
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
try:
    import harvest_multi as harvest
except ModuleNotFoundError:
    # Isolated developer test without original factory checkout.
    import types
    fake=types.ModuleType('factory')
    fake.allowed_path=lambda p: not any(x in p.split('/') for x in ('models','maps','assets','cache','.github','binary')) and p.endswith(('.rs2','.npc','.loc','.json','.kt','.ts','.java'))
    sys.modules['factory']=fake
    import harvest_multi as harvest

SHA1='a'*40
SHA2='b'*40
SHA3='c'*40


class HarvestMultiTests(unittest.TestCase):
    def ghreader(self, url):
        if '/commits/' in url: return ({'sha':SHA1,'commit':{'tree':{'sha':SHA2}}}, {})
        return ({'truncated':False,'tree':[
            {'type':'blob','path':'scripts/areas/lumbridge/scripts/chat.rs2','sha':SHA3},
            {'type':'blob','path':'assets/models/1.dat','sha':SHA3},
            {'type':'blob','path':'maps/m44_51.jm2','sha':SHA3},
            {'type':'blob','path':'scripts/areas/varrock/configs/people.npc','sha':SHA2},
            {'type':'tree','path':'scripts/areas','sha':SHA2}]}, {})

    def test_github_metadata_only_and_exclusions(self):
        source={'key':'lostcity-content-377','repo':'LostCityRS/Content','ref':'377-wip','era':'377'}
        r=harvest.github(source, reader=self.ghreader)
        self.assertEqual(len(r['records']),3)
        self.assertTrue(r['complete_tree'])
        self.assertTrue(all(x['installed'] is False and x['rights_cleared'] is False and x['missing_in_active_game'] is None for x in r['records']))
        self.assertFalse(any('assets' in x['path'] for x in r['records']))
        self.assertTrue(any(x['path'].endswith('.jm2') for x in r['records']))
        self.assertFalse(harvest.allowed_metadata_path('maps/../secret.jm2'))
        self.assertFalse(harvest.allowed_metadata_path('maps/secret.dat'))

    def test_github_pagination_is_resumable(self):
        s={'key':'x','repo':'a/b','ref':'377','era':'377'}
        first=harvest.github(s,reader=self.ghreader,limit=1)
        second=harvest.github(s,{'revision':SHA1,'offset':first['next_offset']},reader=self.ghreader,limit=1)
        self.assertNotEqual(first['records'][0]['id'],second['records'][0]['id'])
        self.assertEqual(second['next_offset'],2)

    def test_reject_truncated_tree(self):
        def reader(u):
            if '/commits/' in u:return {'sha':SHA1,'commit':{'tree':{'sha':SHA2}}}
            return {'truncated':True,'tree':[]}
        with self.assertRaisesRegex(ValueError,'incomplete'):
            harvest.github({'key':'a','repo':'a/b','ref':'main','era':'377'}, reader=reader)

    def test_gitlab_two_page_cursor(self):
        seen=[]
        def reader(url):
            seen.append(url)
            if '/commits/' in url: return {'id':SHA1}
            if 'page_token=' not in url:
                return ([{'type':'blob','path':'scripts/npc/chat.rs2','id':SHA2}],
                        {'Link':'<https://gitlab.com/api/v4/projects/2009scape%2F2009scape/repository/tree?page_token=abc123>; rel="next"'})
            return ([{'type':'blob','path':'scripts/npc/second.rs2','id':SHA3}],{})
        s={'key':'2009scape-gitlab','repo':'2009scape/2009scape','ref':'master','era':'2009'}
        r1=harvest.gitlab(s,reader=reader,max_pages=1)
        self.assertEqual(r1['next_page_token'],'abc123')
        self.assertFalse(r1['complete_tree'])
        r2=harvest.gitlab(s,state={'revision':SHA1,'page_token':'abc123',
                                   'first_page_seen':True},reader=reader)
        self.assertIsNone(r2['next_page_token'])
        self.assertTrue(r2['complete_tree'])
        self.assertIn('pagination=keyset',seen[1])
        self.assertNotIn('&page=',seen[-1])

    def test_gitlab_rejects_unsafe_next_page_link(self):
        with self.assertRaisesRegex(ValueError,'unsafe'):
            harvest._gitlab_next_token({'Link':'<https://evil.invalid/repository/tree?page_token=secret>; rel="next"'})

    def test_gitlab_rejects_unproven_full_page(self):
        s={'key':'2009scape-gitlab','repo':'2009scape/2009scape','ref':'master','era':'2009'}
        def reader(url):
            if '/commits/' in url:return {'id':SHA1}
            return ([{'type':'blob','path':f'scripts/npc/{i}.rs2','id':SHA2} for i in range(100)],{})
        with self.assertRaisesRegex(ValueError,'continuation proof'):
            harvest.gitlab(s,reader=reader,max_pages=1)


    def test_huggingface_and_openrs2_metadata_only(self):
        data={'sha':SHA1,'siblings':[{'rfilename':'README.md'},{'rfilename':'data/data.db'},{'rfilename':'assets/tree.png'},{'rfilename':'data/npc.json'}]}
        s={'key':'2009scape-hf','repo':'arsalan-anwari/2009scape-wiki-api-data','era':'2009'}
        hf=harvest.huggingface(s,reader=lambda u:data)
        self.assertEqual([r['path'] for r in hf['records']],['data/npc.json'])
        self.assertFalse(hf['downloaded_data'])
        o=harvest.openrs2({'key':'openrs2-377'},reader=lambda u:[{'id':2696,'game':'runescape','builds':[{'major':377}], 'valid_groups':23, 'groups':24}])
        self.assertEqual(o['cache_metadata']['valid_groups'],23)
        self.assertFalse(o['downloaded_cache'])
        with self.assertRaisesRegex(ValueError,'not identified'):
            harvest.openrs2({'key':'openrs2-377'},reader=lambda u:[{'id':2696,'game':'runescape','builds':[{'major':530}]}])

    def test_private_drive_manifest_never_releases_paths_or_ids(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'private.json'
            p.write_text(json.dumps({'schema':1,'files':[{'kind':'script','path':'private-user-name/secret.rs2','id':'SECRET-123'},{'kind':'map-source','id':'secret-map'}]}))
            result=harvest.drive_manifest(p)
            self.assertEqual(result['counts'],{'script':1,'map-source':1})
            self.assertNotIn('SECRET-123',json.dumps(result))
            self.assertNotIn('private-user-name',json.dumps(result))
            self.assertEqual(result['records'],[])

    def test_fail_closed_preserves_outputs(self):
        s={'key':'x','repo':'a/b','ref':'main','era':'377'}
        with tempfile.TemporaryDirectory() as t:
            p=Path(t); (p/'state.json').write_text('{"original":true}')
            with self.assertRaises(RuntimeError):
                harvest.run([s],p,['x'],reader=lambda u: (_ for _ in ()).throw(ValueError('offline')))
            self.assertEqual(json.loads((p/'state.json').read_text()),{'original':True})
            self.assertFalse((p/'catalog.json').exists())

    def test_catalogue_accumulates_across_increments_and_preserves_on_partial_failure(self):
        s={'key':'lostcity-content-377','repo':'LostCityRS/Content','ref':'377-wip','era':'377'}
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)
            harvest.run([s],p,['lostcity-content-377'],reader=self.ghreader)
            a=json.loads((p/'catalog.json').read_text())['sources'][0]['records']
            self.assertEqual(len(a),3)
            harvest.run([s],p,['openrs2-377'],reader=lambda u:[{'id':2696,'game':'runescape','builds':[{'major':377}]}])
            after=json.loads((p/'catalog.json').read_text())['sources']
            self.assertEqual(set(x['source'] for x in after),{'lostcity-content-377','openrs2-377'})
            self.assertEqual(len([x for x in after if x['source']=='lostcity-content-377'][0]['records']),3)

    def test_success_writes_and_continues_state(self):
        s={'key':'lostcity-content-377','repo':'LostCityRS/Content','ref':'377-wip','era':'377'}
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)
            r=harvest.run([s],p,['lostcity-content-377'],reader=self.ghreader)
            self.assertEqual(r['candidate_records'],3)
            self.assertEqual(r['installed_content'],0)
            obj=json.loads((p/'catalog.json').read_text())
            self.assertFalse(obj['gameplay_verified'])
            self.assertEqual(obj['sources'][0]['records'][0]['source_revision'],SHA1)
            self.assertEqual(json.loads((p/'state.json').read_text())['lostcity-content-377']['offset'],0)


if __name__=='__main__':unittest.main()