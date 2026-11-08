"""Genuine revision 377 attack spawns and death-gated Swan Song stages."""
import pathlib,re,unittest
root=pathlib.Path(__file__).resolve().parents[2]/"content-patches/rs377/scripts/quests/quest_swansong"
story=(root/"scripts/swan_story_and_army.rs2").read_text()
q=(root/"scripts/quest_swansong.rs2").read_text()
constants=(root/"configs/quest_swansong.constant").read_text()
class CombatQuestContracts(unittest.TestCase):
    def test_eight_actual_troll_kills_not_dialogue_advances(self):
        self.assertIn("^swansong_troll_wave_complete = 58",constants)
        self.assertIn("npc_add($loc, swan_troll_ambush, 500)",story)
        self.assertIn("npc_setmode(opplayer2)",story)
        self.assertIn("if (npc_findhero = ^true)",q)
        self.assertIn("%swansong = calc(%swansong + 1)",q)
        self.assertIn('case ^swansong_trolls, 51, 52, 53, 54, 55, 56, 57',q)
    def test_real_native_queen_and_visible_defenders(self):
        self.assertIn("npc_add($queen_loc, swan_seatroll_queen, 800)",story)
        self.assertIn("npc_add($skeleton_loc, swan_skeleton_battle, 800)",story)
        self.assertIn("map_findsquare(coord, 5, 12",story)
        self.assertIn("~swan_spawn_queen;",story)
        self.assertIn("if (%swansong ! ^swansong_army_deployed)",q)
    def test_no_outside_colony_or_duplicate_boss_spawn(self):
        self.assertEqual(3,story.count("inzone(0_36_57_7_14, 0_36_57_53_50"))
        self.assertIn("npc_find(coord, swan_seatroll_queen, 18, 0)",story)
        self.assertIn("npc_find(coord, swan_troll_ambush, 12, 0)",story)
        self.assertIn("if (inv_total(inv, swan_army) < 1)",story)
