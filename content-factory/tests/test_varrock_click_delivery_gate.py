"""Synthetic evidence-only tests: no game content, accounts or runtime access."""
from __future__ import annotations
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'verify_varrock_dispatch_evidence.py'
spec = importlib.util.spec_from_file_location('verify_varrock_click_gate', MODULE)
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


def audit_fixture(*, pack=True):
    cases = []
    for npc, trigger in verify.EXPECTED.items():
        case = {'npc': npc, 'expected_trigger': trigger, 'source_exists': True,
                'source_sha256': 'a'*64, 'source_trigger_present': True,
                'generic_literal_detected': False}
        if hasattr(verify, 'PINNED_BLOBS'):
            case.update(pinned_source_blob_sha1_expected=verify.PINNED_BLOBS[npc],
                        source_git_blob_sha1=verify.PINNED_BLOBS[npc],
                        source_matches_pinned_377=True)
        cases.append(case)
    return {'schema': 'joshrs-377-dispatch-diagnostic-v1', 'cases': cases,
            'packs': {'script_dat': {'present': pack, 'sha256': 'b'*64 if pack else None},
                      'script_idx': {'present': pack, 'sha256': 'c'*64 if pack else None}}}


def live_fixture(result, click, *, mismatch=False):
    return {'schema': 'joshrs-377-agent3-dispatch-observation-v1',
            'evidence_method': 'agent3_read_only_loaded_pack_fingerprint',
            'client_revision': 377, 'disposable_test_account': True,
            'loaded_script_dat_sha256': ('d' if mismatch else 'b')*64,
            'loaded_script_idx_sha256': 'c'*64,
            'observations': {npc: {'result': result, 'click_reached_server': click,
                                   'relog_checked': False} for npc in verify.EXPECTED}}


class VarrockClickDeliveryGate(unittest.TestCase):
    def classification(self, result, click, **kwargs):
        a = audit_fixture(pack=not kwargs.get('missing_pack', False))
        return verify.verify(a, live_fixture(result, click, mismatch=kwargs.get('mismatch', False)))

    def test_unconfirmed_greeting_never_blames_server_fallback(self):
        report = self.classification('generic_greeting', False)
        self.assertEqual({r['classification'] for r in report['cases']},
                         {'server_click_unconfirmed_trace_transport_before_dialogue'})
        self.assertFalse(report['actual_java_client_verified_by_this_tool'])

    def test_confirmed_greeting_still_requests_fallback_trace(self):
        report = self.classification('generic_greeting', True)
        self.assertEqual(report['cases'][0]['classification'], 'fallback_or_dispatch_suspected_not_proven')

    def test_no_action_without_server_packet_is_delivery_unknown(self):
        self.assertEqual(self.classification('no_action', False)['cases'][0]['classification'],
                         'server_click_unconfirmed_trace_transport_before_dialogue')

    def test_no_action_with_packet_keeps_original_diagnosis(self):
        self.assertEqual(self.classification('no_action', True)['cases'][0]['classification'],
                         'agent3_reported_no_action')

    def test_crash_without_server_packet_does_not_implicate_handler(self):
        self.assertEqual(self.classification('crash', False)['cases'][0]['classification'],
                         'server_click_unconfirmed_trace_transport_before_dialogue')

    def test_crash_with_packet_keeps_original_diagnosis(self):
        self.assertEqual(self.classification('crash', True)['cases'][0]['classification'],
                         'agent3_reported_client_error')

    def test_distinct_dialogue_without_server_click_rejected(self):
        with self.assertRaisesRegex(ValueError, 'without observed click'):
            self.classification('distinct_dialogue', False)

    def test_distinct_dialogue_with_server_click_is_reported_not_proven(self):
        report = self.classification('distinct_dialogue', True)
        self.assertEqual(report['cases'][0]['classification'], 'agent3_reported_distinct_client_dialogue')
        self.assertFalse(report['actual_java_client_verified_by_this_tool'])

    def test_unverified_click_stays_unverified(self):
        self.assertEqual(self.classification('unverified', False)['cases'][0]['classification'],
                         'awaiting_specific_client_observation')

    def test_pack_mismatch_precedes_packet_diagnosis(self):
        self.assertEqual(self.classification('generic_greeting', False, mismatch=True)['cases'][0]['classification'],
                         'loaded_pack_mismatch_investigate_first')

    def test_missing_pack_precedes_packet_diagnosis(self):
        self.assertEqual(self.classification('generic_greeting', False, missing_pack=True)['cases'][0]['classification'],
                         'pack_fingerprint_missing')

    def test_no_live_evidence_is_not_playable(self):
        report = verify.verify(audit_fixture())
        self.assertEqual(report['cases'][0]['classification'], 'awaiting_agent3_client_evidence')
        self.assertFalse(report['actual_java_client_verified_by_this_tool'])


if __name__ == '__main__':
    unittest.main()
