"""Static native-377 contracts for Rag and Bone Man, not in-client gameplay proof."""
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
QUEST = ROOT / "content-patches/rs377/scripts/quests/quest_rag"
SCRIPT = (QUEST / "scripts/quest_rag.rs2").read_text()
CONSTANTS = (QUEST / "configs/quest_rag.constant").read_text()
FORTUNATO = (QUEST / "scripts/rag_fortunato_vinegar.rs2").read_text()
BOILER = (QUEST / "scripts/rag_potboiler.rs2").read_text()
PATCHSHOP = (ROOT / "content-patches/rs377/patches/0016-rag-fortunato-vinegar-shop.patch").read_text()
PATCHVARP = (ROOT / "content-patches/rs377/patches/0015-rag-boiler-persistence.patch").read_text()


class RagAndBoneManContracts(unittest.TestCase):
    def test_eight_required_bones_not_all_thirty_five(self):
        self.assertIn("^rag_bone_total = 8", CONSTANTS)
        self.assertIn("^rag_bone_catalog_total = 35", CONSTANTS)
        self.assertIn("[proc,rag_is_required_bone]", SCRIPT)
        self.assertIn("$i >= 0 & $i <= 5", SCRIPT)
        self.assertIn("$i = 14 | $i = 32", SCRIPT)
        self.assertIn("~rag_is_required_bone($i) = true", SCRIPT)
        self.assertIn("while ($i < ^rag_bone_catalog_total)", SCRIPT)
        self.assertIn("~rag_delivered_count = ^rag_bone_total", SCRIPT)

    def test_quest_completion_cannot_pay_twice(self):
        self.assertIn("[queue,rag_quest_complete]", SCRIPT)
        self.assertIn("if (%rag_quest ! ^rag_started | ~rag_delivered_count ! ^rag_bone_total)", SCRIPT)

    def test_shop_requires_quest_talk_and_member_world(self):
        self.assertIn("[opnpc1,rag_wine_merchant]", FORTUNATO)
        self.assertIn("if (map_members = ^false)", FORTUNATO)
        self.assertIn("if (%rag_quest = ^rag_not_started)", FORTUNATO)
        self.assertIn("%rag_wine = 1", FORTUNATO)
        self.assertIn("openshop(wine_vinegar_merchant", PATCHSHOP)
        self.assertIn("%rag_quest >= ^rag_started & %rag_wine = 1", PATCHSHOP)
        self.assertIn("openshop(wine_merchant_free", PATCHSHOP)

    def test_boiler_persists_and_rejects_empty_invalid_states(self):
        self.assertIn("[rag_bone_2]", PATCHVARP)
        self.assertIn("+scope=perm", PATCHVARP)
        self.assertIn("%rag_potboiler < 1 | %rag_potboiler > ^rag_bone_catalog_total", BOILER)
        self.assertIn("if (inv_freespace(inv) < 2)", BOILER)
        self.assertIn("if (%rag_boiler ! 3", BOILER)


if __name__ == "__main__":
    unittest.main()
