"""Read-only JoshRS candidate promotion safety tests; no live content or network."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('harvest_evidence', ROOT / 'harvest_evidence.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
LEDGER = Path(__file__).resolve().parents[2] / 'research/rs377/harvest/VARROCK_NPC_SOURCE_TRACE_2026-10-31.json'


class HarvestEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.doc = json.loads(LEDGER.read_text(encoding='utf-8'))

    def test_source_traces_are_valid_but_not_playable(self):
        self.assertEqual([], mod.validate(self.doc))
        self.assertTrue(all(c['stage'] == 'source_traced' for c in self.doc['candidates']))
        self.assertTrue(all(c['checks']['client'] == 'not_run' for c in self.doc['candidates']))

    def test_duplicate_entity_id_rejected(self):
        self.doc['candidates'][0]['target']['id377'] = 647
        self.doc['candidates'][1]['target']['id377'] = 647
        self.assertTrue(any('duplicated' in e for e in mod.validate(self.doc)))

    def test_unverified_gap_cannot_advance(self):
        self.doc['candidates'][0]['stage'] = 'gap_confirmed'
        self.assertTrue(any('gap promotion' in e for e in mod.validate(self.doc)))

    def test_invented_compiler_and_client_pass_cannot_promote(self):
        self.doc['candidates'][0]['stage'] = 'persistent_playable'
        self.doc['candidates'][0]['checks'].update(static='pass', compiler='pass', client='pass', persistence='pass')
        self.assertTrue(any('gap promotion' in e for e in mod.validate(self.doc)))

    def test_private_drive_links_refused(self):
        self.doc['candidates'][0]['source']['url'] = 'https://drive.google.com/private'
        self.assertTrue(mod.validate(self.doc))

    def test_duplicate_candidate_key_rejected(self):
        self.doc['candidates'][1]['key'] = self.doc['candidates'][0]['key']
        self.assertTrue(any('duplicated' in e for e in mod.validate(self.doc)))

    def test_unsupported_modern_entity_type_rejected(self):
        self.doc['candidates'][0]['target']['entity_type'] = 'osrs_npc'
        self.assertTrue(any('revision/entity' in e for e in mod.validate(self.doc)))


if __name__ == '__main__':
    unittest.main()
