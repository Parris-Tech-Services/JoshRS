import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from candidate_review import assess, build_ledger, LICENSE_EVIDENCE


class CandidateEvidenceTests(unittest.TestCase):
    def row(self, **k):
        return {**{'id':'candidate-1','source':'lostcity-content-225','repo':'LostCityRS/Content',
                   'path':'scripts/area/quest.rs2','blob_sha':'abc','source_commit_sha':'1'*40,
                   'url':'https://github.com/LostCityRS/Content/blob/225/scripts/area/quest.rs2',
                   'status':'manual_port_required'},**k}

    def test_license_cannot_automatically_clear_game_dialogue_or_assets(self):
        a=assess(self.row())
        self.assertEqual(a['repository_software_license'],'MIT')
        self.assertTrue(a['repository_license_evidence'].endswith('/LICENSE'))
        self.assertFalse(a['source_code_reviewed_individually'])
        self.assertFalse(a['game_content_rights_approved'])
        self.assertFalse(a['external_assets_approved'])
        self.assertFalse(a['native_377_compiled_as_new_feature'])
        self.assertFalse(a['npc_or_player_interaction_tested'])
        self.assertFalse(a['elrothiro_save_tested'])
        self.assertEqual(a['decision'],'requires_individual_code_and_game_rights_review')

    def test_pinned_script_is_not_marked_newly_playable(self):
        x=assess(self.row(status='already_in_pinned_source'))
        self.assertEqual(x['decision'],'already_present_no_port_required')
        self.assertTrue(x['compatible_with_pinned_377'])
        self.assertFalse(x['native_377_compiled_as_new_feature'])
        self.assertFalse(x['npc_or_player_interaction_tested'])

    def test_gpl_reference_only_not_redistributed(self):
        x=assess(self.row(repo='2006-Scape/2006Scape',status='blocked_reference_only'))
        self.assertEqual(x['repository_software_license'],'GPL-3.0')
        self.assertEqual(x['decision'],'blocked_reference_only')
        self.assertFalse(x['game_content_rights_approved'])

    def test_invalid_metadata_fails_closed(self):
        with self.assertRaises(ValueError):assess(self.row(blob_sha=''))
        with self.assertRaises(ValueError):assess(self.row(status='approved'))

    def test_all_records_are_covered_once_and_stable(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)
            (root/'one.json').write_text(json.dumps({'candidates':[
                self.row(id='old',status='manual_port_required'),
                self.row(id='old2',status='manual_port_required',path='scripts/area/other.rs2',blob_sha='def')]}))
            (root/'two.json').write_text(json.dumps({'candidates':[
                self.row(id='new',status='already_in_pinned_source')]}))
            x=build_ledger(root)
            self.assertEqual(2,x['total_unique_source_files'])
            self.assertEqual(0,x['total_approved_third_party_source_ports'])
            self.assertEqual(0,x['total_verified_live_gameplay_candidates'])
            self.assertEqual(len(x['reviews']),2)
            self.assertEqual(len(set(y['review_id'] for y in x['reviews'])),2)
            self.assertEqual(x,build_ledger(root))
            self.assertEqual(next(z for z in x['reviews'] if z['blob_sha']=='abc')['classification'],
                             'already_in_pinned_source')

if __name__=='__main__':unittest.main()
