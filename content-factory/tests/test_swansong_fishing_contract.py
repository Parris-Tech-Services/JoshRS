"""Source-level regression checks for the 377 Swan Song food stage.

The disposable RuneScript build checks actual compatibility separately; these tests
are not a substitute for gameplay or 377 client interaction verification.
"""
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
QUEST = ROOT / "content-patches/rs377/scripts/quests/quest_swansong"
MAIN = (QUEST / "scripts/quest_swansong.rs2").read_text(encoding="utf-8")
FISHING = (QUEST / "scripts/swan_fresh_monkfish.rs2").read_text(encoding="utf-8")
COOKING = (QUEST / "configs/swan_fresh_monkfish.dbrow").read_text(encoding="utf-8")


class SwanSongFishingContract(unittest.TestCase):
    def test_fishing_uses_quest_specific_npc_and_fish(self):
        self.assertIn("[opnpc1,swan_fishingspot]", FISHING)
        self.assertIn("inv_add(inv, swan_raw_monkfish, 1)", FISHING)
        self.assertNotIn("inv_add(inv, raw_monkfish, 1)", FISHING)
        self.assertIn("%swansong ! ^swansong_fish", FISHING)
        self.assertIn("stat(fishing) < 62", FISHING)
        self.assertIn("~check_fish_equipment(net)", FISHING)

    def test_fishing_rechecks_inventory_and_stage_after_action_delay(self):
        self.assertIn("%action_delay >= map_clock", FISHING)
        self.assertRegex(FISHING, r"p_delay\(4\);[\s\S]*?%swansong ! \^swansong_fish[\s\S]*?inv_total\(inv, net\) < 1[\s\S]*?inv_freespace\(inv\) < 1")
        self.assertIn("stat_advance(fishing, 10)", FISHING)

    def test_cooking_uses_existing_indexed_generic_dispatch(self):
        self.assertRegex(COOKING, r"(?m)^\[cooking_generic_swan_fresh_monkfish\]$")
        self.assertIn("table=cooking_generic", COOKING)
        self.assertIn("data=uncooked,swan_raw_monkfish", COOKING)
        self.assertIn("data=cooked,swan_monkfish", COOKING)
        self.assertIn("data=levelrequired,62", COOKING)
        self.assertIn("data=experience,10", COOKING)

    def test_arnold_provides_a_net_and_consumes_five_cooked_fish(self):
        self.assertIn("if (inv_total(inv, net) < 1)", MAIN)
        self.assertIn("inv_freespace(inv) < 1", MAIN)
        self.assertIn("inv_add(inv, net, 1)", MAIN)
        self.assertIn("inv_total(inv, swan_monkfish) >= ^swansong_fish_needed", MAIN)
        self.assertIn("inv_del(inv, swan_monkfish, ^swansong_fish_needed)", MAIN)

    def test_quest_rewards_and_kill_transitions_are_stage_guarded(self):
        for queue, expected in (
            ("swan_queen_kill", "swansong_army_deployed"),
            ("swansong_quest_complete", "swansong_return"),
        ):
            match = re.search(r"\[queue," + queue + r"\]([\s\S]*?)(?=\n\[|\Z)", MAIN)
            self.assertIsNotNone(match, queue)
            self.assertIn(f"if (%swansong ! ^{expected})", match.group(1))
        match = re.search(r"\[queue,swan_troll_kill\]([\s\S]*?)(?=\n\[|\Z)", MAIN)
        self.assertIsNotNone(match)
        self.assertIn("if (%swansong < ^swansong_trolls | %swansong >= ^swansong_troll_wave_complete)", match.group(1))


if __name__ == "__main__":
    unittest.main()
