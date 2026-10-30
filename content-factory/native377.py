#!/usr/bin/env python3
"""Build original JoshRS NPC dialogue into valid-shaped Lost City 377 source overlays.

Generates text-only original definitions. Does not reuse game binaries, save files,
maps, private content or third-party contributions. Compilation happens in CI.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

from factory import normalize_owned

ROOT = Path(__file__).resolve().parent
ALLOWED = re.compile(r"^[A-Za-z][A-Za-z0-9 ,.'!?-]{0,200}$")
NPC_MAX = 20

# Model, head and animations are identifiers already defined by the upstream
# 377 game. This overlay does not copy or redistribute those binary assets.
BASE_MODEL = """model1=idk_man_hair_wildspikes
model2=idk_man_jaw_none
model3=obj_priest_gown_manwear
model4=obj_viking_top_darkbrown_manwear
model5=obj_macro_mime_legs_manwear
head1=idk_man_hair_wildspikes_head
walkanim=human_walk_f,human_walk_b,human_walk_l,human_walk_r
readyanim=human_ready
op1=Talk-to
wanderrange=0
maxrange=2
moverestrict=nomove
"""


def safe_line(value: str, max_length: int = 200) -> str:
    if not isinstance(value, str) or len(value) > max_length or not ALLOWED.fullmatch(value):
        raise ValueError("Unsafe or unsupported NPC dialogue text")
    return value


# These are ORIGINAL new game interactions, not copied RuneScape dialogue.
# Item IDs are names from the already-pinned local 377 engine; no asset data is distributed.
# Fixed rule IDs prevent public intake data from injecting arbitrary RuneScript.
TRADE_RULES = {
    'joshrs_timber_buyer': {'from_obj': 'logs', 'from_qty': 3, 'to_obj': 'coins', 'to_qty': 12,
                            'option': 'Sell 3 logs for 12 coins.', 'result': 'You exchange three logs for twelve coins.', 'needs_space': False},
    'joshrs_ore_buyer': {'from_obj': 'copper_ore', 'from_qty': 2, 'to_obj': 'coins', 'to_qty': 8,
                         'option': 'Sell 2 copper ores for 8 coins.', 'result': 'You sell two copper ores for eight coins.', 'needs_space': False},
    'joshrs_trail_provisioner': {'from_obj': 'coins', 'from_qty': 4, 'to_obj': 'cooked_meat', 'to_qty': 1,
                                'option': 'Buy cooked meat for 4 coins.', 'result': 'You buy a warm meal for four coins.', 'needs_space': True},
}


def interaction_for_npc(key: str, description: str) -> str:
    if key not in TRADE_RULES:
        return (
            f'~chatnpc("<p,happy>Welcome to the woodland trail!");\n'
            f'~chatnpc("<p,neutral>{description}");\n'
            'mes("This original JoshRS guide is ready to talk.");\n'
        )
    rule = TRADE_RULES[key]
    parts = [f'~chatnpc("<p,neutral>{description}");',
             f'def_int $choice = ~p_choice2_header("{rule["option"]}", 1, "Not today.", 2, "Would you like to trade?");',
             'if ($choice ! 1) { return; }',
             f'if (inv_total(inv, {rule["from_obj"]}) < {rule["from_qty"]}) {{',
             '    mes("You do not have enough supplies to complete this trade.");',
             '    return;',
             '}']
    if rule['needs_space']:
        parts.extend(['if (inv_freespace(inv) < 1) {',
                      '    mes("Make room in your inventory before trading.");',
                      '    return;',
                      '}'])
    parts.extend([f'inv_del(inv, {rule["from_obj"]}, {rule["from_qty"]});',
                  f'inv_add(inv, {rule["to_obj"]}, {rule["to_qty"]});',
                  f'mes("{rule["result"]}");'])
    return '\n'.join(parts) + '\n'


def build_native(source: Path, output: Path) -> dict:
    """Generate only original NPCs. Do not fabricate fully working items or quests."""
    specs = []
    for doc in sorted(source.glob("*.json")):
        value = json.loads(doc.read_text(encoding="utf-8"))
        if not isinstance(value, dict) or value.get("schema") != 1 or not isinstance(value.get("entries"), list):
            raise ValueError(f"{doc.name}: unsupported intake schema")
        for entry in value["entries"]:
            validated = normalize_owned(entry)
            if validated["kind"] == "npc":
                if len(specs) >= NPC_MAX:
                    raise ValueError("Too many NPCs in one build")
                specs.append(validated)
    ids = [r["key"] for r in specs]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate NPC key")
    for r in specs:
        safe_line(r["name"], 56)
        safe_line(r["description"])
    if not specs:
        raise ValueError("No original user-authored NPC entries found")

    config = "// JoshRS original NPC definitions, no binary art or cache data.\n"
    scripts = "// JoshRS original dialogue for Lost City 377. Administrative spawn only.\n"
    for r in sorted(specs, key=lambda v: v["key"]):
        k, name, description = r["key"], r["name"], r["description"]
        config += f"\n[{k}]\nname={name}\ndesc={description}\n{BASE_MODEL}"
        scripts += (
            f"\n[opnpc1,{k}]\n"
            + interaction_for_npc(k, description)
            + f"\n[debugproc,joshrs_spawn_{k}]\n"
            + f"npc_add(coord, {k}, 500);\n"
            + f'mes("{name} has been summoned near you.");\n'
        )

    base = Path("scripts/areas/joshrs_custom")
    files = {
        (base / "configs/joshrs_original.npc").as_posix(): config,
        (base / "scripts/joshrs_original.rs2").as_posix(): scripts,
    }
    output.mkdir(parents=True, exist_ok=True)
    expected = set(files)
    for old in output.rglob("*"):
        if old.is_file() and old.name != "manifest.json" and old.relative_to(output).as_posix() not in expected:
            raise ValueError(f"Unexpected file in generated overlay: {old}")
    for name, body in files.items():
        dest = output / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(body, encoding="utf-8")
    manifest = {
        "schema": 1,
        "target": "LostCityRS Content/Engine-TS 377-wip",
        "compilation_verified": False,
        "runtime_login_verified": False,
        "persistent_npc_spawns": False,
        "includes_player_save_changes": False,
        "gameplay_scope": "Original guide and three inventory-checked NPC trades for logs, copper ore and cooked meat; debug-session spawns only; no persistent quest",
        "files": [
            {"path": name, "sha256": hashlib.sha256(body.encode("utf-8")).hexdigest()}
            for name, body in sorted(files.items())
        ],
        "npc_names": [r["key"] for r in sorted(specs, key=lambda v: v["key"])],
        "gameplay_mechanics": [r["key"] for r in sorted(specs, key=lambda v: v["key"]) if r["key"] in TRADE_RULES],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--intake", type=Path, default=ROOT / "intake")
    ap.add_argument("--output", type=Path, default=ROOT / "generated/native377")
    args = ap.parse_args()
    result = build_native(args.intake, args.output)
    print(f"Generated {len(result['npc_names'])} original 377 NPC definition(s) and dialogue scripts; native compiler not run.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("Native 377 generation blocked: " + str(exc), file=sys.stderr)
        raise SystemExit(1)
