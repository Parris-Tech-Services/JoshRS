#!/usr/bin/env python3
"""Build the quest/NPC implementation queue from the NPC dialogue audit JSON.

Metadata only (symbols, ids, coordinates, reference URLs). No dialogue text.
Usage: python3 tools/rs377-quest-npc-queue/build_queue.py
"""
import json, collections, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
AUDIT = ROOT / "research/rs377/npc_dialogue_audit_2026-11-08.json"
OUT = ROOT / "research/rs377"
BRIEFS = OUT / "quest_npc_briefs"

# Ordered oldest -> newest by the earliest quest/feature anchoring each group.
# anchor_confirmed=True means the date came from the RuneScape Wiki release table
# (fetched 2026-11-08). False means agy must confirm the date before starting.
QUEUE = [
 ("F2P Surface & Underground Regions (Other)", "Classic F2P leftovers", "2001-2004 (classic quests; confirm per quest)", False),
 ("Draynor Village & Market", "Classic F2P leftovers", "2001-2004", False),
 ("Farming Gardeners, Shops & Leprechauns", "Farming (shops/gardeners)", "2005 farming era; confirm", False),
 ("Port Sarim, Rimmington & Void Knights' Outpost", "Classic F2P + Pest Control outpost", "2001-2005; confirm per NPC", False),
 ("Karamja, Shilo Village & Tai Bwo Wannai", "Shilo Village / Jungle Potion / Tai Bwo Wannai", "2002-2004; confirm", False),
 ("TzHaar City & Fight Caves", "TzHaar City / Fight Caves", "2003-2004; confirm", False),
 ("Ghosts Ahoy & Port Phasmatys", "Ghosts Ahoy / Port Phasmatys", "2004; confirm", False),
 ("Monkey Madness & Ape Atoll", "Monkey Madness / Ape Atoll", "2003-2005; confirm", False),
 ("Fremennik Province & Miscellania", "The Fremennik Trials (+ Mountain Daughter 7 Mar 2005)", "2004-11-02 (Trials, per OSRS wiki); Mountain Daughter 2005-03-07", True),
 ("Mage Training Arena", "Mage Training Arena minigame", "2005-2006; confirm", False),
 ("One Small Favour & H.A.M. Hideout", "One Small Favour", "2005-02-28", True),
 ("Al Kharid & Kharidian Desert", "Prince Ali Rescue, The Feud (2005-04-04), Desert Treasure (2005-04-18), Icthlarin's Little Helper (2005-04-26), Spirits of the Elid (2005-12-05), The Hand in the Sand (2006-01-10)", "2001 -> 2006-01-10", True),
 ("Keldagrim & The Giant Dwarf", "Between a Rock... (2005-03-21), The Giant Dwarf (2005-05-31), Forgettable Tale of a Drunken Dwarf (2005-07-26)", "2005-03-21 -> 2005-07-26", True),
 ("The Lost Tribe & Dorgeshuun Mines", "The Lost Tribe (2005-05-31); Death to the Dorgeshuun is 2006-06-21 (likely post-377: verify)", "2005-05-31", True),
 ("Tirannwn, Lletya & Mourning's End", "Regicide/Underground Pass, Mourning's End Part I (2005-07-19) and II (2005-10-17)", "2004 -> 2005-10-17", True),
 ("Morytania, Canifis & Burgh de Rott", "Nature Spirit, Rum Deal (2005-10-31), Wanted! (2005-10-17), In Aid of the Myreque (2006-03-22), Cabin Fever (2006-02-07)", "2003 -> 2006-03-22", True),
 ("Ratcatchers & Sewer/Tavern NPCs", "Rat Catchers", "2005-11-28", True),
 ("Recipe for Disaster (100th Quest)", "Recipe for Disaster", "2006-03-15", True),
 ("Members Surface & Underground Regions (Other)", "UNCLASSIFIED members NPCs: triage by region cluster, assign each to a quest/feature, then place in release order", "mixed", False),
 ("Random Events & Macro Guardians", "Random events (not quests)", "2004-2005; confirm", False),
 ("Unspawned / Dynamic / Cutscene / Morph Variants", "Cutscene / quest-stage / seasonal variants: attach each to its parent quest or seasonal event", "mixed", False),
]

