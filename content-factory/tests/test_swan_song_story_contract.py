"""Source contracts for Swan Song's pinned 377 quest mechanics."""
import pathlib
import unittest
root = pathlib.Path(__file__).resolve().parents[2] / "content-patches/rs377"
q = root / "scripts/quests/quest_swansong"
main = (q / "scripts/quest_swansong.rs2").read_text()
story = (q / "scripts/swan_story_and_army.rs2").read_text()
repair = (q / "scripts/swan_colony_repairs.rs2").read_text()
fish = (q / "scripts/swan_fresh_monkfish.rs2").read_text()
qp = (root / "patches/0019-swansong-questpoints-varbit.patch").read_text()
class SwanSongStoryContracts(unittest.TestCase):
    def test_quest_point_uses_9bit_stage_not_30bit_packed_varp(self):
        self.assertIn("+if (%swansong = ^swansong_complete)",qp)
        self.assertIn("-if (%swansong_quest = ^swansong_complete)",qp)
    def test_runes_and_wizard_bone_seeds(self):
        for item in ["lavarune","mistrune","bloodrune","swan_army","potlid"]:
            self.assertIn(item,story)
        self.assertIn("if (stat(magic) < 66)",story)
        self.assertIn("^swansong_army_deployed",story)
    def test_five_persistent_wall_bits_and_press(self):
        for i in range(1,6):
            self.assertIn(f"%swansong_wall_{i}",repair)
        self.assertIn("inv_del(inv, iron_bar, 1);",repair)
        self.assertIn("inv_add(inv, iron_sheet, 1);",repair)
        self.assertIn("inv_del(inv, iron_sheet, 1);",repair)
    def test_correct_cache_fishing_action(self):
        self.assertIn("[opnpc3,swan_fishingspot]",fish)
        self.assertIn("[opnpc1,swan_fishingspot]",fish)
    def test_quest_rebuild_and_rewards(self):
        self.assertIn("%swansong_arnold = 1;",main)
        self.assertIn("~swan_rebuild_advance",main)
        self.assertIn("stat_advance(fishing, 500000)",main)
        self.assertIn("stat_advance(magic, 150000)",main)
        self.assertIn("stat_advance(prayer, 100000)",main)
        self.assertIn("inv_add(inv, coins, 25000)",main)
        self.assertIn("if (%swansong ! ^swansong_army_deployed)",main)
