#!/usr/bin/env python3
"""Offline, read-only scoring of JoshRS 377 bot evidence; never controls gameplay."""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime
import json
from pathlib import Path
import re

SKILLS = (
    "Attack", "Defence", "Strength", "Hitpoints", "Ranged", "Prayer",
    "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
    "Firemaking", "Crafting", "Smithing", "Mining", "Herblore",
    "Agility", "Thieving", "Slayer", "Farming", "Runecrafting",
)
SKILL_SET = set(SKILLS)
BLOCKED_ACTIONS = {
    "addxp", "setxp", "setlevel", "advancestat", "additem", "spawnitem",
    "setquest", "teleportadmin", "directinventorywrite", "speed",
}
MAX_EVENTS = 250_000
MAX_STRING = 220


def short(value: object) -> str:
    """Avoid log/path/markdown injection in public-facing summaries."""
    value = str(value or "").replace("\n", " ").replace("\r", " ")
    return re.sub(r"[\x00-\x1f|<>]", " ", value)[:MAX_STRING]


def timestamp(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError("Each observation requires an ISO timestamp")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.utcoffset() is None:
        raise ValueError("Timezone-aware observation timestamps required")
    return dt


def validate_header(item: dict) -> None:
    if item.get("type") != "run":
        raise ValueError("First event must be a run metadata record")
    for name, expected in (
        ("xp_multiplier", 1),
        ("cheats_enabled", False),
        ("admin_changes", False),
        ("seeded_items", False),
        ("accelerated_time", False),
        ("disposable_test_account", True),
        ("isolated_test_world", True),
    ):
        if name not in item or type(item[name]) is not type(expected) or item[name] != expected:
            raise ValueError(f"No-cheat benchmark requires {name}={expected!r}")
    if not isinstance(item.get("tick_ms"), int) or item["tick_ms"] < 100:
        raise ValueError("Record the positive unaccelerated native server tick_ms")
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,60}", str(item.get("run_id", ""))):
        raise ValueError("run_id must be a safe non-personal identifier")
    if not re.fullmatch(r"[a-f0-9]{7,40}", str(item.get("engine_sha", ""))):
        raise ValueError("engine_sha must identify the actual tested game source")
    if not re.fullmatch(r"[a-f0-9]{7,40}", str(item.get("content_sha", ""))):
        raise ValueError("content_sha must identify the actual tested game source")


def load_events(path: Path) -> list[dict]:
    events: list[dict] = []
    with path.open(encoding="utf-8") as stream:
        for row_number, row in enumerate(stream, start=1):
            if row_number > MAX_EVENTS:
                raise ValueError("Event limit exceeded; split the runs")
            if not row.strip():
                continue
            try:
                item = json.loads(row)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSONL row {row_number}: {exc}") from exc
            if not isinstance(item, dict):
                raise ValueError(f"Row {row_number} is not a JSON object")
            events.append(item)
    if not events:
        raise ValueError("No observations: cannot invent results")
    validate_header(events[0])
    run_id = events[0]["run_id"]
    for event in events[1:]:
        if event.get("type") not in ("xp", "quest", "action", "error"):
            raise ValueError("Unsupported event type; no implicit result")
        if event.get("run_id") != run_id:
            raise ValueError("Mixed run IDs; assess runs separately")
        timestamp(event.get("ts"))
        if event.get("type") == "xp":
            if event.get("skill") not in SKILL_SET:
                raise ValueError("XP sample contains an unknown or unsupported 377 skill")
            if type(event.get("xp_tenths")) is not int or not 0 <= event["xp_tenths"] <= 2_000_000_000:
                raise ValueError("Use raw integer 377 internal XP tenths, never multiplied XP")
        if event.get("type") == "action":
            method = re.sub(r"[^a-z]", "", str(event.get("method", "")).lower())
            if method in BLOCKED_ACTIONS:
                raise ValueError("Cheat/admin action detected in benchmark event: " + method)
    return events


