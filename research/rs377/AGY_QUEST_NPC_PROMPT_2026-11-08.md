# Agy launch prompt: implement queued quest and NPC dialogue (oldest first)

Paste into Antigravity CLI from the JoshRS repo checkout.

---

Pull the branch `research/377-quest-npc-queue-20261108` (or main once merged). Read `AGENTS.md`, `docs/377_CONTENT_FACTORY.md` and `docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md` first.

Your job is the on-machine implementation only. The research is already done and committed:
- `research/rs377/QUEST_NPC_IMPLEMENTATION_QUEUE_2026-11-08.md` is the ordered queue (oldest to newest) of 969 Talk-to NPCs with no dialogue.
- `research/rs377/quest_npc_briefs/BRIEF_NN_*.md` has one brief per group, with ids, debugnames, spawns and wiki references.
- `research/rs377/quest_npc_queue_2026-11-08.json` is the same data for scripts.

Work through the briefs strictly in numeric order, starting at BRIEF_01. For each brief:
1. For rows marked "NO - agy to confirm", confirm the quest or feature release date from the RuneScape Wiki first and fix the order if needed. Skip anything released after revision 377 (May 2006).
2. Run the AGENTS.md pre-feature audit: check pinned `LostCityRS/Content` and local overrides for an existing handler for each NPC. Skip any that exist.
3. Research how each NPC's dialogue appeared in game at 377 (quest stages, repeat dialogue, shop greeting). Implement it in the private content checkout only (`runtime/jparris-377/.../content/scripts`), one `.rs2` file per area or quest, branching on the real quest varp stages.
4. Never commit dialogue text to the repo. Mark any line you cannot verify `// UNVERIFIED: <source tried>` and list it in `research/rs377/UNVERIFIED_LINES.md` (metadata only: NPC symbol, stage, sources tried).
5. Compile and pack. Run `content-factory/audit_npc_trigger_collisions.py` (collisions must stay 0). Re-run the audit scanner and update the counts.
6. NPCs that had no dialogue in 377 go on an "authentically silent" list with evidence. Do not invent dialogue.
7. Commit per brief on a branch `quests/377-<yyyymmdd>`, fetch and rebase on `origin/main` (an automated process pushes there), push, and confirm with `git log origin/<branch>` that the push landed before reporting it done.

Brief 19 (266 unclassified members NPCs) and brief 21 (112 variants) need triage first: group by region cluster, attach each NPC to its parent quest or feature, and re-slot it into release order before implementing.

Do not claim live gameplay from fixture tests. Label anything not tested in the running 377 world as unverified. Stop only for a blocking error and state exactly what it is.
