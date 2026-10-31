"""All test evidence is synthetic; no user world, dialogue or saves are read."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

P = Path(__file__).resolve().parents[1] / 'verify_varrock_dispatch_evidence.py'
spec = importlib.util.spec_from_file_location('verify_varrock_dispatch_evidence', P)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SHA_A = 'a' * 64
SHA_B = 'b' * 64
SHA_C = 'c' * 64


def diagnostic():
    return {
        'schema': 'joshrs-377-dispatch-diagnostic-v1',
        'cases': [{'npc': key, 'expected_trigger': trigger, 'source_exists': True,
                   'source_sha256': SHA_C, 'source_trigger_present': True,
                   'generic_literal_detected': False} for key, trigger in mod.EXPECTED.items()],
        'packs': {'script_dat': {'present': True, 'sha256': SHA_A},
                  'script_idx': {'present': True, 'sha256': SHA_B}},
    }


def agent3(result='distinct_dialogue'):
    return {
        'schema': 'joshrs-377-agent3-dispatch-observation-v1',
        'evidence_method': 'agent3_read_only_loaded_pack_fingerprint',
        'client_revision': 377, 'disposable_test_account': True,
        'loaded_script_dat_sha256': SHA_A, 'loaded_script_idx_sha256': SHA_B,
        'observations': {key: {'result': result, 'click_reached_server': True,
                               'relog_checked': False} for key in mod.EXPECTED},
    }


class VarrockDispatchEvidenceTests(unittest.TestCase):
    def test_no_live_evidence_does_not_claim_playability(self):
        r = mod.verify(diagnostic())
        self.assertFalse(r['actual_java_client_verified_by_this_tool'])
        self.assertFalse(r['agent3_observations_supplied'])
        self.assertTrue(all(c['classification'] == 'awaiting_agent3_client_evidence' for c in r['cases']))

    def test_matching_fingerprints_and_reported_distinct_dialogue(self):
        r = mod.verify(diagnostic(), agent3())
        self.assertTrue(r['loaded_pack_sha256_matches_audited_files'])
        self.assertTrue(all(c['classification'] == 'agent3_reported_distinct_client_dialogue' for c in r['cases']))
        self.assertFalse(r['actual_java_client_verified_by_this_tool'])

    def test_stale_loaded_pack_precedes_fallback_diagnosis(self):
        evidence = agent3('generic_greeting')
        evidence['loaded_script_dat_sha256'] = SHA_C
        r = mod.verify(diagnostic(), evidence)
        self.assertTrue(all(c['classification'] == 'loaded_pack_mismatch_investigate_first' for c in r['cases']))

    def test_matching_pack_generic_greeting_suspects_dispatch(self):
        r = mod.verify(diagnostic(), agent3('generic_greeting'))
        self.assertTrue(all(c['classification'] == 'fallback_or_dispatch_suspected_not_proven' for c in r['cases']))

    def test_missing_source_trigger_precedes_client_claim(self):
        d = diagnostic()
        d['cases'][1]['source_trigger_present'] = False
        r = mod.verify(d, agent3())
        self.assertEqual(r['cases'][1]['classification'], 'expected_source_trigger_missing')

    def test_reject_duplicate_or_unexpected_npc(self):
        d = diagnostic()
        d['cases'][1] = dict(d['cases'][0])
        with self.assertRaises(ValueError):
            mod.verify(d)

    def test_reject_fabricated_sha_and_missing_pack(self):
        d = diagnostic()
        d['packs']['script_idx']['sha256'] = 'not-sha'
        with self.assertRaises(ValueError):
            mod.verify(d)

    def test_reject_non_disposable_live_account(self):
        e = agent3()
        e['disposable_test_account'] = False
        with self.assertRaises(ValueError):
            mod.verify(diagnostic(), e)

    def test_reject_claim_of_dialogue_without_click(self):
        e = agent3()
        e['observations']['romeo']['click_reached_server'] = False
        with self.assertRaises(ValueError):
            mod.verify(diagnostic(), e)

    def test_generic_literal_in_source_is_separate_from_runtime(self):
        d = diagnostic()
        d['cases'][0]['generic_literal_detected'] = True
        r = mod.verify(d)
        self.assertEqual(r['cases'][0]['classification'], 'generic_literal_in_source_review_required')

    def test_relog_report_only_when_pack_matches_and_dialogue(self):
        e = agent3()
        e['observations']['juliet']['relog_checked'] = True
        r = mod.verify(diagnostic(), e)
        self.assertTrue(r['cases'][1]['agent3_relog_reported'])
        self.assertFalse(r['cases'][0]['agent3_relog_reported'])

    def test_no_private_values_or_paths_in_output(self):
        d = diagnostic()
        d['private_source_path'] = '/private/user/character.sav'
        e = agent3()
        e['private_character'] = 'PRIVATE_CHARACTER_NAME'
        output = str(mod.verify(d, e))
        self.assertNotIn('PRIVATE_CHARACTER_NAME', output)
        self.assertNotIn('/private/user', output)
        self.assertNotIn(SHA_A, output)


if __name__ == '__main__':
    unittest.main()