def score(events: list[dict], quest_catalog: list[str] | None = None) -> dict:
    samples: dict[str, list[tuple[datetime, int]]] = defaultdict(list)
    quests: dict[str, dict] = {}
    failures: dict[tuple, dict] = {}
    for event in events[1:]:
        kind = event["type"]
        time = timestamp(event["ts"])
        if kind == "xp":
            samples[event["skill"]].append((time, event["xp_tenths"]))
        elif kind == "quest":
            quest = short(event.get("quest"))
            if not quest:
                raise ValueError("Quest observation lacks a quest title/identifier")
            # Only in-world journal state *and* persisted confirmation count as complete.
            state = event.get("state", "unknown")
            if state not in ("not_started", "started", "complete", "blocked", "unknown"):
                raise ValueError("Unknown quest state")
            older = quests.get(quest)
            if not older or time >= older["_time"]:
                quests[quest] = {
                    "state": state, "journal_complete": event.get("journal_complete") is True,
                    "persisted": event.get("persisted") is True,
                    "stage": short(event.get("stage")), "_time": time,
                }
        elif kind in ("action", "error"):
            status = event.get("status", "error" if kind == "error" else "unknown")
            if status not in ("failed", "timeout", "rejected", "error"):
                continue
            key = (
                short(event.get("task", "unspecified")),
                short(event.get("method", "unspecified")),
                short(event.get("target", "unspecified")),
                short(event.get("reason", status)),
            )
            info = failures.setdefault(key, {"task": key[0], "method": key[1],
                                             "target": key[2], "reason": key[3],
                                             "count": 0, "first": time.isoformat(),
                                             "last": time.isoformat(),
                                             "suspected_bug": False})
            info["count"] += 1
            info["last"] = time.isoformat()
            # A single failure could simply be a game rule. Repeated failures
            # are candidates for investigation, not automatically proven bugs.
            info["suspected_bug"] = info["count"] >= 3 or kind == "error"
    results = []
    for skill in SKILLS:
        points = sorted(samples[skill])
        entry = {"skill": skill, "status": "NOT MEASURED", "xp_gained": None,
                 "elapsed_minutes": None, "xp_per_hour": None}
        if len(points) >= 2 and points[-1][0] > points[0][0]:
            elapsed = (points[-1][0] - points[0][0]).total_seconds()
            delta = points[-1][1] - points[0][1]
            if delta >= 0:
                entry.update(status="MEASURED", xp_gained=round(delta / 10, 1),
                             elapsed_minutes=round(elapsed / 60, 2),
                             xp_per_hour=round(delta / 10 * 3600 / elapsed, 1))
            else:
                entry["status"] = "INVALID: XP decreased"
        results.append(entry)
    if quest_catalog:
        for quest in quest_catalog:
            if quest not in quests:
                quests[quest] = {"state": "not_tested", "journal_complete": False,
                                 "persisted": False, "stage": "", "_time": None}
    quest_rows = []
    for name, row in sorted(quests.items()):
        verified = row["state"] == "complete" and row["journal_complete"] and row["persisted"]
        quest_rows.append({"quest": name, "status": "VERIFIED COMPLETE" if verified else
                           "REPORTED COMPLETE - UNVERIFIED" if row["state"] == "complete"
                           else row["state"].upper(), "stage": row["stage"]})
    return {"run_id": events[0]["run_id"], "evidence": "OBSERVATIONS ONLY",
            "rates": results, "quests": quest_rows,
            "failures": sorted(failures.values(), key=lambda x: (-x["count"], x["task"]))}


def markdown(result: dict) -> str:
    lines = ["# JoshRS 377 no-cheat bot benchmark", "",
             "Run: " + short(result["run_id"]),
             "Status: observed evidence only. Rates are real wall-clock XP/hour; no boosted XP.",
             "No observations are interpreted as zero XP or as successful gameplay.", "",
             "## All 21 era-correct skills", "",
             "| Skill | Status | Gained XP | Wall min | XP/hour |",
             "|---|---|---:|---:|---:|"]
    for item in result["rates"]:
        cells = [item["skill"], item["status"]]
        cells += ["—" if item[k] is None else str(item[k])
                  for k in ("xp_gained", "elapsed_minutes", "xp_per_hour")]
        lines.append("| " + " | ".join(cells) + " |")
    lines += ["", "## Quest attempts (verified only after journal + relog)", "",
              "| Quest | Status | Observed stage |", "|---|---|---|"]
    if not result["quests"]:
        lines.append("| No quest observations/catalogue | NOT TESTED | — |")
    for item in result["quests"]:
        lines.append("| " + " | ".join(short(item[k]) for k in ("quest", "status", "stage")) + " |")
    lines += ["", "## Failure and bug candidates", "",
              "Failures are automatically recorded, but require reproduction before calling them bugs.", "",
              "| Task | Action | Target | Reason | Count | Classification |",
              "|---|---|---|---|---:|---|"]
    if not result["failures"]:
        lines.append("| No failure events received | — | — | — | 0 | NOT VERIFIED BUG-FREE |")
    for item in result["failures"]:
        cells = [item[k] for k in ("task", "method", "target", "reason")]
        cells += [str(item["count"]), "SUSPECTED BUG" if item["suspected_bug"] else "REVIEW"]
        lines.append("| " + " | ".join(cells) + " |")
    lines += ["", "This reporter does not drive a bot, read player saves or post issues automatically.",
              "Only publish redacted output; leave detailed logs private.", ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--events", type=Path, required=True, help="Private JSONL evidence, not saved to Git")
    parser.add_argument("--out", type=Path, required=True, help="Directory for offline JSON/Markdown reports")
    parser.add_argument("--quest-catalog", type=Path, help="Optional JSON array of verified era quest titles")
    args = parser.parse_args()
    names = None
    if args.quest_catalog:
        names = json.loads(args.quest_catalog.read_text(encoding="utf-8"))
        if not isinstance(names, list) or any(not isinstance(x, str) or not x.strip() for x in names):
            parser.error("--quest-catalog must be a JSON array of quest titles")
        if len(set(names)) != len(names):
            parser.error("--quest-catalog contains duplicate titles")
    try:
        result = score(load_events(args.events), names)
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "report.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    (args.out / "report.md").write_text(markdown(result), encoding="utf-8")
    print("Offline report generated; measured skills:", sum(x["status"] == "MEASURED" for x in result["rates"]),
          "verified quests:", sum(x["status"] == "VERIFIED COMPLETE" for x in result["quests"]),
          "failure groups:", len(result["failures"]))


if __name__ == "__main__":
    main()
