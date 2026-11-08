"""Swan Song: Frumscone's dialogue routes to Malignius, not a direct item grant."""
import pathlib,unittest
r=pathlib.Path(__file__).resolve().parents[2]/"content-patches/rs377"
p=(r/"patches/0018-swansong-wizard-frumscone.patch").read_text()
a=(r/"scripts/quests/quest_swansong/scripts/swan_story_and_army.rs2").read_text()
n=(r/"scripts/quests/quest_swansong/scripts/swan_malignius_crafter.rs2").read_text()
class SwanNpcStory(unittest.TestCase):
    def test_frumscone_redirects_to_actual_cache_necromancer(self):
        self.assertIn("Malignius Mortifer",p)
        self.assertNotIn("~swan_frumscone_army",p)
        self.assertIn("[opnpc1,elemental_wizard_boss]",n)
        self.assertIn("~swan_malignius_army;",n)
        self.assertIn("[proc,swan_malignius_army]",a)
    def test_crafting_guild_advice_and_items_remain_grounded(self):
        self.assertIn("[opnpc1,master_crafter_2]",n)
        for item in ("bones","pot_empty","potlid","swan_army"):
            self.assertIn(item,a)
