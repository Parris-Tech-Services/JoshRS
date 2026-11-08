#!/usr/bin/env python3
"""A detailed, *read-only* 104-quest RuneScript/2006-reference discrepancy census.

This tool does not claim to compare verbatim original Jagex dialogue: a period-
authenticated archive has not been supplied for all 104 quests. It measures what
can be established from the exact pinned 377 Content checkout plus JoshRS's
reviewed patches; records every source interaction/NPC/stage and flags missing
coverage. Reports use symbols and script locations, never dialogue quotations.

Run AFTER overlay in the disposable CI 377 workspace. No save or engine writes.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any

# Python -I omits the script directory; load only our reviewed sibling module.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit import OVERLAYS, QUEUE

PIN = "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50"
TRIGGER = re.compile(
    r"^\s*\[\s*((?:op|ap)(?:npc|loc|obj|held)[1-5]|(?:op|ap)(?:npc|loc|obj|held)u|"
    r"ai_queue3|if_button|queue|proc|label)\s*,\s*([A-Za-z0-9_:]+)\s*\]",
    re.M | re.I,
)
# For an item-on-entity trigger the syntax and id are first-class evidence.
COMMENT = re.compile(r"^\s*//", re.M)
CALL = re.compile(r"\b(inv_total|inv_del|inv_add|bank_total|stat_advance|stat|npc_add|"
                  r"npc_find|loc_add|loc_change|loc_find|obj_add)\s*\(")
STAT_CHECK = re.compile(r"\bstat(?:_base)?\(\s*(\w+)\s*\)\s*(?:[<>!=]=?|=)\s*(\d+)", re.I)
STAT_REWARD = re.compile(r"\bstat_advance\(\s*(\w+)\s*,\s*(\d+)\s*\)\s*;", re.I)
STAGE_CONST = re.compile(r"\^([A-Za-z0-9_]+)")
STAGE_ASSIGN = re.compile(r"%([A-Za-z0-9_]+)\s*=\s*(\^[A-Za-z0-9_]+|\d+)\s*;")
QUEST_VAR_CHECK = re.compile(r"%([A-Za-z0-9_]+)\s*(?:[<>!=]=?|=)\s*(\^[A-Za-z0-9_]+|\d+)", re.I)
INVENTORY = re.compile(r"\b(?:inv_total|inv_del|inv_add|bank_total)\(\s*\w+\s*,\s*([A-Za-z0-9_]+)", re.I)
INCOMPLETE = re.compile(r"\b(?:NOT IMPLEMENTED|TODO|UNVERIFIED|PLACEHOLDER|FIXME)\b", re.I)
MAP_FILE = re.compile(r"^m(\d+)_(\d+)\.jm2$")
SECTION = re.compile(r"^\[([A-Za-z0-9_]+)\]$")
PACK_ENTRY = re.compile(r"^\s*(\d+)=([A-Za-z0-9_]+)\s*$")
HISTORIC_SOURCES = {
    # Useful corroborating walkthroughs, NOT proof that every stage is 2006-authentic.
    "soulbane": [
        {"url": "https://oldschool.runescape.wiki/w/A_Soul%27s_Bane",
         "scope": "Story, rift entry, enemy waves, rewards; modern living wiki",
         "contemporaneous_2006_primary": False},
    ],
    "mortton": [
        {"url": "https://oldschool.runescape.wiki/w/Shades_of_Mort%27ton/Quick_guide",
         "scope": "Diary, serum, 5 shades, temple restoration, sacred oil, cremation; modern",
         "contemporaneous_2006_primary": False},
    ],
    "deal": [
        {"url": "https://oldschool.runescape.wiki/w/Rum_Deal",
         "scope": "Pirate Pete, island, fever spider, brewery; modern",
         "contemporaneous_2006_primary": False},
    ],
}
SKILLS = {"attack","defence","strength","hitpoints","ranged","prayer","magic",
          "cooking","woodcutting","fletching","fishing","firemaking","crafting",
          "smithing","mining","herblore","agility","thieving","slayer","farming",
          "runecrafting","runecraft","construction"}
RISK_ORDER = {"NO_EXECUTABLE_QUEST_SCRIPTS":0, "EXPLICITLY_INCOMPLETE":1,
              "CUSTOM_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY":2,
              "PINNED_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY":3}

def clean_code(text: str) -> str:
    """Mask comment-only lines; preserve newline position and all code positions."""
    return "\n".join("" if COMMENT.match(line) else line
                     for line in text.splitlines())

def get_script_sections(text: str) -> list[dict[str, Any]]:
    """Return source-level event bodies, never full quoted dialogue."""
    clean = clean_code(text)
    matches = list(TRIGGER.finditer(clean))
    out = []
    for pos, match in enumerate(matches):
        body = clean[match.end():matches[pos+1].start() if pos+1 < len(matches) else len(clean)]
        out.append({
            "kind": match.group(1).lower(), "target": match.group(2),
            "line": clean.count("\n", 0, match.start()) + 1,
            "body": body,
        })
    return out

def pack_symbols(path: Path) -> dict[str,int]:
    if not path.is_file():
        raise ValueError(f"Pinned cache pack missing: {path}")
    result = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = PACK_ENTRY.match(line)
        if m:
            result[m.group(2)] = int(m.group(1))
    if not result:
        raise ValueError(f"No parsed symbols in {path}")
    return result

def map_spawns(maps: Path, npc_symbols: dict[str,int]) -> dict[str,list[dict[str,int|str]]]:
    """Parse actual 377 NPC spawn blocks, limit stored coordinates per NPC."""
    if not maps.is_dir():
        raise ValueError(f"Map directory missing: {maps}")
    result = defaultdict(list)
    by_id = {v:k for k,v in npc_symbols.items()}
    for file in sorted(maps.glob("*.jm2")):
        mx = MAP_FILE.match(file.name)
        if not mx:
            continue
        xbase, zbase = int(mx.group(1))*64, int(mx.group(2))*64
        in_npc = False
        for line in file.read_text(encoding="utf-8", errors="replace").splitlines():
            s = line.strip()
            if s.startswith("===="):
                in_npc = "NPC" in s.upper()
                continue
            if not in_npc or ":" not in s:
                continue
            lhs, rhs = s.split(":",1)
            c, args = lhs.strip().split(), rhs.strip().split()
            if len(c)!=3 or not all(n.isdigit() for n in c) or not args or not args[0].isdigit():
                continue
            name = by_id.get(int(args[0]))
            if name and len(result[name])<4:
                result[name].append({"map":file.name, "plane":int(c[0]),
                                     "x":xbase+int(c[1]),"z":zbase+int(c[2])})
    return dict(result)

def npc_morphs(scripts: Path) -> dict[str,set[str]]:
    """Resolve alternate morph and category dialogue routes conservatively."""
    result: dict[str,set[str]] = defaultdict(set)
    for file in scripts.rglob("*.npc"):
        name = None
        for raw in file.read_text(encoding="utf-8", errors="replace").splitlines():
            s = raw.strip()
            if not s or s.startswith("//"):
                continue
            section = SECTION.match(s)
            if section:
                name = section.group(1)
                continue
            if name and "=" in s:
                key, value = s.split("=",1)
                if key=="category":
                    result[name].add("_"+value.strip())
                elif key=="multinpc":
                    child = value.split(",",1)[-1].strip()
                    result[name].add(child)
                    result[child].add(name)
    return result

def concise_event(kind: str, target: str, rel: str, line: int) -> dict[str,Any]:
    return {"op":kind, "symbol":target, "path":rel, "line":line}

def flatten_code(scripts: list[tuple[str,str]]) -> str:
    return "\n".join(clean_code(body) for _,body in scripts)

def analyze_quest(q: dict, script_index: dict[str, list[dict]],
                  code_by_file: dict[str,str], start_symbols: dict[str,int],
                  spawns: dict[str,list], morphs: dict[str,set],
                  full_paths: list[str], global_npc_index: dict,
                  loc_symbols: dict[str,int], obj_symbols: dict[str,int],
                  upstream_sha: str, shared_by_var: dict | None = None) -> dict[str,Any]:
    key = q["quest_id"]
    hint = q.get("evidence",{}).get("quest_dir") or ""
    roots = [r for r in (hint, "quests/"+OVERLAYS[key] if key in OVERLAYS else None) if r]
    roots = list(dict.fromkeys(roots))
    source_files = sorted(p for p in full_paths if any(
        p.startswith("scripts/"+root+"/") for root in roots))
    quest_script_files = [p for p in source_files if p.endswith(".rs2")]
    owned = [(p,code_by_file[p]) for p in quest_script_files]
    combined = flatten_code(owned)
    # Statically-owned event handlers: includes NPC and world interactions.
    events: list[dict[str,Any]] = []
    dialogues = 0
    choices = 0
    for path,_ in owned:
        for event in script_index[path]:
            events.append(concise_event(event["kind"],event["target"],path,event["line"]))
        text = clean_code(code_by_file[path])
        dialogues += len(re.findall(r"~(?:chatnpc|chatplayer)\s*\(",text))
        choices += len(re.findall(r"~p_choice\d+\s*\(",text))
    event_counts = dict(sorted(Counter(e["op"] for e in events).items()))
    npc_targets = sorted(set(e["symbol"] for e in events if e["op"].startswith(("opnpc","apnpc"))))
    loc_targets = sorted(set(e["symbol"] for e in events if e["op"].startswith(("oploc","aploc"))))
    obj_targets = sorted(set(e["symbol"] for e in events if e["op"].startswith(("opobj","apobj","opheld","apheld"))))
    npc_combat = sorted(set(e["symbol"] for e in events if e["op"]=="ai_queue3"))
    # Start handler may live in a shared/area script, not the quest folder.
    start = q.get("start_npc") or ""
    start_aliases = {start} | morphs.get(start,set())
    start_handlers = []
    for name in sorted(start_aliases):
        start_handlers += global_npc_index.get(name, [])
    found_start = start in start_symbols or any(a in start_symbols for a in start_aliases)
    start_placements = []
    for a in sorted(start_aliases):
        start_placements.extend(spawns.get(a, []))
    start_placements = start_placements[:4]
    # Area and shared-script interactions can advance a quest outside its
    # quest-owned folder. Only exact %quest-var references count as candidates;
    # generic/morph handlers are still not proven reachable without a client.
    related: dict[tuple[str,int,str],dict[str,Any]] = {}
    for progress_var in re.findall(r"[A-Za-z_][A-Za-z0-9_]*",
                                   q.get("varp_or_varbit") or ""):
        for event in (shared_by_var or {}).get(progress_var, []):
            if event["path"].startswith("scripts/quests/"):
                continue
            identity = (event["path"], event["line"], event["op"])
            if identity not in related:
                related[identity] = {**event, "matched_quest_variables":[]}
            if progress_var not in related[identity]["matched_quest_variables"]:
                related[identity]["matched_quest_variables"].append(progress_var)
    area_handlers = sorted(related.values(),
                           key=lambda e:(e["path"],e["line"],e["op"]))
    for event in area_handlers:
        event["matched_quest_variables"].sort()
    # Item symbol availability checks must be conservative: pack symbols can be
    # defined in handwritten local .obj configs before the build generates ids.
    item_ops = sorted(set(INVENTORY.findall(combined)))
    missing_items = sorted(x for x in item_ops if x not in obj_symbols and
                           x.lower() not in {"obj","item","coins"} and not x.startswith("$"))
    # Reward details are source-observed statements, not historical agreement.
    raw_xp = [(m.group(1).lower(),int(m.group(2))//10) for m in STAT_REWARD.finditer(combined)]
    # Do not add XP awards across mutually exclusive branches or quest stages.
    seen_xp = sorted(set(raw_xp))
    skill_checks = sorted(set((m.group(1).lower(),int(m.group(2))) for m in
                              STAT_CHECK.finditer(combined)))
    expected_skill_names = sorted({x.lower() for s in q.get("required_skills", [])
                                   for x in re.findall(r"[A-Za-z]+",s)
                                   if x.lower() in SKILLS})
    observed_skill_names = {s for s,_ in skill_checks}
    # A condition may be in an area/start handler or a skill helper; therefore
    # absence is a targeted **review-needed**, not proof of unenforced prereqs.
    missing_local_skill_checks = sorted(set(expected_skill_names)-observed_skill_names)
    stages_set = sorted(set(m.group(1) for m in STAGE_CONST.finditer(combined)))
    stages_written = sorted(set((m.group(1),m.group(2)) for m in STAGE_ASSIGN.finditer(combined)))
    stages_compared = sorted(set((m.group(1),m.group(2)) for m in QUEST_VAR_CHECK.finditer(combined)))
    ref_stages = q.get("stages") or []
    explicit = []
    other_notes = []
    for path,text in owned:
        for line_no,line in enumerate(text.splitlines(),1):
            if not line.lstrip().startswith("//") or not INCOMPLETE.search(line):
                continue
            note = {"path":path,"line":line_no,
                    "note":line.strip().lstrip("/").strip()[:155]}
            if "NOT IMPLEMENTED" in line.upper():
                explicit.append(note)
            else:
                other_notes.append(note)
    source_verdict = (
        "NO_EXECUTABLE_QUEST_SCRIPTS" if not quest_script_files
        else "EXPLICITLY_INCOMPLETE" if explicit
        else "CUSTOM_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY" if key in OVERLAYS
        else "PINNED_SOURCE_NEEDS_GAMEPLAY_AND_PERIOD_PARITY"
    )
    # Produce explicit, testable gates; these are not automatically failures.
    open_checks = []
    if not quest_script_files:
        open_checks.append("NO_QUEST_RS2_IN_EXPECTED_ROOT")
    if start and not found_start:
        open_checks.append("START_NPC_SYMBOL_NOT_IN_PACK")
    if start and not start_handlers:
        open_checks.append("START_NPC_DIRECT_OR_MORPH_TALKTO_HANDLER_NOT_FOUND")
    if start and not start_placements:
        open_checks.append("START_NPC_NO_STATIC_MAP_SPAWN_SEEN")
    if not any(e["op"]=="if_button" and e["symbol"]==f"questlist:{key}" for e in events):
        open_checks.append("QUEST_JOURNAL_HANDLER_NOT_IN_OWNED_RS2")
    if "~send_quest_complete(" not in combined:
        open_checks.append("QUEST_COMPLETION_EVENT_NOT_IN_OWNED_RS2")
    if explicit:
        open_checks.append("SOURCE_EXPLICITLY_DECLARES_INCOMPLETE_MECHANICS")
    if missing_local_skill_checks:
        open_checks.append("PREREQUISITE_LEVEL_CHECKS_NOT_ALL_FOUND_IN_OWNED_RS2")
    if any(x not in obj_symbols for x in item_ops):
        open_checks.append("INVENTORY_ITEM_SYMBOLS_NEED_PACK_OR_CONFIG_REVIEW")
    # No trusted period primary source has been paired with this quest.
    period_docs = HISTORIC_SOURCES.get(key, [])
    if not any(x["contemporaneous_2006_primary"] for x in period_docs):
        open_checks.append("CONTEMPORANEOUS_2006_PRIMARY_SOURCE_NOT_VERIFIED")
    open_checks.append("COMPLETE_NORMAL_CLIENT_PLAYTHROUGH_AND_RELOG_NOT_RECORDED")
    return {
        "quest_id":key,
        "quest_name":q["name"],"release_date":q["release_date"],
        "original_source_status":q["status"],
        "source_verdict":source_verdict,
        "content_pin":upstream_sha,
        "reference_requirements":{
            "skills":q.get("required_skills",[]),
            "quests":q.get("required_quests",[]),
            "items":"NOT_RECORDED_IN_ORIGINAL_104_QUEST_QUEUE",
            "expected_rewards":q.get("rewards",[]),
        },
        "source_roots":roots,
        "source_files":source_files,
        "quest_script_count":len(quest_script_files),
        "npc_start":{
            "expected_symbol":start,
            "cache_symbol_found":found_start,
            "direct_or_morph_talk_handlers":start_handlers[:12],
            "map_spawn_evidence":start_placements,
            "map_placement_is_runtime_reachable":False,
        },
        "npc_interactions":npc_targets,
        "npc_combat_death_handlers":npc_combat,
        "npc_spawn_symbols":sorted(set(re.findall(
            r"\bnpc_add\s*\([^;]*?,\s*([A-Za-z_][A-Za-z0-9_]*)\s*,",
            combined))),
        "location_interactions":loc_targets,
        "location_symbols_not_in_pack":sorted(x for x in loc_targets if x not in loc_symbols
                                               and not x.startswith("_")),
        "inventory_interaction_symbols":item_ops,
        "inventory_symbol_not_in_obj_pack":missing_items,
        "item_use_interactions":obj_targets,
        "interaction_handlers":events,
        "shared_area_or_general_event_candidates":area_handlers,
        "shared_area_event_candidate_count":len(area_handlers),
        "shared_area_npc_dialogue_event_candidates":[e for e in area_handlers
              if e["op"].startswith(("opnpc","apnpc"))],
        "interaction_handler_counts":event_counts,
        "dialogue_structure":{
            "chatnpc_or_chatplayer_calls":dialogues,
            "player_choice_menus":choices,
            "npc_dialogue_period_wording_verified":False,
            "full_branch_options_period_verified":False,
            "verbatim_transcripts_not_exported":True,
        },
        "stage_structure":{
            "catalogue_stage_definitions_count":len(ref_stages),
            "referenced_constants":stages_set,
            "stage_writes": [{"var":a,"value":b} for a,b in stages_written],
            "stage_comparisons": [{"var":a,"value":b} for a,b in stages_compared],
            "full_historical_state_graph_verified":False,
        },
        "gameplay_mechanics_source":{
            "source_skill_level_checks":[{"skill":s,"level":n} for s,n in skill_checks],
            "required_skill_checks_not_located_in_quest_scripts":missing_local_skill_checks,
            "reward_xp_literal_sources":[{"skill":s,"xp":n} for s,n in seen_xp],
            "quest_references_to_items":len(item_ops),
            "source_npc_handlers":len(npc_targets),
            "source_location_handlers":len(loc_targets),
            "source_item_use_handlers":len(obj_targets),
            "source_death_handlers":len(npc_combat),
            "quest_progress_call_sites":combined.count("~send_quest_progress("),
            "quest_complete_call_sites":combined.count("~send_quest_complete("),
            "comments_explicitly_unimplemented":explicit[:50],
            "comments_other_uncertainties":other_notes[:50],
        },
        "period_reference_evidence":period_docs,
        "period_primary_source_verified":False,
        "source_vs_period_npc_item_puzzle_dialogue_comparison":"INCOMPLETE_NO_AUTHENTICATED_PERIOD_TRANSCRIPT",
        "full_live_player_quest_completion_verified":False,
        "save_and_relogin_verified":False,
        "open_acceptance_checks":sorted(set(open_checks)),
    }

def assemble(content: Path, source_catalogue: Path=QUEUE) -> dict:
    data = json.loads(source_catalogue.read_text(encoding="utf-8"))
    quests = data["quests"]
    if len(quests)!=104 or len(set(q["quest_id"] for q in quests))!=104:
        raise ValueError("Refuse inaccurate queue: expected 104 distinct quest ids")
    sdir = content/"scripts"
    if not sdir.is_dir():
        raise ValueError("No scripts/ in pinned Content checkout")
    npc_symbols = pack_symbols(content/"pack"/"npc.pack")
    loc_symbols = pack_symbols(content/"pack"/"loc.pack")
    obj_symbols = pack_symbols(content/"pack"/"obj.pack")
    spawn_lookup = map_spawns(content/"maps",npc_symbols)
    morphs = npc_morphs(sdir)
    code_by_file = {}
    script_index = {}
    npc_idx = defaultdict(list)
    # Index exact variable mentions within each shared event body. A quest can
    # have many legitimate handlers in areas/area_... rather than quest_... .
    # Do not infer a match merely because an NPC has a similar English name.
    related_idx = defaultdict(list)
    for path in sorted(sdir.rglob("*.rs2")):
        rel = path.relative_to(content).as_posix()
        code = path.read_text(encoding="utf-8", errors="replace")
        code_by_file[rel] = code
        script_index[rel] = get_script_sections(code)
        for event in script_index[rel]:
            if (rel.startswith("scripts/areas/") or
                rel.startswith("scripts/general/")) and rel != "scripts/general/scripts/quests.rs2":
                for var in set(re.findall(r"%([A-Za-z_][A-Za-z0-9_]*)\b",event["body"])):
                    related_idx[var].append(concise_event(
                        event["kind"],event["target"],rel,event["line"]))
            if event["kind"] in {"opnpc1","apnpc1"}:
                npc_idx[event["target"]].append(
                    concise_event(event["kind"],event["target"],rel,event["line"]))
    all_paths = sorted(code_by_file)
    rows = [analyze_quest(q,script_index,code_by_file,npc_symbols,spawn_lookup,morphs,
                          all_paths,npc_idx,loc_symbols,obj_symbols,PIN,related_idx)
            for q in quests]
    if len(rows)!=104:
        raise ValueError("Deep audit did not visit all historical quest slots")
    count = Counter(r["source_verdict"] for r in rows)
    risk = Counter(c for r in rows for c in r["open_acceptance_checks"])
    return {
        "schema":"joshrs-377-104-quest-deep-static-audit-v2",
        "content_sha_pin":PIN,
        "target_revision":377,
        "release_cutoff":"2006-05-02",
        "total_quests":104,
        "num_quest_script_files":sum(r["quest_script_count"] for r in rows),
        "shared_area_quest_variable_event_candidates":sum(
             r["shared_area_event_candidate_count"] for r in rows),
        "quest_slots_with_shared_area_event_candidates":sum(
             bool(r["shared_area_event_candidate_count"]) for r in rows),
        "all_source_stages_and_interaction_handlers_indexed":True,
        "period_primary_source_authenticated_for_all_104":False,
        "npc_dialogue_2006_wording_parity_verified":False,
        "real_player_full_quest_playthroughs":0,
        "verdict_counts":dict(count),
        "open_check_counts":dict(risk),
        "notes":"Structural comparisons cover all 104 against pinned rev377 scripts and catalogue. NPC/loc/item handler evidence, gameplay stage graph symbols, choices, prerequisites, XP and missing scenes are indexed. This is NOT verbatim Jagex 2006 source, verified chronological dialogue parity, NPC path reachability or a client playthrough. OPEN flags are review leads; no automatic false claims.",
        "quests":rows,
    }

def render_md(data: dict) -> str:
    lines = [
        "# JoshRS Revision 377 — detailed 104-quest source comparison",
        "",
        "> **Scope:** Every 2006 quest slot, all quest-owned RuneScript events and",
        "> start-NPC handlers, item/object interactions, stage writes/comparisons,",
        "> dialogue branch counts, skill checks and reward calls. Historical",
        "> dialogue wording and real-client progression remain **unverified**.",
        "",
        f"Content pin: `{data['content_sha_pin']}`.",
        f"Quest slots examined: **{data['total_quests']}**.",
        f"Quest-owned source script files: **{data['num_quest_script_files']}**.",
        f"Shared area/general event candidates linked by exact quest variable: **{data['shared_area_quest_variable_event_candidates']}** "
        f"across **{data['quest_slots_with_shared_area_event_candidates']}** quests.",
        "",
        "## Structural findings by quest",
        "",
        "| # | Quest | Script files | Talk NPCs | Shared area events | Object interactions | Item actions | Dialogue calls / choices | Stage writes | Review flags |",
        "|---:|---|---:|---:|---:|---:|---:|---|---:|---:|",
    ]
    for index,r in enumerate(data["quests"],1):
        d=r["dialogue_structure"]
        calls=r["interaction_handler_counts"]
        lines.append(
            f"| {index} | {r['quest_name'].replace('|','/')} | {r['quest_script_count']} | "
            f"{len(r['npc_interactions'])} | {r['shared_area_event_candidate_count']} | {len(r['location_interactions'])} | "
            f"{len(r['item_use_interactions'])} | {d['chatnpc_or_chatplayer_calls']} / {d['player_choice_menus']} | "
            f"{len(r['stage_structure']['stage_writes'])} | {len(r['open_acceptance_checks'])} |"
        )
    lines.extend(["","## Specific source issues requiring review",""])
    for r in data["quests"]:
        important = [x for x in r["open_acceptance_checks"]
                     if x not in {"CONTEMPORANEOUS_2006_PRIMARY_SOURCE_NOT_VERIFIED",
                                   "COMPLETE_NORMAL_CLIENT_PLAYTHROUGH_AND_RELOG_NOT_RECORDED"}]
        if not important:
            continue
        lines.append(f"### {r['quest_name']}")
        for v in important:
            lines.append(f"- {v}")
        for note in r["gameplay_mechanics_source"]["comments_explicitly_unimplemented"][:6]:
            lines.append(f"- Explicit TODO: {note['path']}:{note['line']} — {note['note']}")
        lines.append("")
    lines.extend(["","## Evidence boundary","",
                  "For each quest, the JSON report has the precise start-NPC handler",
                  "path/line, map spawns where found, event symbols and line references,",
                  "inventory and item-on-object hooks, stage writes/checks, branch",
                  "structure and XP source statements. No copyrighted dialogue",
                  "transcript is republished. A 100% parity rating requires",
                  "time-appropriate source comparison PLUS a real normal-client",
                  "playthrough and genuine logout/relogin per quest.",
                  ""])
    return "\n".join(lines)

def persist(data: dict, out: Path) -> None:
    out.mkdir(parents=True,exist_ok=True)
    (out/"deep-104-quests.json").write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",
                                            encoding="utf-8")
    (out/"deep-104-quests.md").write_text(render_md(data),encoding="utf-8")
    folder=out/"quest-details"
    folder.mkdir(exist_ok=True)
    with (out/"deep-104-summary.csv").open("w",newline="",encoding="utf-8") as stream:
        fields=["number","id","quest","source_verdict","script_files","npc_start_handler",
                "npc_spawn","npc_ops","loc_ops","item_ops","menu_choices","stage_writes",
                "shared_area_events","open_checks","period_primary_verified","real_client_complete"]
        writer=csv.DictWriter(stream,fieldnames=fields)
        writer.writeheader()
        for index,r in enumerate(data["quests"],1):
            d=r["dialogue_structure"]
            writer.writerow({
                "number":index,"id":r["quest_id"],"quest":r["quest_name"],
                "source_verdict":r["source_verdict"],
                "script_files":r["quest_script_count"],
                "npc_start_handler":bool(r["npc_start"]["direct_or_morph_talk_handlers"]),
                "npc_spawn":bool(r["npc_start"]["map_spawn_evidence"]),
                "npc_ops":len(r["npc_interactions"]),
                "loc_ops":len(r["location_interactions"]),
                "item_ops":len(r["item_use_interactions"]),
                "menu_choices":d["player_choice_menus"],
                "stage_writes":len(r["stage_structure"]["stage_writes"]),
                "shared_area_events":r["shared_area_event_candidate_count"],
                "open_checks":";".join(r["open_acceptance_checks"]),
                "period_primary_verified":False,"real_client_complete":False,
            })
            name=f"{index:03d}_{r['quest_id']}.json"
            (folder/name).write_text(json.dumps(r,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--content",required=True,type=Path)
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    result=assemble(args.content.resolve(strict=True))
    persist(result,args.output)
    print(json.dumps({"quest_slots":result["total_quests"],
                      "quest_source_scripts":result["num_quest_script_files"],
                      "shared_area_event_candidates":result["shared_area_quest_variable_event_candidates"],
                      "quests_with_shared_area_candidates":result["quest_slots_with_shared_area_event_candidates"],
                      "source_verdicts":result["verdict_counts"],
                      "review_flag_counts":result["open_check_counts"],
                      "period_primary_parity_verified":False,
                      "real_client_full_playthroughs":0},indent=2))
    if result["total_quests"]!=104 or not result["all_source_stages_and_interaction_handlers_indexed"]:
        raise SystemExit("104-quest deep audit incomplete")

if __name__=="__main__":
    main()
