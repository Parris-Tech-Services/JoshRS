"""Tests for intentionally unplayable rev377 quest/map QA source ledgers."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("validate_qa_ledgers",ROOT/"validate_qa_ledgers.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
DATA=ROOT.parent/"research/rs377/harvest"


class QuestAndMapLedgerTests(unittest.TestCase):
    def setUp(self):
        self.quest=json.loads((DATA/"VARROCK_QUEST_STAGE_QA_2026-10-31.json").read_text())
        self.maps=json.loads((DATA/"MAP_CANDIDATE_QUARANTINE_2026-10-31.json").read_text())

    def test_pinned_quest_trace_is_valid_not_player_complete(self):
        self.assertEqual([],m.validate_quest(self.quest))
        self.assertFalse(self.quest['completion_verified'])
        self.assertEqual('not_run',self.quest['persistence'])

    def test_quest_source_stage_not_live_pass(self):
        self.quest['transitions'][0]['test_result']='pass'
        self.assertTrue(any('cannot declare completed tests' in x for x in m.validate_quest(self.quest)))

    def test_quest_unknown_actor_must_not_be_invented(self):
        self.quest['transitions'][3]['actor']='Unknown Guess'
        self.assertTrue(any('invent' in x for x in m.validate_quest(self.quest)))

    def test_quest_duplicate_stage_or_transition_fails(self):
        self.quest['stages'].append(copy.deepcopy(self.quest['stages'][0]))
        self.assertTrue(any('duplicate' in x for x in m.validate_quest(self.quest)))

    def test_maps_quarantined(self):
        self.assertEqual([],m.validate_maps(self.maps))
        self.assertEqual([256,266],[x['unsupported_location_instances'] for x in self.maps['candidates']])
        self.assertFalse(any(x['installable'] for x in self.maps['candidates']))

    def test_map_candidate_cannot_be_approved_with_unsupported_ids(self):
        self.maps['candidates'][0]['installable']=True
        self.assertTrue(m.validate_maps(self.maps))

    def test_map_runtime_pack_not_guessed(self):
        self.maps['candidates'][1]['matching_runtime_pack_verified']=True
        self.assertTrue(any('active pack' in x for x in m.validate_maps(self.maps)))

if __name__=='__main__':
    unittest.main()
