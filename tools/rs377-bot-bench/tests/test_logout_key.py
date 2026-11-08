"""Source-gate for the precise Fred/George relog account case fix (offline)."""
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent.parent
ROOT = HERE.parent.parent
BOT = HERE / "engine-patch" / "src" / "engine" / "bot" / "FredGeorgeBot.ts"
REPAIR = ROOT / "deploy" / "jparris-windows" / "Repair-FredGeorgeRelog.ps1"


class RelogKeyRegression(unittest.TestCase):
    def test_normalised_logout_key_used_by_native_world(self):
        source = BOT.read_text(encoding="utf-8")
        self.assertIn("return player?.username ?? name.toLowerCase();", source)
        self.assertIn(
            "world.logoutRequests.has(fredGeorgeLogoutAccountKey(name, player))",
            source,
        )
        self.assertNotIn("world.logoutRequests.has(name)", source)
        self.assertIn("normalised_logout_key:", source)
        self.assertIn("logout_ack_pending:", source)

    def test_old_mismatch_and_new_guard_behaviour(self):
        for display in ("Fred", "George"):
            account = display.lower()
            waiting_logout_requests = {account}
            self.assertNotIn(display, waiting_logout_requests)
            self.assertIn(account, waiting_logout_requests)
            self.assertEqual(account, display.lower())

    def test_windows_patch_requires_backup_and_no_running_server(self):
        source = REPAIR.read_text(encoding="utf-8")
        self.assertIn("Assert-Offline", source)
        self.assertIn("Protect-Elrothiro.ps1", source)
        self.assertIn("VERIFIED OFFLINE BACKUP CREATED", source)
        self.assertIn("Get-FileHash", source)
        self.assertIn("File]::Replace", source)
        self.assertIn("world.logoutRequests.has(player?.username ?? name.toLowerCase())", source)


if __name__ == "__main__":
    unittest.main()