def slug(s):
    return "".join(c.lower() if c.isalnum() else "_" for c in s).strip("_")[:48]

def main():
    d = json.load(open(AUDIT))
    npcs = d["unhandled_npcs"]
    by = collections.defaultdict(list)
    for n in npcs:
        by[n["area_or_quest_group"]].append(n)
    known = {q[0] for q in QUEUE}
    assert set(by) <= known, set(by) - known
    queue_json, md = [], []
    md.append("# JoshRS 377 quest and NPC implementation queue (oldest to newest)\n")
    md.append("Prepared 8 November 2026. Source: `npc_dialogue_audit_2026-11-08.json` (969 unhandled Talk-to NPCs). Target revision 377 (May 2006) at pinned `LostCityRS/Content@44eab090`.\n")
    md.append("Rights policy: this repo holds metadata only (ids, symbols, coordinates, reference URLs). Dialogue is written in the private content checkout, never committed here.\n")
    md.append("| # | Brief | NPCs | Anchor quest/feature | Anchor date | Date confirmed |\n|---:|---|---:|---|---|---|")
    n_total = 0
    for i, (grp, anchor, date, ok) in enumerate(QUEUE, 1):
        lst = sorted(by.get(grp, []), key=lambda n: ((n["primary_spawn"] or {}).get("region") or "~", n["id"]))
        if not lst:
            continue
        n_total += len(lst)
        fn = f"BRIEF_{i:02d}_{slug(grp)}.md"
        queue_json.append({"order": i, "group": grp, "anchor": anchor, "anchor_date": date,
                           "date_confirmed_from_wiki": ok, "brief": f"quest_npc_briefs/{fn}",
                           "npcs": [{k: n[k] for k in ("id","debugname","name","expected_contract","spawned_on_map","spawn_count","primary_spawn","reference_wiki")} for n in lst]})
        md.append(f"| {i} | [{fn}](quest_npc_briefs/{fn}) | {len(lst)} | {anchor} | {date} | {'yes' if ok else 'NO - agy to confirm'} |")
        b = [f"# Brief {i}: {grp}\n",
             f"**Anchor:** {anchor}  \n**Anchor date:** {date} (wiki-confirmed: {'yes' if ok else 'no, confirm before starting'})  \n**NPCs missing a Talk-to trigger:** {len(lst)}\n",
             "## Contract for agy\n",
             "1. Run the AGENTS.md pre-feature audit first: for each NPC, check pinned `LostCityRS/Content` and local overrides for an existing `[opnpc1]`/`[apnpc1]`/`_category`/multinpc handler. Skip any that exist.",
             "2. Decide per NPC: part of a quest stage, a repeatable post-quest line, a shop greeting, or ambient. Anything that cannot be tied to 377-era content goes on an `authentically silent` list with evidence.",
             "3. Implement in the private content checkout only, one `.rs2` per area or quest, compile and pack, run `audit_npc_trigger_collisions.py` (must stay 0).",
             "4. Do not commit dialogue text to this repo. Commit only metadata, evidence and test results.",
             "5. Mark unconfirmed lines `// UNVERIFIED: <source tried>` and list them.\n",
             "## NPCs (sorted by region then id)\n",
             "| ID | Debugname | Name | Contract | Spawn (lvl,x,z,region) | Wiki |", "|---:|---|---|---|---|---|"]
        for n in lst:
            s = n["primary_spawn"]
            sp = f"({s['level']}, {s['x']}, {s['z']}, {s['region']})" if s else "unspawned"
            b.append(f"| {n['id']} | `{n['debugname']}` | {n['name']} | {n['expected_contract']} | {sp} | [wiki]({n['reference_wiki']}) |")
        (BRIEFS / fn).write_text("\n".join(b) + "\n")
    md.append(f"\nTotal queued: {n_total} (audit says 969).\n")
    (OUT / "QUEST_NPC_IMPLEMENTATION_QUEUE_2026-11-08.md").write_text("\n".join(md))
    (OUT / "quest_npc_queue_2026-11-08.json").write_text(json.dumps({"revision": 377, "total": n_total, "queue": queue_json}, indent=1))
    print("wrote", len(queue_json), "briefs;", n_total, "npcs")

if __name__ == "__main__":
    main()
