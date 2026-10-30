from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import patch_377_haunted as patch

LEGACY = """[oploc1,_manor_bookcase]
@manor_bookcase_door(loc_param(end_coord));

// todo: This is borked for opening the doors now. Using the lever is fine.
// Gotta think through how to make this work with find all zone.
[label,manor_bookcase_door](coord $dest)
def_coord $start_coord = coord;
p_delay(0);
loc_findallzone(movecoord(coord, 0, 0, -1));
while (loc_findnext = true) {
    if(loc_type = hauntedbookcasel) {
        loc_change(inviswall, 3);
    } else if(loc_type = hauntedbookcaser) {
        loc_change(inviswall, 3);
    }
}
p_teleport($dest);

[oploc1,puzzle_ladder_top]
p_delay(1);
"""

class HauntedSourcePatchTests(unittest.TestCase):
    def make_content(self, parent: Path, original=LEGACY):
        root=parent/'content'
        script=root/patch.SOURCE
        script.parent.mkdir(parents=True,exist_ok=True)
        script.write_text(original)
        return root,script

    def test_guarded_patch_preserves_unrelated_game_script_and_backups(self):
        with tempfile.TemporaryDirectory() as temp:
            root,p=self.make_content(Path(temp))
            self.assertEqual(patch.apply(root),"eligible_pinned_source_not_modified")
            self.assertEqual(p.read_text(),LEGACY)
            self.assertEqual(patch.apply(root,write=True),"patched_with_backup")
            fixed=p.read_text()
            self.assertIn("~loc_within_distance(coord, hauntedbookcasel, 0)",fixed)
            self.assertIn("~loc_within_distance(coord, hauntedbookcaser, 0)",fixed)
            self.assertIn("if ($left_coord = null | $right_coord = null)",fixed)
            self.assertIn("if (loc_find($right_coord, hauntedbookcaser) = true)",fixed)
            self.assertNotIn("loc_findallzone(movecoord(coord, 0, 0, -1))",fixed)
            self.assertTrue(fixed.startswith("[oploc1,_manor_bookcase]"))
            self.assertTrue(fixed.endswith("[oploc1,puzzle_ladder_top]\np_delay(1);\n"))
            backups=list(p.parent.glob(p.name+'.joshrs-before-*.bak'))
            self.assertEqual(len(backups),1)
            self.assertEqual(backups[0].read_text(),LEGACY)
            self.assertEqual(patch.apply(root,write=True),"already_patched")
            self.assertEqual(len(list(p.parent.glob(p.name+'.joshrs-before-*.bak'))),1)

    def test_unknown_or_modified_quest_source_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temp:
            root,p=self.make_content(Path(temp),LEGACY.replace("hauntedbookcaser","something_else"))
            with self.assertRaisesRegex(ValueError,"doesn't match"):
                patch.apply(root,write=True)
            self.assertEqual(len(list(p.parent.glob('*.bak'))),0)
            self.assertIn("something_else",p.read_text())

    def test_refuse_symlink_target(self):
        with tempfile.TemporaryDirectory() as temp:
            root,p=self.make_content(Path(temp))
            private=Path(temp)/'private-script'
            p.rename(private)
            p.symlink_to(private)
            with self.assertRaisesRegex(ValueError,"linked"):
                patch.apply(root,write=True)
            self.assertEqual(private.read_text(),LEGACY)

if __name__=="__main__":
    unittest.main()
