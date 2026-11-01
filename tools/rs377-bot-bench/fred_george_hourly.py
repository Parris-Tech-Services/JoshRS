#!/usr/bin/env python3
"""Summarise six *actual* ten-minute Fred/George measurements in one UTC hour.

No game connection, bots, credentials, or simulated observations. One file per
bot per 10-minute interval. Never fill missing observations with invented values.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import html
import json
from pathlib import Path
import re

SKILLS = (
    "Attack", "Defence", "Strength", "Hitpoints", "Ranged", "Prayer",
    "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
    "Firemaking", "Crafting", "Smithing", "Mining", "Herblore",
    "Agility", "Thieving", "Slayer", "Farming", "Runecrafting",
)
BOTS = {"Fred": "gather_first", "George": "quest_first"}
SCHEMA = "joshrs-ab-ten-minute-v1"
EXPERIMENT = "fred-george-v1"
MAX_SIZE = 80_000


def utc(s: str) -> datetime:
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.utcoffset() is None:
        raise ValueError("Timezone required")
    return dt.astimezone(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def snapshot_path(root: Path, end: datetime, bot: str) -> Path:
    return root / "snapshots" / end.strftime("%Y-%m-%d") / (end.strftime("%Y-%m-%dT%H-%MZ") + "-" + bot + ".json")


def positive_int(value, name: str) -> int:
    if type(value) is not int or value < 0 or value > 2_000_000_000:
        raise ValueError("Invalid nonnegative integer: " + name)
    return value


def validate(data: dict, start: datetime, end: datetime, bot: str) -> dict:
    if not isinstance(data, dict) or data.get("schema") != SCHEMA or data.get("experiment_id") != EXPERIMENT:
        raise ValueError("Wrong schema/experiment")
    if data.get("bot") != bot or data.get("policy") != BOTS[bot]:
        raise ValueError("Wrong bot or pre-registered AB policy")
    if utc(data["window_start_utc"]) != start or utc(data["window_end_utc"]) != end:
        raise ValueError("Window mismatch")
    if data.get("cheats_enabled") is not False or data.get("xp_multiplier") != 1 or data.get("accelerated_time") is not False:
        raise ValueError("No-cheat flags absent/wrong")
    if data.get("items_seeded") is not False or data.get("fresh_account") is not True:
        raise ValueError("Fresh account / starter gear attestation absent")
    if type(data.get("tick_ms")) is not int or data["tick_ms"] < 100:
        raise ValueError("Missing native tick")
    if not re.fullmatch("[0-9a-f]{7,40}", str(data.get("engine_sha", ""))):
        raise ValueError("Missing source engine SHA")
    if not re.fullmatch("[0-9a-f]{7,40}", str(data.get("content_sha", ""))):
        raise ValueError("Missing source content SHA")
    if not re.fullmatch("[0-9a-f]{16,64}", str(data.get("starting_signature", ""))):
        raise ValueError("Invalid initial-state signature")
    for name in ("xp_before_tenths", "xp_after_tenths"):
        values = data.get(name)
        if not isinstance(values, dict) or set(values) != set(SKILLS):
            raise ValueError("Exactly 21 377 skills required: " + name)
        for skill in SKILLS:
            positive_int(values[skill], name + "." + skill)
    for skill in SKILLS:
        if data["xp_after_tenths"][skill] < data["xp_before_tenths"][skill]:
            raise ValueError("XP decreased: " + skill)
    for key in ("successful_actions", "failed_actions", "deaths"):
        positive_int(data.get(key), key)
    for key in ("quests_verified_new", "bug_candidates"):
        if not isinstance(data.get(key), list) or len(data[key]) > 50:
            raise ValueError("Expected bounded list: " + key)
    for item in data["quests_verified_new"]:
        if not isinstance(item, str) or not 1 <= len(item) <= 100:
            raise ValueError("Invalid quest title")
    for item in data["bug_candidates"]:
        if not isinstance(item, dict) or not re.fullmatch("[a-zA-Z0-9_-]{8,64}", str(item.get("id", ""))):
            raise ValueError("Invalid public-safe bug fingerprint")
        if item.get("severity") not in ("low", "medium", "high", "critical"):
            raise ValueError("Invalid bug severity")
    location = data.get("location")
    if not isinstance(location, dict):
        raise ValueError("Missing bot location")
    for key in ("x", "z", "plane"):
        if type(location.get(key)) is not int or not 0 <= location[key] <= 20_000:
            raise ValueError("Invalid location coordinate")
    if not isinstance(location.get("region"), str) or len(location["region"]) > 80:
        raise ValueError("Invalid region label")
    waypoints = data.get("route_points", [])
    if not isinstance(waypoints, list) or len(waypoints) > 60:
        raise ValueError("Too many route points")
    for p in waypoints:
        if not isinstance(p, list) or len(p) != 2 or any(type(v) is not int or not 0 <= v <= 20_000 for v in p):
            raise ValueError("Invalid route point")
    return data


def scan(root: Path, hour: datetime) -> dict:
    if hour.minute or hour.second or hour.microsecond:
        raise ValueError("UTC hour must be exactly on the hour")
    reports = {name: [] for name in BOTS}
    missing = []
    invalid = []
    for minute in range(10, 61, 10):
        end = hour + timedelta(minutes=minute)
        start = end - timedelta(minutes=10)
        for bot in BOTS:
            path = snapshot_path(root, end, bot)
            if not path.is_file():
                missing.append({"bot": bot, "window_end_utc": iso(end)})
                continue
            try:
                if path.stat().st_size > MAX_SIZE:
                    raise ValueError("Oversized snapshot")
                data = validate(json.loads(path.read_text(encoding="utf-8")), start, end, bot)
                reports[bot].append(data)
            except (ValueError, KeyError, TypeError, json.JSONDecodeError, UnicodeDecodeError) as error:
                invalid.append({"bot": bot, "window_end_utc": iso(end), "error": str(error)[:150]})
    signatures = {(x["engine_sha"], x["content_sha"], x["tick_ms"], x["starting_signature"])
                  for values in reports.values() for x in values}
    comparable = len(signatures) == 1 and all(len(reports[b]) == 6 for b in BOTS)
    detail = {}
    bug_counts = {}
    for bot, values in reports.items():
        gain = {skill: 0 for skill in SKILLS}
        new_quests = set()
        trace = []
        progress = []
        succeeded = failed = deaths = 0
        for snap in values:
            for skill in SKILLS:
                gain[skill] += (snap["xp_after_tenths"][skill] - snap["xp_before_tenths"][skill])
            new_quests.update(snap["quests_verified_new"])
            succeeded += snap["successful_actions"]
            failed += snap["failed_actions"]
            deaths += snap["deaths"]
            points = snap.get("route_points", [])
            trace.extend(points if points else [[snap["location"]["x"], snap["location"]["z"]]])
            progress.append({"end": snap["window_end_utc"], "xp_gained": round(sum(gain.values()) / 10, 1),
                             "skill_xp_gained": {s: round(gain[s] / 10, 1) for s in SKILLS}})
            for bug in snap["bug_candidates"]:
                fingerprint = bug["id"]
                record = bug_counts.setdefault(fingerprint, {"id": fingerprint,
                    "severity": bug["severity"], "count_reports": 0, "bots": set()})
                record["count_reports"] += 1
                record["bots"].add(bot)
        minutes = len(values) * 10
        detail[bot] = {
            "policy": BOTS[bot], "intervals_received": len(values), "minutes_observed": minutes,
            "total_xp_gained": round(sum(gain.values()) / 10, 1),
            "xp_per_hour_of_observed_time": round(sum(gain.values()) / 10 * 60 / minutes, 1) if minutes else None,
            "skill_xp_gained": {s: round(gain[s] / 10, 1) for s in SKILLS},
            "new_quests_verified": sorted(new_quests), "successful_actions": succeeded,
            "failed_actions": failed, "deaths": deaths,
            "latest_location": values[-1]["location"] if values else None,
            "route_points": trace[-360:], "progress": progress,
        }
    bugs = [{**{k: v for k, v in record.items() if k != "bots"},
             "bots": sorted(record["bots"])} for record in bug_counts.values()]
    bugs.sort(key=lambda v: (-{"critical": 4, "high": 3, "medium": 2, "low": 1}[v["severity"]], v["id"]))
    return {
        "schema": "joshrs-fred-george-hourly-v1",
        "experiment_id": EXPERIMENT, "hour_start_utc": iso(hour),
        "hour_end_utc": iso(hour + timedelta(hours=1)),
        "status": "COMPLETE" if comparable else "PARTIAL_OR_NOT_COMPARABLE",
        "comparable": comparable, "received": sum(len(v) for v in reports.values()),
        "expected": 12, "missing": missing, "invalid": invalid,
        "bots": detail, "bug_candidates": bugs,
        "interpretation": "Two distinct bot policies (n=1 per arm): descriptive AB data, NOT a statistically powered causal result.",
        "measurement": "1x wall-clock ten-minute windows; incomplete windows remain explicitly missing.",
    }


def svg_chart(result: dict, metric: str) -> str:
    width, height = 780, 330
    title = {"xp": "Total XP gained during observed windows",
             "quest": "New verified quests reported",
             "bugs": "Unique bug candidates (hour)",
             "routes": "Observed bot route samples (world tiles, not a map)"}[metric]
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img">',
             '<rect width="100%" height="100%" fill="#101923"/>',
             f'<text x="25" y="32" fill="#f5f7fa" font-family="sans-serif" font-size="19">{html.escape(title)}</text>',
             '<text x="25" y="55" fill="#aab5c2" font-family="sans-serif" font-size="12">Fred: gather first   |   George: quest first   |   missing intervals never interpolated</text>']
    colours = {"Fred": "#70b6f5", "George": "#efb47c"}
    if metric == "routes":
        points = [p for bot in BOTS for p in result["bots"][bot]["route_points"]]
        if points:
            minx, maxx = min(p[0] for p in points), max(p[0] for p in points)
            minz, maxz = min(p[1] for p in points), max(p[1] for p in points)
            dx, dz = max(maxx-minx, 1), max(maxz-minz, 1)
            for bot in BOTS:
                route = result["bots"][bot]["route_points"]
                if not route:
                    continue
                coords = " ".join(f'{45+(p[0]-minx)/dx*680:.1f},{285-(p[1]-minz)/dz*200:.1f}' for p in route)
                parts.append(f'<polyline points="{coords}" fill="none" stroke="{colours[bot]}" stroke-width="2"/>')
                for p in (route[0], route[-1]):
                    parts.append(f'<circle cx="{45+(p[0]-minx)/dx*680:.1f}" cy="{285-(p[1]-minz)/dz*200:.1f}" r="4" fill="{colours[bot]}"/>')
            parts.append(f'<text x="44" y="318" fill="#aab5c2" font-size="12">X {minx}–{maxx}; Z {minz}–{maxz}; coarse samples only</text>')
    else:
        def series(bot):
            data = result["bots"][bot]
            if metric == "xp":
                return [p["xp_gained"] for p in data["progress"]]
            if metric == "quest":
                return [len(data["new_quests_verified"])]
            return [sum(bot in b["bots"] for b in result["bug_candidates"])]
        values = [value for bot in BOTS for value in series(bot)]
        ceiling = max(values + [1])
        for bot in BOTS:
            vals = series(bot)
            if not vals:
                continue
            if metric == "xp":
                # Each point marks a real 10-minute completed report, not a fabricated hour.
                coords = " ".join(f'{80+i/5*650:.1f},{285-v/ceiling*195:.1f}' for i,v in enumerate(vals))
                if len(vals) > 1:
                    parts.append(f'<polyline points="{coords}" fill="none" stroke="{colours[bot]}" stroke-width="2.5"/>')
                for i,v in enumerate(vals):
                    parts.append(f'<circle cx="{80+i/5*650:.1f}" cy="{285-v/ceiling*195:.1f}" r="5" fill="{colours[bot]}"/>')
            else:
                idx = 0 if bot == "Fred" else 1
                v = vals[0]
                parts.append(f'<rect x="{220+idx*260}" y="{285-v/ceiling*195:.1f}" width="135" height="{v/ceiling*195:.1f}" rx="5" fill="{colours[bot]}"/>')
                parts.append(f'<text x="{280+idx*260}" y="{275-v/ceiling*195:.1f}" fill="#fff" font-size="17">{v}</text>')
        parts.append(f'<text x="25" y="318" fill="#aab5c2" font-size="12">Max observed: {ceiling}   |   Complete paired comparison: {str(result["comparable"]).lower()}</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def summary_md(result: dict) -> str:
    lines = ["# Fred vs George — real-action 377 AB report", "",
             "UTC hour: " + result["hour_start_utc"] + " to " + result["hour_end_utc"],
             "Status: **" + result["status"] + "**; " + str(result["received"]) + "/12 bot intervals valid.",
             result["interpretation"], "",
             "## Outcomes", "",
             "| Metric | Fred (gather first) | George (quest first) |",
             "|---|---:|---:|"]
    labels = [("intervals_received", "10-minute reports"), ("total_xp_gained", "XP gained"),
              ("xp_per_hour_of_observed_time", "Observed XP/hour"), ("successful_actions", "Successful actions"),
              ("failed_actions", "Failed actions"), ("deaths", "Deaths")]
    for key, label in labels:
        lines.append("| " + label + " | " + str(result["bots"]["Fred"][key]) + " | " + str(result["bots"]["George"][key]) + " |")
    lines += ["", "## Skill XP earned this hour", "",
              "| Skill | Fred | George |", "|---|---:|---:|"]
    for skill in SKILLS:
        lines.append("| " + skill + " | " + str(result["bots"]["Fred"]["skill_xp_gained"][skill]) +
                     " | " + str(result["bots"]["George"]["skill_xp_gained"][skill]) + " |")
    lines += ["", "## Newly verified quest completions", ""]
    for bot in BOTS:
        names = result["bots"][bot]["new_quests_verified"]
        lines.append("- " + bot + ": " + (", ".join(html.escape(x) for x in names) if names else "none observed"))
    lines += ["", "## Bugs requiring investigation", ""]
    if not result["bug_candidates"]:
        lines.append("No structured bug candidates received. This **does not** prove a bug-free world.")
    for bug in result["bug_candidates"]:
        lines.append("- " + bug["id"] + " (" + bug["severity"] + "): " + ",".join(bug["bots"]) +
                     " reported in " + str(bug["count_reports"]) + " interval(s)")
    lines += ["", "## Tracking gaps", ""]
    if not result["missing"] and not result["invalid"]:
        lines.append("All 12 expected bot-interval records received.")
    for miss in result["missing"]:
        lines.append("- MISSING: " + miss["bot"] + " " + miss["window_end_utc"])
    for bad in result["invalid"]:
        lines.append("- INVALID: " + bad["bot"] + " " + bad["window_end_utc"] + ": " + html.escape(bad["error"]))
    lines += ["", "## Charts", "",
              "![Observed XP](xp.svg)", "![Quests](quest.svg)",
              "![Bugs](bugs.svg)", "![Coarse routes](routes.svg)", "",
              "No screenshots, credentials or family player telemetry are collected. Do not claim the bot is online from this report alone.", ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("reports/fred-george"))
    parser.add_argument("--hour", help="UTC hour YYYY-MM-DDTHH; defaults to preceding complete hour")
    args = parser.parse_args()
    hour = datetime.strptime(args.hour, "%Y-%m-%dT%H").replace(tzinfo=timezone.utc) if args.hour else (
        datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours=1))
    result = scan(args.root, hour)
    directory = args.root / "hourly" / hour.strftime("%Y-%m-%dT%HZ")
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "report.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    (directory / "report.md").write_text(summary_md(result), encoding="utf-8")
    for name in ("xp", "quest", "bugs", "routes"):
        (directory / (name + ".svg")).write_text(svg_chart(result, name), encoding="utf-8")
    print(result["status"], "reports", result["received"], "of 12; files:", directory)


if __name__ == "__main__":
    main()
