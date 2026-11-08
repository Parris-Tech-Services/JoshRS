"""Regression tests for one-time disposable HarnessView1 spawn fix. No game save used."""
import struct
import unittest
import zlib

from prepare_lumbridge import patched_save, inspect_save, encode_varint


def fixture(varps=(), pos=(3094, 3106, 0)):
    sav = bytearray(struct.pack(">HHHHB", 0x2004, 7, *pos))
    sav += bytes(7 + 5 + 1)
    sav += struct.pack(">HI", 10000, 0)
    sav += bytes(21 * 5)
    sav += struct.pack(">H", len(varps))
    for varp, value in varps:
        sav += struct.pack(">H", varp) + encode_varint(value)
    sav += bytes([0, 0, 0, 0, 0]) + bytes(8) + bytes(1)
    sav += struct.pack(">I", zlib.crc32(sav))
    return bytes(sav)


class BotLumbridgeFixtureTests(unittest.TestCase):
    def test_fresh_bot_save_and_idempotence(self):
        original = fixture()
        patched = patched_save(original)
        record = inspect_save(patched)
        self.assertEqual((record["x"], record["z"], record["level"], record["tutorial"]),
                         (3233, 3218, 0, 1000))
        self.assertEqual(inspect_save(original)["tutorial"], 0)
        self.assertEqual(patched, patched_save(patched))

    def test_insert_varp_in_order_preserves_other_values(self):
        result = patched_save(fixture([(18, 2), (406, 12)]))
        self.assertEqual(inspect_save(result)["varp_count"], 3)
        self.assertIn(struct.pack(">H", 281) + encode_varint(1000) +
                      struct.pack(">H", 406), result)
        self.assertEqual(result, patched_save(result))

    def test_existing_tutorial_varp(self):
        result = patched_save(fixture([(281, 0)]))
        self.assertEqual(inspect_save(result)["tutorial"], 1000)
        self.assertEqual(inspect_save(result)["varp_count"], 1)

    def test_reject_non_spawning_account(self):
        with self.assertRaisesRegex(ValueError, "not at original"):
            patched_save(fixture(pos=(3096, 3106, 0)))

    def test_reject_started_tutorial(self):
        with self.assertRaisesRegex(ValueError, "started tutorial"):
            patched_save(fixture([(281, 10)]))

    def test_explicit_progressed_tutorial_preserves_other_data_and_crc(self):
        original = fixture([(18, 2), (281, 25), (406, 12)])
        updated = patched_save(original, allow_progressed_tutorial=True)
        record = inspect_save(updated)
        self.assertEqual(
            (record["x"], record["z"], record["level"], record["tutorial"]),
            (3233, 3218, 0, 1000),
        )
        self.assertEqual(record["varp_count"], 3)
        self.assertIn(struct.pack(">H", 18) + encode_varint(2), updated)
        self.assertIn(struct.pack(">H", 406) + encode_varint(12), updated)
        self.assertEqual(inspect_save(original)["tutorial"], 25)
        self.assertEqual(updated, patched_save(updated))

    def test_progressed_tutorial_requires_explicit_opt_in(self):
        original = fixture([(281, 1)])
        with self.assertRaisesRegex(ValueError, "explicit --allow-progressed-tutorial"):
            patched_save(original)
        self.assertEqual(original, bytes(original))

    def test_refuse_completed_flag_on_tutorial_island_even_with_opt_in(self):
        for stage in (1000, 1001):
            with self.subTest(stage=stage):
                with self.assertRaisesRegex(ValueError, "unexpected completed"):
                    patched_save(
                        fixture([(281, stage)]), allow_progressed_tutorial=True
                    )

    def test_progressed_fixture_still_blocks_wrong_location(self):
        with self.assertRaisesRegex(ValueError, "not at original"):
            patched_save(
                fixture([(281, 25)], pos=(3222, 3218, 0)),
                allow_progressed_tutorial=True,
            )

    def test_explicit_opt_in_does_not_override_corrupted_checksum(self):
        original = bytearray(fixture([(281, 25)]))
        original[-8] ^= 1
        with self.assertRaisesRegex(ValueError, "CRC32"):
            patched_save(bytes(original), allow_progressed_tutorial=True)

    def test_reject_invalid_checksum(self):
        data = bytearray(fixture())
        data[30] = 99
        with self.assertRaisesRegex(ValueError, "CRC32"):
            patched_save(bytes(data))

    def test_reject_wrong_save_version(self):
        data = bytearray(fixture())
        data[3] = 6
        with self.assertRaisesRegex(ValueError, "version"):
            patched_save(bytes(data))

    def test_reject_duplicate_or_unsorted_varps(self):
        with self.assertRaisesRegex(ValueError, "increasing"):
            patched_save(fixture([(281, 0), (18, 2)]))


if __name__ == "__main__":
    unittest.main()
