import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gap_audit
import native377


class GapAuditTests(unittest.TestCase):
    def test_present_items_and_amulet_crafting_are_not_called_missing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'game'
            (source / 'pack').mkdir(parents=True)
            jewellery = source / 'scripts/skill_crafting/scripts/jewellery'
            jewellery.mkdir(parents=True)
            (source / 'pack/obj.pack').write_text(
                '561=naturerune\n563=lawrune\n1595=amulet_mould\n1755=chisel\n')
            (jewellery / 'jewellery.rs2').write_text(
                '[inv_button1,crafting_jewelry:amulets_inv]\n'
                'if (inv_total(inv, amulet_mould) > 0) {}\n')
            intake = Path(__file__).resolve().parents[1] / 'intake'
            out = root / 'native'
            native377.build_native(intake, out)
            result = gap_audit.inspect_pinned_content(source, out / 'manifest.json')
            self.assertEqual(len(result['already_present']), 5)
            self.assertFalse(result['new_feature_gap_verified'])
            self.assertFalse(result['custom_world_login_verified'])
            self.assertEqual(result['retired_count'], 7)
            self.assertEqual([item['object_id'] for item in result['already_present'][:4]],
                             [563, 561, 1595, 1755])
            (source / 'pack/obj.pack').write_text('1595=amulet_mould\n')
            with self.assertRaisesRegex(ValueError, 'Cannot confirm'):
                gap_audit.inspect_pinned_content(source, out / 'manifest.json')

    def test_published_vendor_manifest_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'pack').mkdir()
            (root / 'pack/obj.pack').write_text(
                '561=naturerune\n563=lawrune\n1595=amulet_mould\n1755=chisel\n')
            jewellery = root / 'scripts/skill_crafting/scripts/jewellery'
            jewellery.mkdir(parents=True)
            (jewellery / 'jewellery.rs2').write_text(
                '[inv_button1,crafting_jewelry:amulets_inv]\n'
                'if (inv_total(inv, amulet_mould) > 0) {}\n')
            old = root / 'legacy.json'
            old.write_text(json.dumps({'npc_names': ['joshrs_law_rune_vendor'],
                                       'gameplay_mechanics': ['joshrs_law_rune_vendor'],
                                       'retired_unrequested_merchant_keys': []}))
            with self.assertRaisesRegex(ValueError, 'retired'):
                gap_audit.inspect_pinned_content(root, old)


if __name__ == '__main__':
    unittest.main()
