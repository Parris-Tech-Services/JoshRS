"""Synthetic read-only NPC dispatch audit tests; never reads personal world."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit_dispatch', BASE/'audit_dispatch.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DispatchAuditTests(unittest.TestCase):
    def test_exact_three_source_triggers_and_pack_fingerprints(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for key, relative, trigger in module.VARROCK:
                file = root/relative
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text('[' + trigger + ']\nreturn;\n')
            dat = root/'script.dat'
            idx = root/'script.idx'
            dat.write_bytes(b'fake-disposable-only')
            idx.write_bytes(b'test')
            result = module.audit(root, dat, idx)
            self.assertTrue(all(r['source_trigger_present'] for r in result['cases']))
            self.assertTrue(result['packs']['script_dat']['sha256'])
            self.assertFalse(result['live_process_fingerprinted'])
            self.assertEqual('not_run', result['java_client_test'])
            self.assertNotIn(str(root), str(result))

    def test_missing_trigger_never_claims_live_dispatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = module.audit(Path(tmp))
            self.assertTrue(all(not x['source_exists'] for x in result['cases']))
            self.assertTrue(all(x['live_routing_verified'] is False for x in result['cases']))

    def test_repeated_fallback_diagnostic_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key, relative, trigger = module.VARROCK[0]
            file = root/relative
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(f'[{trigger}]\n~chatnpc("Hello adventurer");\n')
            report = module.audit(root)
            self.assertTrue(report['cases'][0]['generic_literal_detected'])
            self.assertFalse(report['cases'][0]['live_routing_verified'])


if __name__ == '__main__':
    unittest.main()
