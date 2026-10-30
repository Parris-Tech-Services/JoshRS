#!/usr/bin/env python3
"""Produce a *per-file evidence ledger*, never automatic rights clearance.

Metadata, an MIT/ISC licence and native compilation are different forms of proof.
A foreign game's scripts may contain protected dialogue and game-specific assets.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
# Actual repo-level licence files inspected 2026-10-31 (content at the named ref).
# MIT source code permission does NOT clear the underlying game assets or dialogue.
LICENSE_EVIDENCE = {
    "LostCityRS/Content": ("MIT", "https://github.com/LostCityRS/Content/blob/377-wip/LICENSE"),
    "LostCityRS/Engine-TS": ("MIT", "https://github.com/LostCityRS/Engine-TS/blob/377-wip/LICENSE"),
    "LostCityRS/RuneScriptTS": ("MIT", "https://github.com/LostCityRS/RuneScriptTS/blob/main/LICENSE"),
    "openrs2/openrs2": ("ISC", "https://github.com/openrs2/openrs2/blob/master/LICENSE"),
    "2006-Scape/2006Scape": ("GPL-3.0", "https://github.com/2006-Scape/2006Scape/blob/master/LICENSE"),
}
GAME_SPECIFIC_CONFIG = {".npc", ".obj", ".loc", ".seq", ".pack"}
KNOWN_CODE_EXT = {".rs2", ".ts", ".tsx", ".kt", ".java", ".py"}
THIRD_PARTY_POLICY = {
    "already_in_pinned_source": "already_present_no_port_required",
    "rights_review_required": "blocked_game_content_rights",
    "blocked_reference_only": "blocked_reference_only",
    "manual_port_required": "requires_individual_code_and_game_rights_review",
}


def assess(row: dict) -> dict:
    """Assess immutable source metadata; never assume a source copy was implemented."""
    for key in ("id", "source", "repo", "path", "blob_sha", "url", "status"):
        if not isinstance(row.get(key), str) or not row[key]:
            raise ValueError(f"Candidate missing required metadata: {key}")
    path = Path(row["path"])
    ext = path.suffix.lower()
    repo = row["repo"]
    known_license, license_link = LICENSE_EVIDENCE.get(repo, (None, None))
    source_status = row["status"]
    if source_status not in THIRD_PARTY_POLICY:
        raise ValueError(f"Unsupported classification: {source_status}")
    if source_status == "already_in_pinned_source":
        action = "No import: already included in pinned source; test locally before claiming functionality."
    elif source_status == "blocked_reference_only":
        action = "Blocked for importing. May be used as public factual context only."
    elif ext in GAME_SPECIFIC_CONFIG:
        action = "Block until code/config, game dialogue and referenced assets have separate provenance checks."
    elif ext in KNOWN_CODE_EXT:
        action = "Inspect source and all dependencies; separately verify original-game-content rights, then port and compile 377."
    else:
        action = "Do not auto-port unfamiliar or potentially binary content."
    identity = hashlib.sha256(f'{repo}\n{row["path"]}\n{row["blob_sha"]}'.encode()).hexdigest()[:24]
    return {
        "review_id": identity,
        "candidate_id": row["id"],
        "source": row["source"],
        "repo": repo,
        "path": row["path"],
        "blob_sha": row["blob_sha"],
        "source_commit_sha": row.get("source_commit_sha"),
        "reference_url": row["url"],
        "classification": source_status,
        "decision": THIRD_PARTY_POLICY[source_status],
        "repository_software_license": known_license,
        "repository_license_evidence": license_link,
        "license_scope": "software_only_not_proof_of_game_data_or_asset_permission" if known_license else "unconfirmed",
        "source_code_reviewed_individually": False,
        "game_content_rights_approved": False,
        "external_assets_approved": False,
        "compatible_with_pinned_377": source_status == "already_in_pinned_source",
        "native_377_compiled_as_new_feature": False,
        "npc_or_player_interaction_tested": False,
        "elrothiro_save_tested": False,
        "outstanding_action": action,
    }


def build_ledger(packs_dir: Path) -> dict:
    rows: dict[str, dict] = {}
    sources = Counter()
    conflicts = []
    for file in sorted(packs_dir.glob("*.json")):
        pack = json.loads(file.read_text(encoding="utf-8"))
        for row in pack.get("candidates", []):
            record = assess(row)
            key = record["review_id"]
            if key in rows:
                # Duplicates from identical paths/SHAs under multiple branches are one source file.
                if (rows[key]["classification"] == "already_in_pinned_source"
                    or record["classification"] != "already_in_pinned_source"):
                    continue
            rows[key] = record
            sources[record["classification"]] += 1
    decisions = Counter(r["decision"] for r in rows.values())
    return {
        "schema": 1,
        "provenance": "read-only GitHub tree metadata; NOT individual source/rights review",
        "total_unique_source_files": len(rows),
        "counts_by_decision": dict(sorted(decisions.items())),
        "total_approved_third_party_source_ports": 0,
        "total_verified_live_gameplay_candidates": 0,
        "code_license_not_equal_asset_rights": True,
        "reviews": [rows[k] for k in sorted(rows)],
    }


def run(packs_dir: Path, output: Path) -> None:
    ledger = build_ledger(packs_dir)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f'Per-candidate evidence generated: {ledger["total_unique_source_files"]} unique tracked metadata records, 0 falsely approved ports.')


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--packs", type=Path, default=ROOT / "generated/packs")
    parser.add_argument("--output", type=Path, default=ROOT / "generated/candidate-evidence.json")
    args = parser.parse_args()
    try:
        run(args.packs, args.output)
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
        print("Evidence audit blocked: " + str(exc), file=sys.stderr)
        raise SystemExit(1)
