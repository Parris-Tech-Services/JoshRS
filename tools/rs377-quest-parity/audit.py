#!/usr/bin/env python3
"""Fail-closed historic reward contracts + evidence-only 104-quest source matrix.

Source presence is NOT a real player playthrough or proof of Jagex-era parity.
Runs after strictly ordered patches and quest overlays in an isolated 377 runner.
No live server, saves or player accounts are read or written.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
QUEUE = REPO / "research" / "rs377" / "QUEST_QUEUE_2026-11-08.json"

# Exact names of the actual JoshRS overlay folders, reconciled with 104 quest IDs.
OVERLAYS = {
    "creatureoffenkenstrain": "quest_fenkenstrain",
    "rag": "quest_rag",
    "soulbane": "quest_soulbane",
    "swansong": "quest_swansong",
    "routequest": "quest_myreque",
    "ics_little": "quest_ics",
    "mdaughter": "quest_mdaughter",
    "hauntedmine": "quest_hauntedmine",
    "lost_tribe": "quest_losttribe",
    "makinghistory": "quest_makinghistory",
    "handsand": "quest_handsand",
    "feud": "quest_feud",
    "elid": "quest_elid",
    "onesmallfavour": "quest_osf",
    "dwarfrock": "quest_dwarfrock",
    "tog": "quest_tog",
    "zogre": "quest_zogre",
    "giantdwarf": "quest_giantdwarf",
    "forget": "quest_forget",
    "garden": "quest_garden",
    "twocats": "quest_twocats",
    "wanted": "quest_wanted",
    "deal": "quest_deal",
    "agrith": "quest_agrith",
}

# Fixed, specifically researched reward quantities in player-facing XP.
# Each stat_advance argument uses historical RuneScript tenths of one XP.
# DO NOT silently replace 2006 Swan Song's Fishing 10,000 with modern OSRS 50,000.
HISTORIC_REWARD_XP = {
    "hauntedmine": {"strength": 22000},
    "soulbane": {"defence": 500, "hitpoints": 500},
    "routequest": {"attack": 600, "defence": 600, "strength": 600, "hitpoints": 600, "crafting": 600},
    "ics_little": {"thieving": 4500, "agility": 4000, "woodcutting": 4000},
    "mdaughter": {"attack": 1000, "prayer": 2000},
    "deal": {"fishing": 7000, "prayer": 7000, "farming": 7000},
    "giantdwarf": {"mining": 2500, "smithing": 2500, "crafting": 2500, "magic": 1500, "thieving": 1500, "firemaking": 1500},
    "dwarfrock": {"mining": 5000, "smithing": 5000, "defence": 5000},
    "zogre": {"herblore": 2000, "fletching": 2000, "ranged": 2000},
    "forget": {"cooking": 5000, "farming": 5000},
    "garden": {"farming": 5000},
    "tog": {"crafting": 1000},
    "wanted": {"slayer": 5000},
    "rag": {"cooking": 500, "prayer": 500},
    "swansong": {"fishing": 10000, "magic": 15000, "prayer": 10000},
    "mortton": {"herblore": 2000, "crafting": 2000},
}

# Genuine incompatible quest rewards confirmed in historical quest guides.
BAD_REWARD_SIGNATURES = {
    "hauntedmine": ("stat_advance(mining, 40000);", "stat_advance(crafting, 20000);"),
    "soulbane": ("stat_advance(prayer, 40000);", "stat_advance(defence, 20000);"),
    "routequest": ("stat_advance(agility, 50000);", "stat_advance(slayer, 20000);"),
    "ics_little": ("stat_advance(prayer, 30000);",),
    "mdaughter": ("stat_advance(strength, 50000);",),
    "giantdwarf": ("inv_add(inv, coins, 5000);",),
}

UNFINISHED = re.compile(r"\bNOT IMPLEMENTED\b", re.I)
UNCERTAINTY = re.compile(r"\b(?:TODO|FIXME|UNVERIFIED|PLACEHOLDER|NOT IMPLEMENTED|guess)\b", re.I)
XP_DIRECT = re.compile(r"\bstat_advance\s*\(\s*([a-z_]+)\s*,\s*(\d+)\s*\)\s*;")

def scan(content: Path) -> dict:
    original = json.loads(QUEUE.read_text(encoding="utf-8"))
    quests = original["quests"]
    ids = [q["quest_id"] for q in quests]
    if len(quests) != 104 or len(set(ids)) != 104:
        raise ValueError("Revision 377 queue no longer has exactly 104 unique quests")
    if not set(OVERLAYS).issubset(ids) or not set(HISTORIC_REWARD_XP).issubset(ids):
        raise ValueError("A source quest ID was renamed without updating parity contracts")
    src = content / "scripts" / "quests"
    if not src.is_dir():
        raise ValueError(f"Not a compiled 377 content source tree: {src}")

    records, failures = [], []
    for q in quests:
        key = q["quest_id"]
        original_dir = q.get("evidence", {}).get("quest_dir")
        upstream_root = src / original_dir.split("/")[-1] if original_dir else None
        custom_name = OVERLAYS.get(key)
        custom_root = src / custom_name if custom_name else None
        roots = []
        if upstream_root and upstream_root.is_dir():
            roots.append(upstream_root)
        if custom_root and custom_root.is_dir() and custom_root not in roots:
            roots.append(custom_root)
        scripts = [f for root in roots for f in sorted(root.rglob("*.rs2"))]
        snippets = [(f, f.read_text(encoding="utf-8", errors="replace")) for f in scripts]
        whole = "\n".join(code for _, code in snippets)
        incomplete_notes = [f"{f.relative_to(content)}:{i}: {line.strip()[:125]}" for f, code in snippets
                            for i, line in enumerate(code.splitlines(), 1)
                            if line.lstrip().startswith("//") and UNFINISHED.search(line)]
        uncertainty_notes = [f"{f.relative_to(content)}:{i}: {line.strip()[:125]}" for f, code in snippets
                             for i, line in enumerate(code.splitlines(), 1)
                             if line.lstrip().startswith("//") and UNCERTAINTY.search(line)]
        has_custom = bool(custom_root and custom_root.is_dir())
        completion = "~send_quest_complete(" in whole
        journal = f"[if_button,questlist:{key}]" in whole
        if incomplete_notes:
            verdict = "EXPLICITLY_INCOMPLETE"
        elif not scripts:
            verdict = "NO_EXECUTABLE_QUEST_SCRIPTS"
        elif has_custom:
            verdict = "CUSTOM_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY"
        else:
            verdict = "PINNED_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY"
        # No claimed gameplay pass anywhere in this generator. Real evidence
        # must come from a separate authenticated client test and relog capture.
        record = {
            "id": key, "name": q["name"], "release_date": q["release_date"],
            "original_catalogue_status": q["status"],
            "source_verdict": verdict,
            "real_player_full_playthrough_verified": False,
            "period_2006_100_percent_parity_verified": False,
            "save_relog_verified": False,
            "has_quest_script_files": bool(scripts),
            "script_files": len(scripts),
            "has_completion_action_in_quest_files": completion,
            "has_journal_handler_in_quest_files": journal,
            "overlay_folder": custom_name,
            "required_skills_reference": q["required_skills"],
            "required_quests_reference": q["required_quests"],
            "expected_rewards_reference": q["rewards"],
            "explicit_unimplemented_lines": incomplete_notes[:8],
            "other_unverified_source_notes": uncertainty_notes[:8],
            "historical_reward_contract_checked": key in HISTORIC_REWARD_XP,
        }
        if key in HISTORIC_REWARD_XP:
            for skill, xp in HISTORIC_REWARD_XP[key].items():
                predicate = re.compile(r"\bstat_advance\s*\(\s*" + re.escape(skill)
                                       + r"\s*,\s*" + str(xp * 10) + r"\s*\)\s*;")
                if not predicate.search(whole):
                    failures.append(f"{q['name']}: historical reward missing {xp} {skill} XP")
            for forbidden in BAD_REWARD_SIGNATURES.get(key, ()):
                if forbidden in whole:
                    failures.append(f"{q['name']}: disproven reward still present: {forbidden}")
        records.append(record)
    counter = dict(Counter(r["source_verdict"] for r in records))
    return {
        "schema": "joshrs-377-quest-accuracy-evidence-v1",
        "source": "Revision 377 quest catalogue, pinned LostCity content plus JoshRS overlays",
        "target_cutoff": "2006-05-02",
        "total_quests": 104,
        "quest_count_by_source_verdict": counter,
        "historic_reward_contracts_checked": len(HISTORIC_REWARD_XP),
        "full_live_playthroughs_verified_by_this_audit": 0,
        "full_2006_accurate_quests_verified_by_this_audit": 0,
        "historical_reward_failures": failures,
        "limitations": "Source-only static audit. No verified historical 2006 Jagex code, individual client playthrough, live installation or save/relog evidence.",
        "quests": records,
    }

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--content", type=Path, required=True)
    ap.add_argument("--out-dir", type=Path, required=True)
    args = ap.parse_args()
    result = scan(args.content.resolve(strict=True))
    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir / "quests-104-evidence.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# JoshRS 377: 104-quest source and accuracy evidence matrix",
        "",
        "Source inspection only; **not a 100% parity certificate**. Historical source dates and",
        "rewards need individual period corroboration. Green catalogue status is not gameplay proof.",
        "",
        f"- Quests checked in catalogue: **{result['total_quests']}**",
        f"- Historical reward contracts checked: **{result['historic_reward_contracts_checked']}**",
        "- Full 2006-accurate, real-client playthroughs verified by this audit: **0**",
        "- Quest status counts: " + ", ".join(f"{k}: {v}" for k,v in sorted(result["quest_count_by_source_verdict"].items())),
        "",
        "| # | Quest | Original catalogue status | Source-only verdict | Playthrough proven | Known missing mechanics |",
        "|---:|---|---|---|---|---:|",
    ]
    for index, q in enumerate(result["quests"], 1):
        name = q["name"].replace("|", "\\|")
        lines.append(f"| {index} | {name} | {q['original_catalogue_status']} | "
                     f"{q['source_verdict']} | NO | {len(q['explicit_unimplemented_lines'])} |")
    lines += ["", "## Known explicit missing-mechanic notes", ""]
    for q in result["quests"]:
        if q["explicit_unimplemented_lines"]:
            lines.append(f"### {q['name']}")
            for note in q["explicit_unimplemented_lines"]:
                lines.append("- " + note.replace("|", "\\|"))
            lines.append("")
    lines += ["## Historical reward contract failures", ""]
    lines.extend("- " + failure for failure in result["historical_reward_failures"])
    lines.append("")
    (args.out_dir / "quests-104-evidence.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"source_quests": 104, "verdicts": result["quest_count_by_source_verdict"],
                      "historic_reward_contracts": result["historic_reward_contracts_checked"],
                      "reward_failures": result["historical_reward_failures"]}, indent=2))
    if result["historical_reward_failures"]:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
