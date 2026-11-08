#!/usr/bin/env python3
"""Read-only revision-377 NPC dialogue coverage & gap audit for JoshRS.

Scans a revision-377 Lost City content directory (`scripts/**/*.npc`, `pack/npc.pack`,
`maps/*.jm2`, and `scripts/**/*.rs2`) and produces a deterministic, rights-safe
catalogue of every `Talk-to` NPC definition and morph target lacking an `[opnpc1,...]`
or `[apnpc1,...]` trigger (directly or via `_category`).

Compliance policy (AGENTS.md & docs/377_CONTENT_FACTORY.md):
- Never exports verbatim copyrighted Jagex dialogue transcripts, cache binaries, or
  player save data into the public MIT repository.
- Records only symbol names, numeric NPC IDs, map spawn coordinates/counts, morph links,
  functional interaction roles, and reference wiki URLs.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import re
from typing import Any
from urllib.parse import quote

TRIGGER_RE = re.compile(
    r"^\s*\[\s*(opnpc[1-5]|apnpc[1-5]|opnpcu|apnpcu)\s*,\s*([A-Za-z0-9_]+)\s*\]",
    re.I,
)
SECTION_RE = re.compile(r"^\[([A-Za-z0-9_]+)\]$")
MAP_NAME_RE = re.compile(r"^m(\d+)_(\d+)\.jm2$")


def classify_group(debugname: str, spawns: list[dict[str, Any]]) -> str:
    d = debugname.lower()
    if d in {"draul_leptoc", "phillipa", "romeo", "juliet", "juliet_multi_visible"} or d.startswith("romjul"):
        return "Varrock & Romeo and Juliet (2006 Rework)"
    if d.startswith(("100_", "hundred_")):
        return "Recipe for Disaster (100th Quest)"
    if d.startswith("ahoy_"):
        return "Ghosts Ahoy & Port Phasmatys"
    if d.startswith(("agrith_", "elid_", "feud_", "ali_", "al_the_camel", "cam_the_camel", "elly_the_camel", "ollie_the_camel", "alice_the_camel", "ugthanki", "magic_carpet")):
        return "Al Kharid & Kharidian Desert"
    if d.startswith(("dwarf_city_", "keldagrim", "blandebir", "dwarven_boatman", "dwarfrock_")):
        return "Keldagrim & The Giant Dwarf"
    if d.startswith(("VIKING", "viking_", "fremennik", "misc_", "royal_")):
        return "Fremennik Province & Miscellania"
    if d.startswith(("mort_", "burgh_", "aide_", "myreque", "canafis", "werewolf", "trek_")):
        return "Morytania, Canifis & Burgh de Rott"
    if d.startswith(("farming_", "elstan", "falador_gardener", "pirate_irate_gardener", "martin_the_master_farmer", "seed_merchant")):
        return "Farming Gardeners, Shops & Leprechauns"
    if d.startswith(("lost_tribe_", "cave_goblin")):
        return "The Lost Tribe & Dorgeshuun Mines"
    if d.startswith("favour_"):
        return "One Small Favour & H.A.M. Hideout"
    if d.startswith("magictraining_"):
        return "Mage Training Arena"
    if d.startswith("wilderness_capeseller"):
        return "Wilderness Team Cape Sellers"
    if d.startswith("fai_barbarian"):
        return "Barbarian Village Warriors"
    if d.startswith("canoeing_"):
        return "River Lum Canoe Stations"
    if d.startswith(("vc_", "ratcatchers")):
        return "Ratcatchers & Sewer/Tavern NPCs"
    if d.startswith(("tzhaar_", "fight_cave")):
        return "TzHaar City & Fight Caves"
    if d.startswith(("mourning_", "lletya", "regicide_", "roving_")):
        return "Tirannwn, Lletya & Mourning's End"
    if d.startswith(("mm_", "monkey_")):
        return "Monkey Madness & Ape Atoll"
    if d.startswith(("tbwt_", "karamja", "shilo_")):
        return "Karamja, Shilo Village & Tai Bwo Wannai"
    if d.startswith(("macro_", "antimacro")):
        return "Random Events & Macro Guardians"
    if d.startswith(("wom_", "wise_old_man", "rag_", "jailguard_")):
        return "Draynor Village & Market"
    if d.startswith(("lumbridge_", "gillie_", "millie_", "swamp_candle")):
        return "Lumbridge & Mill Lane Mill"
    if d.startswith(("falador_", "risingsun_", "mguild_", "rd_teleporter", "master_crafter", "tanner")):
        return "Falador, Mining Guild & Crafting Guild"
    if d.startswith(("sarim_", "shipmonk", "pest_", "rimmington_", "salesman_ranging", "jail_guard_")):
        return "Port Sarim, Rimmington & Void Knights' Outpost"
    if d.startswith(("queen_ellamaria", "merchant_pies", "champions_doorman")):
        return "Varrock Guilds & Palace"
    if spawns:
        first = spawns[0]
        mx = first["x"] // 64
        mz = first["z"] // 64
        if 45 <= mx <= 52 and (48 <= mz <= 61 or 148 <= mz <= 161):
            return "F2P Surface & Underground Regions (Other)"
        return "Members Surface & Underground Regions (Other)"
    return "Unspawned / Dynamic / Cutscene / Morph Variants"


def infer_functional_contract(entry: dict[str, Any]) -> str:
    ops = [o.lower() for o in entry.get("ops", {}).values() if o]
    if entry.get("owned_shop") or "trade" in ops:
        return "shopkeeper_greeting_and_openshop"
    if entry.get("debugname", "").startswith(("farming_gardener", "elstan")):
        return "farming_gardener_advice_and_crop_protection"
    if entry.get("debugname", "").startswith("canoeing_"):
        return "canoe_station_tutor_dialogue"
    if entry.get("debugname", "") in {"draul_leptoc", "phillipa"}:
        return "romeo_and_juliet_quest_stage_dialogue"
    if entry.get("debugname", "") in {"gillie_the_milkmaid", "millie_the_miller"}:
        return "cooks_assistant_ingredient_guidance_dialogue"
    if entry.get("debugname", "") in {"lumbridge_guide2_man", "lumbridge_guide2_woman"}:
        return "lumbridge_local_guide_branching_dialogue"
    if entry.get("multinpc_parents") or entry.get("multinpc_children"):
        return "quest_or_varbit_morph_stage_dialogue"
    if "pickpocket" in ops or "attack" in ops:
        return "interactive_citizen_or_guard_dialogue"
    return "npc_conversation_or_quest_branch"


def wiki_url_for_name(name: str, debugname: str) -> str:
    clean = (name or debugname).strip().strip("'")
    if not clean or clean == debugname:
        clean = debugname.replace("_", " ").title()
    return f"https://oldschool.runescape.wiki/w/{quote(clean.replace(' ', '_'))}"


def scan_content(content_dir: Path) -> dict[str, Any]:
    if not content_dir.is_dir():
        raise ValueError(f"Content directory does not exist: {content_dir}")

    npc_pack = content_dir / "pack" / "npc.pack"
    scripts_dir = content_dir / "scripts"
    maps_dir = content_dir / "maps"
    if not npc_pack.is_file() or not scripts_dir.is_dir():
        raise ValueError("Content directory must contain pack/npc.pack and scripts/")

    id_to_name: dict[int, str] = {}
    name_to_id: dict[str, int] = {}
    for line in npc_pack.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" in line:
            left, right = line.strip().split("=", 1)
            if left.isdigit():
                nid = int(left)
                id_to_name[nid] = right
                name_to_id[right] = nid

    npcs: dict[str, dict[str, Any]] = {}
    npc_files = sorted(scripts_dir.rglob("*.npc"), key=lambda p: ("_unpack" not in p.parts, p.as_posix()))
    for path in npc_files:
        cur: str | None = None
        for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("//"):
                continue
            m = SECTION_RE.match(line)
            if m:
                cur = m.group(1)
                if cur not in npcs:
                    npcs[cur] = {
                        "debugname": cur,
                        "id": name_to_id.get(cur),
                        "name": cur,
                        "has_desc": False,
                        "category": None,
                        "vislevel": None,
                        "ops": {},
                        "multinpc": [],
                        "multivar": None,
                        "owned_shop": None,
                        "shop_title": None,
                        "config_source": path.relative_to(content_dir).as_posix(),
                    }
                else:
                    npcs[cur]["config_source"] = path.relative_to(content_dir).as_posix()
                continue
            if cur and "=" in line:
                k, v = line.split("=", 1)
                rec = npcs[cur]
                if k == "name":
                    rec["name"] = v
                elif k == "desc":
                    rec["has_desc"] = bool(v)
                elif k == "category":
                    rec["category"] = v
                elif k == "vislevel":
                    rec["vislevel"] = v
                elif k in {"op1", "op2", "op3", "op4", "op5"}:
                    rec["ops"][k] = v
                elif k == "multinpc":
                    target = v.split(",", 1)[1].strip() if "," in v else v.strip()
                    if target and target not in rec["multinpc"]:
                        rec["multinpc"].append(target)
                elif k == "multivar":
                    rec["multivar"] = v
                elif k == "param":
                    if v.startswith("owned_shop,"):
                        rec["owned_shop"] = v.split(",", 1)[1]
                    elif v.startswith("shop_title,"):
                        rec["shop_title"] = v.split(",", 1)[1]

    parents_of: dict[str, list[str]] = {}
    for dname, rec in npcs.items():
        for child in rec["multinpc"]:
            parents_of.setdefault(child, [])
            if dname not in parents_of[child]:
                parents_of[child].append(dname)

    triggers: dict[str, list[dict[str, Any]]] = {}
    for path in sorted(scripts_dir.rglob("*.rs2")):
        rel = path.relative_to(content_dir).as_posix()
        for line_no, raw in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            m = TRIGGER_RE.match(raw)
            if m:
                trig_type = m.group(1).lower()
                target = m.group(2)
                key = f"{trig_type},{target}"
                triggers.setdefault(key, []).append({"path": rel, "line": line_no})

    spawns_by_npc: dict[str, list[dict[str, Any]]] = {}
    if maps_dir.is_dir():
        for mpath in sorted(maps_dir.glob("*.jm2")):
            mm = MAP_NAME_RE.match(mpath.name)
            if not mm:
                continue
            mx, mz = int(mm.group(1)), int(mm.group(2))
            in_npc = False
            for raw in mpath.read_text(encoding="utf-8", errors="ignore").splitlines():
                s = raw.strip()
                if s.startswith("===="):
                    in_npc = "NPC" in s
                    continue
                if in_npc and ":" in s:
                    coords_part, rest = s.split(":", 1)
                    cparts = coords_part.strip().split()
                    rparts = rest.strip().split()
                    if len(cparts) == 3 and rparts and rparts[0].isdigit():
                        lvl, lx, lz = int(cparts[0]), int(cparts[1]), int(cparts[2])
                        nid = int(rparts[0])
                        dname = id_to_name.get(nid)
                        if dname:
                            spawns_by_npc.setdefault(dname, []).append(
                                {
                                    "region": f"m{mx}_{mz}",
                                    "level": lvl,
                                    "x": mx * 64 + lx,
                                    "z": mz * 64 + lz,
                                }
                            )

    def find_dialogue_handlers(dname: str) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []
        rec = npcs.get(dname)
        if not rec:
            return found
        candidates = [dname]
        if rec["category"]:
            candidates.append(f"_{rec['category']}")
        for parent in parents_of.get(dname, []):
            candidates.append(parent)
            prec = npcs.get(parent)
            if prec and prec["category"]:
                candidates.append(f"_{prec['category']}")
        for child in rec["multinpc"]:
            candidates.append(child)
            crec = npcs.get(child)
            if crec and crec["category"]:
                candidates.append(f"_{crec['category']}")
        seen = set()
        for cand in candidates:
            for tprefix in ("opnpc1", "apnpc1"):
                tkey = f"{tprefix},{cand}"
                for loc in triggers.get(tkey, []):
                    sig = (tkey, loc["path"], loc["line"])
                    if sig not in seen:
                        seen.add(sig)
                        found.append({"trigger": tkey, "path": loc["path"], "line": loc["line"]})
        return found

    talk_to_npcs: list[dict[str, Any]] = []
    handled_list: list[dict[str, Any]] = []
    unhandled_list: list[dict[str, Any]] = []
    group_counts: Counter[str] = Counter()

    for dname in sorted(npcs.keys()):
        rec = npcs[dname]
        op1 = rec["ops"].get("op1", "")
        if op1.lower() != "talk-to":
            continue
        direct_spawns = spawns_by_npc.get(dname, [])
        parent_spawns: list[dict[str, Any]] = []
        for parent in parents_of.get(dname, []):
            parent_spawns.extend(spawns_by_npc.get(parent, []))
        all_spawns = direct_spawns or parent_spawns
        handlers = find_dialogue_handlers(dname)
        group = classify_group(dname, all_spawns)
        entry = {
            "debugname": dname,
            "id": rec["id"],
            "name": rec["name"],
            "category": rec["category"],
            "ops": rec["ops"],
            "owned_shop": rec["owned_shop"],
            "multinpc_parents": parents_of.get(dname, []),
            "multinpc_children": rec["multinpc"],
            "spawned_on_map": bool(all_spawns),
            "spawn_count": len(all_spawns),
            "primary_spawn": all_spawns[0] if all_spawns else None,
            "area_or_quest_group": group,
            "expected_contract": infer_functional_contract(
                {
                    **rec,
                    "multinpc_parents": parents_of.get(dname, []),
                    "multinpc_children": rec["multinpc"],
                }
            ),
            "reference_wiki": wiki_url_for_name(rec["name"], dname),
            "has_dialogue_trigger": bool(handlers),
            "handlers": handlers,
        }
        talk_to_npcs.append(entry)
        if handlers:
            handled_list.append(entry)
        else:
            unhandled_list.append(entry)
            group_counts[group] += 1

    return {
        "schema": "joshrs-377-npc-dialogue-audit-v1",
        "revision": 377,
        "policy": "Public metadata only; no verbatim copyrighted Jagex dialogue transcripts, cache binaries, or player saves.",
        "summary": {
            "total_npc_definitions": len(npcs),
            "total_talk_to_npcs": len(talk_to_npcs),
            "handled_talk_to_npcs": len(handled_list),
            "unhandled_talk_to_npcs": len(unhandled_list),
            "unhandled_spawned_on_map": sum(1 for x in unhandled_list if x["spawned_on_map"]),
            "unhandled_unspawned_or_dynamic": sum(1 for x in unhandled_list if not x["spawned_on_map"]),
            "unhandled_by_group": dict(sorted(group_counts.items(), key=lambda kv: (-kv[1], kv[0]))),
        },
        "newly_implemented_batch": [
            x
            for x in handled_list
            if any(
                h["path"].endswith(
                    (
                        "draul_leptoc.rs2",
                        "phillipa.rs2",
                        "varrock_npcs_377.rs2",
                        "lumbridge_npcs_377.rs2",
                        "draynor_npcs_377.rs2",
                        "fortunato.rs2",
                        "jail_guard.rs2",
                        "falador_npcs_377.rs2",
                        "barmaid.rs2",
                        "goblin_armed_red.rs2",
                        "crafting_guild.rs2",
                        "tanner.rs2",
                        "monk_of_entrana.rs2",
                        "dwarf_mining_guild.rs2",
                        "port_sarim_npcs_377.rs2",
                        "rimmington_npcs_377.rs2",
                        "barbarian.rs2",
                        "edgeville_npcs_377.rs2",
                        "wilderness_capesellers.rs2",
                        "alkharid_npcs_377.rs2",
                    )
                )
                for h in x["handlers"]
            )
        ],
        "unhandled_npcs": unhandled_list,
    }


def render_markdown(report: dict[str, Any]) -> str:
    s = report["summary"]
    lines = [
        "# JoshRS Revision 377 — Complete Missing-Dialogue NPC Audit",
        "",
        "**Prepared:** 8 November 2026 (Australia/Sydney)  ",
        "**Target revision:** RuneScape #377 (May 2006) — `LostCityRS/Content@44eab09081ef0f6c5f3eaabd1897a588ad7d9e50`  ",
        "**Rights & Repo Policy:** Metadata, NPC symbols, coordinates, functional contracts, and reference URLs only. No copyrighted dialogue transcripts or cache binaries are stored in this MIT repository (`AGENTS.md`, `docs/377_CONTENT_FACTORY.md`).",
        "",
        "## 1. Executive Summary",
        "",
        "| Metric | Count |",
        "|---|---:|",
        f"| Total NPC definitions (`all.npc` + local overrides) | {s['total_npc_definitions']} |",
        f"| Total `Talk-to` (`op1=Talk-to`) NPC definitions | {s['total_talk_to_npcs']} |",
        f"| `Talk-to` NPC definitions with `[opnpc1]` / `[apnpc1]` / `_category` trigger | {s['handled_talk_to_npcs']} |",
        f"| `Talk-to` NPC definitions missing `[opnpc1]` dialogue trigger | {s['unhandled_talk_to_npcs']} |",
        f"| — Spawned on map (`maps/*.jm2`, direct or via `multinpc` parent) | {s['unhandled_spawned_on_map']} |",
        f"| — Dynamic / cutscene / unspawned definitions | {s['unhandled_unspawned_or_dynamic']} |",
        "",
        "## 2. Breakdown by Area / Quest / Feature Group",
        "",
        "| Area / Quest Group | Missing `Talk-to` Definitions |",
        "|---|---:|",
    ]
    for grp, cnt in s["unhandled_by_group"].items():
        lines.append(f"| {grp} | {cnt} |")

    lines.extend(
        [
            "",
            "## 3. Varrock, Romeo & Juliet, and F2P Town Batch Implemented in Local 377 Runtime",
            "",
            "| ID | Debugname | In-Game Name | Group | Primary Spawn `(lvl, x, z, region)` | Trigger & Script Path | Reference |",
            "|---:|---|---|---|---|---|---|",
        ]
    )
    for item in report.get("newly_implemented_batch", []):
        ps = item["primary_spawn"]
        coord_str = f"`({ps['level']}, {ps['x']}, {ps['z']}, {ps['region']})`" if ps else "`n/a`"
        nid = item["id"] if item["id"] is not None else "n/a"
        h = item["handlers"][0]
        h_str = f"`[{h['trigger']}]` in `{h['path']}`"
        lines.append(
            f"| {nid} | `{item['debugname']}` | {item['name']} | {item['area_or_quest_group']} | {coord_str} | {h_str} | [Wiki]({item['reference_wiki']}) |"
        )

    lines.extend(
        [
            "",
            "## 4. Remaining Map-Spawned `Talk-to` NPCs Missing Dialogue Triggers",
            "",
            "| ID | Debugname | In-Game Name | Group | Primary Spawn `(lvl, x, z, region)` | Spawns | Functional Contract | Reference |",
            "|---:|---|---|---|---|---:|---|---|",
        ]
    )
    for item in report["unhandled_npcs"]:
        if not item["spawned_on_map"]:
            continue
        ps = item["primary_spawn"]
        coord_str = f"`({ps['level']}, {ps['x']}, {ps['z']}, {ps['region']})`" if ps else "`n/a`"
        nid = item["id"] if item["id"] is not None else "n/a"
        lines.append(
            f"| {nid} | `{item['debugname']}` | {item['name']} | {item['area_or_quest_group']} | {coord_str} | {item['spawn_count']} | `{item['expected_contract']}` | [Wiki]({item['reference_wiki']}) |"
        )

    lines.extend(
        [
            "",
            "## 4. Dynamic / Cutscene / Unspawned `Talk-to` NPC Definitions",
            "",
            "The remaining definitions are cutscene actors, instanced quest spawns, or unspawned morph variants catalogued in `research/rs377/npc_dialogue_audit_2026-11-08.json`.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, required=True, help="Path to 377 content directory")
    parser.add_argument("--json-out", type=Path, required=True, help="Path to write JSON audit")
    parser.add_argument("--md-out", type=Path, required=True, help="Path to write Markdown summary")
    args = parser.parse_args()

    report = scan_content(args.content)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    args.md_out.parent.mkdir(parents=True, exist_ok=True)
    args.md_out.write_text(render_markdown(report), encoding="utf-8")
    print(
        f"Audited {report['summary']['total_npc_definitions']} NPCs: "
        f"{report['summary']['handled_talk_to_npcs']} handled, "
        f"{report['summary']['unhandled_talk_to_npcs']} unhandled "
        f"({report['summary']['unhandled_spawned_on_map']} spawned on map)."
    )


if __name__ == "__main__":
    main()
