"""Swan Song map patch and per-location single-use regression gates."""
import pathlib
import re
import unittest
root = pathlib.Path(__file__).resolve().parents[2] / "content-patches/rs377"
repair = (root / "scripts/quests/quest_swansong/scripts/swan_colony_repairs.rs2").read_text()
patch = (root / "patches/0023-swansong-piscatoris-five-walls.patch").read_text()
checker = (root / "tools/check_swansong_wall_map.py").read_text()
class WallMapTests(unittest.TestCase):
    def test_map_has_five_explicit_modified_locations(self):
        self.assertEqual(5,len(re.findall(r"(?m)^\+0 7 (?:19|25|31|43|45): 1494[567] 0 2$",patch)))
        for z in (19,25,31,43,45):
            self.assertIn(f"case 0_36_57_7_{z}",repair)
        self.assertIn("SWANSONG_FIVE_UNIQUE_WALL_LOCATIONS_VERIFIED",checker)
    def test_single_use_flag_checked_before_item_consumption(self):
        for i in range(1,6):
            self.assertIn(f"if (%swansong_wall_{i} = 1)",repair)
            self.assertIn(f"%swansong_wall_{i} = 1;",repair)
        self.assertLess(repair.index("already repaired this section"),repair.index("inv_del(inv, iron_sheet, 1);"))
    def test_no_fallback_tile_progress(self):
        self.assertIn("This is not one of Franklin's five damaged wall sections.",repair)
        self.assertEqual(1,repair.count("inv_del(inv, iron_sheet, 1);"))
