"""Synthetic source identity checks: no real game assets or player files."""
import importlib.util
from pathlib import Path
import json
import subprocess
import tempfile
import unittest

BASE = Path(__file__).resolve().parents[1]

def load(name):
    spec = importlib.util.spec_from_file_location(name, BASE / (name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

audit_mod = load('audit_dispatch')
verify_mod = load('verify_varrock_dispatch_evidence')


def audit_fixture(root):
    for key, rel, trigger in audit_mod.VARROCK:
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(('[' + trigger + ']\\nreturn;\\n').encode())
    dat, idx = root / 'script.dat', root / 'script.idx'
    dat.write_bytes(b'disposable script pack test')
    idx.write_bytes(b'disposable script index test')
    return audit_mod.audit(root, dat, idx)


class SourcePinTests(unittest.TestCase):
    def test_git_object_hash_matches_git_hash_object(self):
        sample = b'original-test-bytes\\n'
        proc = subprocess.run(['git', 'hash-object', '--stdin'], input=sample,
                              capture_output=True, check=True)
        self.assertEqual(audit_mod.git_blob_sha1(sample), proc.stdout.decode().strip())

    def test_all_three_pinned_blobs_are_from_canonical_trace(self):
        self.assertEqual(audit_mod.PINNED_BLOBS, verify_mod.PINNED_BLOBS)
        self.assertEqual(len(audit_mod.PINNED_BLOBS), 3)
        self.assertEqual(len(set(audit_mod.PINNED_BLOBS.values())), 3)

    def test_modified_checkout_is_flagged_before_runtime_fallback(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            self.assertTrue(all(c['source_trigger_present'] for c in report['cases']))
            self.assertTrue(all(c['source_matches_pinned_377'] is False for c in report['cases']))
            result = verify_mod.verify(report)
            self.assertEqual([x['classification'] for x in result['cases']],
                             ['source_differs_from_pinned_377_review_customizations'] * 3)
            self.assertFalse(result['all_three_audited_source_blobs_match_pinned_377'])
            self.assertFalse(result['actual_java_client_verified_by_this_tool'])
            self.assertNotIn(str(d), json.dumps(result))

    def test_missing_source_cannot_claim_pinned_match(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_mod.audit(Path(d))
            self.assertTrue(all(c['source_git_blob_sha1'] is None for c in report['cases']))
            self.assertEqual(verify_mod.verify(report)['cases'][0]['classification'],
                             'source_absent_in_audited_checkout')
            report['cases'][0]['source_matches_pinned_377'] = True
            with self.assertRaisesRegex(ValueError, 'missing source'):
                verify_mod.verify(report)

    def test_reject_false_claim_of_exact_pin(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            report['cases'][0]['source_matches_pinned_377'] = True
            with self.assertRaisesRegex(ValueError, 'contradictory'):
                verify_mod.verify(report)

    def test_reject_substituted_expected_blob(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            report['cases'][1]['pinned_source_blob_sha1_expected'] = 'a' * 40
            with self.assertRaisesRegex(ValueError, 'unexpected pinned'):
                verify_mod.verify(report)

    def test_reject_partial_source_identity_evidence(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            del report['cases'][2]['source_git_blob_sha1']
            with self.assertRaisesRegex(ValueError, 'incomplete pinned'):
                verify_mod.verify(report)

    def test_legacy_reports_remain_unverified_not_implicitly_pinned(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            for case in report['cases']:
                for k in ('source_git_blob_sha1', 'source_matches_pinned_377',
                          'pinned_source_blob_sha1_expected'):
                    del case[k]
            result = verify_mod.verify(report)
            self.assertTrue(all(c['audited_source_matches_pinned_377'] is None
                                for c in result['cases']))
            self.assertFalse(result['all_three_audited_source_blobs_match_pinned_377'])
            self.assertTrue(all(c['classification'] == 'awaiting_agent3_client_evidence'
                                for c in result['cases']))

    def test_valid_schema_pinned_match_is_still_not_client_verification(self):
        with tempfile.TemporaryDirectory() as d:
            report = audit_fixture(Path(d))
            for c in report['cases']:
                c['source_git_blob_sha1'] = audit_mod.PINNED_BLOBS[c['npc']]
                c['source_matches_pinned_377'] = True
            result = verify_mod.verify(report)
            self.assertTrue(result['all_three_audited_source_blobs_match_pinned_377'])
            self.assertFalse(result['actual_java_client_verified_by_this_tool'])
            self.assertTrue(all(c['classification'] == 'awaiting_agent3_client_evidence'
                                for c in result['cases']))

if __name__ == '__main__':
    unittest.main()
