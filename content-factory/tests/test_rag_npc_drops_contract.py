"""Rag and Bone Man: real NPC casualty mapping 35/35, no duplicate loot hooks."""
import pathlib,re,unittest
root=pathlib.Path(__file__).resolve().parents[2]/"content-patches/rs377"
drops=(root/"scripts/quests/quest_rag/scripts/rag_npc_drops.rs2").read_text()
hook=(root/"patches/0024-rag-35-npc-quest-bone-drops.patch").read_text()
checks=(root/"tools/check_rag_npc_drops.py").read_text()
class RagKillDropsTests(unittest.TestCase):
    def test_all_thirty_five_indices_not_generic_fake_grants(self):
        rows=[int(x) for x in re.findall(r"(?m)^if \(npc_type = [^\n]+\) \{ return\((\d+)\); \}$",drops)]
        self.assertEqual(list(range(35)),rows)
        self.assertIn("def_namedobj $bone = ~rag_raw_bone($index);",drops)
        self.assertIn("obj_add(npc_coord, $bone, 1, ^lootdrop_duration)",drops)
        self.assertNotIn("inv_add(inv, $bone",drops)
    def test_no_parallel_npc_queue_override(self):
        self.assertNotIn("[ai_queue3",drops)
        self.assertIn("if (npc_findhero = ^true)",hook)
        self.assertIn("~rag_drop_quest_bone;",hook)
        self.assertIn("RAG_35_PINNED_NPC_DEATH_DROP_MAPPINGS_VERIFIED",checks)
    def test_drops_only_when_needed_in_appropriate_stage(self):
        for token in ("~rag_bone_delivered($index) = true","%rag_quest = ^rag_started","%rag_quest = ^rag_complete","~rag_is_required_bone($index)"):
            self.assertIn(token,drops)
