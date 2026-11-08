"""Quest reward and postquest monkfish source regressions (not client playtests)."""
import pathlib,unittest
root=pathlib.Path(__file__).resolve().parents[2]/"content-patches/rs377"
rag=(root/"scripts/quests/quest_rag/scripts/quest_rag.rs2").read_text()
boil=(root/"scripts/quests/quest_rag/scripts/rag_potboiler.rs2").read_text()
fish=(root/"scripts/quests/quest_swansong/scripts/swan_fresh_monkfish.rs2").read_text()
recipe=(root/"scripts/quests/quest_swansong/configs/swan_postquest_monkfish.dbrow").read_text()
class RecoveryAndMonkfishTests(unittest.TestCase):
    def test_initial_rag_quest_rewards_once_after_full_eight_bones(self):
        self.assertIn("if (%rag_quest ! ^rag_started | ~rag_delivered_count ! ^rag_bone_total)",rag)
        self.assertIn("stat_advance(cooking, 5000)",rag)
        self.assertIn("stat_advance(prayer, 5000)",rag)
    def test_disconnected_boil_is_recoverable_without_making_items(self):
        self.assertIn("[oplocu,rag_potboiler_onfire]",boil)
        self.assertIn("%rag_boiler ! 3",boil)
        self.assertIn("p_delay(20)",boil)
        snippet=boil.split("[oplocu,rag_potboiler_onfire]",1)[1]
        self.assertNotIn("inv_add",snippet)
        self.assertIn("%rag_boiler = 4",snippet)
    def test_regular_monkfish_only_after_completion(self):
        self.assertIn("%swansong ! ^swansong_fish & %swansong ! ^swansong_complete",fish)
        self.assertIn("if (%swansong = ^swansong_fish)",fish)
        self.assertIn("inv_add(inv, raw_monkfish, 1)",fish)
        self.assertIn("stat_advance(fishing, 1200)",fish)
        self.assertIn("data=uncooked,raw_monkfish",recipe)
        self.assertIn("data=cooked,monkfish",recipe)
        self.assertIn("data=burnt,burnt_monkfish",recipe)
        self.assertIn("data=experience,1500",recipe)
