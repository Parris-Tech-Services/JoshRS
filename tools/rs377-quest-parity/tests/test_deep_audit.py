#!/usr/bin/env python3
"""Deterministic negative fixtures for the 104-quest deeper source auditor."""
from __future__ import annotations

import sys
from pathlib import Path
from unittest import TestCase, main

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import deep_audit as d

class DeepAuditContracts(TestCase):
    def test_runescript_extracts_npc_object_item_combat_and_stage_handlers(self):
        code = """
// [opnpc1,fake_comment] should NOT register
[opnpc1,quest_cook]
~chatnpc("<p,neutral>Test only.");
if (%test_var = ^start) {
  %test_var = ^done;
}
[oplocu,cooksquestrange]
inv_del(inv, pot_flour, 1);
[opheld1,quest_key]
mes("Try item");
[ai_queue3,quest_boss]
queue(quest_dead, 0, 0);
[queue,quest_dead]
stat_advance(cooking, 3000);
"""
        sections = d.get_script_sections(code)
        self.assertEqual([(e["kind"],e["target"]) for e in sections],
           [("opnpc1","quest_cook"),("oplocu","cooksquestrange"),
            ("opheld1","quest_key"),("ai_queue3","quest_boss"),
            ("queue","quest_dead")])
        self.assertIn(("cooking","3000"), d.STAT_REWARD.findall(d.clean_code(code)))
        self.assertIn(("test_var","^done"), d.STAGE_ASSIGN.findall(d.clean_code(code)))
        self.assertNotIn("fake_comment",[x["target"] for x in sections])

    def test_deep_record_fails_closed_without_period_or_live_evidence(self):
        q={"quest_id":"cook","name":"Cook's Assistant","release_date":"2001-01-04",
           "status":"COMPLETE-VERIFIED","start_npc":"cook",
           "varp_or_varbit":"cookquest","required_skills":[],
           "required_quests":[],"rewards":["300 Cooking XP"],
           "evidence":{"quest_dir":"quests/quest_cook"},
           "stages":[]}
        path="scripts/quests/quest_cook/scripts/quest_cook.rs2"
        content="""
[opnpc1,cook]
~chatnpc("Help me.");
if (%cookquest = 0) { %cookquest = 1; }
[if_button,questlist:cook]
~quest_journal("Cook", "Stage");
[queue,quest_complete]
stat_advance(cooking, 3000);
~send_quest_complete(questlist:cook, egg, 200, 1, "Done");
"""
        owned={path:content}
        idx={path:d.get_script_sections(content)}
        npc_idx={"cook":[d.concise_event("opnpc1","cook",path,2)]}
        result=d.analyze_quest(q,idx,owned,{"cook":278},
              {"cook":[{"map":"m50_50.jm2","plane":0,"x":3209,"z":3215}]},
              {},list(owned),npc_idx,{"cooksquestrange":114},
              {"egg":1944,"pot_flour":1933},d.PIN)
        self.assertEqual(result["source_verdict"],
                         "PINNED_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY")
        self.assertTrue(result["npc_start"]["map_spawn_evidence"])
        self.assertNotIn("QUEST_JOURNAL_HANDLER_NOT_IN_OWNED_RS2",
                         result["open_acceptance_checks"])
        self.assertIn("if_button",result["interaction_handler_counts"])
        self.assertFalse(result["period_primary_source_verified"])
        self.assertFalse(result["full_live_player_quest_completion_verified"])
        self.assertFalse(result["save_and_relogin_verified"])
        self.assertIn("CONTEMPORANEOUS_2006_PRIMARY_SOURCE_NOT_VERIFIED",
                      result["open_acceptance_checks"])
        self.assertEqual(result["dialogue_structure"]["chatnpc_or_chatplayer_calls"],1)
        self.assertEqual(result["gameplay_mechanics_source"]["reward_xp_literal_sources"],
                         [{"skill":"cooking","xp":300}])

    def test_shared_area_handlers_are_indexed_without_false_name_matching(self):
        import re
        q={"quest_id":"cook","name":"Cook's Assistant","release_date":"2001-01-04",
           "status":"COMPLETE-VERIFIED","start_npc":"cook",
           "varp_or_varbit":"cookquest","required_skills":[],
           "required_quests":[],"rewards":[],"stages":[],
           "evidence":{"quest_dir":"quests/quest_cook"}}
        qpath="scripts/quests/quest_cook/scripts/quest_cook.rs2"
        area="scripts/areas/area_lumbridge/scripts/cook.rs2"
        wrong="scripts/areas/area_lumbridge/scripts/other.rs2"
        code="[if_button,questlist:cook]\n~quest_journal(\"Cook\", \"...\");\n"
        area_code="[opnpc1,cook]\nif (%cookquest = 1) { mes(\"Quest active\"); }\n"
        wrong_code="[opnpc1,other]\nif (%cookquest_other = 1) { mes(\"No match\"); }\n"
        index={qpath:d.get_script_sections(code),area:d.get_script_sections(area_code),
               wrong:d.get_script_sections(wrong_code)}
        refs={}
        for path in (area,wrong):
            for event in index[path]:
                for var in set(re.findall(r"%([A-Za-z_][A-Za-z0-9_]*)\b",event["body"])):
                    refs.setdefault(var,[]).append(d.concise_event(
                        event["kind"],event["target"],path,event["line"]))
        r=d.analyze_quest(q,index,{qpath:code}, {"cook":278}, {},
                          {},[qpath],{}, {},{},d.PIN,refs)
        self.assertEqual(r["shared_area_event_candidate_count"],1)
        self.assertEqual(r["shared_area_npc_dialogue_event_candidates"][0]["path"],area)
        self.assertEqual(r["shared_area_event_candidates"] if "shared_area_event_candidates" in r else
                         r["shared_area_or_general_event_candidates"][0]["matched_quest_variables"],
                         ["cookquest"])

    def test_missing_start_and_no_scripts_are_not_marked_verified(self):
        q={"quest_id":"unmade","name":"Unmade","release_date":"2006-01-01",
           "status":"NOT STARTED","start_npc":"missing",
           "required_quests":[],"required_skills":["20 Crafting"],
           "rewards":[],"evidence":{"quest_dir":None},"stages":[]}
        row=d.analyze_quest(q,{}, {},{}, {}, {},[],{}, {}, {},d.PIN)
        self.assertEqual(row["source_verdict"],"NO_EXECUTABLE_QUEST_SCRIPTS")
        self.assertIn("START_NPC_SYMBOL_NOT_IN_PACK",row["open_acceptance_checks"])
        self.assertIn("PREREQUISITE_LEVEL_CHECKS_NOT_ALL_FOUND_IN_OWNED_RS2",
                      row["open_acceptance_checks"])

    def test_explicit_missing_mechanics_overrides_custom_scaffold(self):
        q={"quest_id":"deal","name":"Rum Deal","release_date":"2005-10-31",
           "status":"NOT STARTED","start_npc":"deal_pete",
           "required_quests":[],"required_skills":[],
           "rewards":[],"evidence":{"quest_dir":None},"stages":[]}
        path="scripts/quests/quest_deal/scripts/quest_deal.rs2"
        content="// NOT IMPLEMENTED: pirate boss fight\n[opnpc1,deal_pete]\n~chatnpc(\"Hi\");\n"
        row=d.analyze_quest(q,{path:d.get_script_sections(content)},
                            {path:content},{"deal_pete":7},
                            {"deal_pete":[{"map":"m1_1.jm2","plane":0,"x":1,"z":1}]},
                            {},[path],{"deal_pete":[d.concise_event("opnpc1","deal_pete",path,2)]},
                            {},{},d.PIN)
        self.assertEqual(row["source_verdict"],"EXPLICITLY_INCOMPLETE")
        self.assertIn("SOURCE_EXPLICITLY_DECLARES_INCOMPLETE_MECHANICS",
                      row["open_acceptance_checks"])

if __name__=="__main__":
    main()
