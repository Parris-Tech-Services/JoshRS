#!/usr/bin/env python3
"""Offline regression tests for the Fedora rev377 facing-target repair."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("guard_facing_indices.py")
spec = importlib.util.spec_from_file_location("guard_facing_indices", SCRIPT)
doctor = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(doctor)

EXAMPLE = """class Client {
    public void updateFacingDirection(ClientEntity arg1) {
        if (arg1.field1156 != -1 && arg1.field1156 < 32768) {
            ClientNpc var3 = this.npcs[arg1.field1156];
            if (var3 != null) { }
        }
        if (arg1.field1156 >= 32768) {
            int var6 = arg1.field1156 - 32768;
            if (this.localPid == var6) {
                var6 = this.LOCAL_PLAYER_INDEX;
            }
            ClientPlayer var7 = this.players[var6];
            if (var7 != null) { }
        }
    }
    @ObfuscatedName("next")
    public void next() { }
}
"""


class FacingGuardTest(unittest.TestCase):
    def test_patches_only_target_method(self):
        source = EXAMPLE + "\n" + doctor.NPC_OLD + "\n"
        patched, status = doctor.patch_source(source)
        self.assertEqual(status, "PATCH_AVAILABLE")
        self.assertIn(doctor.NPC_NEW, patched)
        self.assertIn(doctor.PLAYER_NEW, patched)
        self.assertEqual(patched.count(doctor.NPC_OLD), 1)  # outside method
        self.assertNotIn("this.npcs[32767]", patched)
        self.assertIn("var6 >= 0 && var6 < this.players.length", patched)

    def test_patched_source_idempotent(self):
        patched, _ = doctor.patch_source(EXAMPLE)
        second, status = doctor.patch_source(patched)
        self.assertEqual(status, "ALREADY_GUARDED")
        self.assertEqual(second, patched)

    def test_modified_source_fails_closed(self):
        for broken in (
            EXAMPLE.replace(doctor.NPC_OLD, "ClientNpc var3 = customNpcLookup();"),
            EXAMPLE.replace(doctor.PLAYER_OLD, "ClientPlayer var7 = customPlayerLookup();"),
            EXAMPLE.replace("updateFacingDirection", "updateOtherDirection"),
            EXAMPLE.replace('    @ObfuscatedName("next")', ""),
        ):
            with self.subTest(broken=broken[-130:]):
                with self.assertRaises(doctor.UnexpectedSource):
                    doctor.patch_source(broken)

    def test_backup_and_atomic_patch(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "Client.java"
            source.write_text(EXAMPLE)
            with patch.object(doctor, "client_unit_running", return_value=False):
                backup, status = doctor.apply_patch(source)
            self.assertEqual(status, "PATCH_APPLIED")
            self.assertEqual(backup.read_text(), EXAMPLE)
            self.assertEqual(doctor.patch_source(source.read_text())[1], "ALREADY_GUARDED")
            self.assertTrue(backup.is_file())

    def test_refuses_active_client_without_touching_files(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "Client.java"
            source.write_text(EXAMPLE)
            with patch.object(doctor, "client_unit_running", return_value=True):
                with self.assertRaisesRegex(RuntimeError, "active"):
                    doctor.apply_patch(source)
            self.assertEqual(source.read_text(), EXAMPLE)
            self.assertFalse((source.parent / ".joshrs-facing-backups").exists())

    def test_unrelated_file_unmodified(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "Client.java"
            unrelated = Path(folder) / "elrothiro.sav"
            unrelated.write_bytes(b"private player save fixture")
            source.write_text(EXAMPLE)
            with patch.object(doctor, "client_unit_running", return_value=False):
                doctor.apply_patch(source)
            self.assertEqual(unrelated.read_bytes(), b"private player save fixture")


if __name__ == "__main__":
    unittest.main()
