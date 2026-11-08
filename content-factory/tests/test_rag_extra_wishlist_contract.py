"""377 Rag and Bone Man extra-wishlist persistence and one-off rewards.

These source tests do not claim an actual client can acquire all 27 drops.
"""
import pathlib
import unittest

root = pathlib.Path(__file__).resolve().parents[2] / "content-patches/rs377"
script = (root / "scripts/quests/quest_rag/scripts/quest_rag.rs2").read_text()
consts = (root / "scripts/quests/quest_rag/configs/quest_rag.constant").read_text()
patch = (root / "patches/0017-rag-extra-wishlist-questpoint.patch").read_text()

class RagWishlistContracts(unittest.TestCase):
    def test_27_extras_separate_from_8_main_bones(self):
        self.assertIn("^rag_extra_bone_total = 27", consts)
        self.assertIn("^rag_bone_total = 8", consts)
        self.assertIn("~rag_is_required_bone($i) = false", script)
        self.assertIn("rag_extra_delivered_count", script)
    def test_exact_one_time_reward_and_credit(self):
        self.assertIn("if (%rag_bonesack = 1)", script)
        self.assertIn("%rag_bonesack = 1;", script)
        self.assertIn("stat_advance(prayer, 50000)", script)
        self.assertIn("if (%rag_bonesack = 1)", patch)
        self.assertIn("rag_wishlist_questpoints", patch)
    def test_no_reward_duplication_on_exchange(self):
        self.assertIn("inv_del(inv, rag_bonesack, 1);", script)
        self.assertIn("inv_del(inv, rag_ram_helm, 1);", script)
        self.assertIn("Bring your existing bonesack", script)
        self.assertIn("Bring your existing ram skull helm", script)
