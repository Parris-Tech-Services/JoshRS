"""Pinned 377 Swan Song fishing attacks and the OSRS-documented extra bone chance."""
import pathlib,unittest
root=pathlib.Path(__file__).resolve().parents[2]/"content-patches/rs377"
story=(root/"scripts/quests/quest_swansong/scripts/swan_story_and_army.rs2").read_text()
fish=(root/"scripts/quests/quest_swansong/scripts/swan_fresh_monkfish.rs2").read_text()
main=(root/"scripts/quests/quest_swansong/scripts/quest_swansong.rs2").read_text()
rag=(root/"scripts/quests/quest_rag/scripts/rag_npc_drops.rs2").read_text()
class FishingCombatTests(unittest.TestCase):
    def test_three_distinct_real_kill_credited_fishing_trolls(self):
        for i in (1,2,3):
            self.assertIn(f"$troll = swan_troll_fishing_{i}",story)
        self.assertIn("npc_add($spawn, $troll, 500)",story)
        self.assertIn("if (%swansong = ^swansong_fish & %swansong_trolls < 3)",fish)
        self.assertIn("%swansong_trolls = calc(%swansong_trolls + 1)",story)
        self.assertIn("%swansong_trolls = 3)",story)
    def test_fishing_trolls_are_a_real_rebuild_gate(self):
        self.assertIn("~swan_spawn_fishing_troll",fish)
        self.assertIn("~swan_spawn_fishing_troll;",main)
        self.assertIn("Fishing trolls: <tostring(%swansong_trolls)> / 3.",main)
    def test_2006_fishing_reward_not_retconned_2022_reward(self):
        self.assertIn("stat_advance(fishing, 100000)",main)
        self.assertNotIn("stat_advance(fishing, 500000)",main)
    def test_27_extra_bones_1_in_4_but_main_eight_guaranteed(self):
        self.assertIn("%rag_quest = ^rag_complete & random(4) ! 0",rag)
        self.assertIn("%rag_quest = ^rag_started & ~rag_is_required_bone($index) = false",rag)
